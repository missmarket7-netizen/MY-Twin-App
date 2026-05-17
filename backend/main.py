import os, asyncio, logging, hmac, hashlib, json
from datetime import datetime, timedelta, date
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
from slowapi.errors import RateLimitExceeded
import google.generativeai as genai
from supabase import create_client, Client

from twin_brain import TwinBrain
from rate_limiter import limiter, rate_limit_exceeded_handler
from token_limits import check_tok, BASE_TOK
from cache import get as cache_get, set as cache_set

# استيراد اختياري للميزات المتقدمة
try:
    from product_recommender import (
        extract_purchase_intent, get_recommended_product,
        format_product_suggestion, log_product_impression,
    )
    HAS_PRODUCT_RECOMMENDER = True
except ImportError:
    HAS_PRODUCT_RECOMMENDER = False

try:
    from smart_notifications import should_send_notification, format_smart_notification
    HAS_SMART_NOTIFICATIONS = True
except ImportError:
    HAS_SMART_NOTIFICATIONS = False

load_dotenv()

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Supabase & Gemini ──────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
GEMINI_KEY   = os.getenv("GEMINI_API_KEY", "")
RC_SECRET    = os.getenv("REVENUECAT_WEBHOOK_SECRET", "")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    raise RuntimeError("❌ Environment variables missing!")

db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_KEY)
brain = TwinBrain()

# ─── FastAPI App ────────────────────────────────────────────────────────────
app = FastAPI(title="MyTwin API", version="5.2.1")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Helpers ────────────────────────────────────────────────────────────────
async def run_async(fn, *args):
    return await asyncio.get_event_loop().run_in_executor(None, fn, *args)


async def get_current_user(authorization: str = Header(...)) -> str:
    """التحقق من JWT وإرجاع user_id."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="unauthorized")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        user = await run_async(lambda: db.auth.get_user(token))
        uid = user.user.id
        if not uid:
            raise HTTPException(status_code=401, detail="unauthorized")
        return uid
    except Exception:
        raise HTTPException(status_code=401, detail="unauthorized")


async def get_profile(uid: str) -> dict:
    """جلب بروفايل المستخدم من Supabase مع cache."""
    cache_key = f"profile:{uid}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        r = await run_async(
            lambda: db.table("profiles").select("*").eq("user_id", uid).single().execute()
        )
        profile = r.data or {}
        cache_set(cache_key, profile, 600)
        return profile
    except Exception:
        return {}


async def get_daily_usage(uid: str) -> int:
    """التحقق من الاستخدام اليومي من قاعدة البيانات."""
    today = date.today().isoformat()
    try:
        res = await run_async(
            lambda: db.table("daily_usage").select("messages").eq("user_id", uid).eq("date", today).limit(1).execute()
        )
        if res.data and len(res.data) > 0:
            return res.data[0].get("messages", 0)
    except Exception:
        pass
    return 0


# ─── Pydantic Models ─────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    twin_name: str = Field(default="توأمك", max_length=30)
    bond_level: float = Field(default=0, ge=0, le=100)
    relationship_dims: dict = Field(default={})
    history: list = Field(default=[])

    @validator("message")
    def no_empty(cls, v):
        if not v.strip():
            raise ValueError("message cannot be empty")
        return v.strip()


class TrialRequest(BaseModel):
    device_id: str = Field(..., max_length=100)


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "5.2.1"}


@app.post("/api/chat")
@limiter.limit("30/minute")
async def chat(request: Request, 
    body: ChatRequest,
    uid: str = Depends(get_current_user),
    x_calm_mode: str = Header(default="false"),
):
    calm = x_calm_mode.lower() == "true"

    # ✅ جلب البروفايل
    profile = await get_profile(uid)
    tier = profile.get("tier", "free")
    signup_date = profile.get("signup_date") or profile.get("created_at", datetime.utcnow().isoformat())
    trial_start = profile.get("trial_start")

    # ✅ تقدير الـ tokens
    history_text = " ".join([m.get("content", "") for m in body.history[-10:]])
    estimated_tokens = len(body.message + history_text) // 4 + 150

    # ✅ التحقق من الحد اليومي (بالشكل الصحيح)
    allowed, remaining = check_tok(uid, tier, estimated_tokens, signup_date, trial_start)
    if not allowed:
        # احتياط: تحقق من قاعدة البيانات
        used = await get_daily_usage(uid)
        limit = BASE_TOK.get(tier, 3000)
        if used + estimated_tokens > limit:
            raise HTTPException(
                status_code=429,
                detail="token_limit",
            )
        remaining = limit - used - estimated_tokens

    # ✅ جلب الذكريات
    try:
        from memory_engine import get_mems
        memories = await run_async(lambda: get_mems(uid, body.message, days=7, lim=5))
    except ImportError:
        memories = []

    # ✅ توليد الرد
    try:
        result = await run_async(lambda: brain.respond(
            message=body.message,
            twin_name=body.twin_name,
            bond_level=body.bond_level,
            dims=body.relationship_dims,
            memories=memories,
            history=body.history[-10:],
            calm=calm,
        ))
    except Exception as e:
        logger.error(f"brain.respond error: {e}")
        raise HTTPException(status_code=500, detail="ai_error")

    # ✅ إضافة توصية منتج ذكية (اختياري)
    suggestion = None
    if HAS_PRODUCT_RECOMMENDER:
        try:
            intent_category = extract_purchase_intent(body.message)
            if intent_category:
                product = get_recommended_product(intent_category)
                if product:
                    suggestion = format_product_suggestion(product)
                    asyncio.create_task(run_async(
                        lambda: log_product_impression(
                            uid,
                            str(product.get("id") or product.get("product_id") or "unknown"),
                            f"{uid}-{datetime.utcnow().timestamp()}"
                        )
                    ))
        except Exception as e:
            logger.warning(f"product suggestion skipped: {e}")

    # ✅ إشعار ذكي (اختياري)
    if HAS_SMART_NOTIFICATIONS and should_send_notification(profile.get("timezone", "UTC")):
        if tier not in ["free", "free_trial_14d"]:
            try:
                asyncio.create_task(run_async(
                    lambda: db.table("pending_notifications").insert({
                        "user_id": uid,
                        "message": format_smart_notification(
                            profile.get("full_name", "صديقي"),
                            bool(profile.get("goals")),
                            0
                        ),
                        "created_at": datetime.utcnow().isoformat(),
                    }).execute()
                ))
            except Exception as e:
                logger.warning(f"notification queue failed: {e}")

    # ✅ تحديث daily_usage في الخلفية
    asyncio.create_task(run_async(
        lambda: db.rpc("increment_daily_usage", {
            "p_user_id": uid,
            "p_field": "messages",
        }).execute()
    ))

    # ✅ حفظ ذاكرة لو الرسالة مهمة
    if len(body.message) > 20 and result.get("importance", 0) > 0.6:
        try:
            from memory_engine import store_mem
            asyncio.create_task(run_async(
                lambda: store_mem(
                    uid,
                    body.message,
                    imp=result.get("importance", 0.5),
                    tag=result.get("emotion", {}).get("primary", "neutral"),
                )
            ))
        except ImportError:
            pass

    response_data = {
        "reply": result.get("reply", ""),
        "new_bond": result.get("new_bond", body.bond_level),
        "emotion": result.get("emotion", {"primary": "neutral"}),
        "tokens_remaining": remaining,
    }
    if suggestion:
        response_data["suggestion"] = suggestion

    return response_data


@app.post("/api/trial/start")
async def start_trial(
    body: TrialRequest,
    uid: str = Depends(get_current_user),
):
    # ✅ تحقق من تكرار التجربة بالجهاز
    device_hash = hashlib.sha256(body.device_id.encode()).hexdigest()

    existing = await run_async(
        lambda: db.table("profiles")
        .select("id")
        .eq("device_hash", device_hash)
        .execute()
    )

    if existing.data:
        raise HTTPException(status_code=409, detail="trial_already_used")

    trial_end = (datetime.utcnow() + timedelta(days=14)).isoformat()

    await run_async(
        lambda: db.table("profiles").update({
            "tier": "free_trial_14d",
            "trial_end": trial_end,
            "trial_start": datetime.utcnow().isoformat(),
            "device_hash": device_hash,
        }).eq("user_id", uid).execute()
    )

    return {"status": "trial_started", "trial_end": trial_end}


@app.post("/api/profile/sync")
async def sync_profile(uid: str = Depends(get_current_user)):
    """مزامنة بيانات المستخدم."""
    profile = await get_profile(uid)
    if not profile:
        raise HTTPException(status_code=404, detail="profile_not_found")
    return profile


@app.post("/webhooks/revenuecat")
async def revenuecat_webhook(request: Request):
    """استقبال أحداث RevenueCat."""
    if RC_SECRET:
        signature = request.headers.get("X-RevenueCat-Signature", "")
        body_bytes = await request.body()
        expected = hmac.new(
            RC_SECRET.encode(),
            body_bytes,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=401, detail="invalid_signature")

    payload = await request.json()
    event = payload.get("event", {})
    event_type = event.get("type", "")
    user_id = event.get("app_user_id", "")

    if not user_id:
        return {"status": "ignored"}

    if event_type in ["INITIAL_PURCHASE", "RENEWAL"]:
        product = event.get("product_id", "")
        if "yearly" in product.lower():
            tier = "yearly"
        elif "pro" in product.lower():
            tier = "pro"
        elif "premium" in product.lower() and "trial" in product.lower():
            tier = "premium_trial"
        elif "premium" in product.lower():
            tier = "premium"
        else:
            tier = "premium"
        await run_async(
            lambda: db.table("profiles").update({
                "tier": tier,
            }).eq("user_id", user_id).execute()
        )

    elif event_type in ["CANCELLATION", "EXPIRATION"]:
        await run_async(
            lambda: db.table("profiles").update({
                "tier": "free",
            }).eq("user_id", user_id).execute()
        )

    return {"status": "ok"}


@app.delete("/api/account")
async def delete_account(uid: str = Depends(get_current_user)):
    """حذف حساب المستخدم وكل بياناته."""
    await run_async(
        lambda: db.table("profiles").delete().eq("user_id", uid).execute()
    )
    try:
        await run_async(lambda: db.auth.admin.delete_user(uid))
    except Exception as e:
        logger.warning(f"Could not delete auth user {uid}: {e}")

    return {"status": "deleted"}


@app.post("/cron/cleanup")
async def cron_cleanup(request: Request):
    """تنظيف البيانات القديمة — يُستدعى من cron job."""
    cron_key = request.headers.get("X-Cron-Key", "")
    expected_key = os.getenv("CRON_SECRET_KEY", "")
    if expected_key and cron_key != expected_key:
        raise HTTPException(status_code=401, detail="unauthorized")

    await run_async(lambda: db.rpc("cleanup_expired_memories").execute())
    await run_async(
        lambda: db.table("messages")
        .delete()
        .lt("created_at", (datetime.utcnow() - timedelta(days=90)).isoformat())
        .execute()
    )
    return {"status": "cleaned"}
