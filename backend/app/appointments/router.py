"""API routers for the appointment scheduling system.

Three sub-routers are exported:
  • seller_appointments_router  — seller availability management
  • buyer_appointments_router   — buyer visit booking
  • admin_appointments_router   — admin appointment control
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin, get_current_buyer, get_current_seller
from app.db.deps import get_db
from app.models.user import User
from app.appointments import service
from app.appointments.schemas import (
    AppointmentResponse,
    AppointmentStatusUpdate,
    PaginatedAppointments,
    PaginatedTimeSlots,
    TimeSlotCreate,
    TimeSlotResponse,
)


# ── Seller Router ────────────────────────────────────────────────────────────

seller_appointments_router = APIRouter()


@seller_appointments_router.get("/availability", response_model=PaginatedTimeSlots)
async def list_seller_availability(
    property_id: str | None = Query(None, alias="propertyId"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """List time slots created by the authenticated seller."""
    return await service.list_seller_availability(
        db, seller.id, property_id=property_id, page=page, limit=limit,
    )


@seller_appointments_router.post(
    "/availability", response_model=TimeSlotResponse, status_code=201,
)
async def create_availability(
    data: TimeSlotCreate,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Create a new time slot for a seller's property."""
    return await service.create_seller_time_slot(db, data, seller.id)


@seller_appointments_router.delete("/availability/{slot_id}", status_code=204)
async def delete_availability(
    slot_id: str,
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """Delete an unbooked time slot."""
    await service.delete_seller_slot(db, slot_id, seller.id)


@seller_appointments_router.get("/appointments", response_model=PaginatedAppointments)
async def list_seller_appointments(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    seller: User = Depends(get_current_seller),
):
    """List appointments for the seller's properties."""
    return await service.list_seller_appointments(
        db, seller.id, status_filter=status, page=page, limit=limit,
    )


# ── Buyer Router ─────────────────────────────────────────────────────────────

buyer_appointments_router = APIRouter()


@buyer_appointments_router.get("/appointments", response_model=PaginatedAppointments)
async def list_buyer_appointments(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    buyer: User = Depends(get_current_buyer),
):
    """List the authenticated buyer's visit appointments."""
    return await service.list_buyer_appointments(
        db, buyer.id, status_filter=status, page=page, limit=limit,
    )


@buyer_appointments_router.post(
    "/appointments", response_model=AppointmentResponse, status_code=201,
)
async def create_appointment(
    data: service.AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    buyer: User = Depends(get_current_buyer),
):
    """Book a property visit for an available time slot."""
    return await service.create_buyer_appointment(db, data, buyer.id)


# ── Admin Router ─────────────────────────────────────────────────────────────

admin_appointments_router = APIRouter()


@admin_appointments_router.get("", response_model=PaginatedAppointments)
async def list_all_appointments(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """List all appointments across the platform."""
    return await service.list_all_appointments(
        db, status_filter=status, page=page, limit=limit,
    )


@admin_appointments_router.patch(
    "/{appointment_id}", response_model=AppointmentResponse,
)
async def update_appointment_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Approve, cancel, reschedule, or complete an appointment."""
    return await service.update_appointment(db, appointment_id, data)


# ── Public Router (property availability) ────────────────────────────────────

public_availability_router = APIRouter()


@public_availability_router.get(
    "/{property_id}/availability", response_model=list[TimeSlotResponse],
)
async def get_property_availability(
    property_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get available time slots for a property (public)."""
    return await service.get_property_availability(db, property_id)
