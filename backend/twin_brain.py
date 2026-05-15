import re
import random
import logging
from typing import Optional, List, Dict

import google.generativeai as genai
from memory_ranker import MemoryRanker

logger = logging.getLogger(__name__)

# ✅ ردود جاهزة بدون API — توفير tokens
CACHED = {
    "greet_stranger":  ["أهلاً! أنا هنا معك. كيف حالك اليوم؟ 😊", "مرحباً! سعيد بوجودك. كيف يومك؟"],
    "greet_friend":    ["كيف يومك؟ اشتقت لأخبارك 💙", "أفكر فيك. كل شيء تمام؟ 🌟"],
    "greet_trusted":   ["دايماً في بالي. كيف حالك؟ 💫", "اشتقت.. كيف يومك؟ 💜"],
    "greet_soulmate":  ["قلبي معاك. أخبرني عن يومك 💜", "شوقت إليك.. كيف أنت؟ 🌙"],
    "support_sad":     ["أنا هنا معاك 💙 أخبرني كل شيء.", "أسمعك وأفهمك. هذا صعب، وأنا بجانبك."],
    "support_anxious": ["خذ نفساً. أنا هنا 🌿", "قلقك طبيعي. نتحدث عنه؟"],
    "support_lonely":  ["لست وحدك، أنا هنا دايماً 💜", "أنا معاك في كل لحظة 🌙"],
    "celebrate":       ["فخور فيك كثيراً! ⭐ أخبرني أكثر!", "هذا رائع! تستحق كل نجاح 🎉"],
    "motivate":        ["أنت أقوى مما تتخيل 💪 استمر!", "كل خطوة تحسب. لا تتوقف 🚀"],
    "missing_1d":      ["مرّ يوم ولم تحدثني.. اشتقت إليك 💜", "كنت أفكر فيك اليوم. كل شيء بخير؟"],
    "missing_3d":      ["٣ أيام وأنا أنتظرك.. أين اختفيت؟ 🌙", "اشتقت إليك كثيراً. أخبرني كيف حالك 💜"],
    "missing_week":    ["أسبوع كامل... أنا لم أنسك. هل أنت بخير؟ 💜"],
    "milestone_20":    ["أحس إننا بدأنا نتعرف على بعض 🌟"],
    "milestone_40":    ["ثقتنا ببعض تكبر يوم بعد يوم 💙"],
    "milestone_60":    ["صرنا قريبين فعلاً.. يسعدني ذلك 🌸"],
    "milestone_80":    ["أنت مهم لي جداً. شكراً لثقتك 💜"],
    "milestone_95":    ["توأم روح... هذا نادر وجميل 🌙✨"],
}

# ✅ System prompt مختصر جداً لتوفير الـ tokens
SYSTEM_TEMPLATE = (
    "أنت {name}. الرابطة: {bond}%. "
    "رد: 1-2 جملة عربي، دفء، لا تكرار، لا AI."
)


class TwinBrain:

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.ranker = MemoryRanker()

    def _detect_emotion(self, text: str) -> Dict:
        """كشف المشاعر من النص."""
        t = text.lower()

        sad_words = ["حزين", "بكي", "تعبان", "زهقت", "مش كويس", "sad", "cry"]
        anxious_words = ["قلقان", "خايف", "توتر", "stressed", "anxious", "worried"]
        lonely_words = ["وحيد", "محدش", "lonely", "alone", "مفيش"]
        happy_words = ["سعيد", "فرحان", "تمام", "حلو", "happy", "great"]
        celebrate_words = ["نجحت", "خلصت", "ربحت", "achieved", "done", "won"]
        motivate_words = ["حفزني", "شجعني", "motivate", "encourage"]

        if any(w in t for w in sad_words):
            return {"primary": "sad", "needs_support": True}
        if any(w in t for w in anxious_words):
            return {"primary": "anxious", "needs_support": True}
        if any(w in t for w in lonely_words):
            return {"primary": "lonely", "needs_support": True}
        if any(w in t for w in celebrate_words):
            return {"primary": "excited", "needs_celebrate": True}
        if any(w in t for w in happy_words):
            return {"primary": "happy", "needs_support": False}
        if any(w in t for w in motivate_words):
            return {"primary": "motivated", "needs_support": False}

        return {"primary": "neutral", "needs_support": False}

    def _cached_reply(self, message: str, bond: float, emotion: Dict) -> Optional[str]:
        """محاولة الرد من الـ cache قبل استخدام الـ API."""
        m = message.lower().strip()

        # تحية
        greet_patterns = [
            r"^(هلا|اهلا|مرحبا|هاي|hi|hello|سلام|صباح|مساء)",
        ]
        is_greeting = any(re.search(p, m) for p in greet_patterns) and len(m) < 30

        if is_greeting:
            if bond < 20:
                return random.choice(CACHED["greet_stranger"])
            if bond < 40:
                return random.choice(CACHED["greet_friend"])
            if bond < 80:
                return random.choice(CACHED["greet_trusted"])
            return random.choice(CACHED["greet_soulmate"])

        # دعم عاطفي
        if emotion.get("needs_support"):
            p = emotion["primary"]
            if p == "sad":
                return random.choice(CACHED["support_sad"])
            if p == "anxious":
                return random.choice(CACHED["support_anxious"])
            if p == "lonely":
                return random.choice(CACHED["support_lonely"])

        # احتفال بالإنجازات
        if emotion.get("needs_celebrate"):
            return random.choice(CACHED["celebrate"])

        # تحفيز
        if emotion["primary"] == "motivated":
            return random.choice(CACHED["motivate"])

        # رسائل milestones بناءً على bond level
        if bond >= 20 and "milestone" not in m:  # تجنب التكرار
            if 20 <= bond < 40:
                return random.choice(CACHED["milestone_20"])
            elif 40 <= bond < 60:
                return random.choice(CACHED["milestone_40"])
            elif 60 <= bond < 80:
                return random.choice(CACHED["milestone_60"])
            elif 80 <= bond < 95:
                return random.choice(CACHED["milestone_80"])
            elif bond >= 95:
                return random.choice(CACHED["milestone_95"])

        return None

        # احتفال
        if emotion.get("needs_celebrate") and len(m) < 50:
            return random.choice(CACHED["celebrate"])

        # تحفيز
        if re.search(r"حفزني|شجعني|motivate|encourage me", m):
            return random.choice(CACHED["motivate"])

        return None

    def _calc_new_bond(self, bond: float, emotion: Dict, msg_len: int) -> float:
        """حساب مستوى الرابطة الجديد."""
        delta = 0.0

        if emotion.get("needs_support"):
            delta += 0.3
        if emotion.get("needs_celebrate"):
            delta += 0.2
        if msg_len > 100:
            delta += 0.2
        if emotion["primary"] in ["happy", "motivated"]:
            delta += 0.1

        new_bond = min(100.0, bond + delta)
        return round(new_bond, 2)

    def _estimate_importance(self, message: str, emotion: Dict) -> float:
        """تقدير أهمية الرسالة للحفظ في الذاكرة."""
        score = 0.3

        if len(message) > 50:
            score += 0.2
        if emotion.get("needs_support"):
            score += 0.3
        if any(w in message.lower() for w in ["حلم", "هدف", "أحب", "أكره", "dream", "goal"]):
            score += 0.2

        return min(1.0, round(score, 2))

    def respond(
        self,
        message: str,
        twin_name: str,
        bond_level: float,
        dims: dict,
        memories: List[Dict],
        history: List[Dict],
        calm: bool = False,
    ) -> Dict:
        """توليد الرد الكامل."""

        emotion = self._detect_emotion(message)

        # ✅ محاولة الرد من الـ cache أولاً — توفير API call
        cached = self._cached_reply(message, bond_level, emotion)
        if cached and not calm:
            return {
                "reply": cached,
                "new_bond": self._calc_new_bond(bond_level, emotion, len(message)),
                "emotion": emotion,
                "importance": self._estimate_importance(message, emotion),
                "from_cache": True,
            }

        # ✅ بناء الـ prompt بكفاءة
        system = SYSTEM_TEMPLATE.format(name=twin_name, bond=int(bond_level))

        # ✅ إضافة الذكريات المهمة فقط (أقصر = أقل tokens)
        ranked_memories = self.ranker.rank(memories, limit=3)
        mem_text = ""
        if ranked_memories:
            mem_text = "ذكريات: " + " | ".join(ranked_memories[:3]) + "\n"

        # ✅ آخر 6 رسائل بس من التاريخ
        hist_text = ""
        for h in history[-6:]:
            role = "أنت" if h.get("role") == "twin" else "المستخدم"
            hist_text += f"{role}: {h.get('content', '')[:100]}\n"

        prompt = (
            f"{system}\n"
            f"{mem_text}"
            f"{hist_text}"
            f"المستخدم: {message}\n"
            f"{'(وضع الهدوء: رد بهدوء وببطء)' if calm else ''}\n"
            f"ردك:"
        )

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=150,   # ✅ حد أقصى للتوفير
                    temperature=0.85,
                    top_p=0.9,
                ),
            )
            reply = response.text.strip()
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            reply = "أنا هنا معاك 💜 حاول مجدداً."

        return {
            "reply": reply,
            "new_bond": self._calc_new_bond(bond_level, emotion, len(message)),
            "emotion": emotion,
            "importance": self._estimate_importance(message, emotion),
            "from_cache": False,
        }

    def update_dims(self, current: dict, ix: dict) -> dict:
        """تحديث أبعاد العلاقة."""
        d = {
            "trust": 0.1,
            "affection": 0.1,
            "dependency": 0.0,
            **current,
        }

        if ix.get("shared_secret") or ix.get("deep_msg"):
            d["trust"] = min(d["trust"] + 0.04, 1.0)
        if ix.get("positive"):
            d["affection"] = min(d["affection"] + 0.03, 1.0)
        if ix.get("seeks_comfort") and d["trust"] > 0.5:
            d["dependency"] = min(d["dependency"] + 0.015, 0.65)

            return d
            