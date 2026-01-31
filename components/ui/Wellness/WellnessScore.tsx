import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WellnessScoreProps {
  score: number; // 0-100
  size?: number;
  showGrade?: boolean;
  animated?: boolean;
}

export function WellnessScoreRing({ score, size = 180, showGrade = true, animated = true }: WellnessScoreProps) {
  const { colors } = useAppTheme();
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const clamped = Math.min(Math.max(score, 0), 100);
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(scoreAnim, { toValue: clamped, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.loop(Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
        ])),
      ]).start();
    } else {
      scoreAnim.setValue(clamped);
    }
  }, [clamped, animated]);

  const getScoreColor = () => {
    if (clamped >= 90) return '#4CAF50';
    if (clamped >= 75) return '#8BC34A';
    if (clamped >= 60) return '#FFC107';
    if (clamped >= 40) return '#FF9800';
    return '#F44336';
  };

  const getGrade = () => {
    if (clamped >= 90) return { grade: 'A', emoji: '🏆', label: 'Excellent' };
    if (clamped >= 75) return { grade: 'B', emoji: '⭐', label: 'Great' };
    if (clamped >= 60) return { grade: 'C', emoji: '👍', label: 'Good' };
    if (clamped >= 40) return { grade: 'D', emoji: '💪', label: 'Keep Going' };
    return { grade: 'F', emoji: '🎯', label: 'Needs Work' };
  };

  const scoreColor = getScoreColor();
  const gradeInfo = getGrade();

  const strokeDashoffset = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const [displayScore, setDisplayScore] = React.useState(0);
  useEffect(() => {
    const listener = scoreAnim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => scoreAnim.removeListener(listener);
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, { width: size + 40, height: size + 40, borderRadius: (size + 40) / 2, backgroundColor: scoreColor, opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] }) }]} />
      
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={scoreColor} />
            <Stop offset="100%" stopColor={scoreColor} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceVariant} strokeWidth={strokeWidth} fill="none" />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
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
      <View style={[styles.centerContent, { width: size, height: size }]}>
        {showGrade && <Text style={styles.gradeEmoji}>{gradeInfo.emoji}</Text>}
        <Text style={[styles.scoreValue, { color: scoreColor, fontSize: size * 0.22 }]}>{displayScore}</Text>
        <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Wellness Score</Text>
        {showGrade && (
          <View style={[styles.gradeBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.gradeText, { color: scoreColor }]}>Grade {gradeInfo.grade}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

interface MiniScoreProps {
  label: string;
  score: number;
  icon: string;
  color: string;
}

export function MiniWellnessScore({ label, score, icon, color }: MiniScoreProps) {
  const { colors } = useAppTheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: score, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [score]);

  const animatedWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.miniContainer}>
      <View style={styles.miniHeader}>
        <Text style={styles.miniIcon}>{icon}</Text>
        <Text style={[styles.miniLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.miniScore, { color }]}>{score}%</Text>
      </View>
      <View style={[styles.miniTrack, { backgroundColor: colors.surfaceVariant }]}>
        <Animated.View style={[styles.miniFill, { width: animatedWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  centerContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gradeEmoji: { fontSize: 32, marginBottom: 4 },
  scoreValue: { fontWeight: '800' },
  scoreLabel: { fontSize: 12, marginTop: 4 },
  gradeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginTop: 8 },
  gradeText: { fontSize: 13, fontWeight: '700' },
  miniContainer: { marginBottom: 16 },
  miniHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniIcon: { fontSize: 20, marginRight: 8 },
  miniLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  miniScore: { fontSize: 16, fontWeight: '700' },
  miniTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 4 },
});

export default WellnessScoreRing;