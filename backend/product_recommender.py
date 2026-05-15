import os
import logging
from typing import Optional, Dict, List
from supabase import create_client
import google.generativeai as genai

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

db = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_KEY)


def extract_purchase_intent(message: str) -> Optional[str]:
    """
    استخراج نوايا الشراء من الرسالة باستخدام Gemini.
    ترجع category مثل: 'health', 'productivity', 'learning', 'entertainment', إلخ
    """
    try:
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
        
        اجب بفئة واحدة فقط.
        """
        
        response = model.generate_content(prompt)
        intent = response.text.strip().lower()
        
        # تنظيف الاستجابة
        if any(cat in intent for cat in ['health', 'productivity', 'learning', 'entertainment', 'lifestyle']):
            for cat in ['health', 'productivity', 'learning', 'entertainment', 'lifestyle']:
                if cat in intent:
                    return cat
        return None
    except Exception as e:
        logger.error(f"Error extracting purchase intent: {e}")
        return None


def get_recommended_product(category: str) -> Optional[Dict]:
    """
    جلب منتج مقترح من قاعدة البيانات بناءً على الفئة.
    """
    try:
        result = (
            db.table("products")
            .select("*")
            .eq("category", category)
            .eq("active", True)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        logger.error(f"Error fetching recommended product: {e}")
        return None


def format_product_suggestion(product: Dict) -> str:
    """
    تنسيق اقتراح المنتج بطريقة طبيعية.
    """
    return f"💡 **اختيار مقترح:** {product['name']} - {product['description']}\n🔗 [تفاصيل المنتج]({product['affiliate_link']})"


def log_product_impression(user_id: str, product_id: str, message_id: str) -> bool:
    """
    تسجيل عرض المنتج (impression) للتتبع.
    """
    try:
        db.table("product_impressions").insert({
            "user_id": user_id,
            "product_id": product_id,
            "message_id": message_id,
            "created_at": __import__('datetime').datetime.utcnow().isoformat(),
        }).execute()
        return True
    except Exception as e:
        logger.error(f"Error logging impression: {e}")
        return False