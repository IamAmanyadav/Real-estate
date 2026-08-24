"""WebSocket Connection Manager for live property auction rooms."""

from __future__ import annotations

import logging
from typing import Any
from fastapi import WebSocket

logger = logging.getLogger("uvicorn.error")


class AuctionWebSocketManager:
    """Manages active WebSocket connections grouped by property auction room."""

    def __init__(self):
        # property_id (str) -> set of WebSocket connections
        self._rooms: dict[str, set[WebSocket]] = {}
        # websocket -> user_id (optional, for identifying connections)
        self._socket_users: dict[WebSocket, str | None] = {}

    async def connect(
        self,
        websocket: WebSocket,
        property_id: str,
        user_id: str | None = None,
    ) -> None:
        """Accept WebSocket connection and join the property auction room."""
        await websocket.accept()

        if property_id not in self._rooms:
            self._rooms[property_id] = set()
        self._rooms[property_id].add(websocket)
        self._socket_users[websocket] = user_id

        logger.info(
            f"Auction WS client connected: property={property_id}, user={user_id} "
            f"(Total in room: {len(self._rooms[property_id])})"
        )

    def disconnect(
        self,
        websocket: WebSocket,
        property_id: str,
    ) -> None:
        """Remove WebSocket connection from property auction room."""
        if property_id in self._rooms:
            self._rooms[property_id].discard(websocket)
            if not self._rooms[property_id]:
                del self._rooms[property_id]

        self._socket_users.pop(websocket, None)
        logger.info(f"Auction WS client disconnected: property={property_id}")

    async def broadcast_to_room(
        self,
        property_id: str,
        data: dict[str, Any],
        exclude: WebSocket | None = None,
    ) -> None:
        """Send JSON event to all clients in the property auction room."""
        sockets = self._rooms.get(property_id, set()).copy()
        for ws in sockets:
            if ws is not exclude:
                try:
                    await ws.send_json(data)
                except Exception as err:
                    logger.warning(f"Error broadcasting to auction ws {property_id}: {err}")


auction_ws_manager = AuctionWebSocketManager()
