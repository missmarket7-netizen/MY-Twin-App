import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

const CONTENT = {
  ar: {
      title: 'سياسة الخصوصية',
          back: '← رجوع',
              sections: [
                    { heading: '1. طبيعة الخدمة', body: 'MyTwin هو رفيق رقمي يعتمد على الذكاء الاصطناعي. ليس بديلاً عن العلاقات البشرية أو الاستشارة النفسية المتخصصة.' },
                          { heading: '2. جمع البيانات', body: 'نقوم بتخزين نصوص المحادثات والتفضيلات الشخصية لتحسين التفاعل العاطفي. لا نبيع بياناتك لأي طرف ثالث، ولا نستخدمها لأغراض إعلانية.' },
                                { heading: '3. التخزين والحذف', body: 'جميع بياناتك مشفرة ومخزنة بشكل آمن. يمكنك تصدير بياناتك أو حذفها نهائياً في أي وقت من خلال الإعدادات.' },
                                      { heading: '4. الحدود الأخلاقية', body: 'نشجع على الاستخدام الصحي للتقنية. نوفر وضع الهدوء وحدود الاستخدام اليومي لمنع الاعتماد المفرط.' },
                                            { heading: '5. الأمان', body: 'نستخدم مصادقة آمنة (Supabase Auth) وقواعد بيانات محمية بسياسات عزل صارمة (RLS). خوادمنا مراقبة على مدار الساعة.' },
                                                ],
                                                  },
                                                    en: {
                                                        title: 'Privacy Policy',
                                                            back: '← Back',
                                                                sections: [
                                                                      { heading: '1. Service Nature', body: 'MyTwin is an AI-powered digital companion. It is not a substitute for human relationships or professional mental health care.' },
                                                                            { heading: '2. Data Collection', body: 'We store conversation texts and preferences to improve emotional interaction. Your data is never sold or shared with third parties.' },
                                                                                  { heading: '3. Storage & Deletion', body: 'All data is encrypted and stored securely. You can export or permanently delete your data at any time from Settings.' },
                                                                                        { heading: '4. Ethical Boundaries', body: 'We encourage healthy technology use. Calm mode and daily usage limits are provided to prevent over-dependence.' },
                                                                                              { heading: '5. Security', body: 'We use secure authentication (Supabase Auth) and strict Row-Level Security (RLS). Our servers are monitored 24/7.' },
                                                                                                  ],
                                                                                                    },
                                                                                                    };

                                                                                                    export default function Privacy() {
                                                                                                      const lang = 'ar'; // يمكنك ربطها بـ useTwinStore لاحقاً
                                                                                                        const t = CONTENT[lang];

                                                                                                          return (
                                                                                                              <ScrollView style={styles.container}>
                                                                                                                    <View style={styles.header}>
                                                                                                                            <TouchableOpacity onPress={() => router.back()}>
                                                                                                                                      <Text style={styles.back}>{t.back}</Text>
                                                                                                                                              </TouchableOpacity>
                                                                                                                                                      <Text style={styles.title}>{t.title}</Text>
                                                                                                                                                            </View>
                                                                                                                                                                  <View style={styles.content}>
                                                                                                                                                                          {t.sections.map((section, i) => (
                                                                                                                                                                                    <View key={i} style={styles.section}>
                                                                                                                                                                                                <Text style={styles.heading}>{section.heading}</Text>
                                                                                                                                                                                                            <Text style={styles.body}>{section.body}</Text>
                                                                                                                                                                                                                      </View>
                                                                                                                                                                                                                              ))}
                                                                                                                                                                                                                                    </View>
                                                                                                                                                                                                                                          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                                                                                                                                                                                                                                                  <Text style={styles.buttonText}>{lang === 'ar' ? 'فهمت وأوافق' : 'I Understand'}</Text>
                                                                                                                                                                                                                                                        </TouchableOpacity>
                                                                                                                                                                                                                                                            </ScrollView>
                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                              const styles = StyleSheet.create({
                                                                                                                                                                                                                                                                container: { flex: 1, backgroundColor: '#0F0A1A' },
                                                                                                                                                                                                                                                                  header: { padding: 20, borderBottomWidth: 1, borderColor: '#1A1226' },
                                                                                                                                                                                                                                                                    back: { color: '#E0AAFF', fontSize: 15, marginBottom: 8 },
                                                                                                                                                                                                                                                                      title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
                                                                                                                                                                                                                                                                        content: { padding: 16, gap: 12 },
                                                                                                                                                                                                                                                                          section: { backgroundColor: '#1A1226', padding: 14, borderRadius: 12 },
                                                                                                                                                                                                                                                                            heading: { color: '#E0AAFF', fontWeight: '600', marginBottom: 6 },
                                                                                                                                                                                                                                                                              body: { color: '#D0B4E0', lineHeight: 22, fontSize: 14 },
                                                                                                                                                                                                                                                                                button: { margin: 20, backgroundColor: '#E0AAFF', padding: 14, borderRadius: 12, alignItems: 'center' },
                                                                                                                                                                                                                                                                                  buttonText: { color: '#0F0A1A', fontWeight: '700' },
                                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                                  