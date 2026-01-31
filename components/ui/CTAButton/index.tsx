import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * Primary CTA Button - Large, prominent action button
 */
interface PrimaryCTAProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'water' | 'success' | 'warning' | 'gradient';
  size?: 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  pulse?: boolean;
}

export function PrimaryCTA({
  title,
  subtitle,
  onPress,
  icon,
  variant = 'water',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  pulse = false,
}: PrimaryCTAProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pulse && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [pulse, disabled]);

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: '#4CAF50',
          bgDark: '#388E3C',
          text: '#fff',
          glow: 'rgba(76, 175, 80, 0.4)',
        };
      case 'warning':
        return {
          bg: '#FF9800',
          bgDark: '#F57C00',
          text: '#fff',
          glow: 'rgba(255, 152, 0, 0.4)',
        };
      case 'gradient':
        return {
          bg: colors.primary,
          bgDark: colors.primaryDark,
          text: colors.onPrimary,
          glow: `${colors.primary}66`,
        };
      default:
        return {
          bg: colors.primary,
          bgDark: colors.primaryDark,
          text: colors.onPrimary,
          glow: `${colors.primary}66`,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'medium':
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 16,
          titleSize: 16,
          subtitleSize: 12,
          iconSize: 22,
        };
      case 'xlarge':
        return {
          paddingVertical: 22,
          paddingHorizontal: 36,
          borderRadius: 24,
          titleSize: 22,
          subtitleSize: 14,
          iconSize: 32,
        };
      default:
        return {
          paddingVertical: 18,
          paddingHorizontal: 28,
          borderRadius: 20,
          titleSize: 18,
          subtitleSize: 13,
          iconSize: 26,
        };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.primaryCTA,
          {
            backgroundColor: variantColors.bg,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderRadius: sizeStyles.borderRadius,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            shadowColor: variantColors.bg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          },
          style,
        ]}
      >
        {/* Glow effect */}
        {pulse && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: variantColors.glow,
                borderRadius: sizeStyles.borderRadius,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        <View style={styles.ctaContent}>
          {loading ? (
            <LoadingSpinner size={sizeStyles.iconSize} color={variantColors.text} />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={sizeStyles.iconSize}
                  color={variantColors.text}
                  style={styles.ctaIcon}
                />
              )}
              <View style={styles.ctaTextContainer}>
                <Text
                  style={[
                    styles.ctaTitle,
                    { color: variantColors.text, fontSize: sizeStyles.titleSize },
                  ]}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text
                    style={[
                      styles.ctaSubtitle,
                      { color: variantColors.text, fontSize: sizeStyles.subtitleSize },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating Action Button - Circular prominent button
 */
interface FloatingCTAProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'small' | 'medium' | 'large';
  badge?: number;
  style?: StyleProp<ViewStyle>;
}

export function FloatingCTA({
  icon,
  onPress,
  label,
  variant = 'primary',
  size = 'medium',
  badge,
  style,
}: FloatingCTAProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const getVariantColors = () => {
    switch (variant) {
      case 'secondary':
        return { bg: colors.surfaceVariant, icon: colors.primary };
      case 'success':
        return { bg: '#4CAF50', icon: '#fff' };
      default:
        return { bg: colors.primary, icon: colors.onPrimary };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { size: 48, iconSize: 22 };
      case 'large':
        return { size: 72, iconSize: 34 };
      default:
        return { size: 60, iconSize: 28 };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <View style={[styles.floatingContainer, style]}>
      {label && (
        <View style={[styles.floatingLabel, { backgroundColor: colors.card }]}>
          <Text style={[styles.floatingLabelText, { color: colors.text }]}>{label}</Text>
        </View>
      )}
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.floatingCTA,
            {
              width: sizeStyles.size,
              height: sizeStyles.size,
              borderRadius: sizeStyles.size / 2,
              backgroundColor: variantColors.bg,
              transform: [{ scale: scaleAnim }, { rotate }],
              shadowColor: variantColors.bg,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
        >
          <Ionicons name={icon} size={sizeStyles.iconSize} color={variantColors.icon} />
        </Animated.View>
      </Pressable>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: '#FF5252' }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Quick Action Button - Compact action with icon
 */
interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function QuickAction({
  icon,
  label,
  onPress,
  color,
  disabled = false,
  style,
}: QuickActionProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonColor = color || colors.primary;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.quickAction,
          {
            backgroundColor: `${buttonColor}15`,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: `${buttonColor}25` }]}>
          <Ionicons name={icon} size={24} color={buttonColor} />
        </View>
        <Text style={[styles.quickActionLabel, { color: colors.text }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Pill CTA - Compact horizontal button
 */
interface PillCTAProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'filled' | 'outlined' | 'soft';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function PillCTA({
  title,
  onPress,
  icon,
  variant = 'filled',
  color,
  style,
}: PillCTAProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonColor = color || colors.primary;

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          bg: 'transparent',
          text: buttonColor,
          border: buttonColor,
        };
      case 'soft':
        return {
          bg: `${buttonColor}20`,
          text: buttonColor,
          border: 'transparent',
        };
      default:
        return {
          bg: buttonColor,
          text: '#fff',
          border: 'transparent',
        };
    }
  };

  const variantStyles = getVariantStyles();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.pillCTA,
          {
            backgroundColor: variantStyles.bg,
            borderColor: variantStyles.border,
            borderWidth: variant === 'outlined' ? 2 : 0,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {icon && <Ionicons name={icon} size={16} color={variantStyles.text} style={styles.pillIcon} />}
        <Text style={[styles.pillText, { color: variantStyles.text }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Loading Spinner
 */
function LoadingSpinner({ size, color }: { size: number; color: string }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="refresh" size={size} color={color} />
    </Animated.View>
  );
}

/**
 * Circular Progress CTA - Button with progress ring
 */
interface CircularProgressCTAProps {
  progress: number; // 0-100
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function CircularProgressCTA({
  progress,
  icon,
  onPress,
  size = 80,
  label,
  style,
}: CircularProgressCTAProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.circularCTA, { transform: [{ scale: scaleAnim }] }, style]}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceVariant}
            strokeWidth={strokeWidth}
            fill={colors.card}
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.circularContent]}>
          <Ionicons name={icon} size={size * 0.35} color={colors.primary} />
        </View>
        {label && (
          <Text style={[styles.circularLabel, { color: colors.textSecondary }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Primary CTA
  primaryCTA: {
    overflow: 'hidden',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: {
    marginRight: 12,
  },
  ctaTextContainer: {
    alignItems: 'flex-start',
  },
  ctaTitle: {
    fontWeight: '700',
  },
  ctaSubtitle: {
    opacity: 0.85,
    marginTop: 2,
  },

  // Floating CTA
  floatingContainer: {
    alignItems: 'center',
  },
  floatingCTA: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  floatingLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Quick Action
  quickAction: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    minWidth: 90,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Pill CTA
  pillCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Circular Progress CTA
  circularCTA: {
    alignItems: 'center',
  },
  circularContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default PrimaryCTA;
