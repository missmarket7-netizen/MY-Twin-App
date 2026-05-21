import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

export default function TypingIndicator({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity: dot.interpolate({ inputRange: [0,1], outputRange: [0.3,1] }), transform: [{ translateY: dot.interpolate({ inputRange: [0,1], outputRange: [0,-6] }) }] }]}
            />
          ))}
        </View>
        <Text style={styles.text}>{lang === 'ar' ? 'التوأم يكتب...' : 'Twin is typing...'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 8 },
  bubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  dotsRow: { flexDirection: 'row', marginRight: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textSecondary, marginHorizontal: 2 },
  text: { color: COLORS.textSecondary, fontSize: FONTS.small },
});
