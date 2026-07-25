"""Pydantic schemas for the Properties domain.

All response schemas use from_attributes=True and field aliases to serialize
snake_case DB columns as camelCase JSON — preserving the existing frontend API
contract without any frontend changes.
"""

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class PropertyType(str, Enum):
    house = "house"
    apartment = "apartment"
    condo = "condo"
    townhouse = "townhouse"
    villa = "villa"


class PropertyStatus(str, Enum):
    for_sale = "for_sale"
    for_rent = "for_rent"
    sold = "sold"
    pending = "pending"


class SortOption(str, Enum):
    price_asc = "price_asc"
    price_desc = "price_desc"
    newest = "newest"
    oldest = "oldest"


# ── Agent ────────────────────────────────────────────────────────────────────

class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    phone: str
    avatar: str
    title: str


# ── Property ─────────────────────────────────────────────────────────────────

class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    address: str
    city: str
    state: str
    zipCode: str
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


class PropertyCreate(PropertyBase):
    agent: AgentResponse


class PropertyUpdate(BaseModel):
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
    propertyType: PropertyType | None = None
    status: PropertyStatus | None = None
    images: list[str] | None = None
    features: list[str] | None = None


class PropertyResponse(BaseModel):
    """Response schema that maps SQLAlchemy model → camelCase JSON."""
    model_config = ConfigDict(from_attributes=True)

    id: str
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
    agent: AgentResponse
    createdAt: str
    updatedAt: str


class PaginatedProperties(BaseModel):
    items: list[PropertyResponse]
    total: int
    page: int
    limit: int
    totalPages: int
