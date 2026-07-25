"""SSE (Server-Sent Events) manager for real-time notifications."""

from __future__ import annotations

import asyncio
import json
from typing import Any


class SSEManager:
    """In-memory SSE manager that allows broadcasting events to connected clients."""

    def __init__(self):
        self._connections: dict[str, list[asyncio.Queue]] = {}

    def connect(self, channel: str) -> asyncio.Queue:
        """Register a new client connection and return its queue."""
        queue: asyncio.Queue = asyncio.Queue()
        if channel not in self._connections:
            self._connections[channel] = []
        self._connections[channel].append(queue)
        return queue

    def disconnect(self, channel: str, queue: asyncio.Queue) -> None:
        """Remove a client connection."""
        if channel in self._connections:
            self._connections[channel] = [
                q for q in self._connections[channel] if q is not queue
            ]
            if not self._connections[channel]:
                del self._connections[channel]

    async def broadcast(self, channel: str, data: dict[str, Any]) -> None:
        """Send an event to all clients on a channel."""
        if channel not in self._connections:
            return
        message = json.dumps(data)
        for queue in self._connections[channel]:
            await queue.put(message)


# Singleton instance
sse_manager = SSEManager()
