/**
 * MyTwin – Analytics Module (PostHog)
 * تتبع الأحداث وتسجيل المستخدمين.
 * يعمل فقط في بيئة الإنتاج وإذا توفر مفتاح PostHog.
 */
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';

// لا نُهيئ PostHog إذا لم يتوفر مفتاح
export const posthog = POSTHOG_KEY
  ? new PostHog(POSTHOG_KEY, {
      host: 'https://us.i.posthog.com',
    })
  : null;

/**
 * تسجيل حدث.
 * @param event اسم الحدث
 * @param props خصائص إضافية
 */
export const track = (event: string, props?: Record<string, any>) => {
  if (posthog && Platform.OS !== 'web') {
    posthog.capture(event, props);
  }
};

/**
 * تعريف المستخدم لربط الأحداث بهويته.
 * @param userId معرّف المستخدم
 * @param props خصائص إضافية
 */
export const identifyUser = (userId: string, props?: Record<string, any>) => {
  if (posthog) {
    posthog.identify(userId, props);
  }
};

/**
 * إعادة تعيين هوية المستخدم.
 */
export const resetUser = () => {
  if (posthog) {
    posthog.reset();
  }
};
