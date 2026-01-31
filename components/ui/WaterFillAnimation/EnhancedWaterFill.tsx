import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface EnhancedWaterFillProps {
  current: number;
  goal: number;
  size?: number;
  showRippleOnChange?: boolean;
  onGoalReached?: () => void;
}

export function EnhancedWaterFill({
  current,
  goal,
  size = 200,
  showRippleOnChange = true,
  onGoalReached,
}: EnhancedWaterFillProps) {
  const { colors, isDark } = useAppTheme();

  const fillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const bubbleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const [prevCurrent, setPrevCurrent] = useState(current);
  const [showRipple, setShowRipple] = useState(false);

  const progress = Math.min(current / goal, 1);
  const percentage = Math.round(progress * 100);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const innerSize = size - strokeWidth * 2 - 8;

  // Detect water added
  useEffect(() => {
    if (current > prevCurrent && showRippleOnChange) {
      triggerRipple();
    }
    setPrevCurrent(current);

    // Animate fill
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Goal reached celebration
    if (progress >= 1 && prevCurrent / goal < 1) {
      celebrateGoal();
      onGoalReached?.();
    }
  }, [current, goal]);

  // Continuous wave animations
  useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(wave2Anim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Bubble animations
    bubbleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000 + index * 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const triggerRipple = () => {
    setShowRipple(true);
    rippleAnim.setValue(0);
    rippleOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]),
    ]).start(() => setShowRipple(false));
  };

  const celebrateGoal = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]),
    ]).start();
  };

  const strokeDashoffset = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, innerSize],
  });

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -innerSize],
  });

  const wave2TranslateX = wave2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-innerSize / 2, -innerSize * 1.5],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  const waterColor = isDark ? '#2196F3' : '#4FC3F7';
  const waveColor = isDark ? '#1E88E5' : '#29B6F6';
  const wave2Color = isDark ? '#1976D2' : '#03A9F4';

  return (
    <Animated.View style={[styles.container, { width: size, height: size, transform: [{ scale: scaleAnim }] }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            backgroundColor: colors.primary,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
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

      {/* Water container */}
      <View
        style={[
          styles.waterContainer,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {/* Water fill */}
        <Animated.View
          style={[
            styles.waterFill,
            {
              height: fillHeight,
              backgroundColor: waterColor,
            },
          ]}
        >
          {/* Wave 1 */}
          <Animated.View
            style={[
              styles.waveContainer,
              {
                transform: [{ translateX: waveTranslateX }],
              },
            ]}
          >
            <Svg width={innerSize * 2} height={16} style={styles.wave}>
              <Defs>
                <LinearGradient id="wave1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={waveColor} stopOpacity="0.9" />
                  <Stop offset="100%" stopColor={waterColor} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path
                d={`M0,8 Q${innerSize * 0.25},0 ${innerSize * 0.5},8 T${innerSize},8 T${innerSize * 1.5},8 T${innerSize * 2},8 L${innerSize * 2},16 L0,16 Z`}
                fill="url(#wave1Grad)"
              />
            </Svg>
          </Animated.View>

          {/* Wave 2 (offset) */}
          <Animated.View
            style={[
              styles.waveContainer,
              styles.wave2,
              {
                transform: [{ translateX: wave2TranslateX }],
              },
            ]}
          >
            <Svg width={innerSize * 2} height={12} style={styles.wave}>
              <Path
                d={`M0,6 Q${innerSize * 0.2},0 ${innerSize * 0.4},6 T${innerSize * 0.8},6 T${innerSize * 1.2},6 T${innerSize * 1.6},6 T${innerSize * 2},6 L${innerSize * 2},12 L0,12 Z`}
                fill={wave2Color}
                opacity={0.6}
              />
            </Svg>
          </Animated.View>

          {/* Bubbles */}
          {bubbleAnims.map((anim, index) => {
            const bubbleY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -innerSize * 0.7],
            });
            const bubbleOpacity = anim.interpolate({
              inputRange: [0, 0.3, 0.8, 1],
              outputRange: [0, 0.8, 0.4, 0],
            });
            const positions = ['15%', '30%', '50%', '65%', '80%'] as const;
            const sizes = [6, 4, 8, 5, 7];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.bubble,
                  {
                    left: positions[index] as `${number}%`,
                    bottom: '5%',
                    width: sizes[index],
                    height: sizes[index],
                    borderRadius: sizes[index] / 2,
                    opacity: bubbleOpacity,
                    transform: [{ translateY: bubbleY }],
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Ripple effect */}
        {showRipple && (
          <Animated.View
            style={[
              styles.ripple,
              {
                width: innerSize * 0.6,
                height: innerSize * 0.2,
                borderColor: waterColor,
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
        )}
      </View>

      {/* Progress ring */}
      <Svg width={size} height={size} style={styles.svgRing}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke="url(#ringGrad)"
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
        <Text style={[styles.percentageText, { color: colors.text }]}>{percentage}%</Text>
        <Text style={[styles.amountText, { color: colors.textSecondary }]}>
          {current} / {goal} ml
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
  waveContainer: {
    position: 'absolute',
    top: -8,
    left: 0,
    width: '200%',
  },
  wave2: {
    top: -4,
  },
  wave: {
    position: 'absolute',
    top: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  ripple: {
    position: 'absolute',
    top: '10%',
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 100,
  },
  svgRing: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 36,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default EnhancedWaterFill;
