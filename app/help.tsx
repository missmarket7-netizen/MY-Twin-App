import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONTS } from '../utils/theme';

const FAQS = {
  ar: [
    { q: "كيف أنشئ حساباً؟", a: "عند فتح التطبيق لأول مرة، اختر 'إنشاء حساب' وأدخل بريدك الإلكتروني وكلمة مرور." },
    { q: "كيف أستعيد كلمة المرور؟", a: "اذهب إلى شاشة الدخول واضغط 'نسيت كلمة المرور؟' لإعادة تعيينها عبر البريد." },
    { q: "كيف ألغي الاشتراك؟", a: "من الإعدادات > الاشتراكات، اختر 'إلغاء الاشتراك'." },
    { q: "كيف أستخدم الذاكرة؟", a: "التوأم يتذكر تلقائياً محادثاتك المهمة. يمكنك مراجعة الذكريات من القائمة." },
    { q: "كيف أفعل الصوت؟", a: "من تخصيص التوأم > الصوت، فعّل خيار الصوت واختر النوع." },
    { q: "كيف أغير شخصية التوأم؟", a: "من تخصيص التوأم > الشخصية، اختر النمط الذي يناسبك." },
    { q: "ما الفرق بين الباقات؟", a: "باقة Plus تعطيك 1500 توكن يومياً، Premium تمنحك 6000 توكن، Pro 7000، Yearly غير محدودة." },
    { q: "هل يمكنني استرداد المبلغ؟", a: "نعم، خلال 7 أيام من تاريخ الدفع. تواصل مع الدعم." },
  ],
  en: [
    { q: "How do I create an account?", a: "When you open the app, select 'Sign Up' and enter your email and password." },
    { q: "How do I reset my password?", a: "On the login screen, tap 'Forgot password?' to reset via email." },
    { q: "How do I cancel my subscription?", a: "Settings > Subscriptions, choose 'Cancel Subscription'." },
    { q: "How do I use memory?", a: "Your Twin remembers important chats automatically. View memories from the menu." },
    { q: "How do I enable voice?", a: "Customize Twin > Voice, turn on voice and choose the type." },
    { q: "How do I change the Twin's personality?", a: "Customize Twin > Personality, select the style that fits you." },
    { q: "What's the difference between plans?", a: "Plus gives 1500 tokens/day, Premium 6000, Pro 7000, Yearly unlimited." },
    { q: "Can I get a refund?", a: "Yes, within 7 days of payment. Contact support." },
  ],
};

export default function Help() {
  const lang = 'ar';
  const t = FAQS[lang];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{lang === 'ar' ? '❓ المساعدة والدعم' : '❓ Help & Support'}</Text>

      <Text style={styles.sectionTitle}>{lang === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</Text>
      {t.map((faq, i) => (
        <View key={i} style={styles.faqCard}>
          <Text style={styles.question}>{faq.q}</Text>
          <Text style={styles.answer}>{faq.a}</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}</Text>
      <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:support@mytwin.ai')}>
        <Text style={styles.contactText}>📧 support@mytwin.ai</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.contactBtn} onPress={() => router.push('/chat')}>
        <Text style={styles.contactText}>💬 {lang === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportBtn} onPress={() => Alert.alert(lang === 'ar' ? 'شكراً' : 'Thank you', lang === 'ar' ? 'تم استلام تقريرك' : 'Report received')}>
        <Text style={styles.reportBtnText}>{lang === 'ar' ? '🐛 الإبلاغ عن مشكلة' : '🐛 Report an Issue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, marginBottom: 24 },
  sectionTitle: { fontSize: FONTS.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  faqCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  question: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.body, marginBottom: 6 },
  answer: { color: COLORS.textSecondary, fontSize: FONTS.body, lineHeight: 22 },
  contactBtn: { backgroundColor: COLORS.card, padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  contactText: { color: COLORS.text, fontSize: FONTS.body, fontWeight: '500' },
  reportBtn: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  reportBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.body },
});
