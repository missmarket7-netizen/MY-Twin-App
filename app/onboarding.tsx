import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

const QUESTIONS = [
  { id: 1, q: 'كيف تتخذ قراراتك؟', o: ['بالعقل', 'بالإحساس', 'بالمشورة', 'بالتجربة'] },
  { id: 2, q: 'ما محفزك الرئيسي؟', o: ['النجاح', 'الاستقرار', 'التأثير', 'المعرفة'] },
  { id: 3, q: 'كيف تتعامل مع الضغط؟', o: ['أفكر بهدوء', 'أبتعد', 'أتحدث مع شخص', 'أتحرك'] },
  { id: 4, q: 'أهم قيمة لديك؟', o: ['الحرية', 'العائلة', 'القوة', 'السلام'] },
  { id: 5, q: 'كيف تصف نفسك؟', o: ['تحليلي', 'إبداعي', 'قيادي', 'هادئ'] },
];

export default function Onboarding() {
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
      // الخطوة الأخيرة — نحفظ في Supabase
      setLoading(true);
      try {
        const { error: ppError } = await supabase
          .from('personality_profiles')
          .upsert({ user_id: userId, answers: newAnswers });

        if (ppError) throw ppError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ onboarded: true })
          .eq('user_id', userId);

        if (profileError) throw profileError;

        router.replace('/chat');
      } catch (e: any) {
        Alert.alert('خطأ', 'لم نتمكن من حفظ بياناتك، حاول مجدداً');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={[s.question, { marginTop: 16, fontSize: 16 }]}>
          جاري إعداد توأمك...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.progress}>{step + 1} / {QUESTIONS.length}</Text>
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((step + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>
      <Text style={s.question}>{QUESTIONS[step].q}</Text>
      {QUESTIONS[step].o.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={s.option}
          onPress={() => pick(opt)}
          activeOpacity={0.7}
        >
          <Text style={s.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1A',
    justifyContent: 'center',
    padding: 24,
  },
  progress: {
    color: '#8B7BA3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1A1226',
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  question: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  option: {
    backgroundColor: '#1A1226',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3A2A5D',
  },
  optionText: { color: '#FFF', textAlign: 'center', fontSize: 16 },
});
