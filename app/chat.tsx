import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Modal, Alert } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTwinStore } from '../store/useTwinStore';
import { askTwin } from '../lib/api';
import { supabase } from '../lib/supabase';
import { track } from '../lib/analytics';
import EmotionalAvatar from '../components/EmotionalAvatar';
import BondTimeline from '../components/BondTimeline';
import TypingIndicator from '../components/TypingIndicator';
import { COLORS, FONTS } from '../utils/theme';
import { startRecordingVoice, stopRecordingVoice, speakResponse } from '../utils/voice_engine';
import { Plus, Mic, ArrowUp, Image, Moon, Target, Bell, BellOff, Crown } from 'lucide-react-native';

export default function Chat() {
  const { twinName, bondLevel, relationshipDims, chatHistory, addMessage, updateBond, calmMode, toggleCalmMode, triggerHaptic, userId, tier } = useTwinStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, [chatHistory]);

  const send = async (messageText?: string) => {
    const message = (messageText || input).trim();
    if (!message || loading) return;
    triggerHaptic(); addMessage('user', message); setInput(''); setLoading(true);
    try {
      const res = await askTwin(message, twinName, bondLevel, relationshipDims, calmMode);
      addMessage('twin', res.reply); updateBond(res.new_bond ?? bondLevel); setEmotion(res?.emotion?.primary ?? 'neutral');
      if (res.tts) speakResponse(res.reply, res.tts);
    } catch { addMessage('twin', 'حدث خطأ...'); }
    finally { setLoading(false); }
  };

  const handleVoice = async () => { setShowPlusMenu(false); const started = await startRecordingVoice(); if (started) { addMessage('user', '🎙️ جاري التسجيل...'); setTimeout(async () => { const text = await stopRecordingVoice(); if (text) send(text); else addMessage('twin', 'لم أتمكن من سماعك.'); }, 5000); } else { Alert.alert('خطأ', 'تعذر الوصول للميكروفون.'); } };
  const handleCamera = async () => { setShowPlusMenu(false); const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 }); if (!result.canceled) { addMessage('user', '[صورة]'); addMessage('twin', 'تحليل الصور قيد التطوير.'); } };
  const handleDream = () => { setShowPlusMenu(false); setInput('حلمت البارحة... '); };
  const handleGoal = () => { setShowPlusMenu(false); router.push('/goals'); };

  const plusMenuItems = [
    { icon: Mic, label: 'صوت', onPress: handleVoice },
    { icon: Image, label: 'صورة', onPress: handleCamera },
    { icon: Moon, label: 'حلم', onPress: handleDream },
    { icon: Target, label: 'هدف', onPress: handleGoal },
  ];

  const stage = bondLevel >= 95 ? 'توأم روح' : bondLevel >= 80 ? 'ارتباط' : bondLevel >= 60 ? 'ثقة' : bondLevel >= 40 ? 'مقربين' : bondLevel >= 20 ? 'أصدقاء' : 'غرباء';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <EmotionalAvatar emotion={emotion} size={42} />
          <View style={styles.headerInfo}>
            <Text style={styles.twinName}>{twinName}</Text>
            <BondTimeline />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleCalmMode} style={styles.iconBtn}>
              {calmMode ? <BellOff size={20} color={COLORS.textSecondary} /> : <Bell size={20} color={COLORS.textSecondary} />}
            </TouchableOpacity>
            {tier === 'free' && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/subscription')}>
                <Crown size={14} color={COLORS.white} style={{ marginRight: 4 }} />
                <Text style={styles.upgradeText}>ترقية</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <FlatList ref={flatListRef} data={chatHistory} keyExtractor={(_, i) => i.toString()} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => ( <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.twinBubble]}> <Text style={item.role === 'user' ? styles.userText : styles.twinText}>{item.content}</Text> </View> )} />
        {loading && <TypingIndicator />}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowPlusMenu(true)}>
            <Plus size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TextInput style={styles.textInput} value={input} onChangeText={setInput} placeholder="اكتب رسالتك..." placeholderTextColor={COLORS.textSecondary} multiline maxLength={2000} returnKeyType="send" blurOnSubmit={false} onSubmitEditing={() => send()} />
          <TouchableOpacity style={styles.iconBtn} onPress={handleVoice}>
            <Mic size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sendButton, loading && { opacity: 0.5 }]} onPress={() => send()} disabled={loading}>
            <ArrowUp size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Modal visible={showPlusMenu} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPlusMenu(false)}>
            <View style={styles.plusMenu}>
              {plusMenuItems.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity key={i} style={styles.plusMenuItem} onPress={item.onPress}>
                    <View style={styles.plusMenuIconBg}><IconComponent size={24} color={COLORS.primary} /></View>
                    <Text style={styles.plusMenuLabel}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.chatBg },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.header, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  twinName: { color: COLORS.text, fontSize: FONTS.subtitle, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  upgradeBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignItems: 'center' },
  upgradeText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.small },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 10 },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  twinBubble: { backgroundColor: COLORS.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  userText: { color: COLORS.white, fontSize: FONTS.body, lineHeight: 22 },
  twinText: { color: COLORS.text, fontSize: FONTS.body, lineHeight: 22 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: COLORS.header, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 4 },
  textInput: { flex: 1, backgroundColor: COLORS.white, color: COLORS.text, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 20, fontSize: FONTS.body, maxHeight: 100, minHeight: 40, borderWidth: 1, borderColor: COLORS.border },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end', alignItems: 'center' },
  plusMenu: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 24 },
  plusMenuItem: { alignItems: 'center', width: 70 },
  plusMenuIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  plusMenuLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
});
