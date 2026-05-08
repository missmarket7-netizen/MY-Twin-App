export interface TierConfig {
  tokens: number;
  conversations: number;
  memoryDays: number;
}

export const TIERS: Record<string, TierConfig> = {
  free: {
    tokens: 3000,
    conversations: 50,
    memoryDays: 3,
  },
  premium_trial: {
    tokens: 3000,
    conversations: 50,
    memoryDays: 7,
  },
  premium: {
    tokens: 6000,
    conversations: 150,
    memoryDays: 30,
  },
  yearly: {
    tokens: 20000,
    conversations: 999,
    memoryDays: 365,
  },
};

export const getTierConfig = (tier: string): TierConfig => {
  return TIERS[tier] || TIERS.free;
};
