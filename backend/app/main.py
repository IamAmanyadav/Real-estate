"""FastAPI application entry point with async lifespan for DB engine management."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db.session import engine
from app.properties.router import router as properties_router
from app.inquiries.router import router as inquiries_router
from app.blog.router import router as blog_router
from app.auth.router import router as auth_router
from app.auth.profile_router import router as profile_router
from app.admin.users_router import router as admin_users_router
from app.admin.properties_router import router as admin_properties_router
from app.admin.inquiries_router import router as admin_inquiries_router
from app.admin.analytics_router import router as admin_analytics_router
from app.seller.router import router as seller_router
from app.buyer.router import router as buyer_router
from app.uploads.router import router as uploads_router
from app.sse.router import router as sse_router
from app.messaging.router import router as messaging_router


# Ensure uploads directory exists
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "properties"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events for the application."""
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="REST API for the Luxe Estates real estate platform.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Public Routers ───────────────────────────────────────────────────────────
app.include_router(properties_router, prefix="/api/v1/properties", tags=["Properties"])
app.include_router(inquiries_router, prefix="/api/v1/inquiries", tags=["Inquiries"])
app.include_router(blog_router, prefix="/api/v1/blog", tags=["Blog"])

# ── Auth ─────────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(profile_router, prefix="/api/v1/auth", tags=["Auth Profile"])

# ── Admin Routers ────────────────────────────────────────────────────────────
app.include_router(admin_users_router, prefix="/api/v1/admin/users", tags=["Admin Users"])
app.include_router(admin_properties_router, prefix="/api/v1/admin/properties", tags=["Admin Properties"])
app.include_router(admin_inquiries_router, prefix="/api/v1/admin/inquiries", tags=["Admin Inquiries"])
app.include_router(admin_analytics_router, prefix="/api/v1/admin/analytics", tags=["Admin Analytics"])

# ── SSE ──────────────────────────────────────────────────────────────────────
app.include_router(sse_router, prefix="/api/v1/sse", tags=["SSE"])

# ── Messaging ────────────────────────────────────────────────────────────
app.include_router(messaging_router, prefix="/api/v1/messages", tags=["Messages"])

# ── Seller Routers ───────────────────────────────────────────────────────────
app.include_router(seller_router, prefix="/api/v1/seller", tags=["Seller"])

# ── Buyer Routers ────────────────────────────────────────────────────────────
app.include_router(buyer_router, prefix="/api/v1/buyer", tags=["Buyer"])

# ── Uploads ──────────────────────────────────────────────────────────────────
app.include_router(uploads_router, prefix="/api/v1/uploads", tags=["Uploads"])

# ── Static file serving for uploaded images ──────────────────────────────────
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR.parent)), name="uploads")


@app.get("/", tags=["Health"])
async def root():
    return {"message": f"{settings.app_name} is running", "version": settings.app_version}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
