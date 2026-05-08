from datetime import date
from typing import Tuple

try:
    from backend.cache import get, set as cache_set
except ImportError:
    from cache import get, set as cache_set

# حدود التوكن اليومية لكل tier
BASE_TOK = {
    "free": 3000,
    "premium_trial": 3000,
    "premium": 6000,
    "yearly": 20000,
}

# حدود المحادثات اليومية لكل tier
BASE_CONV = {
    "free": 50,
    "premium_trial": 50,
    "premium": 150,
    "yearly": 999,
}


def _daily_key(uid: str) -> str:
    return f"daily:{uid}:{date.today().isoformat()}"


def check_tok(uid: str, tier: str, est: int) -> Tuple[bool, int]:
    """
    تتحقق إذا كان المستخدم عنده توكن كافية.
    ترجع (True, الباقي) لو تمام، أو (False, 0) لو وصل للحد.
    """
    key = _daily_key(uid)
    used = get(key)

    if used is None:
        used = 0

    limit = BASE_TOK.get(tier, 3000)

    if used + est > limit:
        return False, max(0, limit - used)

    cache_set(key, used + est, 86400)
    return True, limit - used - est


def check_conv(uid: str, tier: str) -> Tuple[bool, int]:
    """
    تتحقق إذا كان المستخدم عنده محادثات كافية.
    """
    key = f"conv:{uid}:{date.today().isoformat()}"
    cur = get(key)

    if cur is None:
        cur = 0

    limit = BASE_CONV.get(tier, 50)

    if cur >= limit:
        return False, 0

    cache_set(key, cur + 1, 86400)
    return True, limit - cur - 1
