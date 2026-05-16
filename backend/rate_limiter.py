"""
MyTwin – Rate Limiter
حدود المعدل لكل باقة، لمنع الاستخدام المفرط وحماية الخادم.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from fastapi.responses import JSONResponse

# حدود المعدل لكل باقة
TIER_RATES = {
    "free": "10/minute",
    "free_trial_14d": "20/minute",
    "premium_trial": "120/minute",
    "premium": "60/minute",
    "pro": "200/minute",
    "yearly": "500/minute",
}

# المُحدِّد العام – يستخدم عنوان IP لتحديد المستخدم
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
)


async def rate_limit_exceeded_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    معالج تجاوز حد المعدل.
    يُرجع استجابة 429 مع رسالة عربية واضحة.
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "لقد تجاوزت الحد المسموح به. حاول مجدداً بعد دقيقة.",
            "retry_after": 60,
        },
    )
