import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

interface RippleProps {
  x: number;
  y: number;
  color: string;
  size: number;
  onComplete: () => void;
}

function Ripple({ x, y, color, size, onComplete }: RippleProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, []);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
}

interface RippleAnimationProps {
  color?: string;
  rippleSize?: number;
  style?: ViewStyle;
  children: React.ReactNode;
  onRipple?: () => void;
}

export function RippleAnimation({ color, rippleSize = 150, style, children, onRipple }: RippleAnimationProps) {
  const { colors } = useAppTheme();
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = useRef(0);

  const rippleColor = color || colors.primary;

  const triggerRipple = useCallback(
    (x: number, y: number) => {
      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev, { id, x, y }]);
      onRipple?.();
    },
    [onRipple]
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <View
      style={[styles.container, style]}
      onTouchEnd={(e) => {
        const { locationX, locationY } = e.nativeEvent;
        triggerRipple(locationX, locationY);
      }}
    >
      {children}
      {ripples.map((ripple) => (
        <Ripple
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          color={rippleColor}
          size={rippleSize}
          onComplete={() => removeRipple(ripple.id)}
        />
      ))}
    </View>
  );
}

// Water-specific ripple for adding water
interface WaterRippleEffectProps {
  trigger: number; // Change this value to trigger ripple
  size?: number;
  style?: ViewStyle;
}

export function WaterRippleEffect({ trigger, size = 120, style }: WaterRippleEffectProps) {
  const { colors, isDark } = useAppTheme();
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      setRipples((prev) => [...prev, trigger]);
    }
  }, [trigger]);

  const removeRipple = (id: number) => {
    setRipples((prev) => prev.filter((r) => r !== id));
  };

  const waterColor = isDark ? colors.primary : '#4FC3F7';

  return (
    <View style={[styles.waterRippleContainer, { width: size, height: size / 2 }, style]}>
      {ripples.map((id) => (
        <WaterRipple key={id} color={waterColor} size={size} onComplete={() => removeRipple(id)} />
      ))}
    </View>
  );
}

function WaterRipple({ color, size, onComplete }: { color: string; size: number; onComplete: () => void }) {
  const ring1Scale = useRef(new Animated.Value(0.3)).current;
  const ring2Scale = useRef(new Animated.Value(0.3)).current;
  const ring3Scale = useRef(new Animated.Value(0.3)).current;
  const ring1Opacity = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0.6)).current;
  const ring3Opacity = useRef(new Animated.Value(0.4)).current;
  const splashY = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Splash droplets going up
    Animated.parallel([
      Animated.timing(splashY, {
        toValue: -30,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Ripple rings expanding
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ring3Scale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ring3Opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(onComplete);
  }, []);

  return (
    <View style={styles.waterRipple}>
      {/* Splash droplets */}
      <Animated.View
        style={[
          styles.splashContainer,
          {
            opacity: splashOpacity,
            transform: [{ translateY: splashY }],
          },
        ]}
      >
        <View style={[styles.splashDrop, { backgroundColor: color, left: -15 }]} />
        <View style={[styles.splashDrop, styles.splashDropCenter, { backgroundColor: color }]} />
        <View style={[styles.splashDrop, { backgroundColor: color, right: -15 }]} />
      </Animated.View>

      {/* Ripple rings */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size / 3,
            borderColor: color,
            opacity: ring1Opacity,
            transform: [{ scaleX: ring1Scale }, { scaleY: ring1Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 0.7,
            height: size / 4,
            borderColor: color,
            opacity: ring2Opacity,
            transform: [{ scaleX: ring2Scale }, { scaleY: ring2Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 0.4,
            height: size / 6,
            borderColor: color,
            opacity: ring3Opacity,
            transform: [{ scaleX: ring3Scale }, { scaleY: ring3Scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
  },
  waterRippleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  waterRipple: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 100,
  },
  splashContainer: {
    position: 'absolute',
    top: -20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  splashDrop: {
    width: 6,
    height: 10,
    borderRadius: 3,
    position: 'absolute',
  },
  splashDropCenter: {
    width: 8,
    height: 14,
    borderRadius: 4,
  },
});

export default RippleAnimation;
