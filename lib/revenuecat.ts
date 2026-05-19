import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

// إعادة تصدير الأنواع لتستخدمها الملفات الأخرى
export type { PurchasesPackage, CustomerInfo };

const RC_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
const RC_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';

export const initRevenueCat = (userId: string) => {
  try {
    const key = Platform.OS === 'android' ? RC_KEY_ANDROID : RC_KEY_IOS;
    if (!key) { console.warn('RevenueCat key missing'); return; }
    Purchases.configure({ apiKey: key, appUserID: userId });
    Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  } catch (e) { console.error('RevenueCat init error:', e); }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) { console.error('getOfferings error:', e); return null; }
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo, error: null };
  } catch (e: any) {
    if (e.userCancelled) return { success: false, customerInfo: null, error: 'cancelled' };
    return { success: false, customerInfo: null, error: e.message || 'unknown_error' };
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (e: any) {
    console.error('restorePurchases error:', e);
    return null;
  }
};

export const getTierFromCustomerInfo = (customerInfo: CustomerInfo): string => {
  const entitlements = (customerInfo as any).entitlements?.active || {};
  if (entitlements['yearly']) return 'yearly';
  if (entitlements['pro']) return 'pro';
  if (entitlements['premium']) return 'premium';
  if (entitlements['plus']) return 'plus';
  if (entitlements['premium_trial']) return 'premium_trial';
  return 'free';
};
