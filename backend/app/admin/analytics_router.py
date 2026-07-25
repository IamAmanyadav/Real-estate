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
    # ── Overview stats ──
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_properties = (await db.execute(select(func.count(Property.id)))).scalar_one()
    total_inquiries = (await db.execute(select(func.count(Inquiry.id)))).scalar_one()

    revenue_result = (await db.execute(
        select(func.coalesce(func.sum(Property.price), 0))
        .where(Property.verification_status == "sold")
    )).scalar_one()
    total_revenue = float(revenue_result)

    active_users = (await db.execute(
        select(func.count(User.id)).where(User.status == "active")
    )).scalar_one()

    pending_verifications = (await db.execute(
        select(func.count(Property.id))
        .where(Property.verification_status.in_(["pending", "under_review"]))
    )).scalar_one()

    new_inquiries = (await db.execute(
        select(func.count(Inquiry.id)).where(Inquiry.inquiry_status == "new")
    )).scalar_one()

    published_properties = (await db.execute(
        select(func.count(Property.id))
        .where(Property.verification_status == "published")
    )).scalar_one()

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

    user_analytics = UserAnalytics(
        byRole=by_role, byStatus=by_user_status, total=total_users,
    )

    # ── Recent activity ──
    recent_history = await db.execute(
        select(PropertyStatusHistory)
        .options()
        .order_by(PropertyStatusHistory.created_at.desc())
        .limit(10)
    )
    history_items = list(recent_history.scalars().all())

    recent_activity = []
    for h in history_items:
        # Fetch property title
        prop_result = await db.execute(
            select(Property.title).where(Property.id == h.property_id)
        )
        prop_title = prop_result.scalar() or "Unknown Property"

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
