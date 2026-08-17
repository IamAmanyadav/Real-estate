"""WebSocket Connection Manager for handling real-time chat sessions."""

from __future__ import annotations

import logging
from typing import Any
from fastapi import WebSocket

logger = logging.getLogger("uvicorn.error")


class ConnectionManager:
    """Manages active WebSocket connections grouped by conversation and user."""

    def __init__(self):
        # conversation_id -> set of WebSocket connections
        self._conversations: dict[str, set[WebSocket]] = {}
        # user_id -> set of WebSocket connections
        self._user_sockets: dict[str, set[WebSocket]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        conversation_id: str,
        user_id: str,
    ) -> None:
        """Accept connection and register it in conversation and user sets."""
        await websocket.accept()

        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = set()
        self._conversations[conversation_id].add(websocket)

        if user_id not in self._user_sockets:
            self._user_sockets[user_id] = set()
        self._user_sockets[user_id].add(websocket)

        logger.info(
            f"WebSocket client connected: user={user_id}, conv={conversation_id} "
            f"(Total in conv: {len(self._conversations[conversation_id])})"
        )

    def disconnect(
        self,
        websocket: WebSocket,
        conversation_id: str,
        user_id: str,
    ) -> None:
        """Remove connection from active sets."""
        if conversation_id in self._conversations:
            self._conversations[conversation_id].discard(websocket)
            if not self._conversations[conversation_id]:
                del self._conversations[conversation_id]

        if user_id in self._user_sockets:
            self._user_sockets[user_id].discard(websocket)
            if not self._user_sockets[user_id]:
                del self._user_sockets[user_id]

        logger.info(f"WebSocket client disconnected: user={user_id}, conv={conversation_id}")

    async def send_personal_message(
        self,
        websocket: WebSocket,
        data: dict[str, Any],
    ) -> None:
        """Send JSON payload directly to a single WebSocket client."""
        try:
            await websocket.send_json(data)
        except Exception as err:
            logger.warning(f"Error sending personal message: {err}")

    async def broadcast_to_conversation(
        self,
        conversation_id: str,
        data: dict[str, Any],
        exclude: WebSocket | None = None,
    ) -> None:
        """Send JSON payload to all active clients connected to a conversation room."""
        sockets = self._conversations.get(conversation_id, set()).copy()
        for ws in sockets:
            if ws is not exclude:
                try:
                    await ws.send_json(data)
                except Exception as err:
                    logger.warning(f"Error broadcasting to socket in conv {conversation_id}: {err}")

    async def broadcast_to_user(
        self,
        user_id: str,
        data: dict[str, Any],
    ) -> None:
        """Send JSON payload to all active sockets of a specific user."""
        sockets = self._user_sockets.get(user_id, set()).copy()
        for ws in sockets:
            try:
                await ws.send_json(data)
            except Exception as err:
                logger.warning(f"Error sending to user {user_id}: {err}")


# Global singleton instance
ws_manager = ConnectionManager()
