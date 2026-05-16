from datetime import date, datetime, timedelta
from typing import Tuple, Optional

try:
    from backend.cache import get, set as cache_set
except ImportError:
    from cache import get, set as cache_set

# حدود التوكن اليومية لكل tier - نظام محدّث
BASE_TOK = {
    "free_trial_14d": 1500,
    "free": 500,
    "premium_trial": 2000,
    "premium": 2000,
    "pro": 5000,
    "yearly": 10000,
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
    "free": 0,
    "premium_trial": 10,
    "premium": 10,
    "pro": 30,
    "yearly": 50,
}

# حدود الإشعارات اليومية
BASE_NOTIFICATIONS = {
    "free_trial_14d": 1,
    "free": 0,
    "premium_trial": 3,
    "premium": 2,
    "pro": 5,
    "yearly": 11,
}


def _daily_key(uid: str, prefix: str = "daily") -> str:
    return f"{prefix}:{uid}:{date.today().isoformat()}"


def _get_effective_tier(tier: str, signup_date: Optional[str] = None) -> str:
    """تحديد الباقة الفعلية بناءً على تاريخ التسجيل."""
    if tier == "free" and signup_date:
        try:
            signup = datetime.fromisoformat(signup_date)
            age = datetime.utcnow() - signup
            if age < timedelta(days=14):
                return "free_trial_14d"
        except Exception:
            pass
    return tier


def check_tok(uid: str, tier: str, est: int, signup_date: Optional[str] = None, trial_start: Optional[str] = None) -> Tuple[bool, int]:
    """
    التحقق من توفر التوكن اليومي.
    ترجع (True, الباقي) أو (False, المتبقي).
    """
    effective_tier = _get_effective_tier(tier, signup_date)
    
    # إذا كانت تجربة بريميوم، نتحقق من تاريخ بدء التجربة
    if effective_tier == "premium_trial" and trial_start:
        try:
            trial = datetime.fromisoformat(trial_start)
            days_in_trial = (datetime.utcnow() - trial).days
            # أول 5 أيام: 2000، بعدها: 3000
            # (لكن الحد محفوظ في BASE_TOK، هذا للتوثيق فقط)
        except Exception:
            pass

    key = _daily_key(uid, "tok")
    used = get(key) or 0
    limit = BASE_TOK.get(effective_tier, 500)

    if used + est > limit:
        return False, max(0, limit - used)

    cache_set(key, used + est, 86400)
    return True, limit - used - est


def check_conv(uid: str, tier: str) -> Tuple[bool, int]:
    """التحقق من عدد المحادثات اليومية."""
    key = _daily_key(uid, "conv")
    cur = get(key) or 0
    limit = BASE_CONV.get(tier, 50)

    if cur >= limit:
        return False, 0

    cache_set(key, cur + 1, 86400)
    return True, limit - cur - 1


def check_images(uid: str, tier: str) -> Tuple[bool, int]:
    """التحقق من عدد الصور اليومية."""
    key = _daily_key(uid, "img")
    used = get(key) or 0
    limit = BASE_IMAGES.get(tier, 0)

    if limit == 0:
        return False, 0

    if used >= limit:
        return False, 0

    cache_set(key, used + 1, 86400)
    return True, limit - used - 1


def check_notifications(uid: str, tier: str) -> Tuple[bool, int]:
    """التحقق من إمكانية إرسال إشعار."""
    key = _daily_key(uid, "notif")
    count = get(key) or 0
    limit = BASE_NOTIFICATIONS.get(tier, 0)

    if limit == 0:
        return False, 0

    if count >= limit:
        return False, 0

    cache_set(key, count + 1, 86400)
    return True, limit - count - 1
