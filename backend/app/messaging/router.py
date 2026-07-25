"""Messaging API endpoints — conversations and messages between users and admin."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.db.deps import get_db
from app.models.user import User
from app.messaging import repository as repo
from app.messaging.schemas import (
    ConversationCreate,
    ConversationListItem,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    UnreadCountResponse,
)

router = APIRouter()


# ── Conversations ────────────────────────────────────────────────────────────


@router.get("/conversations", response_model=list[ConversationListItem])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List conversations. Admin sees all; users see their own."""
    if user.role == "admin":
        return await repo.get_conversations_for_admin(db)
    else:
        conv = await repo.get_conversation_for_user(db, user.id)
        if not conv:
            return []
        # Build single-item list for the user
        from app.messaging.repository import get_unread_count
        from sqlalchemy import select, desc
        from app.models.message import Message

        last_msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = last_msg_result.scalars().first()

        unread = await get_unread_count(db, user.id, is_admin=False)

        # Get admin user info for display
        admin_result = await db.execute(
            select(User).where(User.role == "admin").limit(1)
        )
        admin_user = admin_result.scalars().first()

        return [
            ConversationListItem(
                id=str(conv.id),
                userId=str(admin_user.id) if admin_user else "",
                userName=admin_user.full_name if admin_user else "Admin",
                userEmail=admin_user.email if admin_user else "",
                userRole="admin",
                userAvatar=admin_user.avatar if admin_user else None,
                lastMessage=last_msg.content[:100] if last_msg else None,
                lastMessageAt=conv.last_message_at.isoformat(),
                unreadCount=unread,
            )
        ]


@router.post("/conversations", response_model=ConversationResponse)
async def create_or_get_conversation(
    body: ConversationCreate | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get or create a conversation. Users auto-create their own; admin can specify a user_id."""
    if user.role == "admin":
        if not body or not body.userId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin must specify userId to start a conversation",
            )
        target_user_id = uuid.UUID(body.userId)
    else:
        target_user_id = user.id

    conv = await repo.get_or_create_conversation(db, target_user_id)

    # Fetch the user for response
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == target_user_id))
    target_user = result.scalars().first()

    return ConversationResponse(
        id=str(conv.id),
        userId=str(conv.user_id),
        userName=target_user.full_name if target_user else "Unknown",
        userEmail=target_user.email if target_user else "",
        userRole=target_user.role if target_user else "",
        lastMessageAt=conv.last_message_at.isoformat(),
        createdAt=conv.created_at.isoformat(),
    )


# ── Messages ─────────────────────────────────────────────────────────────────


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a conversation. Auth check: user must own it or be admin."""
    conv_id = uuid.UUID(conversation_id)
    conv = await repo.get_conversation_by_id(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Auth: user must be the conversation owner or admin
    if user.role != "admin" and conv.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages, total = await repo.get_messages(db, conv_id, page, limit)

    return [
        MessageResponse(
            id=str(msg.id),
            conversationId=str(msg.conversation_id),
            senderId=str(msg.sender_id),
            senderName=msg.sender.full_name if msg.sender else "Unknown",
            senderRole=msg.sender.role if msg.sender else "",
            content=msg.content,
            isRead=msg.is_read,
            createdAt=msg.created_at.isoformat(),
        )
        for msg in messages
    ]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    body: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a conversation."""
    conv_id = uuid.UUID(conversation_id)
    conv = await repo.get_conversation_by_id(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Auth: user must be the conversation owner or admin
    if user.role != "admin" and conv.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    msg = await repo.create_message(db, conv_id, user.id, body.content)

    return MessageResponse(
        id=str(msg.id),
        conversationId=str(msg.conversation_id),
        senderId=str(msg.sender_id),
        senderName=user.full_name,
        senderRole=user.role,
        content=msg.content,
        isRead=msg.is_read,
        createdAt=msg.created_at.isoformat(),
    )


# ── Read Receipts ────────────────────────────────────────────────────────────


@router.patch("/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all messages in a conversation as read (from the other party)."""
    conv_id = uuid.UUID(conversation_id)
    conv = await repo.get_conversation_by_id(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user.role != "admin" and conv.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    count = await repo.mark_messages_as_read(db, conv_id, user.id)
    return {"markedRead": count}


# ── Unread Count ─────────────────────────────────────────────────────────────


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get total unread message count for the current user."""
    count = await repo.get_unread_count(db, user.id, is_admin=(user.role == "admin"))
    return UnreadCountResponse(unreadCount=count)
