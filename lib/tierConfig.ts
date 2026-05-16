/**
 * MyTwin – Tier Configuration
 * حدود الاستخدام لكل باقة اشتراك.
 * متزامن مع backend/limits.py و store/useTwinStore.ts
 */
import { Tier } from '../store/useTwinStore';

export interface TierConfig {
  tokens: number;
  conversations: number;
  memoryDays: number;
  /** أول أسبوعين للمستخدمين الجدد */
  earlyTokens?: number;
  /** أول 5 أيام من تجربة Premium */
  trialTokens?: number;
}

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    tokens: 700,
    conversations: 50,
    memoryDays: 3,
    earlyTokens: 1500, // أول أسبوعين
  },
  free_trial_14d: {
    tokens: 1500,
    conversations: 60,
    memoryDays: 3,
  },
  premium_trial: {
    tokens: 2000,
    conversations: 100,
    memoryDays: 7,
    trialTokens: 3000, // بعد أول 5 أيام
  },
  premium: {
    tokens: 6000,
    conversations: 150,
    memoryDays: 30,
  },
  pro: {
    tokens: 5000,
    conversations: 300,
    memoryDays: 90,
  },
  yearly: {
    tokens: 20000,
    conversations: 999,
    memoryDays: 365,
  },
};

/**
 * جلب إعدادات الباقة.
 * يعيد إعدادات الباقة المجانية افتراضيًا إذا لم تكن الباقة موجودة.
 */
export const getTierConfig = (tier: string): TierConfig => {
  return TIERS[tier as Tier] || TIERS.free;
};

/**
 * اسم الباقة للعرض.
 */
export const getTierDisplayName = (tier: string, lang: 'ar' | 'en' = 'ar'): string => {
  const names: Record<string, { ar: string; en: string }> = {
    free: { ar: 'مجاني', en: 'Free' },
    free_trial_14d: { ar: 'تجربة مجانية', en: 'Free Trial' },
    premium_trial: { ar: 'تجربة Premium', en: 'Premium Trial' },
    premium: { ar: 'Premium', en: 'Premium' },
    pro: { ar: 'Pro', en: 'Pro' },
    yearly: { ar: 'سنوي', en: 'Yearly' },
  };
  return names[tier]?.[lang] || tier;
};
