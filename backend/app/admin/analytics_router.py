"""Admin analytics API endpoints & service."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.db.deps import get_db
from app.models.inquiry import Inquiry
from app.models.property import Property
from app.models.status_history import PropertyStatusHistory
from app.models.user import User

router = APIRouter()


class OverviewStats(BaseModel):
    totalUsers: int
    totalProperties: int
    totalInquiries: int
    totalRevenue: float
    activeUsers: int
    pendingVerifications: int
    newInquiries: int
    publishedProperties: int


class PropertyAnalytics(BaseModel):
    byType: dict[str, int]
    byStatus: dict[str, int]
    byVerification: dict[str, int]


class UserAnalytics(BaseModel):
    byRole: dict[str, int]
    byStatus: dict[str, int]
    total: int


class RecentActivityItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: str


class DashboardData(BaseModel):
    overview: OverviewStats
    propertyAnalytics: PropertyAnalytics
    userAnalytics: UserAnalytics
    recentActivity: list[RecentActivityItem]


@router.get("/overview", response_model=DashboardData)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    # ── Property analytics ──
    by_type_result = await db.execute(
        select(Property.property_type, func.count()).group_by(Property.property_type)
    )
    by_type = {r[0]: r[1] for r in by_type_result.all()}

    by_status_result = await db.execute(
        select(Property.status, func.count()).group_by(Property.status)
    )
    by_status = {r[0]: r[1] for r in by_status_result.all()}

    by_verification_result = await db.execute(
        select(Property.verification_status, func.count())
        .group_by(Property.verification_status)
    )
    by_verification = {r[0]: r[1] for r in by_verification_result.all()}

    property_analytics = PropertyAnalytics(
        byType=by_type, byStatus=by_status, byVerification=by_verification,
    )

    # ── User analytics ──
    by_role_result = await db.execute(
        select(User.role, func.count()).group_by(User.role)
    )
    by_role = {r[0]: r[1] for r in by_role_result.all()}

    by_user_status_result = await db.execute(
        select(User.status, func.count()).group_by(User.status)
    )
    by_user_status = {r[0]: r[1] for r in by_user_status_result.all()}

    # ── Overview stats computed from dicts ──
    total_users = sum(by_role.values())
    total_properties = sum(by_verification.values())
    active_users = by_user_status.get("active", 0)
    pending_verifications = by_verification.get("pending", 0) + by_verification.get("under_review", 0)
    published_properties = by_verification.get("published", 0)
    
    user_analytics = UserAnalytics(
        byRole=by_role, byStatus=by_user_status, total=total_users,
    )

    # Remaining overview queries
    total_inquiries = (await db.execute(select(func.count(Inquiry.id)))).scalar_one()
    new_inquiries = (await db.execute(
        select(func.count(Inquiry.id)).where(Inquiry.inquiry_status == "new")
    )).scalar_one()

    revenue_result = (await db.execute(
        select(func.coalesce(func.sum(Property.price), 0))
        .where(Property.verification_status == "sold")
    )).scalar_one()
    total_revenue = float(revenue_result)

    overview = OverviewStats(
        totalUsers=total_users,
        totalProperties=total_properties,
        totalInquiries=total_inquiries,
        totalRevenue=total_revenue,
        activeUsers=active_users,
        pendingVerifications=pending_verifications,
        newInquiries=new_inquiries,
        publishedProperties=published_properties,
    )

    # ── Recent activity ──
    recent_history = await db.execute(
        select(PropertyStatusHistory, Property.title)
        .join(Property, Property.id == PropertyStatusHistory.property_id)
        .order_by(PropertyStatusHistory.created_at.desc())
        .limit(10)
    )
    history_items = list(recent_history.all())

    recent_activity = []
    for h, prop_title in history_items:
        recent_activity.append(RecentActivityItem(
            id=str(h.id),
            type="verification",
            title=f"Status changed: {prop_title}",
            description=f"{h.old_status or 'N/A'} → {h.new_status}"
                        + (f" — {h.reason}" if h.reason else ""),
            timestamp=h.created_at.isoformat() if h.created_at else "",
        ))

    # If no history, show recent properties added
    if not recent_activity:
        recent_props = await db.execute(
            select(Property).order_by(Property.created_at.desc()).limit(5)
        )
        for p in recent_props.scalars().all():
            recent_activity.append(RecentActivityItem(
                id=str(p.id),
                type="property_added",
                title=f"New property: {p.title}",
                description=f"{p.property_type} in {p.city}, {p.state}",
                timestamp=p.created_at.isoformat() if p.created_at else "",
            ))

    return DashboardData(
        overview=overview,
        propertyAnalytics=property_analytics,
        userAnalytics=user_analytics,
        recentActivity=recent_activity,
    )
