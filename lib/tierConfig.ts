export interface TierConfig {
  tokens: number;
  conversations: number;
  memoryDays: number;
  images: number;
  files: number;
  mic: boolean;
  camera: boolean;
  notifications: { min: number; max: number };
  earlyTokens?: number; // أول 14 يوم للمجاني
}

export const TIERS: Record<string, TierConfig> = {
  free: {
    tokens: 500,               // بعد 14 يوم
    earlyTokens: 1500,         // أول 14 يوم
    conversations: 50,
    memoryDays: 3,
    images: 1,
    files: 1,
    mic: false,
    camera: false,
    notifications: { min: 1, max: 3 },
  },
  plus: {
    tokens: 1500,
    conversations: 50,
    memoryDays: 3,
    images: 3,
    files: 2,
    mic: true,
    camera: false,
    notifications: { min: 3, max: 5 },
  },
  premium: {
    tokens: 4000,
    conversations: 150,
    memoryDays: 30,
    images: 5,
    files: 5,
    mic: true,
    camera: true,             // 2 استخدام للكاميرا يومياً (يمكن ضبطه لاحقاً)
    notifications: { min: 3, max: 7 },
  },
  pro: {
    tokens: 7000,
    conversations: 300,
    memoryDays: 90,
    images: 9,
    files: 7,
    mic: true,
    camera: true,
    notifications: { min: 3, max: 7 },
  },
  yearly: {
    tokens: 15000,
    conversations: 999,
    memoryDays: 365,
    images: 999,              // مفتوح
    files: 999,
    mic: true,
    camera: true,
    notifications: { min: 5, max: 10 },
  },
};

export const getTierConfig = (tier: string): TierConfig => {
  return TIERS[tier] || TIERS.free;
};
