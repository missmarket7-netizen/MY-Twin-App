import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { Tier, useTwinStore } from '../store/useTwinStore';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PurchasesPackage,
  CustomerInfo,
} from '../lib/revenuecat';
import { COLORS, FONTS } from '../utils/theme';

type Plan = {
  id: Tier;
  name: string;
  price: string;
  originalPrice: string;
  period: string;
  trialDays: number;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'plus',
    name: 'Plus',
    price: '$9',
    originalPrice: '$15',
    period: '/شهر',
    trialDays: 0,
    features: [
      '1,500 توكن يومي',
      '50 محادثة يومية',
      'ذاكرة 3 أيام',
      '📷 3 صور يومياً',
      '📁 2 ملف يومياً',
      '🎙️ مايك مفتوح',
      '🔔 3-5 إشعارات يومية',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19',
    originalPrice: '$25',
    period: '/شهر',
    trialDays: 5,
    features: [
      '4,000 توكن يومي',
      '150 محادثة يومية',
      'ذاكرة 30 يوم',
      '📷 5 صور يومياً',
      '📁 5 ملفات يومياً',
      '🎙️ مايك وتحدث',
      '📸 2 كاميرا يومياً',
      '🔔 3-7 إشعارات يومية',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$110',
    originalPrice: '$150',
    period: '/6 أشهر',
    trialDays: 7,
    features: [
      '7,000 توكن يومي',
      '300 محادثة يومية',
      'ذاكرة 90 يوم',
      '📷 9 صور يومياً',
      '📁 7 ملفات يومياً',
      '🎙️ مايك وتحدث',
      '📸 كاميرا مفتوحة',
      '🔔 3-7 إشعارات يومية',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$199',
    originalPrice: '$300',
    period: '/سنة',
    trialDays: 14,
    popular: true,
    features: [
      '15,000 توكن يومي',
      '∞ محادثات غير محدودة',
      'ذاكرة دائمة',
      '📷 صور غير محدودة',
      '📁 ملفات غير محدودة',
      '🎙️ مايك وتحدث',
      '📸 كاميرا مفتوحة',
      '🔔 5-10 إشعارات يومية',
    ],
  },
];

export default function Subscription() {
  const { tier, updateTier } = useTwinStore();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<PurchasesPackage[] | null>(null);

  const findPackage = useCallback(
    (planId: Tier, availablePackages: PurchasesPackage[]) => {
      return availablePackages.find((pkg) => pkg.identifier === planId);
    },
    []
  );

  const syncSubscriptionStatus = useCallback(
    (customerInfo: CustomerInfo) => {
      const activeEntitlements = Object.keys((customerInfo as any).entitlements?.active);
      const entitlementToTier: Record<string, Tier> = {
        plus: 'plus',
        premium: 'premium',
        pro: 'pro',
        yearly: 'yearly',
      };
      for (const entitlement of activeEntitlements) {
        const mappedTier = entitlementToTier[entitlement];
        if (mappedTier) {
          updateTier(mappedTier);
          return true;
        }
      }
      return false;
    },
    [updateTier]
  );

  const handlePurchase = async (plan: Plan) => {
    if (loadingPlanId) return;
    setLoadingPlanId(plan.id);
    try {
      let packages = offerings;
      if (!packages) {
        const offeringsResult = await getOfferings();
        packages = offeringsResult?.availablePackages ?? [];
        setOfferings(packages);
      }
      const pkg = findPackage(plan.id, packages);
      if (!pkg) {
        Alert.alert('غير متوفر', 'هذه الباقة غير متاحة حالياً.');
        return;
      }
      const { customerInfo } = await purchasePackage(pkg);
      if (customerInfo) {
        syncSubscriptionStatus(customerInfo);
        Alert.alert('تم التفعيل! 🎉', `تم تفعيل باقة ${plan.name} بنجاح!`);
        router.back();
      }
    } catch (error: any) {
      if (error.userCancelled) return;
      Alert.alert('خطأ', error.message || 'فشلت عملية الشراء.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleRestore = async () => {
    if (loadingPlanId) return;
    setLoadingPlanId('restore');
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo && Object.keys((customerInfo as any).entitlements?.active).length > 0) {
        syncSubscriptionStatus(customerInfo);
        Alert.alert('تم', 'تم استعادة اشتراكك بنجاح!');
      } else {
        Alert.alert('تنبيه', 'لم يتم العثور على اشتراك سابق.');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشلت استعادة الاشتراك.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const isLoading = (id: string) => loadingPlanId === id;
  const anyLoading = loadingPlanId !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>اختر خطتك 💜</Text>
        <Text style={styles.subtitle}>ارفع مستوى تجربتك مع توأمك الرقمي</Text>
      </View>

      {PLANS.map((plan) => {
        const active = tier === plan.id;
        const loading = isLoading(plan.id);
        return (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.plan,
              active && styles.activePlan,
              plan.popular && styles.popularPlan,
            ]}
            onPress={() => handlePurchase(plan)}
            activeOpacity={0.85}
            disabled={anyLoading}
          >
            {plan.popular && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>الأفضل قيمة ⭐</Text>
              </View>
            )}
            {plan.trialDays > 0 && !active && (
              <View style={[styles.badge, styles.trialBadge]}>
                <Text style={[styles.badgeText, styles.trialBadgeText]}>تجربة {plan.trialDays} يوم</Text>
              </View>
            )}
            {plan.originalPrice !== plan.price && !active && (
              <View style={[styles.badge, styles.discountBadge]}>
                <Text style={[styles.badgeText, styles.discountBadgeText]}>
                  وفر {Math.round((1 - parseInt(plan.price.replace(/\D/g,'')) / parseInt(plan.originalPrice.replace(/\D/g,''))) * 100)}%
                </Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              {plan.originalPrice !== plan.price && (
                <Text style={styles.originalPrice}>بدلاً من {plan.originalPrice}{plan.period}</Text>
              )}
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.feature}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.selectBtn, active && styles.activeBtn]}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.selectBtnText}>{active ? '✓ مفعّل حالياً' : 'اشتراك الآن'}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={anyLoading}>
        <Text style={styles.restoreText}>استعادة الاشتراك السابق</Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>يمكنك الإلغاء في أي وقت. الاشتراك يتجدد تلقائياً.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 40, paddingTop: 8 },
  header: { padding: 24, paddingTop: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  plan: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  activePlan: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: '#F3F0FF' },
  popularPlan: { borderColor: COLORS.gold, borderWidth: 2 },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  trialBadge: { backgroundColor: COLORS.success, marginTop: 4 },
  trialBadgeText: { color: COLORS.white },
  discountBadge: { backgroundColor: COLORS.gold, marginTop: 4 },
  discountBadgeText: { color: COLORS.text },
  planHeader: { marginBottom: 16 },
  planName: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  planPeriod: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '500', marginLeft: 4 },
  originalPrice: { fontSize: 14, color: COLORS.textSecondary, textDecorationLine: 'line-through', marginTop: 4 },
  featuresList: { marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureIcon: { color: COLORS.success, fontSize: 14, fontWeight: '700', marginRight: 8, width: 20 },
  feature: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 },
  selectBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  activeBtn: { backgroundColor: COLORS.success },
  selectBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  restoreBtn: { alignItems: 'center', padding: 16, marginTop: 8, minHeight: 48, justifyContent: 'center' },
  restoreText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' },
  footerNote: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, marginTop: 16, marginHorizontal: 24, lineHeight: 18 },
});
