import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

const TEXTS = {
  ar: {
    header: '📅 خط الذكريات',
    loading: 'تحميل...',
    empty: 'لا توجد ذكريات بعد.\nتحدث مع توأمك لإنشاء أول ذكرى!',
    important: '⭐ ذكرى مهمة',
    today: 'اليوم',
    yesterday: 'أمس',
  },
  en: {
    header: '📅 Memory Timeline',
    loading: 'Loading...',
    empty: 'No memories yet.\nChat with your twin to create your first memory!',
    important: '⭐ Important Memory',
    today: 'Today',
    yesterday: 'Yesterday',
  },
};

function formatDate(iso: string, lang: 'ar' | 'en'): string {
  const t = TEXTS[lang];
  const now = new Date();
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return `${t.today} ${date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (days === 1) return t.yesterday;

  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Timeline() {
  const { userId } = useTwinStore();
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lang: 'ar' | 'en' = 'ar';
  const t = TEXTS[lang];

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('memories')
      .select('id, content, created_at, emotional_tag, importance_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setMemories(data || []);
        setLoading(false);
      });
  }, [userId]);

  return (
    <FlatList
      style={styles.container}
      data={memories}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Text style={styles.header}>{t.header}</Text>}
      ListEmptyComponent={
        loading ? (
          <Text style={styles.empty}>{t.loading}</Text>
        ) : (
          <Text style={styles.empty}>{t.empty}</Text>
        )
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.tagRow}>
            {item.emotional_tag && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.emotional_tag}</Text>
              </View>
            )}
            <Text style={styles.date}>{formatDate(item.created_at, lang)}</Text>
          </View>
          <Text style={styles.content}>{item.content}</Text>
          {item.importance_score > 0.7 && (
            <Text style={styles.star}>{t.important}</Text>
          )}
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1226',
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#F8F6F2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  tagText: {
    color: '#5B4AE0',
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    color: '#8B7BA3',
    fontSize: 11,
  },
  content: {
    color: '#1A1226',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  star: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  empty: {
    color: '#8B7BA3',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    lineHeight: 22,
  },
});
