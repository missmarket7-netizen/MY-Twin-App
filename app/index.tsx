import { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 10, friction: 2, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[s.logo, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
        resizeMode="contain"
      />
      <TouchableOpacity style={s.button} onPress={() => router.push('/login')}>
        <Animated.Text style={[s.buttonText, { opacity: opacityAnim }]}>Get Started</Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 200, height: 200, marginBottom: 50 },
  button: { backgroundColor: '#5B4AE0', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
