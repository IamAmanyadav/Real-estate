"""Pydantic schemas for admin inquiry management — extended with buyer tracking."""

from enum import Enum

from pydantic import BaseModel, ConfigDict


class InquiryStatusEnum(str, Enum):
    new = "new"
    read = "read"
    responded = "responded"
    closed = "closed"


class TrackingStatusEnum(str, Enum):
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class AdminInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: str | None = None
    message: str
    propertyId: str | None = None
    propertyTitle: str | None = None
    inquiryStatus: str
    adminNotes: str | None = None
    createdAt: str
    updatedAt: str
    # New buyer tracking fields
    inquiryType: str = "inquiry"
    buyerId: str | None = None
    buyerName: str | None = None
    trackingStatus: str = "submitted"
    adminResponse: str | None = None


class InquiryStatusUpdate(BaseModel):
    inquiry_status: InquiryStatusEnum
    admin_notes: str | None = None


class TrackingStatusUpdate(BaseModel):
    tracking_status: TrackingStatusEnum
    admin_response: str | None = None


class PaginatedInquiries(BaseModel):
    items: list[AdminInquiryResponse]
    total: int
    page: int
    limit: int
    totalPages: int
