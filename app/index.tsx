import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

// الشعار الرسمي من مجلد assets
const APP_LOGO = require('../assets/logo.png');

// لوحة الألوان المتناسقة مع الشعار
const COLORS = {
  bg: '#FFFFFF',
  text: '#F8F6F2',
  subtext: '#6B5B8A',
  primary: '#5B4AE0',
  primaryLight: '#F3F0FF',
  inputBg: '#F8F6F2',
  inputBorder: '#E0D9F5',
  placeholder: '#A09BB5',
  white: '#FFFFFF',
};

export default function Welcome() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const { setAuth } = useTwinStore();

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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* مبدل اللغة */}
        <View style={styles.langRow}>
          <TouchableOpacity style={[styles.langBtn, lang === 'ar' && styles.langActive]} onPress={() => setLang('ar')}>
            <Text style={[styles.langText, lang === 'ar' && styles.langActiveText]}>AR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langBtn, lang === 'en' && styles.langActive]} onPress={() => setLang('en')}>
            <Text style={[styles.langText, lang === 'en' && styles.langActiveText]}>EN</Text>
          </TouchableOpacity>
        </View>

        {/* الشعار الرسمي */}
        <View style={styles.logoBox}>
          <Image source={APP_LOGO} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logoTitle}>{t.title}</Text>
          <Text style={styles.logoSub}>{t.sub}</Text>
        </View>

        {/* حقول الإدخال */}
        <TextInput style={styles.input} placeholder={t.name} placeholderTextColor={COLORS.placeholder} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder={t.phone} placeholderTextColor={COLORS.placeholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder={t.email} placeholderTextColor={COLORS.placeholder} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder={t.pass} placeholderTextColor={COLORS.placeholder} value={password} onChangeText={setPassword} secureTextEntry />

        {/* أزرار المصادقة */}
        <TouchableOpacity style={styles.btnPrimary} onPress={signUp} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>{loading ? '...' : t.signup}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={signIn} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnOutlineText}>{loading ? '...' : t.signin}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  langActive: {
    backgroundColor: COLORS.primary,
  },
  langText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  langActiveText: {
    color: COLORS.white,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 15,
    color: COLORS.subtext,
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  btnPrimaryText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnOutlineText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
});
