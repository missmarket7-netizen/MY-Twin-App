from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from fastapi.responses import JSONResponse

TIER_RATES = {
    "free": "10/minute",
    "premium": "60/minute",
    "pro": "200/minute",
    "yearly": "500/minute",
}

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
)


async def rate_limit_exceeded_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "لقد تجاوزت الحد المسموح به. حاول مجدداً بعد دقيقة.",
            "retry_after": 60,
        },
    )
