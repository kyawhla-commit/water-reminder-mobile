import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Share, StyleSheet, Text, View } from 'react-native';

interface WeeklyData {
  avgScore: number;
  avgHydration: number;
  bestDay: string;
  worstDay: string;
  streakDays: number;
  totalWater: number;
  goalHitDays: number;
  improvement: number; // vs last week
  moodCorrelation?: number; // -1 to 1
}

interface WeeklyReportProps {
  data: WeeklyData;
  weekLabel?: string;
}

export function WeeklyReport({ data, weekLabel = 'This Week' }: WeeklyReportProps) {
  const { colors, isDark } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 12 }),
    ]).start();
  }, []);

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆';
    if (score >= 75) return '⭐';
    if (score >= 60) return '👍';
    if (score >= 40) return '💪';
    return '🎯';
  };

  const getImprovementColor = () => {
    if (data.improvement > 0) return '#4CAF50';
    if (data.improvement < 0) return '#F44336';
    return colors.textSecondary;
  };

  const shareReport = async () => {
    const message = `📊 My Weekly Wellness Report\n\n` +
      `🎯 Average Score: ${data.avgScore}/100\n` +
      `💧 Water Intake: ${(data.totalWater / 1000).toFixed(1)}L total\n` +
      `🔥 Streak: ${data.streakDays} days\n` +
      `✅ Goals Hit: ${data.goalHitDays}/7 days\n\n` +
      `#WellnessJourney #Hydration`;
    
    try {
      await Share.share({ message });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.card, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{weekLabel}</Text>
          <Text style={[styles.title, { color: colors.text }]}>Weekly Summary</Text>
        </View>
        <Pressable onPress={shareReport} style={[styles.shareButton, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Main Score */}
      <View style={styles.mainScore}>
        <Text style={styles.scoreEmoji}>{getScoreEmoji(data.avgScore)}</Text>
        <View style={styles.scoreDetails}>
          <Text style={[styles.scoreValue, { color: colors.text }]}>{data.avgScore}</Text>
          <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>/100</Text>
        </View>
        <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Average Score</Text>
        {data.improvement !== 0 && (
          <View style={[styles.improvementBadge, { backgroundColor: getImprovementColor() + '20' }]}>
            <Ionicons name={data.improvement > 0 ? 'trending-up' : 'trending-down'} size={14} color={getImprovementColor()} />
            <Text style={[styles.improvementText, { color: getImprovementColor() }]}>
              {data.improvement > 0 ? '+' : ''}{data.improvement}% vs last week
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Text style={styles.statIcon}>💧</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{(data.totalWater / 1000).toFixed(1)}L</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Water</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: isDark ? '#2D1B4E' : '#F3E5F5' }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{data.streakDays}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: isDark ? '#1B4332' : '#E8F5E9' }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{data.goalHitDays}/7</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goals Hit</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: isDark ? '#4A3728' : '#FFF3E0' }]}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{data.avgHydration}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Hydration</Text>
        </View>
      </View>

      {/* Highlights */}
      <View style={styles.highlights}>
        <View style={styles.highlightItem}>
          <View style={[styles.highlightIcon, { backgroundColor: '#4CAF5020' }]}>
            <Text>🌟</Text>
          </View>
          <View>
            <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>Best Day</Text>
            <Text style={[styles.highlightValue, { color: colors.text }]}>{data.bestDay}</Text>
          </View>
        </View>
        <View style={styles.highlightItem}>
          <View style={[styles.highlightIcon, { backgroundColor: '#FF980020' }]}>
            <Text>📈</Text>
          </View>
          <View>
            <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>Room to Grow</Text>
            <Text style={[styles.highlightValue, { color: colors.text }]}>{data.worstDay}</Text>
          </View>
        </View>
      </View>

      {/* Mood Correlation */}
      {data.moodCorrelation !== undefined && (
        <View style={[styles.correlationBox, { backgroundColor: isDark ? '#1E3A5F' : '#E8F5E9' }]}>
          <Text style={styles.correlationIcon}>🔗</Text>
          <View style={styles.correlationContent}>
            <Text style={[styles.correlationTitle, { color: colors.text }]}>Hydration & Mood Connection</Text>
            <Text style={[styles.correlationText, { color: colors.textSecondary }]}>
              {data.moodCorrelation > 0.5 
                ? 'Strong positive correlation! Better hydration = better mood for you.'
                : data.moodCorrelation > 0
                ? 'Slight positive trend between your hydration and mood.'
                : 'Keep tracking to discover your personal patterns.'}
            </Text>
          </View>
        </View>
      )}

      {/* Motivational Message */}
      <View style={[styles.motivationBox, { borderColor: colors.primary }]}>
        <Text style={[styles.motivationText, { color: colors.text }]}>
          {data.avgScore >= 80 
            ? "🎉 Outstanding week! You're building excellent habits."
            : data.avgScore >= 60
            ? "👏 Good progress! Small improvements lead to big results."
            : "💪 Every day is a new opportunity. You've got this!"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  weekLabel: { fontSize: 13, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700' },
  shareButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mainScore: { alignItems: 'center', marginBottom: 24 },
  scoreEmoji: { fontSize: 48, marginBottom: 8 },
  scoreDetails: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: 56, fontWeight: '800' },
  scoreMax: { fontSize: 24, fontWeight: '500', marginLeft: 4 },
  scoreLabel: { fontSize: 14, marginTop: 4 },
  improvementBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 12, gap: 4 },
  improvementText: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statItem: { width: '47%', padding: 16, borderRadius: 16, alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  highlights: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  highlightItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  highlightIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  highlightLabel: { fontSize: 12 },
  highlightValue: { fontSize: 14, fontWeight: '600' },
  correlationBox: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 16, gap: 12 },
  correlationIcon: { fontSize: 24 },
  correlationContent: { flex: 1 },
  correlationTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  correlationText: { fontSize: 13, lineHeight: 20 },
  motivationBox: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, padding: 16 },
  motivationText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

export default WeeklyReport;