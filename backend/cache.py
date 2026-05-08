import os
import json
from typing import Any, Optional

try:
    import redis
except ImportError:
    redis = None

REDIS_URL = os.getenv("REDIS_URL", "")
_mem: dict = {}

if redis and REDIS_URL:
    r = redis.from_url(REDIS_URL, decode_responses=True)

    def get(k: str) -> Optional[Any]:
        val = r.get(k)
        return json.loads(val) if val else None

    def set(k: str, v: Any, ttl: int = 3600) -> None:
        r.setex(k, ttl, json.dumps(v))

    def incr(k: str, ttl: int = 86400) -> int:
        if not r.exists(k):
            r.setex(k, ttl, 0)
        return r.incr(k)

    def delete(*ks) -> None:
        r.delete(*ks)

else:
    # Fallback: In-memory cache (لما مفيش Redis)
    def get(k: str) -> Optional[Any]:
        return _mem.get(k)

    def set(k: str, v: Any, ttl: int = 3600) -> None:
        _mem[k] = v

    def incr(k: str, ttl: int = 86400) -> int:
        _mem[k] = _mem.get(k, 0) + 1
        return _mem[k]

    def delete(*ks) -> None:
        for k in ks:
            _mem.pop(k, None)
