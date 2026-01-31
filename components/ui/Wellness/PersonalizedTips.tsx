import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface TipData {
  id: string;
  icon: string;
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'hydration' | 'timing' | 'health' | 'motivation';
}

interface PersonalizedTipsProps {
  hydrationPercent: number;
  currentHour: number;
  streakDays: number;
  weatherTemp?: number;
  onActionPress?: (tipId: string) => void;
}

export function PersonalizedTips({ hydrationPercent, currentHour, streakDays, weatherTemp, onActionPress }: PersonalizedTipsProps) {
  const { colors, isDark } = useAppTheme();
  const [tips, setTips] = useState<TipData[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const generated = generateTips();
    setTips(generated);
  }, [hydrationPercent, currentHour, streakDays, weatherTemp]);

  const generateTips = (): TipData[] => {
    const tips: TipData[] = [];

    // Time-based tips
    if (currentHour >= 6 && currentHour < 9 && hydrationPercent < 20) {
      tips.push({
        id: 'morning_water',
        icon: '🌅',
        title: 'Morning Hydration',
        message: 'Start your day with a glass of water to kickstart your metabolism and rehydrate after sleep.',
        action: 'Add 250ml',
        priority: 'high',
        category: 'timing',
      });
    }

    if (currentHour >= 12 && currentHour < 14 && hydrationPercent < 50) {
      tips.push({
        id: 'lunch_reminder',
        icon: '🍽️',
        title: 'Lunch Time Hydration',
        message: 'Drink water before your meal to aid digestion and prevent overeating.',
        action: 'Add 300ml',
        priority: 'high',
        category: 'timing',
      });
    }

    if (currentHour >= 14 && currentHour < 16 && hydrationPercent < 60) {
      tips.push({
        id: 'afternoon_slump',
        icon: '⚡',
        title: 'Beat the Afternoon Slump',
        message: 'Feeling tired? Dehydration causes fatigue. A glass of water can boost your energy better than coffee!',
        action: 'Drink now',
        priority: 'high',
        category: 'health',
      });
    }

    if (currentHour >= 20 && hydrationPercent < 80) {
      tips.push({
        id: 'evening_catchup',
        icon: '🌙',
        title: 'Evening Catch-up',
        message: "You're behind on today's goal. Small sips now can help, but avoid large amounts before bed.",
        priority: 'medium',
        category: 'timing',
      });
    }

    // Hydration level tips
    if (hydrationPercent >= 100) {
      tips.push({
        id: 'goal_reached',
        icon: '🎉',
        title: 'Goal Achieved!',
        message: "Amazing! You've hit your daily water goal. Your body thanks you!",
        priority: 'low',
        category: 'motivation',
      });
    } else if (hydrationPercent >= 80) {
      tips.push({
        id: 'almost_there',
        icon: '🏁',
        title: 'Almost There!',
        message: `Just ${100 - hydrationPercent}% more to reach your goal. You've got this!`,
        action: 'Finish strong',
        priority: 'medium',
        category: 'motivation',
      });
    } else if (hydrationPercent < 30) {
      tips.push({
        id: 'low_hydration',
        icon: '⚠️',
        title: 'Hydration Alert',
        message: 'Your water intake is low. Dehydration can cause headaches, fatigue, and poor concentration.',
        action: 'Drink 500ml',
        priority: 'high',
        category: 'health',
      });
    }

    // Weather tips
    if (weatherTemp && weatherTemp > 28) {
      tips.push({
        id: 'hot_weather',
        icon: '☀️',
        title: 'Hot Day Alert',
        message: `It's ${weatherTemp}°C outside. Increase your water intake by 500ml to stay properly hydrated.`,
        action: 'Add extra',
        priority: 'high',
        category: 'health',
      });
    }

    // Streak tips
    if (streakDays >= 7) {
      tips.push({
        id: 'streak_celebration',
        icon: '🔥',
        title: `${streakDays} Day Streak!`,
        message: "You're building a healthy habit! Consistency is key to long-term wellness.",
        priority: 'low',
        category: 'motivation',
      });
    } else if (streakDays === 0) {
      tips.push({
        id: 'start_streak',
        icon: '🎯',
        title: 'Start Your Streak',
        message: 'Hit your goal today to start a new streak. Small wins lead to big changes!',
        action: 'Begin now',
        priority: 'medium',
        category: 'motivation',
      });
    }

    // Health benefit tips
    tips.push({
      id: 'skin_benefit',
      icon: '✨',
      title: 'Skin Health',
      message: 'Proper hydration improves skin elasticity and gives you a natural glow.',
      priority: 'low',
      category: 'health',
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
  };

  const nextTip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  if (tips.length === 0) return null;

  const currentTip = tips[currentTipIndex];
  const priorityColors = { high: '#F44336', medium: '#FF9800', low: '#4CAF50' };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>💡 Personalized Tip</Text>
        {tips.length > 1 && (
          <Pressable onPress={nextTip} style={styles.nextButton}>
            <Text style={[styles.nextText, { color: colors.primary }]}>Next →</Text>
          </Pressable>
        )}
      </View>

      <Animated.View style={[styles.tipContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipIcon}>{currentTip.icon}</Text>
          <View style={styles.tipTitleContainer}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>{currentTip.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColors[currentTip.priority] + '20' }]}>
              <Text style={[styles.priorityText, { color: priorityColors[currentTip.priority] }]}>
                {currentTip.priority === 'high' ? '!' : currentTip.priority === 'medium' ? '•' : '✓'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.tipMessage, { color: colors.textSecondary }]}>{currentTip.message}</Text>

        {currentTip.action && (
          <Pressable 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => onActionPress?.(currentTip.id)}
          >
            <Text style={styles.actionText}>{currentTip.action}</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Pagination dots */}
      {tips.length > 1 && (
        <View style={styles.pagination}>
          {tips.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === currentTipIndex ? colors.primary : colors.surfaceVariant }]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  nextButton: { padding: 4 },
  nextText: { fontSize: 14, fontWeight: '500' },
  tipContent: {},
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipIcon: { fontSize: 32, marginRight: 12 },
  tipTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipTitle: { fontSize: 17, fontWeight: '600', flex: 1 },
  priorityBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 14, fontWeight: '700' },
  tipMessage: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  actionButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default PersonalizedTips;