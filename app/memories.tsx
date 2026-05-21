import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';
import { COLORS, FONTS } from '../utils/theme';

const TEXTS = {
  ar: {
    title: '🧠 الذكريات',
    search: 'بحث في الذكريات...',
    all: 'الكل',
    episodic: '📝 عرضية',
    semantic: '💡 دلالية',
    emotional: '❤️ عاطفية',
    procedural: '🔧 إجرائية',
    prospective: '🔮 مستقبلية',
    empty: 'لا توجد ذكريات بعد',
    delete: 'حذف',
    importance: 'الأهمية',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    deleteConfirm: 'هل أنت متأكد من حذف هذه الذكرى؟',
    memoryTypes: {
      episodic: 'أحداث ومحادثات مهمة',
      semantic: 'حقائق عنك وتفضيلاتك',
      emotional: 'مواقف عاطفية مؤثرة',
      procedural: 'مهارات وعادات وروتين',
      prospective: 'خطط وأهداف مستقبلية',
    },
  },
  en: {
    title: '🧠 Memories',
    search: 'Search memories...',
    all: 'All',
    episodic: '📝 Episodic',
    semantic: '💡 Semantic',
    emotional: '❤️ Emotional',
    procedural: '🔧 Procedural',
    prospective: '🔮 Prospective',
    empty: 'No memories yet',
    delete: 'Delete',
    importance: 'Importance',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    deleteConfirm: 'Are you sure you want to delete this memory?',
    memoryTypes: {
      episodic: 'Important events & conversations',
      semantic: 'Facts & preferences about you',
      emotional: 'Emotionally impactful moments',
      procedural: 'Skills, habits & routines',
      prospective: 'Future plans & goals',
    },
  },
};

const MEMORY_TYPES = [
  { key: 'all', icon: '📋' },
  { key: 'episodic', icon: '📝' },
  { key: 'semantic', icon: '💡' },
  { key: 'emotional', icon: '❤️' },
  { key: 'procedural', icon: '🔧' },
  { key: 'prospective', icon: '🔮' },
];

const IMPORTANCE_COLORS: Record<string, string> = {
  low: COLORS.success,
  medium: COLORS.gold,
  high: COLORS.rose || '#EF4444',
};

export default function Memories() {
  const { userId } = useTwinStore();
  const [memories, setMemories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const lang = 'ar';
  const t = TEXTS[lang];

  const fetchMemories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let query = supabase.from('memories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    
    if (filter !== 'all') {
      query = query.eq('memory_type', filter);
    }
    
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }
    
    const { data } = await query;
    setMemories(data || []);
    setLoading(false);
  }, [userId, filter, search]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const deleteMemory = async (id: string) => {
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => { await supabase.from('memories').delete().eq('id', id); fetchMemories(); } },
    ]);
  };

  const getImportanceLabel = (score: number) => {
    if (score >= 0.7) return t.high;
    if (score >= 0.4) return t.medium;
    return t.low;
  };

  const getImportanceKey = (score: number): string => {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  const renderItem = ({ item }: any) => {
    const impKey = getImportanceKey(item.importance_score || 0.5);
    const impColor = IMPORTANCE_COLORS[impKey];
    
    return (
      <View style={styles.memoryCard}>
        <View style={styles.memoryHeader}>
          <View style={[styles.memoryTypeBadge, { backgroundColor: COLORS.primary + '20' }]}>
            <Text style={styles.memoryTypeIcon}>{MEMORY_TYPES.find(mt => mt.key === (item.memory_type || 'episodic'))?.icon || '📝'}</Text>
          </View>
          <View style={[styles.importanceBadge, { borderColor: impColor }]}>
            <Text style={[styles.importanceText, { color: impColor }]}>{getImportanceLabel(item.importance_score || 0.5)}</Text>
          </View>
          {item.emotion_tag && (
            <View style={[styles.emotionBadge]}>
              <Text style={styles.emotionText}>{item.emotion_tag}</Text>
            </View>
          )}
        </View>
        <Text style={styles.memoryContent}>{item.content}</Text>
        <View style={styles.memoryFooter}>
          <Text style={styles.memoryDate}>{new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</Text>
          <TouchableOpacity onPress={() => deleteMemory(item.id)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      
      {/* شريط البحث */}
      <TextInput style={styles.searchInput} placeholder={t.search} placeholderTextColor={COLORS.textSecondary} value={search} onChangeText={setSearch} />
      
      {/* تبويبات أنواع الذاكرة */}
      <FlatList
        horizontal
        data={MEMORY_TYPES}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ marginBottom: 16, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterBtn, filter === item.key && styles.filterActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterActiveText]}>
              {item.icon} {(t as any)[item.key] || item.key}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* قائمة الذكريات */}
      <FlatList
        data={memories}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>{t.empty}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  searchInput: { backgroundColor: COLORS.card, color: COLORS.text, padding: 12, borderRadius: 12, fontSize: FONTS.body, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.text, fontSize: FONTS.small },
  filterActiveText: { color: COLORS.white },
  memoryCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  memoryTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  memoryTypeIcon: { fontSize: 14 },
  importanceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  importanceText: { fontSize: FONTS.tiny, fontWeight: '600' },
  emotionBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  emotionText: { color: COLORS.primary, fontSize: FONTS.tiny },
  memoryContent: { color: COLORS.text, fontSize: FONTS.body, lineHeight: 22, marginBottom: 10 },
  memoryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memoryDate: { color: COLORS.textSecondary, fontSize: FONTS.tiny },
  deleteIcon: { fontSize: 18 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontSize: FONTS.body },
});
