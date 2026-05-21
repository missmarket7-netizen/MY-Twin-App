import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';
import { COLORS, FONTS } from '../utils/theme';
import { router } from 'expo-router';

const TEXTS = {
  ar: { title: '📚 المحادثات السابقة', search: 'بحث...', all: 'الكل', today: 'اليوم', week: 'أسبوع', month: 'شهر', positive: '😊 إيجابي', negative: '😔 سلبي', neutral: '😐 محايد', empty: 'لا توجد محادثات بعد', delete: 'حذف', pin: 'تثبيت', export: 'تصدير', deleteConfirm: 'هل أنت متأكد من حذف هذه المحادثة؟' },
  en: { title: '📚 Chat History', search: 'Search...', all: 'All', today: 'Today', week: 'Week', month: 'Month', positive: '😊 Positive', negative: '😔 Negative', neutral: '😐 Neutral', empty: 'No conversations yet', delete: 'Delete', pin: 'Pin', export: 'Export', deleteConfirm: 'Are you sure you want to delete this chat?' },
};

export default function History() {
  const { userId } = useTwinStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lang = 'ar'; // ستصبح ديناميكية لاحقًا
  const t = TEXTS[lang];

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let query = supabase.from('messages').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('created_at', today);
    } else if (filter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', monthAgo);
    }
    
    if (emotionFilter) {
      query = query.eq('emotion', emotionFilter);
    }
    
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }
    
    const { data } = await query;
    setConversations(data || []);
    setLoading(false);
  }, [userId, filter, emotionFilter, search]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const deleteChat = async (id: string) => {
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: 'إلغاء', style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => { await supabase.from('messages').delete().eq('id', id); fetchConversations(); } },
    ]);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.chatItem}>
      <View style={styles.chatInfo}>
        <Text style={styles.chatDate}>{new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</Text>
        <Text style={styles.chatPreview} numberOfLines={1}>{item.content}</Text>
      </View>
      <View style={styles.chatActions}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/chat', params: { chatId: item.id } })}><Text style={styles.actionIcon}>💬</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => deleteChat(item.id)}><Text style={styles.actionIcon}>🗑️</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      <TextInput style={styles.searchInput} placeholder={t.search} placeholderTextColor={COLORS.textSecondary} value={search} onChangeText={setSearch} />
      <View style={styles.filterRow}>
        {['all', 'today', 'week', 'month'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterActiveText]}>{(t as any)[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={conversations} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 20 }} ListEmptyComponent={<Text style={styles.empty}>{t.empty}</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  searchInput: { backgroundColor: COLORS.card, color: COLORS.text, padding: 12, borderRadius: 12, fontSize: FONTS.body, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.text, fontSize: FONTS.small },
  filterActiveText: { color: COLORS.white },
  chatItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  chatInfo: { flex: 1 },
  chatDate: { color: COLORS.textSecondary, fontSize: FONTS.small, marginBottom: 4 },
  chatPreview: { color: COLORS.text, fontSize: FONTS.body },
  chatActions: { flexDirection: 'row', gap: 16 },
  actionIcon: { fontSize: 20 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: FONTS.body },
});
