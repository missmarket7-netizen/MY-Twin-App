import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useTwinStore } from '../store/useTwinStore';
import { router } from 'expo-router';

export default function CustomDrawer(props: any) {
  const { tier, userId } = useTwinStore();

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      {/* أيقونة المستخدم */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userId?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.userName}>حسابي</Text>
      </View>

      {/* زر الترقية (شفاف) */}
      {tier === 'free' && (
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => router.push('/subscription')}
        >
          <Text style={styles.upgradeText}>⭐ Upgrade</Text>
        </TouchableOpacity>
      )}

      {/* قائمة الشاشات */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1226' },
  userSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2D1B4D', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#5B4AE0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  userName: { color: '#FFFFFF', fontSize: 16 },
  upgradeBtn: {
    margin: 16,
    padding: 10,
    backgroundColor: 'rgba(91, 74, 224, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5B4AE0',
    alignItems: 'center',
  },
  upgradeText: { color: '#5B4AE0', fontWeight: '600' },
});
