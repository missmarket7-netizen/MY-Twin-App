"""
MyTwin – Product Recommender
محرك توصية المنتجات (إعلانات سياقية) داخل المحادثة.
يكتشف نية الشراء، يجلب أفضل منتج، ويسجل مرات الظهور.
لتحقيق دخل: املأ جدول products بروابط تابعة حقيقية.
"""
import os
import logging
from datetime import datetime
from typing import Optional, Dict
from supabase import create_client, Client
from cache import get as cache_get, set as cache_set

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

db: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.warning("Supabase missing – product recommender disabled.")

# كلمات مفتاحية للتحليل المحلي (لتقليل استدعاءات Gemini)
INTENT_KEYWORDS = {
    "health": ["رياضة", "جيم", "صحة", "مكمل", "نادي", "جري", "دايت", "gym", "health", "fitness", "diet"],
    "productivity": ["عمل", "إنتاجية", "مكتب", "تنظيم", "وقت", "work", "productivity", "time management"],
    "learning": ["تعلم", "دورة", "كتاب", "قراءة", "كورس", "تعليم", "course", "book", "learn"],
    "entertainment": ["فيلم", "لعبة", "موسيقى", "ترفيه", "نتفلكس", "game", "movie", "music", "netflix"],
    "lifestyle": ["عناية", "بشرة", "شعر", "موضة", "ملابس", "skin", "hair", "fashion", "clothes"],
}


def extract_purchase_intent_local(message: str) -> Optional[str]:
    """تحليل محلي سريع لتقليل تكاليف Gemini."""
    m = message.lower()
    for category, keywords in INTENT_KEYWORDS.items():
        if any(kw in m for kw in keywords):
            return category
    return None


def extract_purchase_intent(message: str) -> Optional[str]:
    """
    استخراج نية الشراء: أولاً محلياً، ثم عبر Gemini إذا لزم الأمر.
    مع تخزين مؤقت للنتائج.
    """
    if not message or len(message.strip()) < 10:
        return None

    # 1. تحقق من الكاش
    cache_key = f"intent:{hash(message)}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached if cached != "none" else None

    # 2. تحليل محلي أولاً
    local = extract_purchase_intent_local(message)
    if local:
        cache_set(cache_key, local, 3600)
        return local

    # 3. تحليل بـ Gemini (فقط إذا لزم الأمر)
    if not GEMINI_KEY:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        حلل الرسالة التالية واستخرج فئة المنتج المقترح (إن وجدت):
        الرسالة: "{message}"
        
        الفئات الممكنة:
        - health: الصحة والرياضة واللياقة
        - productivity: الإنتاجية والعمل
        - learning: التعليم والتطوير
        - entertainment: الترفيه والألعاب
        - lifestyle: أسلوب الحياة والعناية الشخصية
        - none: لا توجد نية شراء واضحة
        
        اجب بكلمة واحدة فقط (اسم الفئة أو none).
        """

        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 10, "temperature": 0.1},
        )
        intent = response.text.strip().lower()

        for cat in ["health", "productivity", "learning", "entertainment", "lifestyle"]:
            if cat in intent:
                cache_set(cache_key, cat, 3600)
                return cat

        cache_set(cache_key, "none", 3600)
        return None

    except Exception as e:
        logger.warning(f"Gemini purchase intent failed: {e}")
        return None


def get_recommended_product(category: str) -> Optional[Dict]:
    """
    جلب أفضل منتج من قاعدة البيانات بناءً على الفئة.
    يُفضل المنتجات ذات الأولوية الأعلى (priority).
    """
    if not db:
        return None

    try:
        result = (
            db.table("products")
            .select("*")
            .eq("category", category)
            .eq("active", True)
            .order("priority", desc=True)  # أعلى أولوية أولاً
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        return result.data[0] if result.data else None

    except Exception as e:
        logger.error(f"Error fetching product: {e}")
        return None


def format_product_suggestion(product: Dict, lang: str = "ar") -> str:
    """
    تنسيق اقتراح المنتج بطريقة طبيعية.
    """
    name = product.get("name", "منتج")
    desc = product.get("description", "")
    link = product.get("affiliate_link", "#")

    if lang == "ar":
        return (
            f"💡 *اقتراح خاص:* {name}\n"
            f"_{desc}_\n"
            f"🔗 {link}"
        )
    else:
        return (
            f"💡 *Suggested:* {name}\n"
            f"_{desc}_\n"
            f"🔗 {link}"
        )


def log_product_impression(user_id: str, product_id: str, message_id: str) -> bool:
    """
    تسجيل عرض المنتج (impression) للتتبع.
    """
    if not db:
        return False

    try:
        db.table("product_impressions").insert({
            "user_id": user_id,
            "product_id": product_id,
            "message_id": message_id,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
        return True

    except Exception as e:
        logger.error(f"Error logging impression: {e}")
        return False
