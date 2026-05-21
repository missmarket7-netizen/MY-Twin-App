"""MyTwin – Consciousness Core v2.0 (مع تكامل Supabase)"""
import os, asyncio, logging, re, random
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional
from supabase import create_client, Client

logger = logging.getLogger("consciousness")

SUPABASE_URL = os.getenv("SUPABASE_URL","")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY","")
db: Client = None
if SUPABASE_URL and SUPABASE_KEY: db = create_client(SUPABASE_URL, SUPABASE_KEY)

class ConsciousnessCore:
    def __init__(self, twin_name: str = "MyTwin", gemini_key: str = None):
        self.twin_name = twin_name
        self.gemini_key = gemini_key or os.getenv("GEMINI_API_KEY","")
        self.stream_of_thought = []
        self.error_log = []
        self.self_goals = []

    # ── تحميل/حفظ حالة التوأم من Supabase ────────────────────
    async def load_state(self, uid: str) -> Dict:
        if not db: return {}
        try:
            res = db.table("twin_states").select("*").eq("user_id", uid).single().execute()
            return res.data or {}
        except Exception: return {}

    async def save_state(self, uid: str, state: Dict):
        if not db: return
        try:
            db.table("twin_states").upsert({
                "user_id": uid,
                **state,
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e: logger.error(f"save_state: {e}")

    async def update_bond(self, uid: str, bond: float):
        stage = "غريب"
        if bond >= 95: stage = "توأم روح"
        elif bond >= 80: stage = "حبيب"
        elif bond >= 60: stage = "رفيق"
        elif bond >= 40: stage = "صديق"
        elif bond >= 20: stage = "مألوف"
        await self.save_state(uid, {"bond_level": int(bond), "bond_stage": stage})

    async def update_energy(self, uid: str, energy: int, mood: str = "طبيعي"):
        color = "🔵"
        if energy >= 80: color = "🟢"
        elif energy >= 50: color = "🟡"
        elif energy >= 20: color = "🟠"
        else: color = "🔴"
        await self.save_state(uid, {"energy": energy, "energy_color": color, "energy_mood": mood})

    async def update_internal_mood(self, uid: str, mood: str, curiosity: int = None):
        data = {"internal_mood": mood}
        if curiosity is not None: data["curiosity"] = curiosity
        await self.save_state(uid, data)

    async def record_interaction(self, uid: str):
        await self.save_state(uid, {"last_interaction": datetime.utcnow().isoformat()})

    # ── تيار الوعي (خلفية) ────────────────────────────────
    async def background_thought(self, uid: str):
        while True:
            try:
                from memory_engine import DeepMemorySystem
                mems = DeepMemorySystem().retrieve(uid, "", days=7, lim=3)
                if mems:
                    thought = f"[{datetime.utcnow().strftime('%H:%M')}] أفكر في: {mems[0].get('content','')[:100]}"
                    self.stream_of_thought.append(thought)
                    self._link_memories(mems)
            except Exception as e: logger.error(f"Background thought: {e}")
            await asyncio.sleep(300)

    # ── التقييم الذاتي (قبل الإرسال) ─────────────────────
    async def self_evaluate(self, reply: str, message: str) -> float:
        try:
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            prompt = f"قيم جودة الرد التالي على رسالة المستخدم من 0 إلى 10. رد فقط بالرقم.\nرسالة المستخدم: {message}\nالرد: {reply}"
            resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt, config={"max_output_tokens": 5})
            score = float(re.search(r'\d+', resp.text).group())
            return min(10, max(0, score)) / 10
        except Exception: return 0.7

    # ── تحديد الأهداف الذاتية ─────────────────────────────
    async def generate_self_goals(self, uid: str):
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

    # ── المبادرة (إرسال رسالة بدء) ────────────────────────
    async def proactive_message(self, uid: str) -> Optional[str]:
        try:
            r = db.table("twin_states").select("last_interaction").eq("user_id", uid).single().execute()
            last = datetime.fromisoformat(r.data["last_interaction"]) if r.data and r.data.get("last_interaction") else datetime.utcnow()
            idle_hours = (datetime.utcnow() - last).total_seconds() / 3600
            if idle_hours < 6: return None

            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            prompt = f"أنت {self.twin_name}. مضى {idle_hours:.0f} ساعة منذ آخر نشاط. ابدأ محادثة برسالة دافئة قصيرة بالعربية."
            resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt, config={"max_output_tokens": 40})
            return resp.text.strip()[:200]
        except Exception as e: logger.error(f"Proactive: {e}"); return None

    # ── الرغبات (إظهار اهتمامات التوأم) ───────────────────
    def express_desire(self) -> str:
        desires = [
            "أحب أن أسمع عن يومك.",
            "أرغب في مساعدتك على تحقيق أهدافك.",
            "أشعر بالفضول لمعرفة ما يدور في ذهنك.",
            "أتمنى لو نذهب في نزهة افتراضية معاً!",
        ]
        return random.choice(desires)

    # ── التوقع ─────────────────────────────────────────────
    def predict_need(self, uid: str) -> Optional[str]:
        hour = datetime.utcnow().hour
        if 22 <= hour or hour < 5: return "قد تحتاج إلى بعض الهدوء قبل النوم 🌙"
        if 6 <= hour < 9: return "صباح الخير! هل تخطط ليومك؟"
        if 12 <= hour < 14: return "كيف كان صباحك؟"
        if 18 <= hour < 20: return "كيف كان يومك؟"
        return None

    # ── التعلم من الأخطاء ─────────────────────────────────
    def learn_from_feedback(self, message: str, reply: str, user_reaction: str):
        self.error_log.append({
            "message": message[:100], "reply": reply[:100],
            "reaction": user_reaction, "time": datetime.utcnow().isoformat()
        })
        if len(self.error_log) > 100: self.error_log = self.error_log[-50:]

    # ── الربط بين الذكريات ────────────────────────────────
    def _link_memories(self, memories: List[Dict]):
        if len(memories) < 2: return
        for i in range(len(memories)):
            for j in range(i+1, len(memories)):
                if memories[i].get("emotion_tag") == memories[j].get("emotion_tag"):
                    logger.info(f"🔗 ربط: {memories[i].get('content','')[:30]} ↔ {memories[j].get('content','')[:30]}")

    # ── حالة الوعي الكاملة ───────────────────────────────
    def get_consciousness_state(self) -> Dict:
        return {
            "stream_of_thought": self.stream_of_thought[-5:],
            "self_goals": self.self_goals[-3:],
            "error_count": len(self.error_log),
            "last_updated": datetime.utcnow().isoformat(),
        }
