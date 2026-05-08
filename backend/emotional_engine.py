from datetime import datetime


def calc_energy(last_active: str, msgs_24h: int, avg_emo: str) -> float:
    """
    حساب مستوى طاقة التوأم بناءً على نشاط المستخدم.
    القيمة بين 0.4 (منخفضة) و 1.2 (عالية).
    """
    try:
        idle = (
            datetime.utcnow() - datetime.fromisoformat(last_active)
        ).total_seconds() / 3600
    except Exception:
        idle = 12.0

    base = max(0.4, 1.0 - (idle / 24))
    energy = max(0.4, min(1.2, base - min(0.3, msgs_24h / 50)))
    return round(energy, 2)


def tts_params(emo: str, calm: bool = False) -> dict:
    """
    إعدادات الصوت بناءً على المشاعر ووضع الهدوء.
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
    }

    return params_map.get(emo, {"pitch": 0.95, "rate": 0.85})


def detect_emotion_shift(prev: str, curr: str) -> bool:
    """
    تكتشف إذا تغيرت مشاعر المستخدم بشكل كبير.
    """
    positive = {"happy", "motivated", "excited", "grateful"}
    negative = {"sad", "anxious", "lonely", "confused"}

    if prev in positive and curr in negative:
        return True
    if prev in negative and curr in positive:
        return True
    return False
