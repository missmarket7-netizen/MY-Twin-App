import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || 'your_free_posthog_key';

export const posthog = new PostHog(POSTHOG_KEY, {
  host: 'https://us.i.posthog.com',
});

export const track = (event: string, props?: Record<string, any>) => {
  if (Platform.OS !== 'web') {
    posthog.capture(event, props);
  }
};

export const identifyUser = (userId: string, props?: Record<string, any>) => {
  posthog.identify(userId, props);
};

export const resetUser = () => {
  posthog.reset();
};
