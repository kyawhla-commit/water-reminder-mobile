import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface WelcomeAnimationProps {
  onAnimationComplete?: () => void;
  title?: string;
  subtitle?: string;
}

export function WelcomeAnimation({
  onAnimationComplete,
  title = 'Welcome',
  subtitle = 'Stay hydrated, stay healthy',
}: WelcomeAnimationProps) {
  const { colors, isDark } = useAppTheme();

  const dropletScale = useRef(new Animated.Value(0)).current;
  const dropletY = useRef(new Animated.Value(-50)).current;
  const splashScale = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Droplet falls and bounces
    Animated.sequence([
      Animated.parallel([
        Animated.spring(dropletScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(dropletY, {
          toValue: 0,
          duration: 600,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]),
      // Splash effect
      Animated.parallel([
        Animated.timing(splashScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(splashOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Title appears
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ]),
      // Subtitle appears
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete?.();
    });

    // Continuous wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  });

  return (
    <View style={styles.container}>
      {/* Water droplet */}
      <Animated.View
        style={[
          styles.dropletContainer,
          {
            transform: [{ scale: dropletScale }, { translateY: dropletY }],
          },
        ]}
      >
        <Svg width={100} height={120} viewBox="0 0 100 120">
          <Defs>
            <LinearGradient id="dropletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#64B5F6' : '#4FC3F7'} />
              <Stop offset="100%" stopColor={isDark ? '#1976D2' : '#2196F3'} />
            </LinearGradient>
          </Defs>
          <Path
            d="M50 10 C50 10 85 55 85 75 C85 95 70 110 50 110 C30 110 15 95 15 75 C15 55 50 10 50 10"
            fill="url(#dropletGradient)"
          />
          {/* Shine effect */}
          <Circle cx="35" cy="60" r="8" fill="rgba(255,255,255,0.4)" />
          <Circle cx="30" cy="70" r="4" fill="rgba(255,255,255,0.3)" />
        </Svg>
      </Animated.View>

      {/* Splash ripples */}
      <Animated.View
        style={[
          styles.splashContainer,
          {
            opacity: splashOpacity,
            transform: [{ scale: splashScale }],
          },
        ]}
      >
        <View style={[styles.ripple, styles.ripple1, { borderColor: colors.primary }]} />
        <View style={[styles.ripple, styles.ripple2, { borderColor: colors.primary }]} />
        <View style={[styles.ripple, styles.ripple3, { borderColor: colors.primary }]} />
      </Animated.View>

      {/* Wave decoration */}
      <Animated.View
        style={[
          styles.waveContainer,
          {
            transform: [{ translateX: waveTranslateX }],
          },
        ]}
      >
        <Svg width={400} height={40} viewBox="0 0 400 40">
          <Path
            d="M0,20 Q50,0 100,20 T200,20 T300,20 T400,20 L400,40 L0,40 Z"
            fill={isDark ? 'rgba(33, 150, 243, 0.2)' : 'rgba(79, 195, 247, 0.3)'}
          />
        </Svg>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            color: colors.text,
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          },
        ]}
      >
        {title}
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            color: colors.textSecondary,
            opacity: subtitleOpacity,
          },
        ]}
      >
        {subtitle}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  dropletContainer: {
    marginBottom: 20,
  },
  splashContainer: {
    position: 'absolute',
    top: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 100,
  },
  ripple1: {
    width: 60,
    height: 30,
    opacity: 0.6,
  },
  ripple2: {
    width: 100,
    height: 50,
    opacity: 0.4,
  },
  ripple3: {
    width: 140,
    height: 70,
    opacity: 0.2,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 60,
    width: 400,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default WelcomeAnimation;
