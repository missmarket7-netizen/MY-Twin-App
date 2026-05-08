import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../utils/theme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTwinStore();
    const colors = getTheme(theme === 'dark');

      return (
          <TouchableOpacity
                onPress={toggleTheme}
                      style={styles.btn}
                            accessibilityLabel="تبديل المظهر"
                                >
                                      <Ionicons
                                              name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                                                      size={20}
                                                              color={colors.text}
                                                                    />
                                                                        </TouchableOpacity>
                                                                          );
                                                                          }

                                                                          const styles = StyleSheet.create({
                                                                            btn: { padding: 6 },
                                                                            });