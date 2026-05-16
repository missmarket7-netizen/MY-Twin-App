"""
MyTwin – Voice Settings
إدارة مزودي الصوت (Google TTS, ElevenLabs, Amazon Polly).
التكامل مع المحرك العاطفي لتعديل نبرة الصوت حسب المشاعر.
"""
import os
import logging
from typing import Dict, Optional
from enum import Enum

from emotional_engine import tts_params as get_emotion_tts

logger = logging.getLogger(__name__)

GOOGLE_TTS_KEY = os.getenv("GOOGLE_TTS_KEY", "")
ELEVENLABS_KEY = os.getenv("ELEVENLABS_API_KEY", "")


class VoiceProvider(str, Enum):
    DISABLED = "disabled"
    GOOGLE = "google"
    AMAZON = "amazon"
    ELEVENLABS = "elevenlabs"


# تخصيص الصوت حسب الباقة
VOICE_CONFIG = {
    "free_trial_14d": {
        "provider": VoiceProvider.DISABLED,
        "available_providers": [],
    },
    "free": {
        "provider": VoiceProvider.DISABLED,
        "available_providers": [],
    },
    "premium_trial": {
        "provider": VoiceProvider.GOOGLE,
        "available_providers": [VoiceProvider.GOOGLE],
    },
    "premium": {
        "provider": VoiceProvider.GOOGLE,
        "available_providers": [VoiceProvider.GOOGLE],
    },
    "pro": {
        "provider": VoiceProvider.GOOGLE,
        "available_providers": [VoiceProvider.GOOGLE],
    },
    "yearly": {
        "provider": VoiceProvider.ELEVENLABS,
        "available_providers": [VoiceProvider.GOOGLE, VoiceProvider.ELEVENLABS],
    },
}

# إعدادات الصوت الافتراضية لكل مزود
VOICE_PARAMS = {
    VoiceProvider.GOOGLE: {
        "language": "ar-SA",
        "voice_name": "ar-SA-Standard-A",
    },
    VoiceProvider.AMAZON: {
        "voice_id": "Maryam",
        "engine": "neural",
    },
    VoiceProvider.ELEVENLABS: {
        "voice_id": os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"),
        "model_id": "eleven_monolingual_v1",
        "voice_stability": 0.75,
        "similarity_boost": 0.75,
    },
}


def get_voice_config(tier: str) -> Dict:
    """جلب إعدادات الصوت حسب الباقة."""
    return VOICE_CONFIG.get(
        tier, {"provider": VoiceProvider.DISABLED, "available_providers": []}
    )


def get_voice_params(provider: VoiceProvider) -> Dict:
    """جلب معاملات الصوت الأساسية."""
    return VOICE_PARAMS.get(provider, {})


async def synthesize_speech(
    text: str,
    provider: VoiceProvider,
    emotion: str = "neutral",
    calm: bool = False
) -> Optional[bytes]:
    """
    تحويل النص إلى صوت باستخدام مقدم الخدمة المحدد.
    يدمج إعدادات الصوت العاطفية من emotional_engine.
    """
    if provider == VoiceProvider.DISABLED:
        return None
    if not text or not text.strip():
        return None

    # جلب إعدادات الصوت العاطفية
    emotion_config = get_emotion_tts(emotion, calm)

    if provider == VoiceProvider.GOOGLE:
        return await _google_tts(text, emotion_config)
    elif provider == VoiceProvider.ELEVENLABS:
        return await _elevenlabs_tts(text, emotion_config)

    return None


async def _google_tts(text: str, emotion_config: Dict) -> Optional[bytes]:
    """تحويل النص إلى صوت باستخدام Google Text-to-Speech."""
    if not GOOGLE_TTS_KEY:
        logger.warning("Google TTS key missing")
        return None

    try:
        import httpx

        url = "https://texttospeech.googleapis.com/v1/text:synthesize"
        params = {"key": GOOGLE_TTS_KEY}

        body = {
            "input": {"text": text},
            "voice": {
                "languageCode": "ar-SA",
                "name": "ar-SA-Standard-A",
                "ssmlGender": "FEMALE",
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "pitch": emotion_config.get("pitch", 0.95),
                "speakingRate": emotion_config.get("rate", 0.85),
            },
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=body, params=params, timeout=15.0)
            if response.status_code == 200:
                audio_base64 = response.json().get("audioContent", "")
                if audio_base64:
                    import base64
                    return base64.b64decode(audio_base64)

        logger.error(f"Google TTS failed: {response.status_code}")
        return None

    except Exception as e:
        logger.error(f"Google TTS error: {e}")
        return None


async def _elevenlabs_tts(text: str, emotion_config: Dict) -> Optional[bytes]:
    """تحويل النص إلى صوت باستخدام ElevenLabs."""
    if not ELEVENLABS_KEY:
        logger.warning("ElevenLabs API key missing")
        return None

    try:
        import httpx

        voice_id = VOICE_PARAMS[VoiceProvider.ELEVENLABS]["voice_id"]
        model_id = VOICE_PARAMS[VoiceProvider.ELEVENLABS]["model_id"]
        stability = emotion_config.get("stability", 0.75)
        similarity = emotion_config.get("similarity_boost", 0.75)

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {"xi-api-key": ELEVENLABS_KEY}
        data = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity,
            },
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers, timeout=15.0)
            if response.status_code == 200:
                return response.content

        logger.error(f"ElevenLabs TTS failed: {response.status_code}")
        return None

    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        return None
