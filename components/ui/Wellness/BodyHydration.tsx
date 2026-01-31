import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

interface BodyHydrationProps {
  hydrationLevel: number; // 0-100
  showLabels?: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function BodyHydration({ hydrationLevel, showLabels = true }: BodyHydrationProps) {
  const { colors, isDark } = useAppTheme();
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const clamped = Math.min(Math.max(hydrationLevel, 0), 100);

  useEffect(() => {
    Animated.timing(fillAnim, { toValue: clamped, duration: 1500, useNativeDriver: false }).start();
    if (clamped >= 80) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
    }
  }, [clamped]);

  const getHydrationColor = () => {
    if (clamped >= 80) return '#4FC3F7';
    if (clamped >= 60) return '#81D4FA';
    if (clamped >= 40) return '#B3E5FC';
    return '#E1F5FE';
  };

  const getStatusText = () => {
    if (clamped >= 90) return { text: 'Excellent! 💧', color: '#4CAF50' };
    if (clamped >= 70) return { text: 'Well Hydrated', color: '#8BC34A' };
    if (clamped >= 50) return { text: 'Moderate', color: '#FFC107' };
    if (clamped >= 30) return { text: 'Need Water', color: '#FF9800' };
    return { text: 'Dehydrated!', color: '#F44336' };
  };

  const status = getStatusText();
  const bodyColor = isDark ? '#4A5568' : '#CBD5E0';
  const hydrationColor = getHydrationColor();

  // Body parts affected by hydration
  const bodyParts = [
    { name: 'Brain', icon: '🧠', y: 15, benefit: 'Focus & Memory', threshold: 70 },
    { name: 'Skin', icon: '✨', y: 35, benefit: 'Glow & Elasticity', threshold: 60 },
    { name: 'Heart', icon: '❤️', y: 45, benefit: 'Circulation', threshold: 50 },
    { name: 'Muscles', icon: '💪', y: 60, benefit: 'Energy & Strength', threshold: 55 },
    { name: 'Kidneys', icon: '🫘', y: 70, benefit: 'Detox & Filter', threshold: 65 },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bodyContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Svg width={140} height={220} viewBox="0 0 100 160">
          <Defs>
            <LinearGradient id="hydrationGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={hydrationColor} stopOpacity="0.9" />
              <Stop offset={`${clamped}%`} stopColor={hydrationColor} stopOpacity="0.7" />
              <Stop offset={`${clamped}%`} stopColor={bodyColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={bodyColor} stopOpacity="0.3" />
            </LinearGradient>
            <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Head */}
          <Ellipse cx="50" cy="18" rx="14" ry="16" fill="url(#hydrationGradient)" />
          
          {/* Neck */}
          <Path d="M 44 32 L 44 40 L 56 40 L 56 32" fill="url(#hydrationGradient)" />
          
          {/* Torso */}
          <Path d="M 30 40 Q 30 45 32 55 L 35 90 Q 38 100 50 100 Q 62 100 65 90 L 68 55 Q 70 45 70 40 Z" fill="url(#hydrationGradient)" />
          
          {/* Arms */}
          <Path d="M 30 42 Q 20 50 15 70 Q 14 75 18 76 Q 22 77 24 72 L 30 55" fill="url(#hydrationGradient)" />
          <Path d="M 70 42 Q 80 50 85 70 Q 86 75 82 76 Q 78 77 76 72 L 70 55" fill="url(#hydrationGradient)" />
          
          {/* Legs */}
          <Path d="M 38 100 L 35 140 Q 34 148 40 148 Q 46 148 45 140 L 48 100" fill="url(#hydrationGradient)" />
          <Path d="M 52 100 L 55 140 Q 56 148 60 148 Q 66 148 65 140 L 62 100" fill="url(#hydrationGradient)" />

          {/* Glow overlay */}
          <Ellipse cx="42" cy="55" rx="8" ry="15" fill="url(#glowGradient)" />
        </Svg>

        {/* Hydration level indicator */}
        <View style={[styles.levelIndicator, { backgroundColor: colors.card }]}>
          <Text style={[styles.levelValue, { color: status.color }]}>{Math.round(clamped)}%</Text>
          <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Hydrated</Text>
        </View>
      </Animated.View>

      {showLabels && (
        <View style={styles.benefitsContainer}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          <View style={styles.benefitsList}>
            {bodyParts.map((part) => {
              const isActive = clamped >= part.threshold;
              return (
                <View key={part.name} style={[styles.benefitItem, { opacity: isActive ? 1 : 0.4 }]}>
                  <Text style={styles.benefitIcon}>{part.icon}</Text>
                  <View>
                    <Text style={[styles.benefitName, { color: colors.text }]}>{part.name}</Text>
                    <Text style={[styles.benefitDesc, { color: isActive ? '#4CAF50' : colors.textSecondary }]}>
                      {isActive ? '✓ ' : ''}{part.benefit}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  bodyContainer: { alignItems: 'center', marginBottom: 16 },
  levelIndicator: { position: 'absolute', bottom: 0, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  levelValue: { fontSize: 20, fontWeight: '700' },
  levelLabel: { fontSize: 11 },
  benefitsContainer: { alignItems: 'center', width: '100%' },
  statusText: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  benefitsList: { width: '100%' },
  benefitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  benefitIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  benefitName: { fontSize: 14, fontWeight: '600' },
  benefitDesc: { fontSize: 12 },
});

export default BodyHydration;