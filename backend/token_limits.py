from datetime import date
from typing import Tuple

try:
    from backend.cache import get, set as cache_set
except ImportError:
    from cache import get, set as cache_set

# حدود التوكن اليومية لكل tier - نظام محدّث
BASE_TOK = {
    "free_trial_14d": 1500,  # أول 14 يوم - استراتيجية الاحتفاظ
    "free": 500,              # بعد 14 يوم - خطة فريميوم
    "premium_trial": 2000,    # تجربة مجانية 5 أيام
    "premium": 2000,          # $19/شهر
    "pro": 5000,              # $89/6 أشهر
    "yearly": 10000,          # $199/سنة
}

# حدود المحادثات اليومية لكل tier
BASE_CONV = {
    "free_trial_14d": 60,
    "free": 20,
    "premium_trial": 100,
    "premium": 100,
    "pro": 300,
    "yearly": 999,
}

# حدود الصور اليومية
BASE_IMAGES = {
    "free_trial_14d": 3,
    "free": 0,                # معطل
    "premium_trial": 10,
    "premium": 10,
    "pro": 30,
    "yearly": 50,
}

# حدود الإشعارات اليومية
BASE_NOTIFICATIONS = {
    "free_trial_14d": 1,
    "free": 0,                # معطل
    "premium_trial": 3,
    "premium": 2,
    "pro": 5,
    "yearly": 11,
}


def _daily_key(uid: str) -> str:
    return f"daily:{uid}:{date.today().isoformat()}"


def check_tok(uid: str, tier: str, est: int, signup_date: str = None) -> Tuple[bool, int]:
    """
    تتحقق إذا كان المستخدم عنده توكن كافية.
    ترجع (True, الباقي) لو تمام، أو (False, 0) لو وصل للحد.
    """
    # تحديد الـ tier الفعلي (free_trial_14d أم free)
    effective_tier = tier
    if tier == "free" and signup_date:
        from datetime import datetime, timedelta
        try:
            signup = datetime.fromisoformat(signup_date)
            age = datetime.utcnow() - signup
            if age < timedelta(days=14):
                effective_tier = "free_trial_14d"
        except Exception:
            pass
    
    key = _daily_key(uid)
    used = get(key)

    if used is None:
        used = 0

    limit = BASE_TOK.get(effective_tier, 500)

    if used + est > limit:
        return False, max(0, limit - used)

    cache_set(key, used + est, 86400)  # cache لـ 24 ساعة
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


def check_images(uid: str, tier: str) -> Tuple[bool, int]:
    """
    تتحقق إذا كان المستخدم عنده صور كافية لليوم.
    """
    key = f"img:{uid}:{date.today().isoformat()}"
    used = get(key)

    if used is None:
        used = 0

    limit = BASE_IMAGES.get(tier, 0)

    if limit == 0:
        return False, 0  # معطل

    if used >= limit:
        return False, 0

    cache_set(key, used + 1, 86400)
    return True, limit - used - 1


def check_notifications(uid: str, tier: str) -> Tuple[bool, int]:
    """
    تتحقق إذا كان المستخدم يمكنه استقبال إشعارات اليوم.
    """
    key = f"notif:{uid}:{date.today().isoformat()}"
    count = get(key)

    if count is None:
        count = 0

    limit = BASE_NOTIFICATIONS.get(tier, 0)

    if limit == 0:
        return False, 0  # معطل

    if count >= limit:
        return False, 0

    cache_set(key, count + 1, 86400)
    return True, limit - count - 1
