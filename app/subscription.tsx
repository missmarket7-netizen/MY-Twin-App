import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Tier, useTwinStore } from '../store/useTwinStore';

const PLANS: Array<{ id: Tier; name: string; price: string; features: string[]; popular?: boolean }> = [
  { id: 'free', name: 'Free', price: '$0 للأبد', features: ['1500 توكن يومي', '50 محادثة', 'ذاكرة 3 أيام'] },
  { id: 'premium', name: 'Premium', price: '$19 / شهر', popular: true, features: ['3000 توكن يومي', '100 محادثة', 'ذاكرة 30 يوم', 'صوت متقدم'] },
  { id: 'pro', name: 'Pro', price: '$89 / 6 أشهر', features: ['5000 توكن يومي', '300 محادثة', 'تخزين طويل الأمد'] },
  { id: 'yearly', name: 'Yearly', price: '$199 / سنة', features: ['10000 توكن يومي', '∞ محادثات', 'ذاكرة دائمة', 'أقصى سرعة'] },
];

export default function Subscription() {
  const { tier, updateTier } = useTwinStore();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (planId: Tier) => {
    if (loading) return;
    if (planId === 'free') { Alert.alert('Free', 'أنت بالفعل على الباقة المجانية.'); return; }
    setLoading(true);
    try { updateTier(planId); Alert.alert('تم', 'تم تفعيل اشتراكك!'); router.back(); }
    catch { Alert.alert('خطأ', 'فشل التفعيل.'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>اختر خطتك 💜</Text>
      {PLANS.map(p => (
        <TouchableOpacity key={p.id} style={[s.plan, tier === p.id && s.active]} onPress={() => handlePurchase(p.id)} disabled={loading}>
          {p.popular && <View style={s.badge}><Text style={s.badgeText}>الأفضل</Text></View>}
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.price}>{p.price}</Text>
          {p.features.map((f, i) => <Text key={i} style={s.feat}>• {f}</Text>)}
          <View style={s.btn}>{loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>{tier === p.id ? 'مفعّل' : 'اشتراك'}</Text>}</View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1226', marginBottom: 16, textAlign: 'center' },
  plan: { backgroundColor: '#F8F6F2', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E0D9F5' },
  active: { borderColor: '#5B4AE0', borderWidth: 2 },
  badge: { backgroundColor: '#5B4AE0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: '#1A1226', fontSize: 11, fontWeight: '600' },
  name: { color: '#1A1226', fontSize: 18, fontWeight: '700' },
  price: { fontSize: 22, fontWeight: '800', color: '#5B4AE0', marginBottom: 8 },
  feat: { color: '#6B5B8A', marginBottom: 4 },
  btn: { backgroundColor: '#5B4AE0', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#1A1226', fontWeight: '700' },
});
