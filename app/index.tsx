import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  return (
    <View style={s.container}>
      {/* الشعار */}
      <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />
      
      {/* اسم التطبيق */}
      <Text style={s.appName}>MY Twin</Text>
      
      {/* الجملة التسويقية */}
      <Text style={s.tagline}>Your AI Twin ... Your True Companion</Text>
      
      {/* زر المتابعة */}
      <TouchableOpacity style={s.button} onPress={() => router.push('/login')}>
        <Text style={s.buttonText}>Get Started</Text>
      </TouchableOpacity>

      {/* تذييل الشركة */}
      <Text style={s.footer}>Soul Sync © 2026</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1226',
    letterSpacing: 2,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#5B4AE0',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#5B4AE0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#1A1226',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#A09BB5',
  },
});
