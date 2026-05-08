import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Tier, useTwinStore } from '../store/useTwinStore';
import { getOfferings, purchasePackage } from '../lib/revenuecat';

const PLANS: Array<{ id: Tier; name: string; price: string; features: string[] }> = [
  {
      id: 'premium',
          name: 'Premium',
              price: '$19/شهر',
                  features: ['6000 توكن يومي', '150 محادثة', 'ذاكرة 30 يوم', 'ردود صوتية متقدمة'],
                    },
                      {
                          id: 'yearly',
                              name: 'Yearly',
                                  price: '$180/سنة',
                                      features: ['20000 توكن يومي', 'محادثات غير محدودة', 'ذاكرة دائمة', 'مزامنة سحابية كاملة'],
                                        },
                                        ];

                                        export default function Subscription() {
                                          const { tier, updateTier } = useTwinStore();

                                            const handlePurchase = async (planId: Tier) => {
                                                try {
                                                      const offerings = await getOfferings();
                                                            const pkg = offerings?.current?.availablePackages.find((p: any) => p.identifier === planId);
                                                                  if (!pkg) {
                                                                          Alert.alert('غير متوفر', 'هذه الباقة غير متاحة مؤقتاً.');
                                                                                  return;
                                                                                        }
                                                                                              await purchasePackage(pkg);
                                                                                                    updateTier(planId);
                                                                                                          Alert.alert('تم', 'تم تفعيل اشتراكك بنجاح!');
                                                                                                                router.back();
                                                                                                                    } catch (e) {
                                                                                                                          Alert.alert('خطأ', 'فشلت عملية الشراء.');
                                                                                                                              }
                                                                                                                                };

                                                                                                                                  return (
                                                                                                                                      <ScrollView style={styles.container}>
                                                                                                                                            <View style={styles.header}>
                                                                                                                                                    <Text style={styles.title}>اختر خطتك</Text>
                                                                                                                                                          </View>
                                                                                                                                                                {PLANS.map(p => (
                                                                                                                                                                        <TouchableOpacity
                                                                                                                                                                                  key={p.id}
                                                                                                                                                                                            style={[styles.plan, tier === p.id && styles.activePlan]}
                                                                                                                                                                                                      onPress={() => handlePurchase(p.id)}
                                                                                                                                                                                                              >
                                                                                                                                                                                                                        <Text style={styles.planName}>{p.name}</Text>
                                                                                                                                                                                                                                  <Text style={styles.planPrice}>{p.price}</Text>
                                                                                                                                                                                                                                            {p.features.map((f, i) => (
                                                                                                                                                                                                                                                        <Text key={i} style={styles.feature}>• {f}</Text>
                                                                                                                                                                                                                                                                  ))}
                                                                                                                                                                                                                                                                            <View style={styles.selectBtn}>
                                                                                                                                                                                                                                                                                        <Text style={styles.selectBtnText}>{tier === p.id ? 'مفعل' : 'اشتراك'}</Text>
                                                                                                                                                                                                                                                                                                  </View>
                                                                                                                                                                                                                                                                                                          </TouchableOpacity>
                                                                                                                                                                                                                                                                                                                ))}
                                                                                                                                                                                                                                                                                                                    </ScrollView>
                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                      const styles = StyleSheet.create({
                                                                                                                                                                                                                                                                                                                        container: { flex: 1, backgroundColor: '#0F0A1A' },
                                                                                                                                                                                                                                                                                                                          header: { padding: 20 },
                                                                                                                                                                                                                                                                                                                            title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
                                                                                                                                                                                                                                                                                                                              plan: { backgroundColor: '#1A1226', padding: 16, borderRadius: 14, margin: 12, borderWidth: 1, borderColor: '#2D1B4D' },
                                                                                                                                                                                                                                                                                                                                activePlan: { borderColor: '#E0AAFF' },
                                                                                                                                                                                                                                                                                                                                  planName: { color: '#FFF', fontSize: 18, fontWeight: '700' },
                                                                                                                                                                                                                                                                                                                                    planPrice: { fontSize: 22, fontWeight: '800', color: '#E0AAFF', marginBottom: 8 },
                                                                                                                                                                                                                                                                                                                                      feature: { color: '#D0B4E0', marginBottom: 4 },
                                                                                                                                                                                                                                                                                                                                        selectBtn: { backgroundColor: '#E0AAFF', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
                                                                                                                                                                                                                                                                                                                                          selectBtnText: { color: '#1A1226', fontWeight: '700' },
                                                                                                                                                                                                                                                                                                                                          });
                                                                                                                                                                                                                                                                                                                                          