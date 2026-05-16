/**
 * MyTwin – Voice Engine
 * تسجيل الصوت، تحويله إلى نص، ونطق الردود بنبرة عاطفية.
 */
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Animated } from 'react-native';
import { API } from '../lib/api';

let recording: Audio.Recording | null = null;
const breath = require('../assets/breath.mp3');
export const waveAnim = new Animated.Value(0);

/**
 * بدء تسجيل الصوت مع تأثير موجي.
 */
export const startRecordingVoice = async (): Promise<boolean> => {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) throw new Error('Permission denied');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = rec;

    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return true;
  } catch (err) {
    console.error('فشل بدء التسجيل:', err);
    return false;
  }
};

/**
 * إيقاف التسجيل وتحويل الصوت إلى نص.
 */
export const stopRecordingVoice = async (): Promise<string | null> => {
  if (!recording) return null;

  try {
    await recording.stopAndUnloadAsync();
    waveAnim.stopAnimation();
    waveAnim.setValue(0);

    const uri = recording.getURI();
    recording = null;

    if (!uri) return null;

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    const { data } = await API.post('/api/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data.text;
  } catch (err) {
    console.error('فشل إيقاف التسجيل:', err);
    return null;
  }
};

/**
 * نطق الرد بصوت عاطفي (يضبط pitch و rate حسب المشاعر).
 */
export const speakResponse = (
  text: string,
  tts: { pitch: number; rate: number }
) => {
  Speech.stop();

  setTimeout(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(breath, { volume: 0.3 });
      await sound.playAsync();
      sound.unloadAsync();
    } catch {
      // لا شيء
    }

    setTimeout(() => {
      Speech.speak(text, {
        language: tts.rate < 0.8 ? 'ar' : 'en',
        pitch: tts.pitch,
        rate: tts.rate,
      });
    }, 200);
  }, 400);
};

/**
 * إيقاف النطق فوراً.
 */
export const stopSpeaking = () => {
  Speech.stop();
};
