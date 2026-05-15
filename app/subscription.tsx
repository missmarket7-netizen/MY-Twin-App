import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Tier, useTwinStore } from '../store/useTwinStore';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat';

const PLANS: Array<{ id: Tier; name: string; price: string; features: string[] }> = [
  {
    id: 'premium',
    name: 'Premium',
    price: '$19/شهر',
    features: [
      '2000 توكن يومي',
      '100 محادثات يومية',
      'وضع صوتي متقدم',
      'ذكريات 30 يوم',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$89/6 أشهر',
    features: [
      '5000 توكن يومي',
      '300 محادثة يومية',
      'دعم مميز وإشعارات ذكية',
      'تخزين طويل الأمد',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$199/سنة',
    features: [
      '10000 توكن يومي',
      'محادثات غير محدودة',
      'تذكير ذكي ودعم كامل',
      'أقصى سرعة استجابات وصوتية',
    ],
  },
];

export default function Subscription() {
  const { tier, updateTier } = useTwinStore();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (planId: Tier) => {
    setLoading(true);
    try {
      const offerings = await getOfferings();

      // ✅ إصلاح: استخدام availablePackages من الـ offering مباشرة
      const packages = offerings?.availablePackages ?? [];
      const pkg = packages.find((p: any) =>
        p.identifier === planId ||
        p.product?.identifier?.toLowerCase().includes(planId) ||
        p.package?.identifier === planId
      );

      if (!pkg) {
        Alert.alert('غير متوفر', 'هذه الباقة غير متاحة مؤقتاً.');
        return;
      }

      const result = await purchasePackage(pkg);

      if (result.success) {
        updateTier(planId);
        Alert.alert('تم! 🎉', 'تم تفعيل اشتراكك بنجاح!');
        router.back();
      } else if (result.error !== 'cancelled') {
        Alert.alert('خطأ', 'فشلت عملية الشراء. حاول مجدداً.');
      }
    } catch (e) {
      Alert.alert('خطأ', 'فشلت عملية الشراء.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      if (result.success && result.customerInfo) {
        Alert.alert('تم', 'تم استعادة اشتراكك بنجاح!');
      } else {
        Alert.alert('تنبيه', 'لم يتم العثور على اشتراك سابق.');
      }
    } catch {
      Alert.alert('خطأ', 'فشلت استعادة الاشتراك.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <Text style={s.title}>اختر خطتك 💜</Text>
        <Text style={s.subtitle}>ارقِ تجربتك مع توأمك الرقمي</Text>
      </View>

      {PLANS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={[s.plan, tier === p.id && s.activePlan]}
          onPress={() => handlePurchase(p.id)}
          activeOpacity={0.8}
          disabled={loading}
        >
          {p.id === 'yearly' && (
            <View style={s.badge}>
              <Text style={s.badgeText}>الأفضل قيمة</Text>
            </View>
          )}
          <Text style={s.planName}>{p.name}</Text>
          <Text style={s.planPrice}>{p.price}</Text>
          {p.features.map((f, i) => (
            <Text key={i} style={s.feature}>• {f}</Text>
          ))}
          <View style={[s.selectBtn, tier === p.id && s.activeBtn]}>
            {loading ? (
              <ActivityIndicator color="#1A1226" />
            ) : (
              <Text style={s.selectBtnText}>
                {tier === p.id ? '✓ مفعّل' : 'اشتراك الآن'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={loading}>
        <Text style={s.restoreText}>استعادة الاشتراك</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0A1A' },
  header: { padding: 24, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8B7BA3', textAlign: 'center', marginTop: 8 },
  plan: {
    backgroundColor: '#1A1226',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D1B4D',
  },
  activePlan: { borderColor: '#E0AAFF', borderWidth: 2 },
  badge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  planName: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  planPrice: { fontSize: 24, fontWeight: '800', color: '#E0AAFF', marginBottom: 12 },
  feature: { color: '#D0B4E0', marginBottom: 6, fontSize: 14 },
  selectBtn: {
    backgroundColor: '#E0AAFF',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  activeBtn: { backgroundColor: '#7C3AED' },
  selectBtnText: { color: '#1A1226', fontWeight: '700', fontSize: 15 },
  restoreBtn: { alignItems: 'center', padding: 16 },
  restoreText: { color: '#8B7BA3', fontSize: 14 },
});
