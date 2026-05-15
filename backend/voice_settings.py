import os
import logging
from typing import Dict, Optional
from enum import Enum

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

# إعدادات الصوت الافتراضية
VOICE_PARAMS = {
    VoiceProvider.GOOGLE: {
        "language": "ar-SA",
        "pitch": 0.95,
        "speed": 0.85,
    },
    VoiceProvider.AMAZON: {
        "voice_id": "Maryam",  # صوت عربي
        "engine": "neural",
    },
    VoiceProvider.ELEVENLABS: {
        "model_id": "eleven_monolingual_v1",
        "voice_stability": 0.75,
        "similarity_boost": 0.75,
    },
}


def get_voice_config(tier: str) -> Dict:
    """
    جلب إعدادات الصوت حسب الباقة.
    """
    return VOICE_CONFIG.get(tier, {"provider": VoiceProvider.DISABLED, "available_providers": []})


def get_voice_params(provider: VoiceProvider) -> Dict:
    """
    جلب معاملات الصوت.
    """
    return VOICE_PARAMS.get(provider, {})


async def synthesize_speech(text: str, provider: VoiceProvider, emotion: str = "neutral") -> Optional[bytes]:
    """
    تحويل النص إلى صوت باستخدام مقدم الخدمة المحدد.
    """
    if provider == VoiceProvider.DISABLED:
        return None

    if provider == VoiceProvider.GOOGLE:
        return await _google_tts(text, emotion)
    elif provider == VoiceProvider.ELEVENLABS:
        return await _elevenlabs_tts(text, emotion)
    
    return None


async def _google_tts(text: str, emotion: str) -> Optional[bytes]:
    """
    تحويل باستخدام Google Text-to-Speech.
    """
    try:
        # هنا يمكن تنفيذ استدعاء Google TTS API
        # هذا مثال بسيط
        logger.info(f"Generating Google TTS for: {text[:50]}...")
        return None  # placeholder
    except Exception as e:
        logger.error(f"Google TTS error: {e}")
        return None


async def _elevenlabs_tts(text: str, emotion: str) -> Optional[bytes]:
    """
    تحويل باستخدام ElevenLabs.
    """
    try:
        import httpx
        
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
        headers = {"xi-api-key": ELEVENLABS_KEY}
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.75,
                "similarity_boost": 0.75,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code == 200:
                return response.content
        
        return None
    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        return None