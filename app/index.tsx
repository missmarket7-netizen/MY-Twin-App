import { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // تأثير ظهور ناعم
    Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // بعد 2.5 ثانية، تحقق من الجلسة وانتقل للصفحة الصحيحة
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/chat');
      } else {
        router.replace('/login');
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={s.container}>
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[s.logo, { opacity: opacityAnim }]}
        resizeMode="contain"
      />
      <Animated.Text style={[s.company, { opacity: opacityAnim }]}>
        by Soul Sync
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 240, height: 240, marginBottom: 30 },
  company: { fontSize: 16, color: '#5B4AE0', fontWeight: '600', letterSpacing: 1 },
});
