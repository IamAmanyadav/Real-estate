"""Messaging repository — SQLAlchemy CRUD operations for conversations and messages."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, update, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Conversation, Message
from app.models.user import User


async def get_or_create_conversation(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Conversation:
    """Get existing conversation for a user, or create one."""
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user_id)
    )
    conv = result.scalars().first()
    if conv:
        return conv

    conv = Conversation(user_id=user_id)
    db.add(conv)
    await db.flush()
    return conv


async def get_conversation_by_id(
    db: AsyncSession,
    conversation_id: uuid.UUID,
) -> Conversation | None:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    return result.scalars().first()


async def get_conversations_for_admin(
    db: AsyncSession,
) -> list[dict]:
    """Get all conversations with last message preview and unread counts for admin."""
    from sqlalchemy.orm import selectinload
    
    # 1. Get all conversations with their user data loaded (solves N+1 on conv.user)
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.user))
        .order_by(desc(Conversation.last_message_at))
    )
    conversations = result.scalars().all()
    if not conversations:
        return []

    conv_ids = [c.id for c in conversations]

    # 2. Get unread counts batched
    unread_result = await db.execute(
        select(Conversation.id, func.count(Message.id))
        .join(Message, Message.conversation_id == Conversation.id)
        .where(
            Conversation.id.in_(conv_ids),
            Message.is_read == False,
            Message.sender_id == Conversation.user_id,
        )
        .group_by(Conversation.id)
    )
    unread_map = {row[0]: row[1] for row in unread_result.all()}

    # 3. Get last messages batched
    # For each conversation, we can just fetch the most recent message ID using a subquery
    subq = select(
        Message.conversation_id,
        func.max(Message.created_at).label("max_created_at")
    ).where(Message.conversation_id.in_(conv_ids)).group_by(Message.conversation_id).subquery()
    
    last_msgs_result = await db.execute(
        select(Message)
        .join(subq, and_(Message.conversation_id == subq.c.conversation_id, Message.created_at == subq.c.max_created_at))
    )
    # Map conversation_id to last message content
    last_msg_map = {m.conversation_id: m.content[:100] for m in last_msgs_result.scalars().all()}

    items = []
    for conv in conversations:
        items.append({
            "id": str(conv.id),
            "userId": str(conv.user_id),
            "userName": conv.user.full_name if conv.user else "Unknown",
            "userEmail": conv.user.email if conv.user else "",
            "userRole": conv.user.role if conv.user else "",
            "userAvatar": conv.user.avatar if conv.user else None,
            "lastMessage": last_msg_map.get(conv.id),
            "lastMessageAt": conv.last_message_at.isoformat(),
            "unreadCount": unread_map.get(conv.id, 0),
        })

    return items


async def get_conversation_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Conversation | None:
    result = await db.execute(
        select(Conversation).where(Conversation.user_id == user_id)
    )
    return result.scalars().first()


async def get_messages(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[Message], int]:
    """Get paginated messages for a conversation, newest first for pagination but returned in asc order."""
    # Count total
    count_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id == conversation_id
        )
    )
    total = count_result.scalar() or 0

    # Fetch messages in ascending order (oldest first for chat display)
    offset = max(0, total - page * limit)
    actual_limit = min(limit, total - (page - 1) * limit)

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(max(0, (page - 1) * limit) if total <= limit else offset)
        .limit(actual_limit if total > limit else limit)
    )
    messages = result.scalars().all()

    return messages, total


async def create_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
) -> Message:
    """Create a new message and update conversation timestamp."""
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
    )
    db.add(msg)

    # Update conversation last_message_at
    await db.execute(
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(last_message_at=func.now())
    )

    await db.flush()
    return msg


async def mark_messages_as_read(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    reader_id: uuid.UUID,
) -> int:
    """Mark all messages in a conversation as read (messages NOT sent by reader)."""
    result = await db.execute(
        update(Message)
        .where(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != reader_id,
                Message.is_read == False,
            )
        )
        .values(is_read=True)
    )
    return result.rowcount


async def get_unread_count(
    db: AsyncSession,
    user_id: uuid.UUID,
    is_admin: bool = False,
) -> int:
    """Get total unread message count for a user."""
    if is_admin:
        # Admin: count all unread messages sent BY users (not by admin)
        # Get admin user id first
        result = await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                and_(
                    Message.sender_id != user_id,
                    Message.is_read == False,
                )
            )
        )
    else:
        # User: count unread messages in their conversation sent by admin
        conv_result = await db.execute(
            select(Conversation.id).where(Conversation.user_id == user_id)
        )
        conv_id = conv_result.scalar()
        if not conv_id:
            return 0

        result = await db.execute(
            select(func.count(Message.id)).where(
                and_(
                    Message.conversation_id == conv_id,
                    Message.sender_id != user_id,
                    Message.is_read == False,
                )
            )
        )

    return result.scalar() or 0
