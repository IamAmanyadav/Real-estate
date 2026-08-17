"""Pydantic schemas for the appointment scheduling system."""

from datetime import date, time
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class AppointmentStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    cancelled = "cancelled"
    completed = "completed"
    rescheduled = "rescheduled"


# ── Time Slot schemas ────────────────────────────────────────────────────────

class TimeSlotCreate(BaseModel):
    propertyId: str
    slotDate: date
    startTime: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    endTime: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format")


class TimeSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    propertyId: str
    propertyTitle: str
    sellerId: str
    slotDate: str
    startTime: str
    endTime: str
    isBooked: bool
    createdAt: str


class TimeSlotBulkCreate(BaseModel):
    propertyId: str
    slotDate: date
    slots: list[dict] = Field(
        ..., description="List of {startTime, endTime} dicts in HH:MM format"
    )


class PaginatedTimeSlots(BaseModel):
    items: list[TimeSlotResponse]
    total: int
    page: int
    limit: int
    totalPages: int


# ── Appointment schemas ──────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    propertyId: str
    timeSlotId: str | None = None
    message: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    adminNotes: str | None = None
    newTimeSlotId: str | None = None  # for rescheduling


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    propertyId: str
    propertyTitle: str
    propertyImage: str | None = None
    propertyAddress: str | None = None
    buyerId: str
    buyerName: str
    buyerEmail: str
    buyerPhone: str | None = None
    sellerId: str
    sellerName: str
    sellerEmail: str
    sellerPhone: str | None = None
    timeSlotId: str | None = None
    slotDate: str | None = None
    startTime: str | None = None
    endTime: str | None = None
    status: str
    adminNotes: str | None = None
    cancellationReason: str | None = None
    createdAt: str
    updatedAt: str


class PaginatedAppointments(BaseModel):
    items: list[AppointmentResponse]
    total: int
    page: int
    limit: int
    totalPages: int
