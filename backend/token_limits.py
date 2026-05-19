from datetime import date, datetime, timedelta
from typing import Tuple, Optional
from cache import get, set as cache_set

BASE_TOK = {
    "free": 500,
    "free_trial_14d": 1500,
    "plus": 1500,
    "premium": 4000,
    "pro": 7000,
    "yearly": 15000,
}

BASE_IMAGES = {
    "free": 1,
    "plus": 3,
    "premium": 5,
    "pro": 9,
    "yearly": 999,
}

BASE_FILES = {
    "free": 1,
    "plus": 2,
    "premium": 5,
    "pro": 7,
    "yearly": 999,
}

BASE_NOTIFICATIONS = {
    "free": 3,
    "plus": 5,
    "premium": 7,
    "pro": 7,
    "yearly": 10,
}

def _get_effective_tier(tier: str, signup_date: Optional[str] = None) -> str:
    if tier == "free" and signup_date:
        try:
            signup = datetime.fromisoformat(signup_date)
            age = datetime.utcnow() - signup
            if age < timedelta(days=14):
                return "free_trial_14d"
        except:
            pass
    return tier

def check_tok(uid: str, tier: str, est: int, signup_date: Optional[str] = None, trial_start: Optional[str] = None) -> Tuple[bool, int]:
    effective = _get_effective_tier(tier, signup_date)
    key = f"tok:{uid}:{date.today().isoformat()}"
    used = get(key) or 0
    limit = BASE_TOK.get(effective, 500)
    if used + est > limit:
        return False, max(0, limit - used)
    cache_set(key, used + est, 86400)
    return True, limit - used - est

def check_images(uid: str, tier: str) -> Tuple[bool, int]:
    key = f"img:{uid}:{date.today().isoformat()}"
    used = get(key) or 0
    limit = BASE_IMAGES.get(tier, 0)
    if limit == 0:
        return False, 0
    if used >= limit:
        return False, 0
    cache_set(key, used + 1, 86400)
    return True, limit - used - 1

def check_files(uid: str, tier: str) -> Tuple[bool, int]:
    key = f"file:{uid}:{date.today().isoformat()}"
    used = get(key) or 0
    limit = BASE_FILES.get(tier, 0)
    if limit == 0:
        return False, 0
    if used >= limit:
        return False, 0
    cache_set(key, used + 1, 86400)
    return True, limit - used - 1

def check_notifications(uid: str, tier: str) -> Tuple[bool, int]:
    key = f"notif:{uid}:{date.today().isoformat()}"
    count = get(key) or 0
    limit = BASE_NOTIFICATIONS.get(tier, 0)
    if limit == 0:
        return False, 0
    if count >= limit:
        return False, 0
    cache_set(key, count + 1, 86400)
    return True, limit - count - 1
