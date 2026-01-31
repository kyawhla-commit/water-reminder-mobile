import { useThemeStore } from '@/store/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewProps } from 'react-native';

interface ThemeTransitionProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Wraps content with smooth fade transition when theme changes
 */
export function ThemeTransition({ children, style, ...props }: ThemeTransitionProps) {
  const isTransitioning = useThemeStore((state) => state.isTransitioning);
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTransitioning) {
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isTransitioning]);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }, style]} {...props}>
      {children}
    </Animated.View>
  );
}

/**
 * Animated background that smoothly transitions between theme colors
 */
interface AnimatedBackgroundProps extends ViewProps {
  children: React.ReactNode;
  lightColor: string;
  darkColor: string;
}

export function AnimatedBackground({ children, lightColor, darkColor, style, ...props }: AnimatedBackgroundProps) {
  const { resolvedTheme, isTransitioning } = useThemeStore();
  const colorAnim = useRef(new Animated.Value(resolvedTheme === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: resolvedTheme === 'dark' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [resolvedTheme]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColor, darkColor],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }, style]} {...props}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ThemeTransition;
