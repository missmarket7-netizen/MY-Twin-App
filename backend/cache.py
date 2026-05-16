"""
MyTwin – Cache Layer
نظام تخزين مؤقت متعدد الخلفيات: Redis (إن وُجد) أو ذاكرة محلية.
"""
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
    # ─── Redis Backend ────────────────────────────────────────
    r = redis.from_url(REDIS_URL, decode_responses=True)

    def get(k: str) -> Optional[Any]:
        try:
            val = r.get(k)
            return json.loads(val) if val else None
        except Exception:
            return None

    def set(k: str, v: Any, ttl: int = 3600) -> None:
        try:
            r.setex(k, ttl, json.dumps(v))
        except Exception:
            pass

    def incr(k: str, ttl: int = 86400) -> int:
        """زيادة عداد مع ضبط ttl تلقائياً."""
        try:
            # Redis INCR ينشئ المفتاح بقيمة 0 إذا لم يكن موجوداً
            v = r.incr(k)
            # تجديد مدة الصلاحية بعد كل زيادة (أو ضبطها أول مرة)
            r.expire(k, ttl)
            return v
        except Exception:
            # احتياطي بسيط
            val = _mem.get(k, 0) + 1
            _mem[k] = val
            return val

    def delete(*ks) -> None:
        try:
            r.delete(*ks)
        except Exception:
            pass

else:
    # ─── In-Memory Backend (للتطوير) ─────────────────────────
    def get(k: str) -> Optional[Any]:
        return _mem.get(k)

    def set(k: str, v: Any, ttl: int = 3600) -> None:
        _mem[k] = v
        # ملاحظة: لا يتم تطبيق ttl في وضع الذاكرة المحلية،
        # يُستخدم فقط للتطوير والاختبار.

    def incr(k: str, ttl: int = 86400) -> int:
        _mem[k] = _mem.get(k, 0) + 1
        return _mem[k]

    def delete(*ks) -> None:
        for k in ks:
            _mem.pop(k, None)
