import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface WaterFillAnimationProps {
  fillPercentage: number;
  size?: number;
  animated?: boolean;
  showWaves?: boolean;
  onFillComplete?: () => void;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function WaterFillAnimation({
  fillPercentage,
  size = 150,
  animated = true,
  showWaves = true,
  onFillComplete,
}: WaterFillAnimationProps) {
  const { colors, isDark } = useAppTheme();

  const fillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  const clampedFill = Math.min(Math.max(fillPercentage, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(fillAnim, {
        toValue: clampedFill,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        if (clampedFill >= 100 && onFillComplete) {
          onFillComplete();
        }
      });
    } else {
      fillAnim.setValue(clampedFill);
    }
  }, [clampedFill, animated]);

  useEffect(() => {
    if (showWaves) {
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showWaves]);

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size],
  });

  const bubbleTranslateY = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * 0.6],
  });

  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.8, 0.4, 0],
  });

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, size - 20],
  });

  const waterColor = isDark ? '#2196F3' : '#4FC3F7';
  const waveColor = isDark ? '#1E88E5' : '#29B6F6';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glass container */}
      <View
        style={[
          styles.glass,
          {
            width: size * 0.7,
            height: size * 0.85,
            borderColor: isDark ? colors.border : '#B3E5FC',
            backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(79, 195, 247, 0.1)',
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
          {/* Wave effect */}
          {showWaves && (
            <Animated.View
              style={[
                styles.waveContainer,
                {
                  transform: [{ translateX: waveTranslateX }],
                },
              ]}
            >
              <Svg width={size * 2} height={20} style={styles.wave}>
                <Defs>
                  <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={waveColor} stopOpacity="0.8" />
                    <Stop offset="100%" stopColor={waterColor} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Path
                  d={`M0,10 Q${size * 0.25},0 ${size * 0.5},10 T${size},10 T${size * 1.5},10 T${size * 2},10 L${size * 2},20 L0,20 Z`}
                  fill="url(#waveGradient)"
                />
              </Svg>
            </Animated.View>
          )}
        </Animated.View>

        {/* Bubbles */}
        {showWaves && clampedFill > 10 && (
          <>
            <Animated.View
              style={[
                styles.bubble,
                {
                  left: '20%',
                  bottom: '10%',
                  width: 6,
                  height: 6,
                  opacity: bubbleOpacity,
                  transform: [{ translateY: bubbleTranslateY }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.bubble,
                {
                  left: '60%',
                  bottom: '15%',
                  width: 4,
                  height: 4,
                  opacity: bubbleOpacity,
                  transform: [
                    {
                      translateY: Animated.multiply(bubbleTranslateY, 0.7),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.bubble,
                {
                  left: '40%',
                  bottom: '5%',
                  width: 5,
                  height: 5,
                  opacity: bubbleOpacity,
                  transform: [
                    {
                      translateY: Animated.multiply(bubbleTranslateY, 1.2),
                    },
                  ],
                },
              ]}
            />
          </>
        )}
      </View>

      {/* Glass shine effect */}
      <View
        style={[
          styles.shine,
          {
            left: size * 0.2,
            height: size * 0.5,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glass: {
    borderWidth: 3,
    borderRadius: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
    top: -10,
    left: 0,
    width: '200%',
  },
  wave: {
    position: 'absolute',
    top: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 50,
  },
  shine: {
    position: 'absolute',
    top: '15%',
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
});

export default WaterFillAnimation;
