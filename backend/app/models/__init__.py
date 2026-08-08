"""ORM models package — import all models so Alembic metadata is populated."""

from app.models.agent import Agent  # noqa: F401
from app.models.property import Property, PropertyImage, PropertyFeature  # noqa: F401
from app.models.inquiry import Inquiry  # noqa: F401
from app.models.blog import BlogPost, BlogTag  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.status_history import PropertyStatusHistory  # noqa: F401
from app.models.property_document import PropertyDocument  # noqa: F401
from app.models.message import Conversation, Message  # noqa: F401
from app.models.appointment import TimeSlot, Appointment  # noqa: F401
from app.models.password_reset import PasswordResetToken  # noqa: F401
