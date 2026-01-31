import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface OnboardingWaterProgressProps {
  targetAmount: number;
  unit?: 'ml' | 'oz';
  animated?: boolean;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function OnboardingWaterProgress({
  targetAmount,
  unit = 'ml',
  animated = true,
  size = 220,
}: OnboardingWaterProgressProps) {
  const { colors, isDark } = useAppTheme();

  const fillAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      // Entry animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.parallel([
          // Fill animation
          Animated.timing(fillAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Count up animation
          Animated.timing(countAnim, {
            toValue: targetAmount,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        // Celebration pulse
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [animated, targetAmount]);

  const strokeDashoffset = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const displayAmount = countAnim.interpolate({
    inputRange: [0, targetAmount],
    outputRange: [0, targetAmount],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: colors.primary,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Background circle */}
      <View
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isDark ? '#1a2a3a' : '#e8f4fc',
          },
        ]}
      />

      {/* Water fill container */}
      <View
        style={[
          styles.waterContainer,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.waterFill,
            {
              height: fillHeight,
              backgroundColor: isDark ? '#2196F3' : '#4FC3F7',
            },
          ]}
        >
          {/* Animated waves */}
          <Animated.View
            style={[
              styles.waveWrapper,
              {
                transform: [{ translateX: waveTranslateX }],
              },
            ]}
          >
            <Svg width={size * 2} height={20} style={styles.waveSvg}>
              <Defs>
                <LinearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={isDark ? '#1E88E5' : '#29B6F6'} stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={isDark ? '#2196F3' : '#4FC3F7'} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path
                d={`M0,10 Q${size * 0.25},0 ${size * 0.5},10 T${size},10 T${size * 1.5},10 T${size * 2},10 L${size * 2},20 L0,20 Z`}
                fill="url(#waveGrad)"
              />
            </Svg>
          </Animated.View>

          {/* Bubbles */}
          <View style={[styles.bubble, styles.bubble1]} />
          <View style={[styles.bubble, styles.bubble2]} />
          <View style={[styles.bubble, styles.bubble3]} />
        </Animated.View>
      </View>

      {/* Progress ring */}
      <Svg width={size} height={size} style={styles.svgRing}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={isDark ? '#64B5F6' : '#2196F3'} />
            <Stop offset="100%" stopColor={isDark ? '#1976D2' : '#03A9F4'} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#2a3a4a' : '#d0e8f5'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Daily Goal</Text>
        <AnimatedText value={displayAmount} style={[styles.goalAmount, { color: colors.text }]} />
        <Text style={[styles.unitText, { color: colors.textSecondary }]}>{unit}</Text>
      </View>
    </Animated.View>
  );
}

// Helper component for animated number
function AnimatedText({ value, style }: { value: Animated.AnimatedInterpolation<number>; style: any }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const listener = value.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });
    return () => value.removeListener(listener);
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  waterContainer: {
    position: 'absolute',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterFill: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  waveWrapper: {
    position: 'absolute',
    top: -10,
    left: 0,
    width: '200%',
  },
  waveSvg: {
    position: 'absolute',
    top: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 50,
  },
  bubble1: {
    width: 8,
    height: 8,
    left: '20%',
    bottom: '20%',
  },
  bubble2: {
    width: 5,
    height: 5,
    left: '60%',
    bottom: '40%',
  },
  bubble3: {
    width: 6,
    height: 6,
    left: '40%',
    bottom: '60%',
  },
  svgRing: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  goalAmount: {
    fontSize: 42,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default OnboardingWaterProgress;
