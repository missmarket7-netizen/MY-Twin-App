"""
MyTwin – Emotional Engine
حساب طاقة التوأم، إعدادات الصوت العاطفي، وكشف التحولات العاطفية.
"""
from datetime import datetime


def calc_energy(last_active: str, msgs_24h: int, avg_emo: str) -> float:
    """
    حساب مستوى طاقة التوأم بناءً على نشاط المستخدم.
    القيمة بين 0.4 (منخفضة) و 1.2 (عالية).

    - كلما زاد الخمول (idle)، انخفضت الطاقة.
    - كثرة الرسائل في 24 ساعة تقلل الطاقة قليلاً.
    """
    try:
        idle = (
            datetime.utcnow() - datetime.fromisoformat(last_active)
        ).total_seconds() / 3600
    except Exception:
        idle = 12.0

    base = max(0.4, 1.0 - (idle / 24))
    fatigue = min(0.3, msgs_24h / 50)
    energy = max(0.4, min(1.2, base - fatigue))
    return round(energy, 2)


def tts_params(emo: str, calm: bool = False) -> dict:
    """
    إعدادات الصوت (pitch, rate) بناءً على المشاعر ووضع الهدوء.

    في وضع الهدوء: صوت منخفض وبطيء.
    """
    if calm:
        return {"pitch": 0.80, "rate": 0.70}

    params_map = {
        "happy":     {"pitch": 1.12, "rate": 0.90},
        "sad":       {"pitch": 0.80, "rate": 0.75},
        "anxious":   {"pitch": 1.05, "rate": 0.95},
        "neutral":   {"pitch": 0.95, "rate": 0.85},
        "motivated": {"pitch": 1.08, "rate": 0.92},
        "lonely":    {"pitch": 0.85, "rate": 0.78},
        "excited":   {"pitch": 1.15, "rate": 0.95},
        "grateful":  {"pitch": 1.00, "rate": 0.88},
        "confused":  {"pitch": 0.92, "rate": 0.82},
    }

    return params_map.get(emo, {"pitch": 0.95, "rate": 0.85})


def detect_emotion_shift(prev: str, curr: str) -> bool:
    """
    تكتشف إذا تغيرت مشاعر المستخدم بشكل كبير.
    تُرجع True إذا كان هناك تحول بين فئة عاطفية وأخرى.
    """
    if not prev or not curr:
        return False
    if prev == curr:
        return False

    positive = {"happy", "motivated", "excited", "grateful"}
    negative = {"sad", "anxious", "lonely", "confused"}

    prev_is_pos = prev in positive
    prev_is_neg = prev in negative
    curr_is_pos = curr in positive
    curr_is_neg = curr in negative

    # تحول من إيجابي إلى سلبي أو العكس
    if (prev_is_pos and curr_is_neg) or (prev_is_neg and curr_is_pos):
        return True

    return False
