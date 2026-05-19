"""MyTwin – Emotional Engine v3.0 (متوافق مع voice_engine)"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import re

class EmotionalStateTracker:
    EMOTION_KEYWORDS = {
        "joy": ["سعيد","فرح","مبسوط","رائع","جميل","ممتاز","حلو","بهجة","سرور","احتفال","نجاح","فخر","سعادة","ضحك","ابتسام"],
        "sadness": ["حزين","مؤلم","صعب","آسف","مؤسف","بكاء","دمعة","كآبة","اكتئاب","خيبة","خسارة","فقدان","وحدة","حزن","كسر"],
        "anger": ["غاضب","محبط","مزعج","سيء","غضب","عصبي","ثورة","حنق","استياء","غيظ","كره","عداء","ظلم","غضبان","زعلان"],
        "fear": ["خائف","قلق","مقلق","خطير","خوف","فزع","رعب","توتر","اضطراب","هلع","شك","ريبة","خوف","جبان"],
        "love": ["أحبك","أهتم","أغلى","غالي","قلبي","حب","عشق","هوى","شغف","ولع","ميل","حنان","دفء","أشتاق","مشتاق"],
        "surprise": ["مفاجأة","عجيب","مدهش","واو","غريب","عجب","استغراب","ذهول","صدمة","مفاجئ","لم أتوقع","لا أصدق","مذهل"],
        "neutral": ["طبيعي","عادي","تمام","حسناً","ماشي","okay","ok"],
    }
    EMOTION_PATTERNS = {
        "joy": [r"(الحمدلله|شكراً|يسعد|أفرح|مبروك)"],
        "sadness": [r"(يا حرام|للأسف|حسبي الله|الله يرحم|فات الأوان)"],
        "anger": [r"(كفاية|بقى|زهقت|مليت|سامح|العفو)"],
        "fear": [r"(خايف|متخوف|قلقان|متوتر|مش عارف|يارب)"],
        "love": [r"(يا قلبي|يا عمري|يا حبيبي|يا روحي|تسلم|يسلم|حبيب قلبي)"],
    }

    def __init__(self):
        self.emotion_history = []

    def analyze(self, text: str) -> Dict:
        tl = text.lower()
        scores = {}
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in tl)
            if emotion in self.EMOTION_PATTERNS:
                for pat in self.EMOTION_PATTERNS[emotion]:
                    score += len(re.findall(pat, tl))
            scores[emotion] = score
        if scores:
            primary = max(scores, key=scores.get)
            total = sum(scores.values())
            intensity = min(scores[primary] / max(total * 0.3, 1), 1.0) if total > 0 else 0.5
        else:
            primary = "neutral"; intensity = 0.5
        result = {"primary": primary, "intensity": round(intensity, 2), "scores": scores}
        self.emotion_history.append({"timestamp": datetime.utcnow().isoformat(), "emotion": result})
        return result

    def detect_shift(self, prev_emotion: str, current_emotion: str) -> bool:
        if prev_emotion == current_emotion: return False
        positive = {"joy", "love", "surprise"}
        negative = {"sadness", "fear", "anger"}
        return (prev_emotion in positive and current_emotion in negative) or \
               (prev_emotion in negative and current_emotion in positive)

    def calculate_energy(self, last_active: str, daily_messages: int, current_emotion: str) -> float:
        energy = 0.5
        if last_active:
            try:
                last = datetime.fromisoformat(last_active.replace("Z", "+00:00"))
                hours = (datetime.utcnow() - last.replace(tzinfo=None)).total_seconds() / 3600
                if hours > 24: energy -= 0.2
                elif hours < 1: energy += 0.1
            except: pass
        if daily_messages > 50: energy -= 0.1
        elif daily_messages < 5: energy -= 0.1
        else: energy += 0.1
        emotion_energy = {"joy":0.2,"excited":0.3,"love":0.2,"sadness":-0.3,"anger":-0.2,"fear":-0.2,"neutral":0.0}
        energy += emotion_energy.get(current_emotion, 0)
        return round(max(0.1, min(1.0, energy)), 2)

    def get_emotion_trend(self, hours: int = 24) -> Dict:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent = [e for e in self.emotion_history if datetime.fromisoformat(e["timestamp"]) > cutoff]
        if not recent: return {"trend": "stable", "dominant": "neutral"}
        emotions = [e["emotion"]["primary"] for e in recent]
        dominant = max(set(emotions), key=emotions.count)
        if len(recent) >= 3:
            first = recent[0]["emotion"]["primary"]; last = recent[-1]["emotion"]["primary"]
            if first != last: return {"trend": "shifting", "from": first, "to": last, "dominant": dominant}
        return {"trend": "stable", "dominant": dominant}

# دوال مساعدة للتوافق مع main.py
def calc_energy(last_active: str, msgs_24h: int, avg_emo: str) -> float:
    return EmotionalStateTracker().calculate_energy(last_active, msgs_24h, avg_emo)

def detect_emotion_shift(prev: str, curr: str) -> bool:
    return EmotionalStateTracker().detect_shift(prev, curr)

def tts_params(emo: str, calm: bool = False) -> dict:
    from voice_engine import EmotionalVoiceEngine
    return EmotionalVoiceEngine().get_tts_params(emo, calm)
