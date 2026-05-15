import os
import logging
from datetime import datetime
from typing import Optional, List, Dict
from supabase import create_client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
db = create_client(SUPABASE_URL, SUPABASE_KEY)

# ساعات منع الإشعارات (22:00 - 08:00)
QUIET_HOURS_START = 22
QUIET_HOURS_END = 8


def should_send_notification(user_tz: str = "UTC") -> bool:
    """
    تتحقق إذا كان الوقت مناسباً لإرسال الإشعار (ليس في ساعات الهدوء).
    """
    try:
        # حالياً نستخدم UTC، لكن يمكن تحسينها لاستخدام timezone المستخدم
        current_hour = datetime.utcnow().hour
        if QUIET_HOURS_START <= current_hour or current_hour < QUIET_HOURS_END:
            return False  # في ساعات الهدوء
        return True
    except Exception as e:
        logger.error(f"Error checking quiet hours: {e}")
        return True


def format_smart_notification(
    user_name: str, 
    has_goals: bool = False,
    last_activity_hours: int = 0
) -> str:
    """
    إنشاء إشعار مخصص بناءً على سلوك المستخدم.
    """
    messages = []
    
    # الرسالة الأساسية
    base_msgs = [
        f"كيف يومك يا {user_name}؟ 💜",
        f"اشتقت لأخبارك يا {user_name}! 🌙",
        f"هل تريد أن تشاركني أحوالك؟ 💙",
        f"أنا هنا للاستماع يا {user_name} 🌟",
    ]
    messages.append(base_msgs[hash(user_name) % len(base_msgs)])
    
    # إذا كان لديه goals مفتوحة
    if has_goals:
        messages.append("أتذكر أن لديك مشاريع تنتظرك 🎯")
    
    # إذا كان مشغول (لم يتفاعل آخر ساعات)
    if last_activity_hours > 24:
        messages.append(f"اشتقت إليك! كنت أفكر فيك 💫")
    
    return " ".join(messages)


def get_pending_notifications(limit: int = 100) -> List[Dict]:
    """
    جلب الإشعارات المعلقة من Supabase.
    """
    try:
        result = db.table("pending_notifications").select("*").limit(limit).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        return []


def mark_notification_sent(notification_id: str) -> bool:
    """
    تسجيل إرسال الإشعار.
    """
    try:
        db.table("pending_notifications").update({"sent_at": datetime.utcnow().isoformat()}).eq("id", notification_id).execute()
        return True
    except Exception as e:
        logger.error(f"Error marking notification sent: {e}")
        return False