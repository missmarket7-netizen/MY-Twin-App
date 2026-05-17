import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTwinStore } from '../store/useTwinStore';

export default function Login() {
  const { setAuth } = useTwinStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // تسجيل الدخول بجوجل
  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) Alert.alert('خطأ', error.message);
    setLoading(false);
  };

  // تسجيل الدخول بالبريد
  const signInWithEmail = async () => {
    if (!email || !password) { Alert.alert('خطأ', 'أدخل البريد وكلمة المرور'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('خطأ', error.message);
    else if (data.user) { setAuth(data.user.id); router.replace('/chat'); }
    setLoading(false);
  };

  // تسجيل جديد بالبريد (يرسل رابط تأكيد)
  const signUpWithEmail = async () => {
    if (!email || !password) { Alert.alert('خطأ', 'أدخل البريد وكلمة المرور'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('خطأ', error.message);
    else Alert.alert('تم', 'تم إرسال رابط تأكيد إلى بريدك الإلكتروني. الرجاء التحقق.');
    setLoading(false);
  };

  // تسجيل الدخول برقم الهاتف (لاحقاً عبر OTP)
  const signInWithPhone = async () => {
    if (!phone) { Alert.alert('خطأ', 'أدخل رقم الهاتف'); return; }
    // يمكن تفعيل OTP عبر Supabase لاحقاً
    Alert.alert('تنبيه', 'ميزة تسجيل الدخول بالهاتف قيد التطوير.');
  };

  return (
    <View style={s.container}>
      <Text style={s.heading}>Welcome Back</Text>

      {/* Google Sign-In */}
      <TouchableOpacity style={[s.button, s.googleBtn]} onPress={signInWithGoogle} disabled={loading}>
        <Text style={s.googleText}>G  تسجيل الدخول بحساب قوقل</Text>
      </TouchableOpacity>

      <View style={s.divider} />

      {/* Email & Password */}
      <TextInput style={s.input} placeholder="البريد الإلكتروني" placeholderTextColor="#A09BB5" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={s.input} placeholder="كلمة المرور" placeholderTextColor="#A09BB5" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={s.button} onPress={signInWithEmail} disabled={loading}>
        <Text style={s.buttonText}>تسجيل الدخول</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.button, s.outline]} onPress={signUpWithEmail} disabled={loading}>
        <Text style={[s.buttonText, s.outlineText]}>إنشاء حساب جديد</Text>
      </TouchableOpacity>

      {/* Phone Number */}
      <TextInput style={s.input} placeholder="رقم الهاتف (اختياري)" placeholderTextColor="#A09BB5" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TouchableOpacity style={[s.button, s.outline]} onPress={signInWithPhone} disabled={loading}>
        <Text style={[s.buttonText, s.outlineText]}>متابعة برقم الهاتف</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24, justifyContent: 'center' },
  heading: { fontSize: 28, fontWeight: '800', color: '#1A1226', textAlign: 'center', marginBottom: 30 },
  googleBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', flexDirection: 'row', justifyContent: 'center' },
  googleText: { color: '#1A1226', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E0D9F5', marginVertical: 20 },
  input: { backgroundColor: '#F8F6F2', color: '#1A1226', padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#E0D9F5', fontSize: 15 },
  button: { backgroundColor: '#5B4AE0', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#1A1226', fontWeight: '700', fontSize: 16 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#5B4AE0' },
  outlineText: { color: '#5B4AE0' },
});
