"""
MyTwin – Memory Engine
توليد التضمينات (embeddings)، تصنيف الذكريات، تخزينها واسترجاعها.
يعتمد على Supabase للتخزين و Gemini Embedding API للتضمين.
"""
import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict

from supabase import create_client, Client
from google import genai
from cache import get, set, delete

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

# إنشاء عميل Supabase مرة واحدة
if SUPABASE_URL and SUPABASE_KEY:
    SUPABASE: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    SUPABASE = None
    logger.warning("Supabase credentials missing – memory engine disabled.")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
else:
    logger.warning("Gemini API key missing – embeddings will fall back to zeros.")


def emb(t: str) -> List[float]:
    """توليد embedding للنص — fallback لو فشل."""
    if not t or len(t.strip()) < 3:
        return [0.0] * 768

    # ✅ حد أقصى 500 حرف لتوفير التكاليف
    clean_text = t.strip()[:500]

    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=clean_text,
        )
        return result.get("embedding", [0.0] * 768)
    except Exception as e:
        logger.warning(f"Embedding fallback: {e}")
        return [0.0] * 768


def classify(t: str) -> str:
    """تصنيف نوع الذاكرة بناءً على الكلمات المفتاحية."""
    if not t:
        return "fact"
    tl = t.lower()
    if any(w in tl for w in ["أحب", "أكره", "love", "hate", "يحب", "يكره"]):
        return "pref"
    if any(w in tl for w in ["حلم", "هدف", "dream", "wish", "hope"]):
        return "dream"
    return "fact"


def store_mem(uid: str, content: str, imp: float = 0.5, tag: str = "neutral") -> None:
    """حفظ ذاكرة جديدة للمستخدم."""
    if not SUPABASE:
        return
    if not uid or not content or len(content.strip()) < 3:
        return

    clean_content = content.strip()[:500]
    importance = max(0.0, min(1.0, imp))
    embedding = emb(clean_content)

    try:
        SUPABASE.table("memories").insert({
            "user_id": uid,
            "content": clean_content,
            "category": classify(clean_content),
            "importance_score": importance,
            "emotional_tag": tag,
            "embedding": embedding,
        }).execute()

        # مسح الـ cache بعد إضافة ذاكرة جديدة
        delete(f"mem:{uid}")

    except Exception as e:
        logger.error(f"store_mem error for {uid}: {e}")


def get_mems(uid: str, q: str = "", days: int = 7, lim: int = 5) -> List[Dict]:
    """جلب أحدث الذكريات للمستخدم خلال عدد محدد من الأيام."""
    if not SUPABASE or not uid:
        return []

    # مفتاح كاش يعتمد على المستخدم وعدد الأيام (وليس النص)
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
        set(cache_key, result, 600)  # cache لمدة 10 دقائق
        return result

    except Exception as e:
        logger.error(f"get_mems error for {uid}: {e}")
        return []
