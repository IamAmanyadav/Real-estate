"""Inquiry API endpoints — async DB-backed."""

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db
from app.inquiries.schemas import InquiryCreate, InquiryResponse
from app.inquiries import service

router = APIRouter()

optional_bearer = HTTPBearer(auto_error=False)


@router.post("", response_model=InquiryResponse, status_code=201)
async def submit_inquiry(
    data: InquiryCreate,
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
):
    return await service.create_inquiry(db, data, credentials.credentials if credentials else None)
