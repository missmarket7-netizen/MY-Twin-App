import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

const CONTENT = {
  ar: {
    title: 'سياسة الخصوصية',
    back: '← رجوع',
    lastUpdated: 'آخر تحديث: 2025',
    sections: [
      {
        heading: '1. طبيعة الخدمة',
        body: 'MyTwin هو رفيق رقمي يعتمد على الذكاء الاصطناعي. ليس بديلاً عن العلاقات البشرية أو الاستشارة النفسية المتخصصة.',
      },
      {
        heading: '2. جمع البيانات',
        body: 'نقوم بتخزين نصوص المحادثات والتفضيلات الشخصية لتحسين التفاعل العاطفي. لا نبيع بياناتك لأي طرف ثالث، ولا نستخدمها لأغراض إعلانية.',
      },
      {
        heading: '3. التخزين والحذف',
        body: 'جميع بياناتك مشفرة ومخزنة بشكل آمن. يمكنك تصدير بياناتك أو حذفها نهائياً في أي وقت من خلال الإعدادات.',
      },
      {
        heading: '4. الحدود الأخلاقية',
        body: 'نشجع على الاستخدام الصحي للتقنية. نوفر وضع الهدوء وحدود الاستخدام اليومي لمنع الاعتماد المفرط.',
      },
      {
        heading: '5. الأمان',
        body: 'نستخدم مصادقة آمنة (Supabase Auth) وقواعد بيانات محمية بسياسات عزل صارمة (RLS). خوادمنا مراقبة على مدار الساعة.',
      },
      {
        heading: '6. التواصل',
        body: 'لأي استفسارات حول الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: privacy@mytwin.app',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    back: '← Back',
    lastUpdated: 'Last updated: 2025',
    sections: [
      {
        heading: '1. Service Nature',
        body: 'MyTwin is an AI-powered digital companion. It is not a substitute for human relationships or professional mental health care.',
      },
      {
        heading: '2. Data Collection',
        body: 'We store conversation texts and preferences to improve emotional interaction. Your data is never sold or shared with third parties.',
      },
      {
        heading: '3. Storage & Deletion',
        body: 'All data is encrypted and stored securely. You can export or permanently delete your data at any time from Settings.',
      },
      {
        heading: '4. Ethical Boundaries',
        body: 'We encourage healthy technology use. Calm mode and daily usage limits are provided to prevent over-dependence.',
      },
      {
        heading: '5. Security',
        body: 'We use secure authentication (Supabase Auth) and strict Row-Level Security (RLS). Our servers are monitored 24/7.',
      },
      {
        heading: '6. Contact',
        body: 'For any privacy inquiries, contact us at: privacy@mytwin.app',
      },
    ],
  },
};

export default function Privacy() {
  const lang = 'ar';
  const t = CONTENT[lang];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t.title}</Text>
        <Text style={s.lastUpdated}>{t.lastUpdated}</Text>
      </View>

      {/* Content */}
      <View style={s.content}>
        {t.sections.map((section, i) => (
          <View key={i} style={s.section}>
            <Text style={s.heading}>{section.heading}</Text>
            <Text style={s.body}>{section.body}</Text>
          </View>
        ))}
      </View>

      {/* Accept Button */}
      <TouchableOpacity style={s.button} onPress={() => router.back()} activeOpacity={0.8}>
        <Text style={s.buttonText}>{lang === 'ar' ? 'فهمت وأوافق' : 'I Understand'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0FF',
    marginBottom: 16,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    color: '#5B4AE0',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1226',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#A09BB5',
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  section: {
    backgroundColor: '#F8F6F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  heading: {
    color: '#5B4AE0',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  body: {
    color: '#1A1226',
    lineHeight: 22,
    fontSize: 14,
  },
  button: {
    margin: 20,
    backgroundColor: '#5B4AE0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1A1226',
    fontWeight: '700',
    fontSize: 16,
  },
});
