import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { setToken } from '../lib/api';
import { COLORS, FONTS } from '../utils/theme';

function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { tier, twinName, bondLevel } = useTwinStore();
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const stage = bondLevel >= 95 ? 'توأم روح' : bondLevel >= 80 ? 'ارتباط' : bondLevel >= 60 ? 'ثقة' : bondLevel >= 40 ? 'مقربين' : bondLevel >= 20 ? 'أصدقاء' : 'غرباء';

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: visible ? 0 : -280, duration: 250, useNativeDriver: true }).start();
  }, [visible]);

  const items = [
    { label: '💬 المحادثات', route: '/chat' },
    { label: '⚙️ الإعدادات', route: '/settings' },
    { label: '💎 الاشتراكات', route: '/subscription' },
    { label: '🎯 أهدافي', route: '/goals' },
    { label: '📊 مزاجي', route: '/mood' },
    { label: '📅 ذكرياتي', route: '/timeline' },
    { label: '🔒 الخصوصية', route: '/privacy' },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.sideHeader}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{twinName?.charAt(0)?.toUpperCase() || '?'}</Text></View>
            <Text style={styles.twinName}>{twinName || 'توأمك'}</Text>
            <Text style={styles.stage}>{stage} • {bondLevel.toFixed(0)}%</Text>
            {tier === 'free' && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => { onClose(); router.push('/subscription'); }}>
                <Text style={styles.upgradeText}>⭐ ترقية</Text>
              </TouchableOpacity>
            )}
          </View>
          {items.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => { onClose(); router.push(item.route as any); }}>
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
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
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" options={{ headerShown: true, headerTitle: '', headerStyle: { backgroundColor: COLORS.header }, headerLeft: () => <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 16 }}><Text style={{ fontSize: 24 }}>☰</Text></TouchableOpacity> }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="privacy" />
      </Stack>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, backgroundColor: COLORS.bg, paddingTop: 60, paddingHorizontal: 20 },
  sideHeader: { alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  twinName: { color: COLORS.text, fontSize: FONTS.subtitle, fontWeight: '700' },
  stage: { color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 4 },
  upgradeBtn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  upgradeText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.small },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuText: { color: COLORS.text, fontSize: FONTS.body },
});
