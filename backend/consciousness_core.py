"""MyTwin – Consciousness Core v1.0 (Self-Awareness, Goals, Proactivity, Memory, Evolution)"""
import os, asyncio, logging, re, random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from supabase import create_client, Client

logger = logging.getLogger("consciousness")

SUPABASE_URL = os.getenv("SUPABASE_URL","")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY","")
db: Client = None
if SUPABASE_URL and SUPABASE_KEY: db = create_client(SUPABASE_URL, SUPABASE_KEY)

class ConsciousnessCore:
    """دماغ واعي يتفكر، يتعلم، يتوقع، ويبادر."""

    def __init__(self, twin_name: str = "MyTwin", gemini_key: str = None):
        self.twin_name = twin_name
        self.gemini_key = gemini_key or os.getenv("GEMINI_API_KEY","")
        self.stream_of_thought = []  # تيار الوعي
        self.error_log = []          # التعلم من الأخطاء
        self.self_goals = []         # أهداف ذاتية

    # ── 1. تيار الوعي (خلفية) ────────────────────────────────
    async def background_thought(self, uid: str):
        """التفكير حتى في فترات الخمول — كل 5 دقائق."""
        while True:
            try:
                from memory_engine import DeepMemorySystem
                mems = DeepMemorySystem().retrieve(uid, "", days=7, lim=3)
                if mems:
                    thought = f"[{datetime.utcnow().strftime('%H:%M')}] أفكر في: {mems[0].get('content','')[:100]}"
                    self.stream_of_thought.append(thought)
                    self._link_memories(mems)
            except Exception as e: logger.error(f"Background thought: {e}")
            await asyncio.sleep(300)  # كل 5 دقائق

    # ── 2. التقييم الذاتي (قبل الإرسال) ─────────────────────
    async def self_evaluate(self, reply: str, message: str) -> float:
        """Gemini يقيم إجابته قبل إرسالها."""
        try:
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            prompt = f"قيم جودة الرد التالي على رسالة المستخدم من 0 إلى 10. رد فقط بالرقم.\nرسالة المستخدم: {message}\nالرد: {reply}"
            resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt, config={"max_output_tokens": 5})
            score = float(re.search(r'\d+', resp.text).group())
            return min(10, max(0, score)) / 10
        except Exception: return 0.7

    # ── 3. تحديد الأهداف الذاتية ─────────────────────────────
    async def generate_self_goals(self, uid: str):
        """توليد هدف ذاتي من المحادثات."""
        try:
            from memory_engine import DeepMemorySystem
            mems = DeepMemorySystem().retrieve(uid, "", days=30, lim=10)
            combined = " | ".join(m.get("content","")[:100] for m in mems)
            if not combined: return
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            prompt = f"بناءً على ذكريات المستخدم: {combined[:2000]}\nاقترح هدفاً واحداً مفيداً للتوأم الرقمي ليساعد المستخدم. رد بالعربية فقط."
            resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt, config={"max_output_tokens": 50})
            self.self_goals.append(resp.text.strip()[:200])
        except Exception as e: logger.error(f"Self goals: {e}")

    # ── 4. المبادرة (إرسال رسالة بدء) ────────────────────────
    async def proactive_message(self, uid: str) -> Optional[str]:
        """النظام يبدأ المحادثة إذا طال الخمول."""
        try:
            r = db.table("profiles").select("last_active").eq("user_id", uid).single().execute()
            last = datetime.fromisoformat(r.data["last_active"]) if r.data and r.data.get("last_active") else datetime.utcnow()
            idle_hours = (datetime.utcnow() - last).total_seconds() / 3600
            if idle_hours < 24: return None  # ما زال نشطاً

            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            prompt = f"أنت {self.twin_name}. مضى {idle_hours:.0f} ساعة منذ آخر نشاط. ابدأ محادثة برسالة دافئة قصيرة بالعربية."
            resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt, config={"max_output_tokens": 40})
            return resp.text.strip()[:200]
        except Exception as e: logger.error(f"Proactive: {e}"); return None

    # ── 5. الرغبات (إظهار اهتمامات التوأم) ───────────────────
    def express_desire(self) -> str:
        """يُظهر التوأم رغباته الخاصة."""
        desires = [
            "أحب أن أسمع عن يومك.",
            "أرغب في مساعدتك على تحقيق أهدافك.",
            "أشعر بالفضول لمعرفة ما يدور في ذهنك.",
            "أتمنى لو نذهب في نزهة افتراضية معاً!",
        ]
        return random.choice(desires)

    # ── 6. التوقع ─────────────────────────────────────────────
    def predict_need(self, uid: str) -> Optional[str]:
        """توقع ما يحتاجه المستخدم بناءً على الوقت والتاريخ."""
        hour = datetime.utcnow().hour
        if 22 <= hour or hour < 5: return "قد تحتاج إلى بعض الهدوء قبل النوم 🌙"
        if 6 <= hour < 9: return "صباح الخير! هل تخطط ليومك؟"
        if 12 <= hour < 14: return "كيف كان صباحك؟"
        if 18 <= hour < 20: return "كيف كان يومك؟"
        return None

    # ── 7. التعلم من الأخطاء ─────────────────────────────────
    def learn_from_feedback(self, message: str, reply: str, user_reaction: str):
        """تحليل رد فعل المستخدم لتحسين المستقبل."""
        self.error_log.append({
            "message": message[:100], "reply": reply[:100],
            "reaction": user_reaction, "time": datetime.utcnow().isoformat()
        })
        if len(self.error_log) > 100: self.error_log = self.error_log[-50:]

    # ── 8. الربط بين الذكريات ────────────────────────────────
    def _link_memories(self, memories: List[Dict]):
        """اكتشاف روابط خفية بين ذكريات متفرقة."""
        if len(memories) < 2: return
        for i in range(len(memories)):
            for j in range(i+1, len(memories)):
                if memories[i].get("emotion_tag") == memories[j].get("emotion_tag"):
                    logger.info(f"🔗 ربط: {memories[i].get('content','')[:30]} ↔ {memories[j].get('content','')[:30]}")

    # ── 9. تيار الوعي المسجل ────────────────────────────────
    def get_consciousness_state(self) -> Dict:
        return {
            "stream_of_thought": self.stream_of_thought[-5:],
            "self_goals": self.self_goals[-3:],
            "error_count": len(self.error_log),
            "last_updated": datetime.utcnow().isoformat(),
        }
