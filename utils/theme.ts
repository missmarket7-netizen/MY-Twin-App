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

                        const DARK_THEME: ThemeColors = {
                          bg: '#0F0A1A',
                            bgSecondary: '#1A1226',
                              text: '#FFFFFF',
                                textSecondary: '#8B7BA3',
                                  accent: '#E0AAFF',
                                    accentGlow: '#E0AAFF33',
                                      border: '#2D1B4D',
                                        inputBg: '#161122',
                                          twinBubble: '#1A1226',
                                            danger: '#FF6B6B',
                                              success: '#4ADE80',
                                              };

                                              const LIGHT_THEME: ThemeColors = {
                                                bg: '#FFFFFF',
                                                  bgSecondary: '#F8F7FF',
                                                    text: '#1A1226',
                                                      textSecondary: '#6B7280',
                                                        accent: '#8B5CF6',
                                                          accentGlow: '#8B5CF622',
                                                            border: '#E5E7EB',
                                                              inputBg: '#F3F4F6',
                                                                twinBubble: '#F9FAFB',
                                                                  danger: '#EF4444',
                                                                    success: '#10B981',
                                                                    };

                                                                    export function getTheme(isDark: boolean): ThemeColors {
                                                                      return isDark ? DARK_THEME : LIGHT_THEME;
                                                                      }

                                                                      export const colors = {
                                                                        purple: '#E0AAFF',
                                                                          purpleDark: '#5B21B6',
                                                                            bgDark: '#0F0A1A',
                                                                            };