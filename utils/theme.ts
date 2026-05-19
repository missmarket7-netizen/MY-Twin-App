/**
 * MyTwin – Theme System v2.0 (Off-White Design)
 * يدعم الوضعين الفاتح والداكن مع الحفاظ على التوافق.
 */
export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentGlow: string;
  border: string;
  inputBg: string;
  twinBubble: string;
  danger: string;
  success: string;
}

// ── الوضع الداكن (احتياطي) ──────────────────────────────────────
const DARK_THEME: ThemeColors = {
  bg: '#0F0A1A',
  bgSecondary: '#1A1226',
  text: '#FFFFFF',
  textSecondary: '#8B7BA3',
  accent: '#A855F7',
  accentGlow: '#A855F733',
  border: '#2D1B4D',
  inputBg: '#161122',
  twinBubble: '#1A1226',
  danger: '#FF6B6B',
  success: '#4ADE80',
};

// ── الوضع الفاتح (Off-White الأساسي) ───────────────────────────
const LIGHT_THEME: ThemeColors = {
  bg: '#FAFAF8',
  bgSecondary: '#F5F5F0',
  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  accent: '#6B21A8',
  accentGlow: '#6B21A822',
  border: '#E8E8E3',
  inputBg: '#FDFDF9',
  twinBubble: '#F5F5F0',
  danger: '#EF4444',
  success: '#7C9A6B',
};

/**
 * دالة مساعدة لجلب ألوان المظهر الحالي.
 * (للاستخدام في الشاشات القديمة)
 */
export function getTheme(isDark: boolean): ThemeColors {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

// ── نظام الألوان الجديد (مختصر) ─────────────────────────────────
export const COLORS = {
  bg: '#FAFAF8',
  card: '#F5F5F0',
  header: '#F0F0EB',
  border: '#E8E8E3',
  chatBg: '#FDFDF9',
  primary: '#6B21A8',
  primaryLight: '#A855F7',
  gold: '#D4A574',
  rose: '#C08497',
  success: '#7C9A6B',
  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  white: '#FFFFFF',
};

// ── الخطوط والأبعاد ────────────────────────────────────────────
export const FONTS = {
  title: 28,
  subtitle: 18,
  body: 16,
  small: 14,
  tiny: 12,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ── ثوابت قديمة للتوافق (اختياري) ──────────────────────────────
export const colors = {
  purple: '#6B21A8',
  purpleDark: '#5B21B6',
  bgDark: '#0F0A1A',
};
