import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS } from '../utils/theme';
import { router } from 'expo-router';

const TEXTS = {
  ar: {
    title: '🎨 تخصيص التوأم',
    personality: 'الشخصية',
    name: 'اسم التوأم',
    style: 'النمط',
    styles: { supportive: '🤝 صديق داعم', coach: '🎯 مدرب شخصي', wise: '💡 مستشار حكيم', fun: '😊 رفيق مرح', calm: '🧘 معلم هادئ' },
    appearance: 'المظهر',
    avatar: 'الأفاتار',
    colors: 'الألوان',
    voice: 'الصوت',
    voiceEnabled: 'تفعيل الصوت',
    voiceType: 'نوع الصوت',
    voiceSpeed: 'السرعة',
    voiceTone: 'النبرة',
    language: 'اللغة',
    primaryLang: 'اللغة الأساسية',
    dialect: 'اللهجة',
    behavior: 'السلوك',
    detailLevel: 'مستوى التفصيل',
    defaultMode: 'الوضع الافتراضي',
    initiative: 'المبادرة',
    save: 'حفظ التغييرات',
    saved: 'تم حفظ التغييرات بنجاح',
  },
  en: {
    title: '🎨 Customize Twin',
    personality: 'Personality',
    name: 'Twin Name',
    style: 'Style',
    styles: { supportive: '🤝 Supportive Friend', coach: '🎯 Personal Coach', wise: '💡 Wise Advisor', fun: '😊 Fun Companion', calm: '🧘 Calm Teacher' },
    appearance: 'Appearance',
    avatar: 'Avatar',
    colors: 'Colors',
    voice: 'Voice',
    voiceEnabled: 'Enable Voice',
    voiceType: 'Voice Type',
    voiceSpeed: 'Speed',
    voiceTone: 'Tone',
    language: 'Language',
    primaryLang: 'Primary Language',
    dialect: 'Dialect',
    behavior: 'Behavior',
    detailLevel: 'Detail Level',
    defaultMode: 'Default Mode',
    initiative: 'Initiative',
    save: 'Save Changes',
    saved: 'Changes saved successfully',
  },
};

export default function Customize() {
  const { twinName, tier } = useTwinStore();
  const [name, setName] = useState(twinName);
  const [style, setStyle] = useState('supportive');
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [detailLevel, setDetailLevel] = useState('medium');
  const [initiative, setInitiative] = useState('medium');
  const lang = 'ar';
  const t = TEXTS[lang];

  const handleSave = async () => {
    // حفظ الإعدادات في Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        twin_name: name,
        twin_style: style,
        voice_enabled: voiceOn,
        voice_speed: voiceSpeed,
        detail_level: detailLevel,
        initiative_level: initiative,
      }).eq('user_id', user.id);
    }
    Alert.alert('✅', t.saved);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{t.title}</Text>

      {/* الشخصية */}
      <Text style={styles.sectionTitle}>{t.personality}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t.name}</Text>
          <Text style={styles.value}>{name}</Text>
        </View>
        <Text style={styles.optionTitle}>{t.style}</Text>
        {Object.entries(t.styles).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.optionBtn, style === key && styles.optionActive]} onPress={() => setStyle(key)}>
            <Text style={[styles.optionText, style === key && styles.optionActiveText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* الصوت */}
      <Text style={styles.sectionTitle}>{t.voice}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t.voiceEnabled}</Text>
          <Switch value={voiceOn} onValueChange={setVoiceOn} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
        </View>
      </View>

      {/* السلوك */}
      <Text style={styles.sectionTitle}>{t.behavior}</Text>
      <View style={styles.card}>
        <Text style={styles.optionTitle}>{t.detailLevel}</Text>
        {['short', 'medium', 'long'].map(level => (
          <TouchableOpacity key={level} style={[styles.optionBtn, detailLevel === level && styles.optionActive]} onPress={() => setDetailLevel(level)}>
            <Text style={[styles.optionText, detailLevel === level && styles.optionActiveText]}>
              {level === 'short' ? 'مختصر' : level === 'medium' ? 'متوسط' : 'مفصل'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* زر الحفظ */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{t.save}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, marginBottom: 24 },
  sectionTitle: { fontSize: FONTS.subtitle, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 12 },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: FONTS.body },
  value: { color: COLORS.text, fontSize: FONTS.body, fontWeight: '600' },
  optionTitle: { color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 12, marginBottom: 8 },
  optionBtn: { padding: 12, borderRadius: 10, backgroundColor: COLORS.bg, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  optionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.text, fontSize: FONTS.body },
  optionActiveText: { color: COLORS.white },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.body },
});
