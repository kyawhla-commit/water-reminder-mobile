import { useAppTheme } from '@/hooks/useAppTheme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

/**
 * Frosted Glass Card - Main glassmorphism component
 */
interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  glowColor?: string;
  showBorder?: boolean;
}

export function GlassCard({
  children,
  intensity = 50,
  tint = 'default',
  borderRadius = 20,
  style,
  onPress,
  glowColor,
  showBorder = true,
}: GlassCardProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }).start();
    }
  };

  const blurTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)';
  const shadowColor = glowColor || colors.primary;

  const content = (
    <Animated.View
      style={[
        styles.glassCard,
        {
          borderRadius,
          borderWidth: showBorder ? 1 : 0,
          borderColor,
          shadowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: glowColor ? 0.3 : 0.1,
          shadowRadius: 16,
          elevation: 8,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={blurTint} style={[StyleSheet.absoluteFill, { borderRadius }]}>
          <View style={[styles.glassOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }]} />
        </BlurView>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(30,40,60,0.85)' : 'rgba(255,255,255,0.75)',
              borderRadius,
            },
          ]}
        />
      )}
      <View style={styles.glassContent}>{children}</View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Glass Button - Frosted glass button
 */
interface GlassButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}: GlassButtonProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getVariantColors = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          text: colors.text,
          border: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        };
      case 'accent':
        return {
          bg: `${colors.primary}30`,
          text: colors.primary,
          border: `${colors.primary}50`,
        };
      default:
        return {
          bg: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
          text: colors.text,
          border: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, borderRadius: 12 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 28, fontSize: 18, borderRadius: 20 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 22, fontSize: 16, borderRadius: 16 };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.glassButton,
          {
            backgroundColor: variantColors.bg,
            borderColor: variantColors.border,
            borderRadius: sizeStyles.borderRadius,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {icon && <View style={styles.buttonIcon}>{icon}</View>}
        <Text style={[styles.buttonText, { color: variantColors.text, fontSize: sizeStyles.fontSize }]}>
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Glass Panel - Full-width frosted panel
 */
interface GlassPanelProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassPanel({
  children,
  position = 'bottom',
  intensity = 80,
  style,
}: GlassPanelProps) {
  const { isDark } = useAppTheme();

  const positionStyles = position === 'top' 
    ? { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }
    : { borderTopLeftRadius: 24, borderTopRightRadius: 24 };

  return (
    <View style={[styles.glassPanel, positionStyles, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, positionStyles]}
        >
          <View
            style={[
              styles.panelOverlay,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)' },
            ]}
          />
        </BlurView>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            positionStyles,
            { backgroundColor: isDark ? 'rgba(20,30,50,0.95)' : 'rgba(255,255,255,0.9)' },
          ]}
        />
      )}
      <View style={styles.panelContent}>{children}</View>
    </View>
  );
}

/**
 * Glass Modal Backdrop - Blurred background for modals
 */
interface GlassBackdropProps {
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
  intensity?: number;
}

export function GlassBackdrop({
  children,
  visible,
  onClose,
  intensity = 30,
}: GlassBackdropProps) {
  const { isDark } = useAppTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: opacityAnim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}
          />
        )}
      </Pressable>
      {children}
    </Animated.View>
  );
}

/**
 * Glass Chip - Small frosted tag/chip
 */
interface GlassChipProps {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function GlassChip({
  label,
  icon,
  onPress,
  selected = false,
  color,
  style,
}: GlassChipProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const chipColor = color || colors.primary;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const content = (
    <Animated.View
      style={[
        styles.glassChip,
        {
          backgroundColor: selected
            ? `${chipColor}30`
            : isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.6)',
          borderColor: selected ? chipColor : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {icon && <View style={styles.chipIcon}>{icon}</View>}
      <Text style={[styles.chipLabel, { color: selected ? chipColor : colors.text }]}>{label}</Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Glass Gradient Card - Card with gradient overlay
 */
interface GlassGradientCardProps {
  children: React.ReactNode;
  gradientColors?: [string, string, ...string[]];
  intensity?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function GlassGradientCard({
  children,
  gradientColors,
  intensity = 40,
  borderRadius = 20,
  style,
}: GlassGradientCardProps) {
  const { colors, isDark } = useAppTheme();

  const defaultGradient: [string, string] = isDark
    ? ['rgba(100,181,246,0.2)', 'rgba(33,150,243,0.1)']
    : ['rgba(33,150,243,0.15)', 'rgba(100,181,246,0.05)'];

  const gradient = gradientColors || defaultGradient;

  return (
    <View style={[styles.gradientCard, { borderRadius }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(30,40,60,0.9)' : 'rgba(255,255,255,0.85)', borderRadius },
          ]}
        />
      )}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        style={[
          styles.gradientBorder,
          {
            borderRadius,
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
          },
        ]}
      />
      <View style={styles.gradientContent}>{children}</View>
    </View>
  );
}

/**
 * Glass Stat Card - Specialized card for displaying stats
 */
interface GlassStatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function GlassStatCard({
  value,
  label,
  icon,
  trend,
  trendValue,
  color,
  style,
}: GlassStatCardProps) {
  const { colors, isDark } = useAppTheme();
  const accentColor = color || colors.primary;

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <GlassCard style={[styles.statCard, style]} glowColor={accentColor}>
      <View style={styles.statHeader}>
        {icon && (
          <View style={[styles.statIcon, { backgroundColor: `${accentColor}20` }]}>
            {icon}
          </View>
        )}
        {trend && trendValue && (
          <View style={[styles.trendBadge, { backgroundColor: `${getTrendColor()}20` }]}>
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </GlassCard>
  );
}

/**
 * Glass Input - Frosted glass text input container
 */
interface GlassInputContainerProps {
  children: React.ReactNode;
  focused?: boolean;
  error?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassInputContainer({
  children,
  focused = false,
  error = false,
  style,
}: GlassInputContainerProps) {
  const { colors, isDark } = useAppTheme();

  const borderColor = error
    ? '#F44336'
    : focused
    ? colors.primary
    : isDark
    ? 'rgba(255,255,255,0.15)'
    : 'rgba(0,0,0,0.1)';

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
          borderColor,
          borderWidth: focused || error ? 2 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Glass Card
  glassCard: {
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glassContent: {
    padding: 16,
  },

  // Glass Button
  glassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
  },

  // Glass Panel
  glassPanel: {
    overflow: 'hidden',
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  panelContent: {
    padding: 16,
  },

  // Backdrop
  backdrop: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Glass Chip
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Gradient Card
  gradientCard: {
    overflow: 'hidden',
  },
  gradientBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  gradientContent: {
    padding: 16,
  },

  // Stat Card
  statCard: {
    minWidth: 140,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },

  // Input Container
  inputContainer: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default GlassCard;
