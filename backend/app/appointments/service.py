"""Service layer for appointment scheduling — orchestrates repository + SSE."""

from __future__ import annotations

import math
import uuid
from datetime import date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.appointments import repository as repo
from app.appointments.schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    PaginatedAppointments,
    PaginatedTimeSlots,
    TimeSlotCreate,
    TimeSlotResponse,
)
from app.models.property import Property
from app.sse.manager import sse_manager


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_time(t: str) -> time:
    """Parse HH:MM string into a time object."""
    parts = t.split(":")
    return time(int(parts[0]), int(parts[1]))


def _format_time(t: time) -> str:
    return t.strftime("%H:%M")


def _format_date(d: date) -> str:
    return d.isoformat()


def _slot_to_response(slot) -> TimeSlotResponse:
    return TimeSlotResponse(
        id=str(slot.id),
        propertyId=str(slot.property_id),
        propertyTitle=slot.property.title if slot.property else "Unknown",
        sellerId=str(slot.seller_id),
        slotDate=_format_date(slot.slot_date),
        startTime=_format_time(slot.start_time),
        endTime=_format_time(slot.end_time),
        isBooked=slot.is_booked,
        createdAt=slot.created_at.isoformat(),
    )


def _appointment_to_response(appt) -> AppointmentResponse:
    prop = appt.property
    buyer = appt.buyer
    seller = appt.seller
    slot = appt.time_slot

    # Get first property image if available
    prop_image = None
    if prop and hasattr(prop, "images") and prop.images:
        prop_image = prop.images[0].url if prop.images else None

    return AppointmentResponse(
        id=str(appt.id),
        propertyId=str(appt.property_id),
        propertyTitle=prop.title if prop else "Unknown",
        propertyImage=prop_image,
        propertyAddress=f"{prop.address}, {prop.city}" if prop else None,
        buyerId=str(appt.buyer_id),
        buyerName=buyer.full_name if buyer else "Unknown",
        buyerEmail=buyer.email if buyer else "",
        sellerId=str(appt.seller_id),
        sellerName=seller.full_name if seller else "Unknown",
        sellerEmail=seller.email if seller else "",
        timeSlotId=str(appt.time_slot_id),
        slotDate=_format_date(slot.slot_date) if slot else "",
        startTime=_format_time(slot.start_time) if slot else "",
        endTime=_format_time(slot.end_time) if slot else "",
        status=appt.status,
        adminNotes=appt.admin_notes,
        cancellationReason=appt.cancellation_reason,
        createdAt=appt.created_at.isoformat(),
        updatedAt=appt.updated_at.isoformat(),
    )


# ── Time Slot Service ────────────────────────────────────────────────────────

async def create_seller_time_slot(
    db: AsyncSession, data: TimeSlotCreate, seller_id: uuid.UUID,
) -> TimeSlotResponse:
    """Create an availability slot — seller must own the property."""
    prop_id = uuid.UUID(data.propertyId)

    # Verify ownership
    result = await db.execute(select(Property).where(Property.id == prop_id))
    prop = result.scalars().first()
    if not prop or prop.seller_id != seller_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create slots for your own properties.",
        )

    start = _parse_time(data.startTime)
    end = _parse_time(data.endTime)
    if end <= start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time.",
        )

    slot = await repo.create_time_slot(
        db,
        property_id=prop_id,
        seller_id=seller_id,
        slot_date=data.slotDate,
        start_time=start,
        end_time=end,
    )
    # Refresh to populate relationships
    await db.refresh(slot)
    return _slot_to_response(slot)


async def list_seller_availability(
    db: AsyncSession, seller_id: uuid.UUID,
    *, property_id: str | None = None,
    page: int = 1, limit: int = 20,
) -> PaginatedTimeSlots:
    pid = uuid.UUID(property_id) if property_id else None
    slots, total = await repo.list_slots_for_seller(
        db, seller_id, property_id=pid, page=page, limit=limit,
    )
    total_pages = max(1, math.ceil(total / limit))
    return PaginatedTimeSlots(
        items=[_slot_to_response(s) for s in slots],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def delete_seller_slot(
    db: AsyncSession, slot_id: str, seller_id: uuid.UUID,
) -> None:
    success = await repo.delete_time_slot(db, uuid.UUID(slot_id), seller_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot not found, not owned by you, or already booked.",
        )


async def get_property_availability(
    db: AsyncSession, property_id: str,
) -> list[TimeSlotResponse]:
    """Public: get available (unbooked) slots for a property."""
    slots = await repo.list_slots_for_property(
        db, uuid.UUID(property_id),
        from_date=date.today(),
        only_available=True,
    )
    return [_slot_to_response(s) for s in slots]


# ── Appointment Service ──────────────────────────────────────────────────────

async def create_buyer_appointment(
    db: AsyncSession, data: AppointmentCreate, buyer_id: uuid.UUID,
) -> AppointmentResponse:
    """Buyer requests a visit. Can be slot-less (pending admin) or with a specific slot."""
    prop_id = uuid.UUID(data.propertyId)
    
    # Fetch property to get seller_id
    result = await db.execute(select(Property).where(Property.id == prop_id))
    prop = result.scalars().first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")
        
    seller_id = prop.seller_id
    slot_id = None
    
    if data.timeSlotId:
        slot_id = uuid.UUID(data.timeSlotId)
        slot = await repo.get_time_slot_by_id(db, slot_id)
        if not slot:
            raise HTTPException(status_code=404, detail="Time slot not found.")
        if slot.is_booked:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This time slot is already booked.",
            )
        if str(slot.property_id) != data.propertyId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time slot does not belong to this property.",
            )
        # Mark slot as booked
        await repo.mark_slot_booked(db, slot.id, True)

    appt = await repo.create_appointment(
        db,
        property_id=prop_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        time_slot_id=slot_id,
    )
    await db.refresh(appt)
    response = _appointment_to_response(appt)

    # SSE notification to seller
    await sse_manager.broadcast(
        f"appointments:{seller_id}",
        {
            "type": "new_appointment",
            "appointmentId": response.id,
            "propertyTitle": response.propertyTitle,
            "buyerName": response.buyerName,
            "slotDate": response.slotDate if response.slotDate else "Pending Admin",
            "startTime": response.startTime if response.startTime else "Pending Admin",
        },
    )

    return response


async def list_buyer_appointments(
    db: AsyncSession, buyer_id: uuid.UUID,
    *, status_filter: str | None = None,
    page: int = 1, limit: int = 20,
) -> PaginatedAppointments:
    items, total = await repo.list_appointments(
        db, buyer_id=buyer_id, status=status_filter, page=page, limit=limit,
    )
    total_pages = max(1, math.ceil(total / limit))
    return PaginatedAppointments(
        items=[_appointment_to_response(a) for a in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def list_seller_appointments(
    db: AsyncSession, seller_id: uuid.UUID,
    *, status_filter: str | None = None,
    page: int = 1, limit: int = 20,
) -> PaginatedAppointments:
    items, total = await repo.list_appointments(
        db, seller_id=seller_id, status=status_filter, page=page, limit=limit,
    )
    total_pages = max(1, math.ceil(total / limit))
    return PaginatedAppointments(
        items=[_appointment_to_response(a) for a in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def list_all_appointments(
    db: AsyncSession,
    *, status_filter: str | None = None,
    page: int = 1, limit: int = 20,
) -> PaginatedAppointments:
    items, total = await repo.list_appointments(
        db, status=status_filter, page=page, limit=limit,
    )
    total_pages = max(1, math.ceil(total / limit))
    return PaginatedAppointments(
        items=[_appointment_to_response(a) for a in items],
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


async def update_appointment(
    db: AsyncSession,
    appointment_id: str,
    data: AppointmentStatusUpdate,
) -> AppointmentResponse:
    """Admin updates appointment status — broadcasts to buyer + seller."""
    appt_id = uuid.UUID(appointment_id)
    new_status = data.status.value

    old_appt = await repo.get_appointment_by_id(db, appt_id)
    if not old_appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Handle assigning/rescheduling a slot
    if (new_status in ("approved", "rescheduled")) and data.newTimeSlotId:
        # If there was an old slot, free it
        if old_appt.time_slot_id:
            await repo.mark_slot_booked(db, old_appt.time_slot_id, False)

        # Book new slot
        new_slot = await repo.get_time_slot_by_id(db, uuid.UUID(data.newTimeSlotId))
        if not new_slot or new_slot.is_booked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New time slot is not available.",
            )
        await repo.mark_slot_booked(db, new_slot.id, True)
        old_appt.time_slot_id = new_slot.id
        await db.flush()

    # If cancelling, free the slot
    if new_status == "cancelled" and old_appt.time_slot_id:
        await repo.mark_slot_booked(db, old_appt.time_slot_id, False)

    appt = await repo.update_appointment_status(
        db, appt_id,
        status=new_status,
        admin_notes=data.adminNotes,
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    response = _appointment_to_response(appt)

    # SSE notifications — broadcast to both buyer and seller
    event_data = {
        "type": f"appointment_{new_status}",
        "appointmentId": response.id,
        "propertyTitle": response.propertyTitle,
        "status": new_status,
        "slotDate": response.slotDate,
        "startTime": response.startTime,
    }
    await sse_manager.broadcast(f"appointments:{appt.buyer_id}", event_data)
    await sse_manager.broadcast(f"appointments:{appt.seller_id}", event_data)

    return response
