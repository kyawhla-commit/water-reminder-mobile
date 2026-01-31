import { useAppTheme } from '@/hooks/useAppTheme';
import { formatWaterAmount } from '@/utils';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WaterProgressProps {
  current: number;
  goal: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function WaterProgress({ current, goal, size = 200 }: WaterProgressProps) {
  const { colors, isDark } = useAppTheme();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const progress = Math.min(current / goal, 1);
  const percentage = Math.round(progress * 100);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (progress >= 1) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [progress]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const fillPercentage = Math.round(progress * 100);

  return (
    <Animated.View style={[styles.container, { width: size, height: size, transform: [{ scale: scaleAnim }] }]}>
      {/* Background Circle */}
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

      {/* Water Fill */}
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
        <View
          style={[
            styles.waterFill,
            {
              backgroundColor: isDark ? '#2196F3' : '#4FC3F7',
              height: `${fillPercentage}%`,
            },
          ]}
        >
          <View style={[styles.wave, { backgroundColor: isDark ? '#1E88E5' : '#29B6F6' }]} />
          <View style={[styles.wave2, { backgroundColor: isDark ? '#1976D2' : '#03A9F4' }]} />
        </View>
      </View>

      {/* SVG Progress Ring */}
      <Svg width={size} height={size} style={styles.svgContainer}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center Text */}
      <View style={styles.centerContent}>
        <Text style={[styles.percentageText, { color: colors.text }]}>{percentage}%</Text>
        <Text style={[styles.amountText, { color: colors.textSecondary }]}>
          {formatWaterAmount(current)} / {formatWaterAmount(goal)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  },
  wave: {
    position: 'absolute',
    top: -5,
    left: 0,
    right: 0,
    height: 10,
    borderRadius: 5,
  },
  wave2: {
    position: 'absolute',
    top: -3,
    left: '10%',
    right: '10%',
    height: 6,
    borderRadius: 3,
  },
  svgContainer: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  amountText: {
    fontSize: 14,
    marginTop: 4,
  },
});
