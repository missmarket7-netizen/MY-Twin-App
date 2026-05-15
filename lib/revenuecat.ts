import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const RC_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
const RC_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';

// ✅ تهيئة RevenueCat عند بدء التطبيق
export const initRevenueCat = (userId: string) => {
  try {
    const key = Platform.OS === 'android' ? RC_KEY_ANDROID : RC_KEY_IOS;
    if (!key) {
      console.warn('RevenueCat key missing');
      return;
    }
    Purchases.configure({ apiKey: key, appUserID: userId });
    Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  } catch (e) {
    console.error('RevenueCat init error:', e);
  }
};

// ✅ جلب العروض المتاحة
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (e) {
    console.error('getOfferings error:', e);
    return null;
  }
};

// ✅ شراء باقة
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    console.error('purchasePackage error:', e);
    return { success: false, error: e.message || 'unknown_error' };
  }
};

// ✅ استعادة المشتريات
export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (e: any) {
    console.error('restorePurchases error:', e);
    return { success: false, error: e.message || 'unknown_error' };
  }
};

// ✅ جلب معلومات المستخدم الحالية
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.error('getCustomerInfo error:', e);
    return null;
  }
};

// ✅ تحديد الـ tier من entitlements
export const getTierFromCustomerInfo = (customerInfo: CustomerInfo): string => {
  const entitlements = customerInfo.entitlements.active || {};
  if (entitlements['yearly']) return 'yearly';
  if (entitlements['pro']) return 'pro';
  if (entitlements['premium_trial']) return 'premium_trial';
  if (entitlements['premium']) return 'premium';
  if (entitlements['free_trial_14d']) return 'free_trial_14d';
  return 'free';
};
