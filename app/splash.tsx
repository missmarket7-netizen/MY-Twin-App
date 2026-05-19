import { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONTS } from '../utils/theme';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subTextOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // تسلسل الحركات
    Animated.sequence([
      // المرحلة 1: ظهور الشعار مع تكبير
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // المرحلة 2: ظهور النص "by Soul Sync"
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // المرحلة 3: ظهور رمز حقوق النشر
      Animated.timing(subTextOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // الانتقال التلقائي بعد 3 ثوانٍ
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.company, { opacity: textOpacity }]}>
        by Soul Sync
      </Animated.Text>
      <Animated.Text style={[styles.copyright, { opacity: subTextOpacity }]}>
        ©️ 2026
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  company: {
    fontSize: FONTS.subtitle,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: 8,
  },
  copyright: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
});
