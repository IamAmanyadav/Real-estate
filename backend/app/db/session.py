"""Async SQLAlchemy engine and session factory."""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

connect_args = {}
if (
    settings.database_url.startswith("postgresql")
    and "localhost" not in settings.database_url
    and "127.0.0.1" not in settings.database_url
    and "ssl=" not in settings.database_url
    and "sslmode=" not in settings.database_url
):
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

