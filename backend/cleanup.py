"""
MyTwin – Cleanup Job
تنظيف دوري للذكريات القديمة حسب مدة الاحتفاظ لكل باقة، مع وضع طوارئ.
يُستدعى عبر cron job أو `/cron/cleanup`.
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if SUPABASE_URL and SUPABASE_KEY:
    SUPABASE: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    SUPABASE = None
    logger.warning("Supabase credentials missing – cleanup disabled.")

# مدة الاحتفاظ بالأيام لكل باقة
RETENTION_DAYS = {
    "free": 3,
    "free_trial_14d": 3,
    "premium_trial": 20,
    "premium": 30,
    "pro": 90,
    "yearly": 365,
}


def run(dry: bool = False) -> dict:
    """
    تنفيذ التنظيف الدوري:
    - يتحقق من تجاوز حد الذكريات الإجمالي (40000).
    - يحذف الذكريات منتهية الصلاحية حسب مدة كل باقة.
    """
    if not SUPABASE:
        return {"error": "supabase_unavailable"}

    res = {"emergency": False, "tiers_cleaned": 0, "total_deleted": 0, "err": []}

    try:
        # ── التحقق من عدد الذكريات الإجمالي ──
        cnt_result = SUPABASE.table("memories").select("id", count="exact").execute()
        total_count = cnt_result.count or 0

        if total_count > 40000:
            res["emergency"] = True
            logger.warning(f"Emergency: {total_count} memories. Cleaning oldest 14 days.")
            if not dry:
                del_result = (
                    SUPABASE.table("memories")
                    .delete()
                    .lt("created_at", (datetime.utcnow() - timedelta(days=14)).isoformat())
                    .execute()
                )
                res["total_deleted"] = len(del_result.data) if del_result.data else 0
                logger.info(f"Emergency cleanup: deleted ~{res['total_deleted']} memories.")

        # ── تنظيف حسب الباقة ──
        for tier, days in RETENTION_DAYS.items():
            cut = (datetime.utcnow() - timedelta(days=days)).isoformat()

            # جلب user_id للمستخدمين في هذه الباقة
            users_result = (
                SUPABASE.table("profiles")
                .select("user_id")
                .eq("tier", tier)
                .execute()
            )
            uids = [u["user_id"] for u in (users_result.data or [])]

            if not uids:
                continue

            if not dry:
                del_result = (
                    SUPABASE.table("memories")
                    .delete()
                    .in_("user_id", uids)
                    .lt("created_at", cut)
                    .execute()
                )
                deleted = len(del_result.data) if del_result.data else 0
                res["total_deleted"] += deleted
                if deleted > 0:
                    logger.info(f"Cleaned {deleted} memories for tier '{tier}' (> {days}d).")
                res["tiers_cleaned"] += 1

        return res

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        res["err"].append(str(e))
        return res
