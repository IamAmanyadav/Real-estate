"""Pydantic schemas for the messaging system."""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    id: str
    conversationId: str
    senderId: str
    senderClerkId: str | None = None
    senderName: str
    senderRole: str
    content: str
    isRead: bool
    createdAt: str


class ConversationCreate(BaseModel):
    """Used by admin to start a conversation with a specific user."""
    userId: str | None = None


class ConversationResponse(BaseModel):
    id: str
    userId: str
    userName: str
    userEmail: str
    userRole: str
    lastMessageAt: str
    createdAt: str


class ConversationListItem(BaseModel):
    id: str
    userId: str
    userName: str
    userEmail: str
    userRole: str
    userAvatar: str | None
    lastMessage: str | None
    lastMessageAt: str
    unreadCount: int


class UnreadCountResponse(BaseModel):
    unreadCount: int
