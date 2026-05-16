import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { API } from '../lib/api';

const TEXTS = {
  ar: {
    title: 'الإعدادات',
    tier: 'الخطة الحالية',
    calm: '🕊️ وضع الهدوء',
    upgrade: '💎 ترقية الخطة',
    goals: '🎯 أهدافي',
    emergency: '🆘 دعم طوارئ نفسي',
    mood: '📊 لوحة المشاعر',
    timeline: '📅 خط الذكريات',
    privacy: '📜 سياسة الخصوصية',
    export: '📤 تصدير بياناتي',
    logout: 'تسجيل الخروج',
    delete: '🗑️ حذف الحساب نهائياً',
    deleteTitle: 'حذف نهائي',
    deleteMsg: 'لا يمكن التراجع. سيتم حذف جميع ذكرياتك وبياناتك نهائياً.',
    cancel: 'إلغاء',
    confirmDelete: 'حذف',
    exportTitle: 'تصدير البيانات',
    company: 'Soul Sync Ltd.',
    companyDesc: 'MyTwin — شريكك الرقمي الذكي',
  },
  en: {
    title: 'Settings',
    tier: 'Current Plan',
    calm: '🕊️ Calm Mode',
    upgrade: '💎 Upgrade Plan',
    goals: '🎯 My Goals',
    emergency: '🆘 Emergency Support',
    mood: '📊 Mood Board',
    timeline: '📅 Memory Timeline',
    privacy: '📜 Privacy Policy',
    export: '📤 Export My Data',
    logout: 'Sign Out',
    delete: '🗑️ Delete Account',
    deleteTitle: 'Delete Account',
    deleteMsg: 'This is irreversible. All your memories and data will be permanently deleted.',
    cancel: 'Cancel',
    confirmDelete: 'Delete',
    exportTitle: 'Export Data',
    company: 'Soul Sync Ltd.',
    companyDesc: 'MyTwin — Your Intelligent Digital Companion',
  },
};

export default function Settings() {
  const { tier, calmMode, toggleCalmMode } = useTwinStore();
  const lang = 'ar';
  const t = TEXTS[lang];

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const deleteAccount = () => {
    Alert.alert(t.deleteTitle, t.deleteMsg, [
      { text: t.cancel },
      {
        text: t.confirmDelete,
        style: 'destructive',
        onPress: async () => {
          await API.delete('/api/account');
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleExport = async () => {
    try {
      const { data } = await API.get('/api/export');
      Alert.alert(t.exportTitle, JSON.stringify(data, null, 2));
    } catch {
      Alert.alert('خطأ', 'فشل تصدير البيانات');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{t.tier}: {tier}</Text>
        </View>

        {/* Calm Mode */}
        <View style={styles.row}>
          <Text style={styles.label}>{t.calm}</Text>
          <Switch
            value={calmMode}
            onValueChange={toggleCalmMode}
            trackColor={{ false: '#DDD', true: '#5B4AE0' }}
            thumbColor={calmMode ? '#FFF' : '#F4F4F4'}
          />
        </View>

        {/* Navigation Buttons */}
        <TouchableOpacity style={styles.button} onPress={() => router.push('/subscription')}>
          <Text style={styles.buttonText}>{t.upgrade}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/goals')}>
          <Text style={styles.buttonText}>{t.goals}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/mood')}>
          <Text style={styles.buttonText}>{t.mood}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/timeline')}>
          <Text style={styles.buttonText}>{t.timeline}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/privacy')}>
          <Text style={styles.buttonText}>{t.privacy}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleExport}>
          <Text style={styles.buttonText}>{t.export}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => Linking.openURL('https://findahelpline.com')}>
          <Text style={[styles.buttonText, { color: '#E57373' }]}>{t.emergency}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={[styles.button, styles.logoutBtn]} onPress={logout}>
          <Text style={[styles.buttonText, { color: '#5B4AE0' }]}>{t.logout}</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={[styles.button, styles.dangerBtn]} onPress={deleteAccount}>
          <Text style={[styles.buttonText, { color: '#FF5252' }]}>{t.delete}</Text>
        </TouchableOpacity>

        {/* Soul Sync Branding */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>{t.company}</Text>
          <Text style={styles.brandingSub}>{t.companyDesc}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  card: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1226',
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  tierText: {
    color: '#5B4AE0',
    fontWeight: '600',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F6F2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  label: {
    color: '#1A1226',
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#F8F6F2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D9F5',
  },
  buttonText: {
    color: '#1A1226',
    fontWeight: '600',
    fontSize: 15,
  },
  logoutBtn: {
    borderColor: '#5B4AE0',
    borderWidth: 1.5,
  },
  dangerBtn: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  branding: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0D9F5',
  },
  brandingText: {
    color: '#5B4AE0',
    fontWeight: '700',
    fontSize: 15,
  },
  brandingSub: {
    color: '#A09BB5',
    fontSize: 12,
    marginTop: 2,
  },
});
