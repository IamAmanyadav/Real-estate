"""Pydantic schemas for inquiries."""

from pydantic import BaseModel, ConfigDict, Field


class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=200)
    phone: str | None = None
    message: str = Field(..., min_length=10, max_length=2000)
    propertyId: str | None = None


class InquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    message: str
    createdAt: str
