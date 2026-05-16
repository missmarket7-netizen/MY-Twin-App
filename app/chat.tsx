import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Share
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTwinStore } from '../store/useTwinStore';
import { askTwin } from '../lib/api';
import { supabase } from '../lib/supabase';
import { track } from '../lib/analytics';
import EmotionalAvatar from '../components/EmotionalAvatar';
import BondTimeline from '../components/BondTimeline';
import TypingIndicator from '../components/TypingIndicator';

export default function Chat() {
  const {
    twinName, bondLevel, relationshipDims,
    chatHistory, addMessage, updateBond,
    calmMode, toggleCalmMode, triggerHaptic,
    userId,
  } = useTwinStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [chatHistory]);

  const shareMemory = async () => {
    const lastTwin = [...chatHistory].reverse().find(m => m.role === 'twin');
    if (lastTwin) {
      await Share.share({ message: `💬 ${lastTwin.content}` });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      addMessage('user', `[مشاركة صورة]`);
    }
  };

  const send = async () => {
    const message = input.trim();
    if (!message || loading) return;

    triggerHaptic();
    addMessage('user', message);
    setInput('');
    setLoading(true);

    try {
      track('message_sent', { bond_level: bondLevel, calm_mode: calmMode });

      // ✅ تمرير relationshipDims مباشرة بدون تحويل
      const res = await askTwin(
        message,
        twinName,
        bondLevel,
        relationshipDims,
        calmMode
      );

      addMessage('twin', res.reply);
      updateBond(res.new_bond ?? bondLevel);
      setEmotion(res?.emotion?.primary ?? 'neutral');

      track('message_received', { emotion: res?.emotion?.primary });

      if (userId) {
        const { error } = await supabase.from('messages').insert([
          { user_id: userId, sender: 'user', content: message },
          { user_id: userId, sender: 'twin', content: res.reply },
        ]);
        if (error) console.log('Supabase insert error:', error.message);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      const errMsg = detail === 'token_limit'
        ? 'وصلت للحد اليومي من الرسائل 💜 جرب غداً أو قم بالترقية'
        : 'حدث خطأ... حاول مجدداً';
      addMessage('twin', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.header}>
          <EmotionalAvatar emotion={emotion} size={42} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.twinName}>{twinName}</Text>
            <BondTimeline />
          </View>
          <TouchableOpacity onPress={toggleCalmMode} style={s.bellBtn}>
            <Text style={{ fontSize: 20 }}>{calmMode ? '🔕' : '🔔'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={chatHistory}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={[s.bubble, item.role === 'user' ? s.userBubble : s.twinBubble]}>
              <Text style={item.role === 'user' ? s.userText : s.twinText}>
                {item.content}
              </Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          style={s.list}
        />

        {loading && <TypingIndicator />}

        <View style={s.inputRow}>
          <TouchableOpacity onPress={shareMemory} style={s.shareButton}>
            <Text style={s.shareIcon}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={s.imageButton}>
            <Text style={s.imageIcon}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={s.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="اكتب رسالتك..."
            placeholderTextColor="#8B7BA3"
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[s.sendButton, loading && { opacity: 0.5 }]}
            onPress={send}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={s.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F6F2',
    borderBottomWidth: 1,
    borderColor: '#2D1B4D',
  },
  twinName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  bellBtn: { padding: 8 },
  list: { flex: 1 },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  twinBubble: {
    backgroundColor: '#F3F0FF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#3A2A5D',
  },
  userText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  twinText: { color: '#E0D0FF', fontSize: 15, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 16,
    backgroundColor: '#F8F6F2',
    borderTopWidth: 1,
    borderColor: '#2D1B4D',
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3A2A5D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: '#5A4A7D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  imageIcon: { fontSize: 18 },
  shareIcon: { fontSize: 18 },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#3A2A5D',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
});
