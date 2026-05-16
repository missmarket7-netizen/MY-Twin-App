import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

const EMOJI_MAP: Record<string, string> = {
  sad: '😢', happy: '😊', anxious: '😰', lonely: '🥺',
  motivated: '💪', grateful: '🙏', confused: '😕', excited: '🎉',
  neutral: '😌',
};

const COLORS: Record<string, string> = {
  sad: '#FF6B6B', happy: '#FFD93D', anxious: '#C084FC', lonely: '#94A3B8',
  motivated: '#4ADE80', grateful: '#F59E0B', confused: '#A78BFA', excited: '#F472B6',
  neutral: '#8B7BA3',
};

const LABELS: Record<string, { ar: string; en: string }> = {
  sad: { ar: 'حزين', en: 'Sad' },
  happy: { ar: 'سعيد', en: 'Happy' },
  anxious: { ar: 'قلق', en: 'Anxious' },
  lonely: { ar: 'وحيد', en: 'Lonely' },
  motivated: { ar: 'متحفز', en: 'Motivated' },
  grateful: { ar: 'ممتن', en: 'Grateful' },
  confused: { ar: 'مرتبك', en: 'Confused' },
  excited: { ar: 'متحمس', en: 'Excited' },
  neutral: { ar: 'محايد', en: 'Neutral' },
};

const RECOMMENDATIONS: Record<string, { ar: string; en: string }> = {
  sad: { ar: 'جرب المشي أو التحدث مع صديق', en: 'Try walking or talking to a friend' },
  happy: { ar: 'شارك فرحتك مع من تحب', en: 'Share your joy with loved ones' },
  anxious: { ar: 'جرب التنفس العميق أو التأمل', en: 'Try deep breathing or meditation' },
  lonely: { ar: 'تواصل مع شخص تثق به', en: 'Reach out to someone you trust' },
  motivated: { ar: 'استغل طاقتك في هدف جديد', en: 'Channel your energy into a new goal' },
  grateful: { ar: 'اكتب 3 أشياء ممتن لها اليوم', en: 'Write 3 things you are grateful for today' },
  confused: { ar: 'خذ استراحة ورتب أفكارك', en: 'Take a break and organize your thoughts' },
  excited: { ar: 'خطط لخطوتك القادمة بحماس', en: 'Plan your next step with enthusiasm' },
  neutral: { ar: 'يوم متوازن – استمر في روتينك', en: 'A balanced day – keep up your routine' },
};

export default function Mood() {
  const { userId } = useTwinStore();
  const [moods, setMoods] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [dominant, setDominant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('memories')
      .select('emotional_tag')
      .eq('user_id', userId)
      .limit(100)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach(d => {
          if (d.emotional_tag) counts[d.emotional_tag] = (counts[d.emotional_tag] || 0) + 1;
        });
        setMoods(counts);
        const tot = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
        setTotal(tot);
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        setDominant(top?.[0] || null);
        setLoading(false);
      });
  }, [userId]);

  return (
    <ScrollView style={s.container}>
      <Text style={s.header}>{lang === 'ar' ? '📊 لوحة المشاعر' : '📊 Mood Board'}</Text>

      {loading ? (
        <Text style={s.empty}>{lang === 'ar' ? 'تحميل...' : 'Loading...'}</Text>
      ) : Object.keys(moods).length === 0 ? (
        <Text style={s.empty}>
          {lang === 'ar' ? 'تحدث أكثر ليظهر تحليل مشاعرك.' : 'Chat more to see your mood analysis.'}
        </Text>
      ) : (
        <>
          {/* بطاقة المشاعر السائدة */}
          {dominant && (
            <View style={s.card}>
              <Text style={s.cardTitle}>{lang === 'ar' ? 'المشاعر السائدة' : 'Dominant Mood'}</Text>
              <Text style={s.cardEmoji}>{EMOJI_MAP[dominant] || '😌'}</Text>
              <Text style={s.cardLabel}>{LABELS[dominant]?.[lang] || dominant}</Text>
              <Text style={s.cardTip}>{RECOMMENDATIONS[dominant]?.[lang] || ''}</Text>
            </View>
          )}

          {/* قائمة المشاعر */}
          <Text style={s.subheader}>{lang === 'ar' ? 'تفاصيل المشاعر' : 'Mood Details'}</Text>
          {Object.entries(moods).map(([emotion, count]) => (
            <View key={emotion} style={s.row}>
              <Text style={s.emoji}>{EMOJI_MAP[emotion] || '😶'}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={s.label}>{LABELS[emotion]?.[lang] || emotion}</Text>
                  <Text style={s.percent}>{Math.round((count / total) * 100)}%</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.bar, { width: `${(count / total) * 100}%`, backgroundColor: COLORS[emotion] || '#8B7BA3' }]} />
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 22, fontWeight: '700', color: '#1A1226', marginBottom: 20 },
  empty: { color: '#8B7BA3', textAlign: 'center', marginTop: 40, fontSize: 15 },
  card: {
    backgroundColor: '#F8F6F2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  cardTitle: { fontSize: 14, color: '#8B7BA3', marginBottom: 8 },
  cardEmoji: { fontSize: 48, marginBottom: 4 },
  cardLabel: { fontSize: 20, fontWeight: '700', color: '#1A1226', marginBottom: 8 },
  cardTip: { fontSize: 13, color: '#6B5B8A', textAlign: 'center', lineHeight: 18 },
  subheader: { fontSize: 16, fontWeight: '600', color: '#1A1226', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  emoji: { fontSize: 24, width: 40 },
  label: { color: '#1A1226', fontSize: 14, fontWeight: '500' },
  percent: { color: '#8B7BA3', fontSize: 13 },
  barBg: { height: 8, backgroundColor: '#F3F0FF', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
});
