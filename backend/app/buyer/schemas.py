"""Pydantic schemas for buyer inquiry management."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class InquiryType(str, Enum):
    inquiry = "inquiry"
    purchase_request = "purchase_request"


class TrackingStatus(str, Enum):
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class BuyerInquiryCreate(BaseModel):
    propertyId: str = Field(..., min_length=1)
    message: str = Field(..., min_length=10, max_length=2000)
    inquiryType: InquiryType = InquiryType.inquiry
    phone: str | None = None


class BuyerInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    propertyId: str | None = None
    propertyTitle: str | None = None
    propertyImage: str | None = None
    propertyPrice: float | None = None
    message: str
    inquiryType: str
    trackingStatus: str
    adminResponse: str | None = None
    inquiryStatus: str
    createdAt: str
    updatedAt: str


class PaginatedBuyerInquiries(BaseModel):
    items: list[BuyerInquiryResponse]
    total: int
    page: int
    limit: int
    totalPages: int


class BuyerDashboardStats(BaseModel):
    totalInquiries: int
    purchaseRequests: int
    pendingResponses: int
    respondedInquiries: int
