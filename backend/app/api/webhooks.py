"""Clerk Webhook handlers for syncing users to the Neon database."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from svix.webhooks import Webhook, WebhookVerificationError
import json

from app.config import settings
from app.db.deps import get_db
from app.models.user import User

router = APIRouter()

@router.post("/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Clerk webhooks."""
    secret = settings.clerk_webhook_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk Webhook Secret is not configured"
        )
        
    payload = await request.body()
    headers = request.headers
    
    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")
    
    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Svix headers"
        )
        
    wh = Webhook(secret)
    try:
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        })
    except WebhookVerificationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
    evt_type = evt.get("type")
    data = evt.get("data", {})
    
    if evt_type == "user.created":
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else f"{data.get('id')}@no-email.clerk"
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        full_name = f"{first_name} {last_name}".strip()
        role = data.get("unsafe_metadata", {}).get("role") or data.get("public_metadata", {}).get("role") or "buyer"
        
        user = User(
            clerk_id=data.get("id"),
            email=email,
            full_name=full_name,
            role=role,
            status="active",
            is_verified=True,
            password_hash=None
        )
        db.add(user)
        await db.commit()
        
    elif evt_type == "user.updated":
        clerk_id = data.get("id")
        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalars().first()
        if user:
            first_name = data.get("first_name") or ""
            last_name = data.get("last_name") or ""
            user.full_name = f"{first_name} {last_name}".strip()
            # Also update email if it changed
            email_addresses = data.get("email_addresses", [])
            if email_addresses:
                user.email = email_addresses[0].get("email_address")
            await db.commit()
            
    elif evt_type == "user.deleted":
        clerk_id = data.get("id")
        result = await db.execute(select(User).where(User.clerk_id == clerk_id))
        user = result.scalars().first()
        if user:
            await db.delete(user)
            await db.commit()

    return {"message": "Webhook received"}
