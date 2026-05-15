import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';
import * as Notifications from 'expo-notifications';

export default function Welcome() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const { setAuth } = useTwinStore();

  useEffect(() => {
    // طلب إذن الإشعارات
    Notifications.requestPermissionsAsync();

    // جدولة إشعار يومي
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'توأمك ينتظرك!',
        body: 'كيف يومك اليوم؟ تعال نتحدث 💜',
      },
      trigger: { hour: 9, minute: 0, repeats: true },
    });
  }, []);

  const translations = {
    ar: {
      title: 'MY Twin',
      sub: 'رفيق حياتك الرقمي',
      name: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      pass: 'كلمة المرور',
      signup: 'إنشاء حساب',
      signin: 'تسجيل الدخول',
      err: 'خطأ',
      errMsg: 'أدخل البريد وكلمة المرور',
    },
    en: {
      title: 'MY Twin',
      sub: 'Your Digital Life Companion',
      name: 'Full Name',
      phone: 'Phone Number',
      email: 'Email Address',
      pass: 'Password',
      signup: 'Create Account',
      signin: 'Sign In',
      err: 'Error',
      errMsg: 'Enter email and password',
    },
  } as const;

  const t = translations[lang];

  const signUp = async () => {
    if (!email || !password) { Alert.alert(t.err, t.errMsg); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name, phone } },
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else if (data.user) { setAuth(data.user.id); router.replace('/onboarding'); }
  };

  const signIn = async () => {
    if (!email || !password) { Alert.alert(t.err, t.errMsg); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else if (data.user) { setAuth(data.user.id); router.replace('/chat'); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.langRow}>
          <TouchableOpacity style={[s.langBtn, lang === 'ar' && s.langActive]} onPress={() => setLang('ar')}>
            <Text style={[s.langText, lang === 'ar' && s.langActiveText]}>AR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.langBtn, lang === 'en' && s.langActive]} onPress={() => setLang('en')}>
            <Text style={[s.langText, lang === 'en' && s.langActiveText]}>EN</Text>
          </TouchableOpacity>
        </View>
        <View style={s.logoBox}>
          <Text style={s.logoEmoji}>🧬</Text>
          <Text style={s.logoText}>{t.title}</Text>
          <Text style={s.logoSub}>{t.sub}</Text>
        </View>
        <TextInput style={s.input} placeholder={t.name} placeholderTextColor="#999" value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder={t.phone} placeholderTextColor="#999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={s.input} placeholder={t.email} placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder={t.pass} placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={signUp} disabled={loading}>
          <Text style={s.btnText}>{loading ? '...' : t.signup}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={signIn} disabled={loading}>
          <Text style={[s.btnText, s.btnOutlineText]}>{loading ? '...' : t.signin}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F6F2', justifyContent: 'center', padding: 24 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16, gap: 8 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#7C3AED' },
  langActive: { backgroundColor: '#7C3AED' },
  langText: { color: '#7C3AED', fontWeight: '600' },
  langActiveText: { color: '#FFF' },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 64, marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: '800', color: '#1A1226', letterSpacing: 2 },
  logoSub: { fontSize: 15, color: '#6B5B8A', marginTop: 4 },
  input: { backgroundColor: '#FFF', color: '#1A1226', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#DDD', fontSize: 15 },
  btn: { backgroundColor: '#7C3AED', padding: 15, borderRadius: 12, marginBottom: 10 },
  btnText: { color: '#FFF', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#7C3AED' },
  btnOutlineText: { color: '#7C3AED' },
});
