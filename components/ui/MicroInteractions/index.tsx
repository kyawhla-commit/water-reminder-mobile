import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useCallback, useRef } from 'react';
import {
    Animated,
    Easing,
    Pressable,
    PressableProps,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

/**
 * Pressable with scale animation on press
 */
interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  duration?: number;
}

export function ScalePressable({
  children,
  style,
  scaleValue = 0.96,
  duration = 100,
  onPressIn,
  onPressOut,
  ...props
}: ScalePressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: scaleValue,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
      onPressIn?.(e);
    },
    [scaleValue, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
      onPressOut?.(e);
    },
    [onPressOut]
  );

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * Pressable with bounce animation
 */
interface BouncePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BouncePressable({ children, style, onPress, ...props }: BouncePressableProps) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(
    (e: any) => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 12,
        }),
      ]).start();
      onPress?.(e);
    },
    [onPress]
  );

  return (
    <Pressable onPress={handlePress} {...props}>
      <Animated.View style={[style, { transform: [{ scale: bounceAnim }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * Pressable with highlight/ripple effect
 */
interface HighlightPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlightColor?: string;
}

export function HighlightPressable({ children, style, highlightColor, ...props }: HighlightPressableProps) {
  const { colors } = useAppTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const color = highlightColor || colors.highlight;

  const handlePressIn = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      <View style={style}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: color,
              opacity: opacityAnim,
              borderRadius: (style as any)?.borderRadius || 0,
            },
          ]}
        />
        {children}
      </View>
    </Pressable>
  );
}

/**
 * Animated icon that rotates on press
 */
interface SpinIconProps {
  children: React.ReactNode;
  spinning?: boolean;
  duration?: number;
}

export function SpinIcon({ children, spinning = false, duration = 1000 }: SpinIconProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (spinning) {
      animationRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      spinAnim.setValue(0);
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [spinning, duration]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

/**
 * Pulse animation for attention-grabbing elements
 */
interface PulseViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pulsing?: boolean;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}

export function PulseView({
  children,
  style,
  pulsing = true,
  minScale = 0.97,
  maxScale = 1.03,
  duration = 1500,
}: PulseViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (pulsing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: maxScale,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: minScale,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [pulsing, minScale, maxScale, duration]);

  return <Animated.View style={[style, { transform: [{ scale: pulseAnim }] }]}>{children}</Animated.View>;
}

/**
 * Shake animation for error states
 */
interface ShakeViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shake?: boolean;
  intensity?: number;
}

export function ShakeView({ children, style, shake = false, intensity = 10 }: ShakeViewProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (shake) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: intensity / 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -intensity / 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shake, intensity]);

  return (
    <Animated.View style={[style, { transform: [{ translateX: shakeAnim }] }]}>{children}</Animated.View>
  );
}

/**
 * Fade in animation on mount
 */
interface FadeInViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  delay?: number;
}

export function FadeInView({ children, style, duration = 300, delay = 0 }: FadeInViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, delay]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Staggered fade in for lists
 */
interface StaggeredListProps {
  children: React.ReactNode[];
  style?: StyleProp<ViewStyle>;
  staggerDelay?: number;
  itemDuration?: number;
}

export function StaggeredList({ children, style, staggerDelay = 50, itemDuration = 300 }: StaggeredListProps) {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeInView delay={index * staggerDelay} duration={itemDuration}>
          {child}
        </FadeInView>
      ))}
    </View>
  );
}

/**
 * Number counter animation
 */
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: any;
  formatValue?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 500,
  style,
  formatValue = (v) => Math.round(v).toString(),
}: AnimatedNumberProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(formatValue(0));

  React.useEffect(() => {
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(formatValue(v));
    });

    Animated.timing(animValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listener);
    };
  }, [value, duration, formatValue]);

  return <Animated.Text style={style}>{displayValue}</Animated.Text>;
}

export default ScalePressable;
