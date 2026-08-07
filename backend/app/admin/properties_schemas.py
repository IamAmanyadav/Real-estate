"""Pydantic schemas for admin property management."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class AdminDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    documentType: str
    documentUrl: str
    documentName: str
    status: str
    adminNote: str | None = None


class VerificationStatus(str, Enum):
    pending = "pending"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    published = "published"
    sold = "sold"
    archived = "archived"


class AdminPropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    propertyCode: str | None = None
    title: str
    description: str
    price: float
    address: str
    city: str
    state: str
    zipCode: str
    country: str
    latitude: float | None = None
    longitude: float | None = None
    bedrooms: int
    bathrooms: int
    area: int
    propertyType: str
    status: str
    yearBuilt: int
    images: list[str]
    features: list[str]
    agent: dict
    verificationStatus: str
    rejectionReason: str | None = None
    verifiedBy: str | None = None
    verifiedAt: str | None = None
    sellerId: str | None = None
    sellerName: str | None = None
    createdAt: str
    updatedAt: str
    statusHistory: list["StatusHistoryItem"] = []
    documents: list[AdminDocumentResponse] = []


class StatusHistoryItem(BaseModel):
    id: str
    oldStatus: str | None = None
    newStatus: str
    changedBy: str | None = None
    changedByName: str | None = None
    reason: str | None = None
    createdAt: str


class AdminPropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = Field(None, gt=0)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zipCode: str | None = None
    bedrooms: int | None = Field(None, ge=0)
    bathrooms: int | None = Field(None, ge=0)
    area: int | None = Field(None, gt=0)
    propertyType: str | None = None
    status: str | None = None
    images: list[str] | None = None
    features: list[str] | None = None


class VerificationUpdate(BaseModel):
    verification_status: VerificationStatus = Field(..., alias="verificationStatus")
    reason: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PaginatedAdminProperties(BaseModel):
    items: list[AdminPropertyResponse]
    total: int
    page: int
    limit: int
    totalPages: int
