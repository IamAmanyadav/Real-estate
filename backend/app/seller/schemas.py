"""Pydantic schemas for seller property management."""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class PropertyType(str, Enum):
    house = "house"
    apartment = "apartment"
    condo = "condo"
    townhouse = "townhouse"
    villa = "villa"
    flat = "flat"
    plot = "plot"


class PropertyStatus(str, Enum):
    for_sale = "for_sale"
    for_rent = "for_rent"


class DocumentType(str, Enum):
    title_deed = "title_deed"
    ownership_certificate = "ownership_certificate"
    tax_receipt = "tax_receipt"
    identity_proof = "identity_proof"
    noc = "noc"
    encumbrance_certificate = "encumbrance_certificate"
    other = "other"


# ── Document schemas ─────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    documentType: DocumentType
    documentUrl: str = Field(..., min_length=5, max_length=500)
    documentName: str = Field(..., min_length=1, max_length=200)


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    documentType: str
    documentUrl: str
    documentName: str
    status: str
    adminNote: str | None = None


# ── Property schemas ─────────────────────────────────────────────────────────

class SellerPropertyCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    address: str = Field(..., min_length=3)
    city: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    zipCode: str = Field(..., min_length=3)
    country: str = "United States"
    latitude: float | None = None
    longitude: float | None = None
    bedrooms: int = Field(..., ge=0)
    bathrooms: int = Field(..., ge=0)
    area: int = Field(..., gt=0, description="Area in sqft")
    propertyType: PropertyType
    status: PropertyStatus = PropertyStatus.for_sale
    yearBuilt: int = Field(..., ge=1800, le=2030)
    images: list[str] = []
    features: list[str] = []
    documents: list[DocumentCreate] = []


class SellerPropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = Field(None, gt=0)
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zipCode: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    bedrooms: int | None = Field(None, ge=0)
    bathrooms: int | None = Field(None, ge=0)
    area: int | None = Field(None, gt=0)
    propertyType: PropertyType | None = None
    status: PropertyStatus | None = None
    yearBuilt: int | None = Field(None, ge=1800, le=2030)
    images: list[str] | None = None
    features: list[str] | None = None
    documents: list[DocumentCreate] | None = None


class SellerPropertyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    propertyId: str  # human-readable ID e.g. LXE-xxxx
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
    documents: list[DocumentResponse]
    verificationStatus: str
    rejectionReason: str | None = None
    createdAt: str
    updatedAt: str


class PaginatedSellerProperties(BaseModel):
    items: list[SellerPropertyResponse]
    total: int
    page: int
    limit: int
    totalPages: int


# ── Dashboard stats ──────────────────────────────────────────────────────────

class SellerDashboardStats(BaseModel):
    totalListings: int
    pendingListings: int
    approvedListings: int
    publishedListings: int
    soldListings: int
    archivedListings: int
    rejectedListings: int
    totalInquiriesReceived: int
