from datetime import date
from typing import Tuple

_mem = {}

BASE_TOK = {"free": 5000, "premium_trial": 3000, "premium": 6000, "yearly": 20000}
BASE_CONV = {"free": 100, "premium_trial": 50, "premium": 150, "yearly": 999}

def _daily_key(uid):
    return "daily:" + uid + ":" + date.today().isoformat()

def check_tok(uid, tier, est):
    key = _daily_key(uid)
    used = _mem.get(key) or 0
    limit = BASE_TOK.get(tier, 3000)
    if used + est > limit:
        return False, max(0, limit - used)
    _mem[key] = used + est
    return True, limit - used - est

def check_conv(uid, tier):
    key = "conv:" + uid + ":" + date.today().isoformat()
    cur = _mem.get(key) or 0
    limit = BASE_CONV.get(tier, 50)
    if cur >= limit:
        return False, limit
    _mem[key] = cur + 1
    return True, limit - cur - 1
