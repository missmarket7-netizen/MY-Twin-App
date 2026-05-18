import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '../components/CustomDrawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { supabase } from '../lib/supabase';
import { setToken } from '../lib/api';

export default function Layout() {
  const { setAuth, tier } = useTwinStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setAuth(session.user.id);
        setToken(session.access_token);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user.id);
        setToken(session.access_token);
      } else {
        setAuth('');
        setToken('');
      }
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Drawer drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: '#1A1226', width: 300 },
          drawerLabelStyle: { color: '#FFFFFF', fontSize: 16 },
          drawerActiveBackgroundColor: '#2D1B4D',
        }}
      >
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen
          name="index"
          options={{ drawerLabel: 'الرئيسية', drawerItemStyle: { display: 'none' } }}
        />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen name="login" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen
          name="chat"
          options={{ drawerLabel: '💬 المحادثات' }}
        />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen
          name="settings"
          options={{ drawerLabel: '⚙️ الإعدادات' }}
        />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen
          name="subscription"
          options={{
            drawerLabel: tier === 'free' ? '⭐ ترقية' : '⭐ اشتراكي',
          }}
        />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen name="goals" options={{ drawerLabel: '🎯 أهدافي' }} />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen name="mood" options={{ drawerLabel: '📊 مزاجي' }} />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen name="timeline" options={{ drawerLabel: '📅 ذكرياتي' }} />
        <Drawer drawerContent={(props) => <CustomDrawer {...props} />}.Screen name="privacy" options={{ drawerLabel: '🔒 الخصوصية' }} />
      </Drawer>
    </>
  );
}
