import { Alert } from "react-native";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';
import { COLORS, FONTS } from '../utils/theme';

const QUESTIONS = [
  { id: 1, q: 'كيف تتخذ قراراتك؟', o: ['بالعقل', 'بالإحساس', 'بالمشورة', 'بالتجربة'] },
  { id: 2, q: 'ما محفزك الرئيسي؟', o: ['النجاح', 'الاستقرار', 'التأثير', 'المعرفة'] },
  { id: 3, q: 'كيف تتعامل مع الضغط؟', o: ['أفكر بهدوء', 'أبتعد', 'أتحدث مع شخص', 'أتحرك'] },
  { id: 4, q: 'أهم قيمة لديك؟', o: ['الحرية', 'العائلة', 'القوة', 'السلام'] },
  { id: 5, q: 'كيف تصف نفسك؟', o: ['تحليلي', 'إبداعي', 'قيادي', 'هادئ'] },
  { id: 6, q: 'كيف تتعامل مع الفشل؟', o: ['أتعلم منه', 'أشعر بالإحباط', 'أحاول مجدداً', 'أتقبله بهدوء'] },
  { id: 7, q: 'ما أكثر شيء يجعلك سعيداً؟', o: ['العلاقات', 'الإنجازات', 'التعلم', 'السلام الداخلي'] },
  { id: 8, q: 'كيف تقضي وقت فراغك؟', o: ['القراءة', 'الرياضة', 'التواصل الاجتماعي', 'التأمل'] },
  { id: 9, q: 'ما هي أكبر مخاوفك؟', o: ['الفشل', 'الوحدة', 'المستقبل', 'فقدان الأحبة'] },
  { id: 10, q: 'ما طموحك الأكبر؟', o: ['النجاح المهني', 'السعادة العائلية', 'التأثير في العالم', 'تحقيق السلام الداخلي'] },
];

function analyzePersonality(answers: Record<string, string>) {
  const traits: Record<string, number> = {
    analytical: 0, emotional: 0, social: 0, independent: 0,
    ambitious: 0, calm: 0, creative: 0, resilient: 0,
  };
  if (answers['1'] === 'بالعقل') traits.analytical += 2;
  if (answers['1'] === 'بالإحساس') traits.emotional += 2;
  if (answers['2'] === 'النجاح') traits.ambitious += 2;
  if (answers['3'] === 'أفكر بهدوء') traits.calm += 2;
  if (answers['4'] === 'الحرية') traits.independent += 2;
  if (answers['4'] === 'العائلة') traits.social += 2;
  if (answers['5'] === 'إبداعي') traits.creative += 2;
  if (answers['6'] === 'أتعلم منه' || answers['6'] === 'أحاول مجدداً') traits.resilient += 2;
  if (answers['7'] === 'العلاقات') traits.social += 2;
  if (answers['9'] === 'الوحدة') traits.social += 1;
  const dominant = Object.entries(traits).sort((a, b) => b[1] - a[1])[0][0];
  const typeMap: Record<string, string> = {
    analytical: 'ANALYTICAL', emotional: 'EMPATH', social: 'SOCIAL',
    independent: 'EXPLORER', ambitious: 'ACHIEVER', calm: 'GUARDIAN',
    creative: 'CREATOR', resilient: 'WARRIOR',
  };
  return { traits, dominant_type: typeMap[dominant] || 'BALANCED' };
}

export default function Onboarding() {
  const [skipped, setSkipped] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { userId } = useTwinStore();

  const pick = async (option: string) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: option };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      const analysis = analyzePersonality(newAnswers);
      try {
        await supabase.from('personality_profiles').upsert({ user_id: userId, answers: newAnswers, analyzed_traits: analysis });
        await supabase.from('profiles').update({ onboarded: true }).eq('user_id', userId);
        router.replace('/chat');
      } catch (e: any) {
        Alert.alert('خطأ', 'لم نتمكن من حفظ بياناتك');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, fontSize: FONTS.body, color: COLORS.text }}>جاري إعداد توأمك...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={() => { setSkipped(true); router.replace("/chat"); }}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>
      <Text style={styles.progress}>{step + 1} / {QUESTIONS.length}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>
      <Text style={styles.question}>{QUESTIONS[step].q}</Text>
      {QUESTIONS[step].o.map((opt, i) => (
        <TouchableOpacity key={i} style={styles.option} onPress={() => pick(opt)} activeOpacity={0.7}>
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', padding: 24 },
  progress: { color: COLORS.textSecondary, fontSize: FONTS.small, textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 32, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  question: { color: COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  option: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  optionText: { color: COLORS.text, textAlign: 'center', fontSize: FONTS.body },
});
const s = StyleSheet.create({
  skipBtn: { position: 'absolute', top: 20, right: 20, padding: 8, zIndex: 10 },
  skipText: { color: COLORS.textSecondary, fontSize: FONTS.body },
});
