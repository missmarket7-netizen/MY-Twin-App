"""MyTwin – Emotional Voice Engine (Edge-TTS)"""
import os, asyncio, logging
from typing import Dict
import edge_tts
logger = logging.getLogger("voice_engine")

class EmotionalVoiceEngine:
    ARABIC_VOICES = {"neutral":"ar-SA-ZariyahNeural","happy":"ar-SA-HamedNeural","sad":"ar-EG-SalmaNeural","excited":"ar-SA-HamedNeural","calm":"ar-SA-ZariyahNeural","angry":"ar-SA-HamedNeural","loving":"ar-EG-SalmaNeural","worried":"ar-EG-SalmaNeural","surprised":"ar-SA-HamedNeural"}
    ENGLISH_VOICES = {"neutral":"en-US-AriaNeural","happy":"en-US-GuyNeural","sad":"en-US-JennyNeural","excited":"en-US-GuyNeural","calm":"en-US-AriaNeural","angry":"en-US-GuyNeural","loving":"en-US-JennyNeural","worried":"en-US-JennyNeural","surprised":"en-US-GuyNeural"}
    EMOTION_PARAMS = {"neutral":{"rate":"+0%","pitch":"+0Hz","volume":"+0%"},"happy":{"rate":"+10%","pitch":"+20Hz","volume":"+5%"},"sad":{"rate":"-15%","pitch":"-30Hz","volume":"-10%"},"excited":{"rate":"+20%","pitch":"+40Hz","volume":"+10%"},"calm":{"rate":"-10%","pitch":"-10Hz","volume":"-5%"},"angry":{"rate":"+15%","pitch":"+30Hz","volume":"+15%"},"loving":{"rate":"-5%","pitch":"+10Hz","volume":"+0%"},"worried":{"rate":"-5%","pitch":"-5Hz","volume":"-5%"},"surprised":{"rate":"+15%","pitch":"+35Hz","volume":"+10%"}}

    async def synthesize(self, text, emotion="neutral", language="ar", speed=1.0):
        if language=="ar": voice = self.ARABIC_VOICES.get(emotion, self.ARABIC_VOICES["neutral"])
        else: voice = self.ENGLISH_VOICES.get(emotion, self.ENGLISH_VOICES["neutral"])
        params = self.EMOTION_PARAMS.get(emotion, self.EMOTION_PARAMS["neutral"])
        rate = self._adjust_rate(params["rate"], speed)
        try:
            communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=params["pitch"], volume=params["volume"])
            audio_bytes = b""
            async for chunk in communicate.stream():
                if chunk["type"]=="audio": audio_bytes += chunk["data"]
            return audio_bytes
        except Exception as e:
            logger.error(f"Edge-TTS failed: {e}")
            if emotion!="neutral": return await self.synthesize(text, "neutral", language, speed)
            raise

    def get_tts_params(self, emotion, calm=False):
        params = self.EMOTION_PARAMS.get(emotion, self.EMOTION_PARAMS["neutral"]).copy()
        if calm: params = {"rate":"-20%","pitch":"-20Hz","volume":"-15%"}
        rate_map = {"+0%":1.0,"+10%":1.1,"-15%":0.85,"+20%":1.2,"-10%":0.9,"+15%":1.15,"-5%":0.95,"-20%":0.8}
        pitch_map = {"+0Hz":1.0,"+20Hz":1.05,"-30Hz":0.85,"+40Hz":1.1,"-10Hz":0.95,"+30Hz":1.08,"-5Hz":0.98,"+35Hz":1.09,"-20Hz":0.9}
        return {"pitch": pitch_map.get(params["pitch"], 1.0), "rate": rate_map.get(params["rate"], 1.0)}

    def _adjust_rate(self, base_rate, speed):
        try: return f"{int(int(base_rate.replace('%','').replace('+','')) * speed):+d}%"
        except: return base_rate
