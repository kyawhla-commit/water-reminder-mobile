import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateInsights, Insight } from '@/services/insights';
import { useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function InsightsCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const dailyGoal = useUserProfileStore((state) => state.profile.dailyWaterGoal);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    const data = await generateInsights(dailyGoal);
    setInsights(data);
  };

  const nextInsight = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  if (insights.length === 0) return null;

  const current = insights[currentIndex];
  const bgColor = {
    tip: isDark ? '#1E3A5F' : '#E3F2FD',
    achievement: isDark ? '#2E4A2E' : '#E8F5E9',
    warning: isDark ? '#4A3A1E' : '#FFF3E0',
    motivation: isDark ? '#3A2E4A' : '#F3E5F5',
  }[current.type];

  const accentColor = {
    tip: '#2196F3',
    achievement: '#4CAF50',
    warning: '#FF9800',
    motivation: '#9C27B0',
  }[current.type];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{current.icon}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
          <Text style={[styles.badge, { backgroundColor: accentColor }]}>
            {current.type.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.message, { color: colors.text }]}>{current.message}</Text>

      {insights.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity onPress={prevInsight} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={colors.icon} />
          </TouchableOpacity>

          <View style={styles.dots}>
            {insights.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentIndex ? accentColor : colors.icon },
                  index === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={nextInsight} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  dotActive: {
    width: 18,
    opacity: 1,
  },
});
