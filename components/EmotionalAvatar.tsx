import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const EMOJIS: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  lonely: '🥺',
  motivated: '💪',
  grateful: '🙏',
  confused: '😕',
  excited: '🎉',
  neutral: '😌',
};

interface Props {
  emotion: string;
  size?: number;
}

export default function EmotionalAvatar({ emotion, size = 60 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const emoji = EMOJIS[emotion] ?? EMOJIS.neutral;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: pulse }],
        },
      ]}
    >
      <Animated.Text style={{ fontSize: size * 0.6 }}>{emoji}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2D1B4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
