import { getElevationStyle, ThemeColors, themes, useThemeStore } from '@/store/theme';
import { useMemo } from 'react';

export const useAppTheme = () => {
  const { mode, resolvedTheme, isTransitioning, setMode } = useThemeStore();

  const colors: ThemeColors = themes[resolvedTheme];
  const isDark = resolvedTheme === 'dark';

  // Memoized elevation styles
  const elevation = useMemo(
    () => ({
      small: getElevationStyle(2, isDark),
      medium: getElevationStyle(4, isDark),
      large: getElevationStyle(8, isDark),
      extraLarge: getElevationStyle(16, isDark),
    }),
    [isDark]
  );

  // Common style helpers
  const styles = useMemo(
    () => ({
      // Card styles with proper elevation
      card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        ...elevation.small,
      },
      cardElevated: {
        backgroundColor: colors.cardElevated,
        borderRadius: 16,
        ...elevation.medium,
      },
      // Surface styles
      surface: {
        backgroundColor: colors.surface,
      },
      surfaceVariant: {
        backgroundColor: colors.surfaceVariant,
      },
      // Text styles
      textPrimary: {
        color: colors.text,
      },
      textSecondary: {
        color: colors.textSecondary,
      },
      textTertiary: {
        color: colors.textTertiary,
      },
      // Border styles
      border: {
        borderWidth: 1,
        borderColor: colors.border,
      },
      borderFocused: {
        borderWidth: 2,
        borderColor: colors.borderFocused,
      },
      // Divider
      divider: {
        height: 1,
        backgroundColor: colors.divider,
      },
    }),
    [colors, elevation]
  );

  return {
    mode,
    resolvedTheme,
    colors,
    isDark,
    isTransitioning,
    setMode,
    elevation,
    styles,
  };
};

export default useAppTheme;
