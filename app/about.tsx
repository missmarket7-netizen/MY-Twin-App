import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

export default function About() {
  const lang = 'ar';
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{lang === 'ar' ? 'ℹ️ عن التطبيق' : 'ℹ️ About'}</Text>

      {/* معلومات الإصدار */}
      <View style={styles.card}>
        <Text style={styles.label}>{lang === 'ar' ? 'الإصدار' : 'Version'}</Text>
        <Text style={styles.value}>v6.3.0</Text>
        <Text style={styles.label}>{lang === 'ar' ? 'آخر تحديث' : 'Last Updated'}</Text>
        <Text style={styles.value}>2026</Text>
      </View>

      {/* الفريق */}
      <Text style={styles.sectionTitle}>{lang === 'ar' ? 'الفريق' : 'Team'}</Text>
      <View style={styles.card}>
        <Text style={styles.companyName}>Soul Sync Ltd.</Text>
        <Text style={styles.companyDesc}>{lang === 'ar' ? 'شركة ذكاء اصطناعي رائدة تهدف إلى القضاء على الوحدة الرقمية من خلال رفيق ذكي يتفهمك حقاً.' : 'A leading AI company dedicated to eradicating digital loneliness through intelligent companions that truly understand you.'}</Text>
      </View>

      {/* الروابط */}
      <Text style={styles.sectionTitle}>{lang === 'ar' ? 'الروابط' : 'Links'}</Text>
      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL('https://mytwin.ai')}>
        <Text style={styles.linkText}>🌐 mytwin.ai</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL('https://instagram.com/mytwin_ai')}>
        <Text style={styles.linkText}>📸 Instagram</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL('https://tiktok.com/@mytwin_ai')}>
        <Text style={styles.linkText}>🎵 TikTok</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL('https://linkedin.com/company/soulsync')}>
        <Text style={styles.linkText}>💼 LinkedIn</Text>
      </TouchableOpacity>

      {/* السياسات */}
      <Text style={styles.sectionTitle}>{lang === 'ar' ? 'السياسات' : 'Policies'}</Text>
      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL('https://mytwin.ai/terms')}>
        <Text style={styles.linkText}>📋 {lang === 'ar' ? 'شروط الاستخدام' : 'Terms of Service'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL('https://mytwin.ai/privacy')}>
        <Text style={styles.linkText}>🔒 {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Text>
      </TouchableOpacity>

      <Text style={styles.copyright}>©️ 2026 Soul Sync Ltd. {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: FONTS.title, fontWeight: '800', color: COLORS.text, marginBottom: 24 },
  sectionTitle: { fontSize: FONTS.subtitle, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  card: { backgroundColor: COLORS.card, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: FONTS.small, marginBottom: 4 },
  value: { color: COLORS.text, fontSize: FONTS.body, fontWeight: '600', marginBottom: 10 },
  companyName: { color: COLORS.primary, fontSize: FONTS.subtitle, fontWeight: '700', marginBottom: 8 },
  companyDesc: { color: COLORS.textSecondary, fontSize: FONTS.body, lineHeight: 22 },
  linkBtn: { backgroundColor: COLORS.card, padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  linkText: { color: COLORS.text, fontSize: FONTS.body },
  copyright: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONTS.tiny, marginTop: 32 },
});
