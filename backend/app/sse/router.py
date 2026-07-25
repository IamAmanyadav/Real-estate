"""SSE (Server-Sent Events) router for real-time property status updates."""

import asyncio

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.sse.manager import sse_manager

router = APIRouter()


@router.get("/property-status/{seller_id}")
async def property_status_stream(seller_id: str):
    """SSE endpoint — sellers connect to receive live property status updates."""

    async def event_generator():
        queue = sse_manager.connect(seller_id)
        try:
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"event": "status_update", "data": data}
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield {"event": "heartbeat", "data": "ping"}
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.disconnect(seller_id, queue)

    return EventSourceResponse(event_generator())
