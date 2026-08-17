"""Repository layer for time slots and appointments."""

from __future__ import annotations

import math
import uuid
from datetime import date, time

from sqlalchemy import Select, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, TimeSlot


# ── Time Slot Queries ────────────────────────────────────────────────────────

async def create_time_slot(
    db: AsyncSession,
    *,
    property_id: uuid.UUID,
    seller_id: uuid.UUID,
    slot_date: date,
    start_time: time,
    end_time: time,
) -> TimeSlot:
    slot = TimeSlot(
        property_id=property_id,
        seller_id=seller_id,
        slot_date=slot_date,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(slot)
    await db.flush()
    await db.refresh(slot)
    return slot


async def get_time_slot_by_id(db: AsyncSession, slot_id: uuid.UUID) -> TimeSlot | None:
    result = await db.execute(select(TimeSlot).where(TimeSlot.id == slot_id))
    return result.scalars().first()


async def list_slots_for_property(
    db: AsyncSession,
    property_id: uuid.UUID,
    *,
    from_date: date | None = None,
    only_available: bool = False,
) -> list[TimeSlot]:
    stmt = select(TimeSlot).where(TimeSlot.property_id == property_id)
    if from_date:
        stmt = stmt.where(TimeSlot.slot_date >= from_date)
    if only_available:
        stmt = stmt.where(TimeSlot.is_booked == False)  # noqa: E712
    stmt = stmt.order_by(TimeSlot.slot_date, TimeSlot.start_time)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_slots_for_seller(
    db: AsyncSession,
    seller_id: uuid.UUID,
    *,
    property_id: uuid.UUID | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[TimeSlot], int]:
    base = select(TimeSlot).where(TimeSlot.seller_id == seller_id)
    if property_id:
        base = base.where(TimeSlot.property_id == property_id)
    base = base.order_by(TimeSlot.slot_date.desc(), TimeSlot.start_time)

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(base.offset((page - 1) * limit).limit(limit))
    return list(result.scalars().all()), total


async def delete_time_slot(
    db: AsyncSession, slot_id: uuid.UUID, seller_id: uuid.UUID,
) -> bool:
    slot = await get_time_slot_by_id(db, slot_id)
    if not slot or slot.seller_id != seller_id:
        return False
    if slot.is_booked:
        return False
    await db.delete(slot)
    await db.flush()
    return True


async def mark_slot_booked(db: AsyncSession, slot_id: uuid.UUID, booked: bool = True) -> None:
    slot = await get_time_slot_by_id(db, slot_id)
    if slot:
        slot.is_booked = booked
        await db.flush()


# ── Appointment Queries ──────────────────────────────────────────────────────

async def create_appointment(
    db: AsyncSession,
    *,
    property_id: uuid.UUID,
    buyer_id: uuid.UUID,
    seller_id: uuid.UUID,
    time_slot_id: uuid.UUID | None = None,
) -> Appointment:
    appointment = Appointment(
        property_id=property_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        time_slot_id=time_slot_id,
        status="pending",
    )
    db.add(appointment)
    await db.flush()
    await db.refresh(appointment)
    return appointment


async def get_appointment_by_id(db: AsyncSession, appointment_id: uuid.UUID) -> Appointment | None:
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    return result.scalars().first()


def _appointments_base(
    *,
    buyer_id: uuid.UUID | None = None,
    seller_id: uuid.UUID | None = None,
    status: str | None = None,
    property_id: uuid.UUID | None = None,
) -> Select:
    stmt = select(Appointment)
    if buyer_id:
        stmt = stmt.where(Appointment.buyer_id == buyer_id)
    if seller_id:
        stmt = stmt.where(Appointment.seller_id == seller_id)
    if status:
        stmt = stmt.where(Appointment.status == status)
    if property_id:
        stmt = stmt.where(Appointment.property_id == property_id)
    return stmt.order_by(Appointment.created_at.desc())


async def list_appointments(
    db: AsyncSession,
    *,
    buyer_id: uuid.UUID | None = None,
    seller_id: uuid.UUID | None = None,
    status: str | None = None,
    property_id: uuid.UUID | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Appointment], int]:
    base = _appointments_base(
        buyer_id=buyer_id, seller_id=seller_id,
        status=status, property_id=property_id,
    )
    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0
    result = await db.execute(base.offset((page - 1) * limit).limit(limit))
    return list(result.scalars().all()), total


async def update_appointment_status(
    db: AsyncSession,
    appointment_id: uuid.UUID,
    *,
    status: str,
    admin_notes: str | None = None,
    cancellation_reason: str | None = None,
) -> Appointment | None:
    appt = await get_appointment_by_id(db, appointment_id)
    if not appt:
        return None
    appt.status = status
    if admin_notes is not None:
        appt.admin_notes = admin_notes
    if cancellation_reason is not None:
        appt.cancellation_reason = cancellation_reason
    await db.flush()
    await db.refresh(appt)
    return appt
