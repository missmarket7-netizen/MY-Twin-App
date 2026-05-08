import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

export interface Message {
  role: 'user' | 'twin';
  content: string;
}

export interface RelationshipDims {
  trust: number;
  empathy: number;
  humor: number;
  support: number;
}

export type Tier = 'free' | 'premium' | 'yearly';
export type Theme = 'dark' | 'light';

interface TwinStore {
  // Auth
  userId: string;
  setAuth: (userId: string) => void;

  // Twin identity
  twinName: string;
  setTwinName: (name: string) => void;

  // Bond & relationship
  bondLevel: number;
  relationshipDims: RelationshipDims;
  updateBond: (newBond: number) => void;

  // Chat
  chatHistory: Message[];
  addMessage: (role: 'user' | 'twin', content: string) => void;
  clearHistory: () => void;

  // Settings
  calmMode: boolean;
  toggleCalmMode: () => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Subscription
  tier: Tier;
  updateTier: (tier: string) => void;

  // Haptic
  triggerHaptic: () => void;
}

export const useTwinStore = create<TwinStore>((set, get) => ({
  // Auth
  userId: '',
  setAuth: (userId) => set({ userId }),

  // Twin identity
  twinName: 'توأمك',
  setTwinName: (name) => set({ twinName: name }),

  // Bond & relationship
  bondLevel: 0,
  relationshipDims: {
    trust: 0,
    empathy: 0,
    humor: 0,
    support: 0,
  },
  updateBond: (newBond) => set({ bondLevel: newBond }),

  // Chat — ✅ نحتفظ بآخر 50 رسالة بس في الـ store
  chatHistory: [],
  addMessage: (role, content) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, { role, content }].slice(-50),
    })),
  clearHistory: () => set({ chatHistory: [] }),

  // Settings
  calmMode: false,
  toggleCalmMode: () => set((state) => ({ calmMode: !state.calmMode })),

  // Theme
  theme: 'dark',
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  // Subscription
  tier: 'free',
  updateTier: (tier) => set({ tier: tier as Tier }),

  // Haptic
  triggerHaptic: () => {
    if (!get().calmMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
}));
