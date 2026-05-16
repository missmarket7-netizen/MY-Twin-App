import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Tier, useTwinStore } from '../store/useTwinStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getTierFromCustomerInfo,
} from '../lib/revenuecat';

const FREE_TOKENS_EARLY = 1500;
const FREE_TOKENS_LATER = 700;
const FREE_CONVERSATIONS = 50;
const FREE_MEMORY_DAYS = 3;

const PLANS: Array<{ id: Tier; name: string; price: string; features: string[]; popular?: boolean }> = [
  {
    id: 'free',
    name: 'Free',
    price: '$0 للأبد',
    features: [
      `🔥 أول أسبوعين: ${FREE_TOKENS_EARLY} توكن يومي`,
      `📅 بعد الأسبوعين: ${FREE_TOKENS_LATER} توكن يومي`,
      `💬 ${FREE_CONVERSATIONS} محادثة يومية`,
      `🧠 ذاكرة ${FREE_MEMORY_DAYS} أيام`,
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19 / شهر',
    popular: true,
    features: [
      '🎁 7 أيام تجربة مجانية',
      '⚡ أول 5 أيام: 2000 توكن يومي',
      '💰 بعد الاشتراك: 3000 توكن يومي',
      '💬 100 محادثة يومية',
      '🎙️ وضع صوتي متقدم',
      '🧠 ذاكرة 30 يوم',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$89 / 6 أشهر',
    features: [
      '5000 توكن يومي',
      '300 محادثة يومية',
      '🎯 دعم مميز وإشعارات ذكية',
      '🧠 تخزين طويل الأمد',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$199 / سنة',
    features: [
      '10000 توكن يومي',
      '∞ محادثات غير محدودة',
      '🤖 تذكير ذكي ودعم كامل',
      '⚡ أقصى سرعة استجابة وصوتية',
    ],
  },
];

export default function Subscription() {
  const { tier, updateTier } = useTwinStore();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (planId: Tier) => {
    if (loading) return;
    if (planId === 'free') {
      Alert.alert('Free', 'أنت بالفعل على الباقة المجانية.');
      return;
    }

    setLoading(true);
    try {
      // ✅ getOfferings ترجع PurchasesOffering | null (هو current)
      const offering = await getOfferings();
      const packages = offering?.availablePackages ?? [];

      // ✅ مطابقة آمنة – تحويل إلى نص صغير ومقارنة
      const pkg = packages.find((p: any) => {
        const id = String(p.identifier ?? '').toLowerCase();
        const prodId = String(p.product?.identifier ?? '').toLowerCase();
        const target = planId.toLowerCase();
        return id.includes(target) || prodId.includes(target);
      });

      if (!pkg) {
        Alert.alert('غير متوفر', 'هذه الباقة غير متاحة مؤقتاً. حاول مجدداً لاحقاً.');
        return;
      }

      // ✅ فحص success واستخدام customerInfo
      const result = await purchasePackage(pkg);
      if (result.success && result.customerInfo) {
        const actualTier = getTierFromCustomerInfo(result.customerInfo) as Tier;
        updateTier(actualTier);
        Alert.alert('تم! 🎉', 'تم تفعيل اشتراكك بنجاح!');
        router.back();
      } else if (result.error !== 'cancelled') {
        Alert.alert('خطأ', 'فشلت عملية الشراء. حاول مجدداً.');
      }
    } catch (e: any) {
      if (!e?.message?.includes('cancelled') && e?.code !== 'cancelled') {
        Alert.alert('خطأ', 'فشلت عملية الشراء. تأكد من اتصالك وحاول مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // ✅ فحص success واستخدام customerInfo
      const result = await restorePurchases();
      if (result.success && result.customerInfo) {
        const actualTier = getTierFromCustomerInfo(result.customerInfo) as Tier;
        updateTier(actualTier);
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
          {p.popular && (
            <View style={s.badge}>
              <Text style={s.badgeText}>الأفضل قيمة</Text>
            </View>
          )}
          <Text style={s.planName}>{p.name}</Text>
          <Text style={s.planPrice}>{p.price}</Text>
          {p.features.map((f) => (
            <Text key={f} style={s.feature}>• {f}</Text>
          ))}
          <View style={[s.selectBtn, tier === p.id && s.activeBtn]}>
            {loading ? (
              <ActivityIndicator color="#F8F6F2" />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 24, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8B7BA3', textAlign: 'center', marginTop: 8 },
  plan: {
    backgroundColor: '#F8F6F2',
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
  selectBtnText: { color: '#F8F6F2', fontWeight: '700', fontSize: 15 },
  restoreBtn: { alignItems: 'center', padding: 16 },
  restoreText: { color: '#8B7BA3', fontSize: 14 },
});
