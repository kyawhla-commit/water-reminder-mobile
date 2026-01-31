import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Water Drop Character - Friendly mascot illustration
 */
interface WaterDropCharacterProps {
  size?: number;
  mood?: 'happy' | 'thirsty' | 'celebrating' | 'sleeping';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function WaterDropCharacter({
  size = 120,
  mood = 'happy',
  animated = true,
  style,
}: WaterDropCharacterProps) {
  const { colors, isDark } = useAppTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blink animation
    const blinkInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, [animated]);

  const getMoodFace = () => {
    switch (mood) {
      case 'thirsty':
        return { eyeY: 45, mouthPath: 'M 40 65 Q 50 60 60 65', blush: false };
      case 'celebrating':
        return { eyeY: 42, mouthPath: 'M 35 60 Q 50 75 65 60', blush: true };
      case 'sleeping':
        return { eyeY: 45, mouthPath: 'M 42 65 L 58 65', blush: false, eyesClosed: true };
      default:
        return { eyeY: 45, mouthPath: 'M 38 62 Q 50 72 62 62', blush: true };
    }
  };

  const face = getMoodFace();
  const primaryColor = isDark ? '#64B5F6' : '#2196F3';
  const secondaryColor = isDark ? '#90CAF9' : '#64B5F6';

  return (
    <Animated.View style={[{ transform: [{ translateY: bounceAnim }] }, style]}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
        <Defs>
          <LinearGradient id="dropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={secondaryColor} />
            <Stop offset="100%" stopColor={primaryColor} />
          </LinearGradient>
          <LinearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Drop body */}
        <Path
          d="M 50 10 Q 20 50 20 70 Q 20 95 50 95 Q 80 95 80 70 Q 80 50 50 10"
          fill="url(#dropGradient)"
        />

        {/* Shine */}
        <Ellipse cx="35" cy="50" rx="8" ry="12" fill="url(#shineGradient)" />

        {/* Eyes */}
        {face.eyesClosed ? (
          <>
            <Path d="M 35 45 Q 38 48 41 45" stroke="#333" strokeWidth="2" fill="none" />
            <Path d="M 59 45 Q 62 48 65 45" stroke="#333" strokeWidth="2" fill="none" />
          </>
        ) : (
          <Animated.View style={{ opacity: blinkAnim }}>
            <G>
              <Circle cx="38" cy={face.eyeY} r="5" fill="#333" />
              <Circle cx="62" cy={face.eyeY} r="5" fill="#333" />
              <Circle cx="40" cy={face.eyeY - 2} r="2" fill="#fff" />
              <Circle cx="64" cy={face.eyeY - 2} r="2" fill="#fff" />
            </G>
          </Animated.View>
        )}

        {/* Blush */}
        {face.blush && (
          <>
            <Ellipse cx="28" cy="55" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
            <Ellipse cx="72" cy="55" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
          </>
        )}

        {/* Mouth */}
        <Path d={face.mouthPath} stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Celebration sparkles */}
        {mood === 'celebrating' && (
          <>
            <Path d="M 15 25 L 18 20 L 21 25 L 18 22 Z" fill="#FFD700" />
            <Path d="M 82 30 L 85 25 L 88 30 L 85 27 Z" fill="#FFD700" />
            <Circle cx="10" cy="40" r="3" fill="#FF69B4" />
            <Circle cx="90" cy="45" r="3" fill="#FF69B4" />
          </>
        )}

        {/* Thirsty sweat drop */}
        {mood === 'thirsty' && (
          <Path d="M 75 35 Q 72 42 75 48 Q 78 42 75 35" fill="#87CEEB" />
        )}

        {/* Sleep Zs */}
        {mood === 'sleeping' && (
          <>
            <Path d="M 75 30 L 82 30 L 75 38 L 82 38" stroke="#666" strokeWidth="2" fill="none" />
            <Path d="M 85 20 L 90 20 L 85 26 L 90 26" stroke="#666" strokeWidth="1.5" fill="none" />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

/**
 * Empty State Illustration - For when there's no data
 */
interface EmptyStateIllustrationProps {
  type?: 'noData' | 'noHistory' | 'success' | 'error';
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function EmptyStateIllustration({
  type = 'noData',
  size = 150,
  style,
}: EmptyStateIllustrationProps) {
  const { colors, isDark } = useAppTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const bgColor = isDark ? '#1E3A5F' : '#E3F2FD';
  const primaryColor = isDark ? '#64B5F6' : '#2196F3';

  const renderIllustration = () => {
    switch (type) {
      case 'noHistory':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            {/* Calendar/chart icon */}
            <Rect x="20" y="25" width="60" height="55" rx="8" fill={bgColor} stroke={primaryColor} strokeWidth="2" />
            <Rect x="20" y="25" width="60" height="15" rx="8" fill={primaryColor} />
            <Circle cx="35" cy="20" r="4" fill={primaryColor} />
            <Circle cx="65" cy="20" r="4" fill={primaryColor} />
            {/* Empty bars */}
            <Rect x="30" y="50" width="8" height="20" rx="2" fill={isDark ? '#2D4A6F' : '#BBDEFB'} />
            <Rect x="46" y="55" width="8" height="15" rx="2" fill={isDark ? '#2D4A6F' : '#BBDEFB'} />
            <Rect x="62" y="60" width="8" height="10" rx="2" fill={isDark ? '#2D4A6F' : '#BBDEFB'} />
          </Svg>
        );
      case 'success':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" fill="#4CAF50" opacity="0.2" />
            <Circle cx="50" cy="50" r="30" fill="#4CAF50" />
            <Path d="M 35 50 L 45 60 L 65 40" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );
      case 'error':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" fill="#F44336" opacity="0.2" />
            <Circle cx="50" cy="50" r="30" fill="#F44336" />
            <Path d="M 38 38 L 62 62 M 62 38 L 38 62" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
          </Svg>
        );
      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100">
            {/* Glass outline */}
            <Path
              d="M 25 20 L 30 85 Q 30 90 35 90 L 65 90 Q 70 90 70 85 L 75 20 Z"
              fill={bgColor}
              stroke={primaryColor}
              strokeWidth="2"
            />
            {/* Water drops around */}
            <Circle cx="15" cy="40" r="5" fill={primaryColor} opacity="0.5" />
            <Circle cx="85" cy="50" r="4" fill={primaryColor} opacity="0.5" />
            <Circle cx="20" cy="70" r="3" fill={primaryColor} opacity="0.5" />
            {/* Question mark */}
            <Path
              d="M 45 45 Q 45 35 50 35 Q 58 35 58 42 Q 58 48 50 50 L 50 55"
              stroke={primaryColor}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx="50" cy="62" r="2.5" fill={primaryColor} />
          </Svg>
        );
    }
  };

  return (
    <Animated.View style={[{ transform: [{ translateY: floatAnim }] }, style]}>
      {renderIllustration()}
    </Animated.View>
  );
}

/**
 * Achievement Badge Illustration
 */
interface AchievementBadgeProps {
  type: 'streak' | 'goal' | 'hydration' | 'consistency';
  level?: 'bronze' | 'silver' | 'gold';
  size?: number;
  unlocked?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AchievementBadge({
  type,
  level = 'bronze',
  size = 80,
  unlocked = true,
  style,
}: AchievementBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(unlocked ? 1 : 0.9)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [unlocked]);

  const levelColors = {
    bronze: { primary: '#CD7F32', secondary: '#8B4513' },
    silver: { primary: '#C0C0C0', secondary: '#808080' },
    gold: { primary: '#FFD700', secondary: '#DAA520' },
  };

  const colors = levelColors[level];

  const getIcon = () => {
    switch (type) {
      case 'streak':
        return <Path d="M 40 55 L 40 35 L 50 25 L 60 35 L 60 55" stroke="#fff" strokeWidth="3" fill="none" />;
      case 'goal':
        return <Path d="M 35 50 L 45 60 L 65 40" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'hydration':
        return <Path d="M 50 30 Q 35 45 35 55 Q 35 70 50 70 Q 65 70 65 55 Q 65 45 50 30" fill="#fff" />;
      case 'consistency':
        return (
          <>
            <Circle cx="40" cy="50" r="6" fill="#fff" />
            <Circle cx="60" cy="50" r="6" fill="#fff" />
            <Circle cx="50" cy="38" r="6" fill="#fff" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: unlocked ? 1 : 0.4 }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`badge-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.secondary} />
          </LinearGradient>
        </Defs>

        {/* Badge shape */}
        <Circle cx="50" cy="50" r="40" fill={`url(#badge-${level})`} />
        <Circle cx="50" cy="50" r="35" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />

        {/* Icon */}
        {getIcon()}

        {/* Locked overlay */}
        {!unlocked && (
          <>
            <Circle cx="50" cy="50" r="40" fill="#000" opacity="0.5" />
            <Path d="M 40 55 L 40 48 Q 40 38 50 38 Q 60 38 60 48 L 60 55 Z" fill="#666" />
            <Rect x="35" y="52" width="30" height="20" rx="3" fill="#888" />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

/**
 * Motivational Scene Illustration
 */
interface MotivationalSceneProps {
  scene: 'morning' | 'workout' | 'relax' | 'night';
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function MotivationalScene({ scene, size = 200, style }: MotivationalSceneProps) {
  const { isDark } = useAppTheme();

  const getSceneColors = () => {
    switch (scene) {
      case 'morning':
        return { sky: '#FFE4B5', sun: '#FFD700', ground: '#90EE90' };
      case 'workout':
        return { sky: '#87CEEB', sun: '#FFA500', ground: '#98FB98' };
      case 'relax':
        return { sky: '#E6E6FA', sun: '#DDA0DD', ground: '#F0FFF0' };
      case 'night':
        return { sky: '#191970', sun: '#F5F5DC', ground: '#2F4F4F' };
      default:
        return { sky: '#87CEEB', sun: '#FFD700', ground: '#90EE90' };
    }
  };

  const sceneColors = getSceneColors();

  return (
    <View style={style}>
      <Svg width={size} height={size * 0.6} viewBox="0 0 200 120">
        {/* Sky */}
        <Rect x="0" y="0" width="200" height="80" fill={sceneColors.sky} />

        {/* Sun/Moon */}
        <Circle cx="160" cy="30" r="20" fill={sceneColors.sun} />
        {scene === 'night' && (
          <Circle cx="150" cy="25" r="18" fill={sceneColors.sky} />
        )}

        {/* Ground */}
        <Ellipse cx="100" cy="120" rx="120" ry="50" fill={sceneColors.ground} />

        {/* Water glass */}
        <Path
          d="M 85 60 L 88 100 Q 88 105 93 105 L 107 105 Q 112 105 112 100 L 115 60 Z"
          fill={isDark ? '#64B5F6' : '#2196F3'}
          opacity="0.8"
        />
        <Path
          d="M 85 60 L 115 60"
          stroke={isDark ? '#90CAF9' : '#64B5F6'}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Decorative elements based on scene */}
        {scene === 'morning' && (
          <>
            <Path d="M 30 90 Q 35 70 40 90" stroke="#228B22" strokeWidth="2" fill="none" />
            <Path d="M 170 85 Q 175 65 180 85" stroke="#228B22" strokeWidth="2" fill="none" />
          </>
        )}
        {scene === 'workout' && (
          <>
            <Ellipse cx="50" cy="95" rx="15" ry="8" fill="#FF6347" opacity="0.7" />
            <Rect x="45" y="80" width="10" height="15" fill="#FF6347" />
          </>
        )}
        {scene === 'night' && (
          <>
            <Circle cx="30" cy="20" r="1" fill="#fff" />
            <Circle cx="50" cy="35" r="1.5" fill="#fff" />
            <Circle cx="80" cy="15" r="1" fill="#fff" />
            <Circle cx="120" cy="25" r="1.5" fill="#fff" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WaterDropCharacter;
