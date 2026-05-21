import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { setToken } from '../lib/api';
import { COLORS, FONTS } from '../utils/theme';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { ToastProvider } from '../components/Toast';

function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(-280)).current;
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: visible ? 0 : -280, duration: 250, useNativeDriver: true }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <CustomDrawerContent onClose={onClose} />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function Layout() {
  const { setAuth } = useTwinStore();
  const initialized = useRef(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    router.replace('/splash');
    setTimeout(() => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          setAuth(session.user.id); setToken(session.access_token);
          const { data: profile } = await supabase.from('profiles').select('onboarded').eq('user_id', session.user.id).single();
          router.replace(profile?.onboarded ? '/chat' : '/onboarding');
        } else router.replace('/login');
      });
    }, 2500);
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { setAuth(session.user.id); setToken(session.access_token); }
      else { setAuth(''); setToken(''); router.replace('/login'); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <ToastProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" options={{ headerShown: true, headerTitle: '', headerStyle: { backgroundColor: COLORS.header }, headerLeft: () => <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 16 }}><Text style={{ fontSize: 24 }}>☰</Text></TouchableOpacity> }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="memories" />
        <Stack.Screen name="customize" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="help" />
        <Stack.Screen name="about" />
      </Stack>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, backgroundColor: COLORS.bg, paddingTop: 60, paddingHorizontal: 20 },
});
