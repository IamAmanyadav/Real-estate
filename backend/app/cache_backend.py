import typing
from typing import Optional, Tuple

from fastapi_cache.backends import Backend

class ValkeyBackend(Backend):
    def __init__(self, valkey):
        self.valkey = valkey

    async def get_with_ttl(self, key: str) -> Tuple[int, Optional[str]]:
        async with self.valkey.pipeline() as pipe:
            pipe.ttl(key)
            pipe.get(key)
            ttl, value = await pipe.execute()
        if not value:
            return 0, None
        return ttl, value

    async def get(self, key: str) -> Optional[str]:
        return await self.valkey.get(key)

    async def set(self, key: str, value: str, expire: Optional[int] = None) -> None:
        if expire:
            await self.valkey.set(key, value, ex=expire)
        else:
            await self.valkey.set(key, value)

    async def clear(self, namespace: Optional[str] = None, key: Optional[str] = None) -> int:
        if namespace:
            lua = f"for i, name in ipairs(redis.call('KEYS', '{namespace}:*')) do redis.call('DEL', name); end"
            return await self.valkey.eval(lua, 0)
        elif key:
            return await self.valkey.delete(key)
        return 0
