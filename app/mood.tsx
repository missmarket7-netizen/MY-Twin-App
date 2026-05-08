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

            export default function Mood() {
              const { userId } = useTwinStore();
                const [moods, setMoods] = useState<Record<string, number>>({});
                  const [loading, setLoading] = useState(true);

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
                                                                                                            setLoading(false);
                                                                                                                  });
                                                                                                                    }, [userId]);

                                                                                                                      const total = Object.values(moods).reduce((a, b) => a + b, 0) || 1;

                                                                                                                        return (
                                                                                                                            <ScrollView style={styles.container}>
                                                                                                                                  <Text style={styles.header}>📊 لوحة المشاعر</Text>
                                                                                                                                        {loading ? (
                                                                                                                                                <Text style={styles.empty}>تحميل...</Text>
                                                                                                                                                      ) : Object.keys(moods).length === 0 ? (
                                                                                                                                                              <Text style={styles.empty}>تحدث أكثر ليظهر تحليل مشاعرك.</Text>
                                                                                                                                                                    ) : (
                                                                                                                                                                            Object.entries(moods).map(([emotion, count]) => (
                                                                                                                                                                                      <View key={emotion} style={styles.row}>
                                                                                                                                                                                                  <Text style={styles.emoji}>{EMOJI_MAP[emotion] || '😶'}</Text>
                                                                                                                                                                                                              <Text style={styles.label}>{emotion}</Text>
                                                                                                                                                                                                                          <View style={styles.barBg}>
                                                                                                                                                                                                                                        <View style={[styles.bar, { width: `${(count / total) * 100}%`, backgroundColor: COLORS[emotion] || '#8B7BA3' }]} />
                                                                                                                                                                                                                                                    </View>
                                                                                                                                                                                                                                                                <Text style={styles.count}>{count}</Text>
                                                                                                                                                                                                                                                                          </View>
                                                                                                                                                                                                                                                                                  ))
                                                                                                                                                                                                                                                                                        )}
                                                                                                                                                                                                                                                                                            </ScrollView>
                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                              const styles = StyleSheet.create({
                                                                                                                                                                                                                                                                                                container: { flex: 1, backgroundColor: '#0F0A1A', padding: 20 },
                                                                                                                                                                                                                                                                                                  header: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 20 },
                                                                                                                                                                                                                                                                                                    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
                                                                                                                                                                                                                                                                                                      emoji: { fontSize: 22, width: 35 },
                                                                                                                                                                                                                                                                                                        label: { width: 80, color: '#D0B4E0', fontSize: 13 },
                                                                                                                                                                                                                                                                                                          barBg: { flex: 1, height: 10, backgroundColor: '#2D1B4D', borderRadius: 5, marginHorizontal: 8, overflow: 'hidden' },
                                                                                                                                                                                                                                                                                                            bar: { height: '100%', borderRadius: 5 },
                                                                                                                                                                                                                                                                                                              count: { width: 30, color: '#8B7BA3', textAlign: 'right' },
                                                                                                                                                                                                                                                                                                                empty: { color: '#8B7BA3', textAlign: 'center', marginTop: 30 },
                                                                                                                                                                                                                                                                                                                });
                                                                                                                                                                                                                                                                                                                