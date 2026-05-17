import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { setToken } from '../lib/api';

export default function Layout() {
  const { setAuth } = useTwinStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // تحقق من الجلسة الحالية
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setAuth(session.user.id);
        setToken(session.access_token);

        // تحقق إذا أتم الـ onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.onboarded) {
          router.replace('/chat');
        } else {
          router.replace('/onboarding');
        }
      } else {
        router.replace('/');
      }
    });

    // تابع تغييرات الـ auth
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user.id);
        setToken(session.access_token);
      } else {
        setAuth('');
        setToken('');
        router.replace('/');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="mood" />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="privacy" />
      </Stack>
    </>
  );
}
