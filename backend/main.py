"""MyTwin API v5.3.1 — Clean Version"""
import os, asyncio, logging, hmac, hashlib, json
from datetime import datetime, timedelta, date
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from slowapi.errors import RateLimitExceeded
from supabase import create_client, Client
from twin_brain import TwinBrain
from rate_limiter import limiter, rate_limit_exceeded_handler
from token_limits import check_tok, BASE_TOK
from cache import get as cache_get, set as cache_set
from emotional_engine import calc_energy, tts_params
try:
    from product_recommender import (extract_purchase_intent, get_recommended_product, format_product_suggestion, log_product_impression)
    HAS_PRODUCT_RECOMMENDER = True
except ImportError:
    HAS_PRODUCT_RECOMMENDER = False

load_dotenv(); logging.basicConfig(level=logging.INFO); logger = logging.getLogger("mytwin")
SUPABASE_URL=os.getenv("SUPABASE_URL",""); SUPABASE_KEY=os.getenv("SUPABASE_SERVICE_KEY","")
GEMINI_KEY=os.getenv("GEMINI_API_KEY",""); RC_SECRET=os.getenv("REVENUECAT_WEBHOOK_SECRET","")
if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]): raise RuntimeError("Missing env vars")
db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
brain = TwinBrain(GEMINI_KEY)

app = FastAPI(title="MyTwin API", version="5.3.1")
ALLOWED_ORIGINS = ["https://mytwin.app", "exp://*", "http://localhost:*"]

@app.middleware("http")
async def csrf_check(request: Request, call_next):
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("origin", "")
        if origin and origin not in ALLOWED_ORIGINS:
            return JSONResponse(status_code=403, content={"detail": "Origin not allowed"})
    return await call_next(request)

app.state.limiter = limiter; app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=["https://mytwin.app", "exp://*", "http://localhost:*"], allow_methods=["*"], allow_headers=["*"])

async def run_async(fn, *args): return await asyncio.get_event_loop().run_in_executor(None, fn, *args)

async def get_user(auth: str = Header(...)) -> str:
    if not auth.startswith("Bearer "): raise HTTPException(401, "unauthorized")
    try:
        user = await run_async(lambda: db.auth.get_user(auth[7:].strip()))
        if not user.user.id: raise HTTPException(401)
        return user.user.id
    except: raise HTTPException(401)

async def get_profile(uid):
    k = f"p:{uid}"
    if c := cache_get(k): return c
    r = await run_async(lambda: db.table("profiles").select("*").eq("user_id", uid).single().execute())
    p = r.data or {}; cache_set(k, p, 600); return p

async def get_usage(uid):
    t = date.today().isoformat()
    r = await run_async(lambda: db.table("daily_usage").select("messages").eq("user_id", uid).eq("date", t).limit(1).execute())
    return r.data[0].get("messages",0) if r.data else 0

class ChatReq(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    twin_name: str = "توأمك"; bond_level: float = 0.0; dims: dict = {}; history: list = []

@app.get("/")
async def root():
    return {"status":"ok","version":"5.3.1"}

@app.get("/health")
async def health():
    return {"status":"ok","version":"5.3.1"}

@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat(req: Request, body: ChatReq, uid=Depends(get_user), calm: str = Header("false")):
    is_calm = calm.lower() == "true"
    p = await get_profile(uid); tier = p.get("tier","free")
    sd = p.get("signup_date") or p.get("created_at", datetime.utcnow().isoformat())
    ts = p.get("trial_start")

    est = len(body.message.encode()) + sum(len(m.get("content","").encode()) for m in body.history[-10:]) // 4 + 150
    ok, rem = check_tok(uid, tier, est, sd, ts)
    if not ok:
        used = await get_usage(uid); lim = BASE_TOK.get(tier, 3000)
        if used + est > lim: raise HTTPException(429, "token_limit")
        rem = lim - used - est

    emo_filter = None
    try:
        emo = brain._detect_emotion(body.message)
        if emo.get("needs_support"): emo_filter = "sadness"
    except: pass

    try:
        from memory_engine import DeepMemorySystem
        mems = DeepMemorySystem().retrieve(uid, body.message, days=7, lim=5, emotion_filter=emo_filter)
        if not mems:
            from memory_engine import get_mems
            mems = await run_async(lambda: get_mems(uid, body.message, 7, 5))
    except:
        try:
            from memory_engine import get_mems
            mems = await run_async(lambda: get_mems(uid, body.message, 7, 5))
        except: mems = []

    traits = None
    try:
        pers = await run_async(lambda: db.table("personality_profiles").select("analyzed_traits").eq("user_id", uid).single().execute())
        traits = pers.data.get("analyzed_traits") if pers.data else None
    except: pass

    try:
        res = await run_async(lambda: brain.respond(
            message=body.message, twin_name=body.twin_name, bond_level=body.bond_level,
            dims=body.dims, memories=mems, history=body.history[-10:], calm=is_calm, personality=traits
        ))
    except Exception as e:
        logger.error(f"brain: {e}"); raise HTTPException(500, "ai_error")

    sug = None
    if HAS_PRODUCT_RECOMMENDER:
        try:
            intent = extract_purchase_intent(body.message)
            if intent:
                prod = get_recommended_product(intent)
                if prod:
                    sug = format_product_suggestion(prod)
                    asyncio.create_task(run_async(lambda: log_product_impression(uid, str(prod.get("id")), f"{uid}-{datetime.utcnow().timestamp()}")))
        except: pass

    asyncio.create_task(run_async(lambda: db.rpc("increment_daily_usage", {"p_user_id":uid, "p_field":"messages"}).execute()))
    if len(body.message) > 20 and res.get("importance",0) > 0.6:
        try:
            from memory_engine import store_mem
            asyncio.create_task(run_async(lambda: store_mem(uid, body.message, res.get("importance",0.5), res.get("emotion",{}).get("primary","neutral"))))
        except: pass

    energy = calc_energy(p.get("last_active",""), p.get("daily_msgs",0), res.get("emotion",{}).get("primary","neutral"))
    voice = tts_params(res.get("emotion",{}).get("primary","neutral"), is_calm)

    resp = {"reply": res["reply"], "new_bond": res["new_bond"], "emotion": res["emotion"], "energy": energy, "tts": voice, "tokens_left": rem, "provider": res.get("provider","gemini_flash")}
    if "dream_data" in res: resp["dream"] = res["dream_data"]
    if "coaching_data" in res: resp["coaching"] = res["coaching_data"]
    if sug: resp["suggestion"] = sug
    return resp

@app.delete("/api/account")
async def del_acc(uid=Depends(get_user)):
    await run_async(lambda: db.table("profiles").delete().eq("user_id", uid).execute())
    try: await run_async(lambda: db.auth.admin.delete_user(uid))
    except Exception as e: logger.warning(f"del user: {e}")
    return {"status":"deleted"}

@app.post("/cron/cleanup")
async def cron_cleanup(req: Request):
    key = req.headers.get("X-Cron-Key",""); expected = os.getenv("CRON_SECRET_KEY","")
    if expected and key != expected: raise HTTPException(401)
    await run_async(lambda: db.rpc("cleanup_expired_memories").execute())
    await run_async(lambda: db.table("messages").delete().lt("created_at", (datetime.utcnow()-timedelta(days=90)).isoformat()).execute())
    return {"status":"cleaned"}

# ─── Consciousness Core ──────────────────────────────────────────────
from consciousness_core import ConsciousnessCore
consciousness = ConsciousnessCore(twin_name="MyTwin", gemini_key=GEMINI_KEY)

@app.get("/api/consciousness/state")
async def get_consciousness(uid=Depends(get_user)):
    return consciousness.get_consciousness_state()

@app.get("/api/consciousness/predict")
async def predict_need(uid=Depends(get_user)):
    return {"prediction": consciousness.predict_need(uid)}

@app.get("/api/consciousness/desire")
async def get_desire():
    return {"desire": consciousness.express_desire()}

# ─── Consciousness Core ──────────────────────────────────────────────
from consciousness_core import ConsciousnessCore
consciousness = ConsciousnessCore(twin_name="MyTwin", gemini_key=GEMINI_KEY)

@app.get("/api/consciousness/state")
async def get_consciousness(uid=Depends(get_user)):
    return consciousness.get_consciousness_state()

@app.get("/api/consciousness/predict")
async def predict_need(uid=Depends(get_user)):
    return {"prediction": consciousness.predict_need(uid)}

@app.get("/api/consciousness/desire")
async def get_desire():
    return {"desire": consciousness.express_desire()}

@app.post("/api/twin/state/sync")
async def sync_twin_state(uid=Depends(get_user)):
    """مزامنة حالة التوأم من Supabase."""
    state = await consciousness.load_state(uid)
    return state or {"status": "no_state_yet"}

# ─── Consciousness Core ──────────────────────────────────────────────
from consciousness_core import ConsciousnessCore
consciousness = ConsciousnessCore(twin_name="MyTwin", gemini_key=GEMINI_KEY)

@app.get("/api/consciousness/state")
async def get_consciousness(uid=Depends(get_user)):
    return consciousness.get_consciousness_state()

@app.get("/api/consciousness/predict")
async def predict_need(uid=Depends(get_user)):
    return {"prediction": consciousness.predict_need(uid)}

@app.get("/api/consciousness/desire")
async def get_desire():
    return {"desire": consciousness.express_desire()}

@app.post("/api/twin/state/sync")
async def sync_twin_state(uid=Depends(get_user)):
    """مزامنة حالة التوأم من Supabase."""
    state = await consciousness.load_state(uid)
    return state or {"status": "no_state_yet"}
