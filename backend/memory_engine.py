import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict

from supabase import create_client
import google.generativeai as genai
from cache import get, set, delete

logger = logging.getLogger(__name__)

SUPABASE = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", ""),
)
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


def emb(t: str) -> List[float]:
    """توليد embedding للنص — fallback لو فشل."""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=t,
        )
        return result.get("embedding", [0.0] * 768)
    except Exception as e:
        logger.warning(f"Embedding fallback: {e}")
        return [0.0] * 768


def classify(t: str) -> str:
    """تصنيف نوع الذاكرة."""
    tl = t.lower()
    if any(w in tl for w in ["أحب", "أكره", "love", "hate", "يحب", "يكره"]):
        return "pref"
    if any(w in tl for w in ["حلم", "هدف", "dream", "wish", "hope"]):
        return "dream"
    return "fact"


def store_mem(uid: str, content: str, imp: float = 0.5, tag: str = "neutral") -> None:
    """حفظ ذاكرة جديدة للمستخدم."""
    # ✅ تحقق من الـ uid قبل الحفظ
    if not uid or not content or len(content.strip()) < 3:
        return

    try:
        SUPABASE.table("memories").insert({
            "user_id": uid,
            "content": content[:500],  # ✅ حد أقصى 500 حرف
            "category": classify(content),
            "importance_score": max(0.0, min(1.0, imp)),
            "emotional_tag": tag,
            "embedding": emb(content),
        }).execute()

        # مسح الـ cache بعد إضافة ذاكرة جديدة
        delete(f"mem:{uid}")

    except Exception as e:
        logger.error(f"store_mem error for {uid}: {e}")


def get_mems(uid: str, q: str, days: int = 7, lim: int = 5) -> List[Dict]:
    """جلب أحدث الذكريات للمستخدم."""
    if not uid:
        return []

    # تحقق من الـ cache أولاً
    cache_key = f"mem:{uid}:{days}"
    cached = get(cache_key)
    if cached:
        return cached

    cut = (datetime.utcnow() - timedelta(days=days)).isoformat()

    try:
        r = (
            SUPABASE.table("memories")
            .select("content, emotional_tag, created_at")
            .eq("user_id", uid)
            .gte("created_at", cut)
            .order("created_at", desc=True)
            .limit(lim)
            .execute()
        )
        result = r.data or []

        # ✅ cache لمدة 10 دقائق
        set(cache_key, result, 600)
        return result

    except Exception as e:
        logger.error(f"get_mems error for {uid}: {e}")
        return []
