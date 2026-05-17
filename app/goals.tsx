import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

export default function Goals() {
  const { userId } = useTwinStore();
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const fetchGoals = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setGoals(data || []);
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async () => {
    if (!title.trim()) return;
    await supabase.from('goals').insert({
      user_id: userId,
      title: title.trim(),
      description: desc.trim(),
    });
    setTitle('');
    setDesc('');
    fetchGoals();
  };

  const updateProgress = async (id: string, current: number) => {
    const newProgress = Math.min(current + 10, 100);
    await supabase
      .from('goals')
      .update({ progress: newProgress })
      .eq('id', id);
    setGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, progress: newProgress } : g))
    );
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    fetchGoals();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎯 أهدافي</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="هدف جديد"
          placeholderTextColor="#8B7BA3"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="وصف (اختياري)"
          placeholderTextColor="#8B7BA3"
          value={desc}
          onChangeText={setDesc}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addGoal}>
          <Text style={{ color: '#1A1226', fontWeight: 'bold', fontSize: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.goal}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{item.title}</Text>
              <TouchableOpacity onPress={() => deleteGoal(item.id)}>
                <Text style={{ color: '#FF6B6B', fontSize: 16 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{item.progress}%</Text>
            {!item.completed && (
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={() => updateProgress(item.id, item.progress)}
              >
                <Text style={{ color: '#E0AAFF' }}>تحديث +10%</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 22, fontWeight: '700', color: '#1A1226', marginBottom: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  input: { flex: 1, backgroundColor: '#F8F6F2', color: '#1A1226', padding: 10, borderRadius: 8 },
  addBtn: {
    backgroundColor: '#E0AAFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goal: {
    backgroundColor: '#F8F6F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: { color: '#1A1226', fontWeight: '600', fontSize: 16 },
  desc: { color: '#8B7BA3', marginTop: 4 },
  progressBar: {
    height: 6,
    backgroundColor: '#2D1B4D',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#E0AAFF' },
  progressText: { color: '#1A1226', fontSize: 12, marginTop: 4 },
  updateBtn: { marginTop: 8 },
});
