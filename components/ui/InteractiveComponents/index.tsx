import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Easing,
    PanResponder,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle
} from 'react-native';

/**
 * Enhanced Button with hover/press states
 */
interface InteractiveButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}

export function InteractiveButton({
  children,
  onPress,
  style,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
}: InteractiveButtonProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: isDark ? colors.surfaceVariant : colors.surfaceVariant,
          bgPressed: isDark ? colors.border : colors.border,
          text: colors.text,
        };
      case 'outline':
        return {
          bg: 'transparent',
          bgPressed: colors.highlight,
          text: colors.primary,
          border: colors.primary,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          bgPressed: colors.highlight,
          text: colors.primary,
        };
      default:
        return {
          bg: colors.primary,
          bgPressed: colors.primaryDark,
          text: colors.onPrimary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, iconSize: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 28, fontSize: 18, iconSize: 22 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16, iconSize: 18 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [variantStyles.bg, variantStyles.bgPressed],
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
          styles.button,
          {
            backgroundColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            opacity: disabled ? 0.5 : opacityAnim,
            transform: [{ scale: scaleAnim }],
            borderWidth: variant === 'outline' ? 2 : 0,
            borderColor: variantStyles.border,
          },
          style,
        ]}
      >
        {loading ? (
          <LoadingSpinner size={sizeStyles.iconSize} color={variantStyles.text} />
        ) : (
          <View style={styles.buttonContent}>
            {icon && iconPosition === 'left' && (
              <Ionicons name={icon} size={sizeStyles.iconSize} color={variantStyles.text} style={styles.iconLeft} />
            )}
            <Text style={[styles.buttonText, { color: variantStyles.text, fontSize: sizeStyles.fontSize }]}>
              {children}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons name={icon} size={sizeStyles.iconSize} color={variantStyles.text} style={styles.iconRight} />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Loading spinner for buttons
 */
function LoadingSpinner({ size, color }: { size: number; color: string }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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
 * Interactive Card with tap feedback
 */
interface InteractiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export function InteractiveCard({
  children,
  onPress,
  style,
  elevation = 'small',
  disabled = false,
}: InteractiveCardProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(1)).current;

  const getElevationStyle = () => {
    const baseOpacity = isDark ? 0.3 : 0.1;
    switch (elevation) {
      case 'none':
        return { shadowOpacity: 0, elevation: 0 };
      case 'medium':
        return { shadowOpacity: baseOpacity + 0.05, elevation: 4 };
      case 'large':
        return { shadowOpacity: baseOpacity + 0.1, elevation: 8 };
      default:
        return { shadowOpacity: baseOpacity, elevation: 2 };
    }
  };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(elevationAnim, {
        toValue: 0.5,
        duration: 100,
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
        bounciness: 4,
      }),
      Animated.timing(elevationAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const elevationStyle = getElevationStyle();

  if (!onPress) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            ...elevationStyle,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            ...elevationStyle,
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Swipeable List Item with actions
 */
interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
    label?: string;
  };
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
    label?: string;
  };
  style?: StyleProp<ViewStyle>;
  swipeThreshold?: number;
}

export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  style,
  swipeThreshold = 80,
}: SwipeableItemProps) {
  const { colors } = useAppTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        setSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit swipe distance
        const maxSwipe = 120;
        const clampedX = Math.max(-maxSwipe, Math.min(maxSwipe, gestureState.dx));
        
        // Only allow swipe in directions with actions
        if (gestureState.dx > 0 && !leftAction) return;
        if (gestureState.dx < 0 && !rightAction) return;
        
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        setSwiping(false);
        
        if (gestureState.dx > swipeThreshold && leftAction && onSwipeLeft) {
          // Swipe right - trigger left action
          Animated.timing(translateX, {
            toValue: 150,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeLeft();
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          });
        } else if (gestureState.dx < -swipeThreshold && rightAction && onSwipeRight) {
          // Swipe left - trigger right action
          Animated.timing(translateX, {
            toValue: -150,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeRight();
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  const leftActionOpacity = translateX.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [-swipeThreshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const leftActionScale = translateX.interpolate({
    inputRange: [0, swipeThreshold],
    outputRange: [0.5, 1],
    extrapolate: 'clamp',
  });

  const rightActionScale = translateX.interpolate({
    inputRange: [-swipeThreshold, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.swipeableContainer, style]}>
      {/* Left action background */}
      {leftAction && (
        <Animated.View
          style={[
            styles.swipeAction,
            styles.swipeActionLeft,
            {
              backgroundColor: leftAction.backgroundColor,
              opacity: leftActionOpacity,
              transform: [{ scale: leftActionScale }],
            },
          ]}
        >
          <Ionicons name={leftAction.icon} size={24} color={leftAction.color} />
          {leftAction.label && (
            <Text style={[styles.swipeActionLabel, { color: leftAction.color }]}>{leftAction.label}</Text>
          )}
        </Animated.View>
      )}

      {/* Right action background */}
      {rightAction && (
        <Animated.View
          style={[
            styles.swipeAction,
            styles.swipeActionRight,
            {
              backgroundColor: rightAction.backgroundColor,
              opacity: rightActionOpacity,
              transform: [{ scale: rightActionScale }],
            },
          ]}
        >
          <Ionicons name={rightAction.icon} size={24} color={rightAction.color} />
          {rightAction.label && (
            <Text style={[styles.swipeActionLabel, { color: rightAction.color }]}>{rightAction.label}</Text>
          )}
        </Animated.View>
      )}

      {/* Main content */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.swipeableContent,
          {
            backgroundColor: colors.card,
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/**
 * Tab Selector with animated indicator
 */
interface AnimatedTabsProps {
  tabs: string[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedTabs({ tabs, activeIndex, onTabChange, style }: AnimatedTabsProps) {
  const { colors } = useAppTheme();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = 100 / tabs.length;

  React.useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [activeIndex]);

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => `${i * tabWidth}%`),
  });

  return (
    <View style={[styles.tabsContainer, { backgroundColor: colors.surfaceVariant }, style]}>
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            width: `${tabWidth}%`,
            backgroundColor: colors.primary,
            transform: [{ translateX: indicatorAnim.interpolate({
              inputRange: [0, tabs.length - 1],
              outputRange: [0, (tabs.length - 1) * (100 / tabs.length) * 3.5], // Approximate pixel calculation
            }) }],
          },
        ]}
      />

      {/* Tabs */}
      {tabs.map((tab, index) => (
        <Pressable
          key={tab}
          style={styles.tab}
          onPress={() => onTabChange(index)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeIndex === index ? '#fff' : colors.text },
            ]}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },

  // Card styles
  card: {
    borderRadius: 16,
    padding: 16,
    shadowRadius: 8,
  },

  // Swipeable styles
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeableContent: {
    zIndex: 1,
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  swipeActionLeft: {
    left: 0,
  },
  swipeActionRight: {
    right: 0,
  },
  swipeActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InteractiveButton;
