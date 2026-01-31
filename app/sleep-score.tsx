import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    calculateSleepQualityScore,
    DailySleepAnalysis,
    getDailySleepAnalysis,
    getScoreColor,
    getScoreEmoji,
    SleepQualityScore,
} from '@/services/sleepQualityScore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SleepScoreScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [score, setScore] = useState<SleepQualityScore | null>(null);
  const [dailyAnalysis, setDailyAnalysis] = useState<DailySleepAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (score) {
      Animated.parallel([
        Animated.timing(scoreAnim, {
          toValue: score.totalScore,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [score]);

  const loadData = async () => {
    setLoading(true);
    const [scoreData, analysisData] = await Promise.all([
      calculateSleepQualityScore(),
      getDailySleepAnalysis(7),
    ]);
    setScore(scoreData);
    setDailyAnalysis(analysisData);
    setLoading(false);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const renderScoreCircle = () => {
    if (!score) return null;

    const scoreColor = getScoreColor(score.grade);
    const emoji = getScoreEmoji(score.grade);

    return (
      <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
        <View style={styles.scoreCircleContainer}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Animated.Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {scoreAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0', score.totalScore.toString()],
              })}
            </Animated.Text>
            <Text style={[styles.scoreGrade, { color: scoreColor }]}>
              {emoji} {score.grade}
            </Text>
          </View>
        </View>

        <Text style={[styles.scoreTitle, { color: colors.text }]}>
          {isBurmese ? 'အိပ်စက်မှု အရည်အသွေးရမှတ်' : 'Sleep Quality Score'}
        </Text>

        {/* Trend Badge */}
        <View
          style={[
            styles.trendBadge,
            {
              backgroundColor:
                score.trend === 'improving'
                  ? '#E8F5E9'
                  : score.trend === 'declining'
                    ? '#FFEBEE'
                    : '#F5F5F5',
            },
          ]}
        >
          <Ionicons
            name={
              score.trend === 'improving'
                ? 'trending-up'
                : score.trend === 'declining'
                  ? 'trending-down'
                  : 'remove'
            }
            size={16}
            color={
              score.trend === 'improving'
                ? '#4CAF50'
                : score.trend === 'declining'
                  ? '#F44336'
                  : '#9E9E9E'
            }
          />
          <Text
            style={[
              styles.trendText,
              {
                color:
                  score.trend === 'improving'
                    ? '#4CAF50'
                    : score.trend === 'declining'
                      ? '#F44336'
                      : '#9E9E9E',
              },
            ]}
          >
            {score.trend === 'improving'
              ? isBurmese
                ? 'တိုးတက်နေသည်'
                : 'Improving'
              : score.trend === 'declining'
                ? isBurmese
                  ? 'ကျဆင်းနေသည်'
                  : 'Declining'
                : isBurmese
                  ? 'တည်ငြိမ်'
                  : 'Stable'}
          </Text>
        </View>

        {/* Streak */}
        {score.streakDays > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: isDark ? '#3D3B1F' : '#FFF8E1' }]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakText, { color: '#FF9800' }]}>
              {score.streakDays} {isBurmese ? 'ရက်ဆက်တိုက်' : 'day streak'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderBreakdown = () => {
    if (!score) return null;

    const categories = [
      {
        key: 'duration',
        label: isBurmese ? 'ကြာချိန်' : 'Duration',
        icon: '⏱️',
        score: score.breakdown.duration,
        color: '#2196F3',
      },
      {
        key: 'consistency',
        label: isBurmese ? 'တသမတ်တည်းမှု' : 'Consistency',
        icon: '📊',
        score: score.breakdown.consistency,
        color: '#9C27B0',
      },
      {
        key: 'timing',
        label: isBurmese ? 'အချိန်' : 'Timing',
        icon: '🌙',
        score: score.breakdown.timing,
        color: '#FF9800',
      },
      {
        key: 'quality',
        label: isBurmese ? 'အရည်အသွေး' : 'Quality',
        icon: '✨',
        score: score.breakdown.quality,
        color: '#4CAF50',
      },
    ];

    return (
      <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '📈 အမှတ်ခွဲခြမ်းစိတ်ဖြာ' : '📈 Score Breakdown'}
        </Text>

        {categories.map((cat) => (
          <View key={cat.key} style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownIcon}>{cat.icon}</Text>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>{cat.label}</Text>
              <Text style={[styles.breakdownScore, { color: cat.color }]}>{cat.score}/25</Text>
            </View>
            <View style={[styles.breakdownBar, { backgroundColor: colors.surfaceVariant }]}>
              <Animated.View
                style={[
                  styles.breakdownFill,
                  {
                    width: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${(cat.score / 25) * 100}%`],
                    }),
                    backgroundColor: cat.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderDailyChart = () => {
    if (dailyAnalysis.length === 0) return null;

    const maxScore = 100;

    return (
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '📅 နေ့စဉ်ရမှတ်များ' : '📅 Daily Scores'}
        </Text>

        <View style={styles.chartContainer}>
          {dailyAnalysis.map((day, index) => {
            const height = (day.score / maxScore) * 100;
            const dayName = new Date(day.date).toLocaleDateString(isBurmese ? 'my-MM' : 'en-US', {
              weekday: 'short',
            });

            return (
              <View key={day.date} style={styles.chartDay}>
                <Text style={[styles.chartScore, { color: colors.text }]}>{day.score}</Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${height}%`,
                        backgroundColor: getScoreColor(
                          day.score >= 90
                            ? 'A'
                            : day.score >= 80
                              ? 'B'
                              : day.score >= 70
                                ? 'C'
                                : day.score >= 60
                                  ? 'D'
                                  : 'F'
                        ),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayLabel, { color: colors.textSecondary }]}>{dayName}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    if (!score || score.insights.length === 0) return null;

    return (
      <View style={styles.insightsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '💡 တွေ့ရှိချက်များ' : '💡 Insights'}
        </Text>

        {score.insights.map((insight, index) => (
          <View
            key={index}
            style={[
              styles.insightCard,
              {
                backgroundColor:
                  insight.type === 'positive'
                    ? isDark
                      ? '#1B3D2F'
                      : '#E8F5E9'
                    : insight.type === 'negative'
                      ? isDark
                        ? '#3D2B1F'
                        : '#FFEBEE'
                      : isDark
                        ? '#1E3A5F'
                        : '#E3F2FD',
              },
            ]}
          >
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                {isBurmese ? insight.titleMy : insight.title}
              </Text>
              <Text style={[styles.insightMessage, { color: colors.textSecondary }]}>
                {isBurmese ? insight.messageMy : insight.message}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!score || score.recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '🎯 အကြံပြုချက်များ' : '🎯 Recommendations'}
        </Text>

        {score.recommendations.map((rec, index) => (
          <View
            key={index}
            style={[
              styles.recCard,
              {
                backgroundColor: colors.card,
                borderLeftColor:
                  rec.priority === 'high'
                    ? '#F44336'
                    : rec.priority === 'medium'
                      ? '#FF9800'
                      : '#4CAF50',
              },
            ]}
          >
            <Text style={styles.recIcon}>{rec.icon}</Text>
            <View style={styles.recContent}>
              <View style={styles.recHeader}>
                <Text style={[styles.recTitle, { color: colors.text }]}>
                  {isBurmese ? rec.titleMy : rec.title}
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        rec.priority === 'high'
                          ? '#FFEBEE'
                          : rec.priority === 'medium'
                            ? '#FFF3E0'
                            : '#E8F5E9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color:
                          rec.priority === 'high'
                            ? '#F44336'
                            : rec.priority === 'medium'
                              ? '#FF9800'
                              : '#4CAF50',
                      },
                    ]}
                  >
                    {rec.priority === 'high'
                      ? isBurmese
                        ? 'မြင့်'
                        : 'High'
                      : rec.priority === 'medium'
                        ? isBurmese
                          ? 'အလယ်'
                          : 'Med'
                        : isBurmese
                          ? 'နိမ့်'
                          : 'Low'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.recDescription, { color: colors.textSecondary }]}>
                {isBurmese ? rec.descriptionMy : rec.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {isBurmese ? 'ခွဲခြမ်းစိတ်ဖြာနေသည်...' : 'Analyzing your sleep...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isBurmese ? '🧠 AI အိပ်စက်မှုရမှတ်' : '🧠 AI Sleep Score'}
          </Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Score Circle */}
        {renderScoreCircle()}

        {/* Breakdown */}
        {renderBreakdown()}

        {/* Daily Chart */}
        {renderDailyChart()}

        {/* Insights */}
        {renderInsights()}

        {/* Recommendations */}
        {renderRecommendations()}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {isBurmese
              ? 'ရမှတ်သည် ကြာချိန်၊ တသမတ်တည်းမှု၊ အိပ်ရာဝင်ချိန်နှင့် အရည်အသွေးအပေါ် အခြေခံသည်။ ပိုမိုတိကျသော ရလဒ်များအတွက် နေ့စဉ်မှတ်တမ်းတင်ပါ။'
              : 'Score is based on duration, consistency, bedtime, and quality. Log daily for more accurate results.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  refreshButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scoreCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  scoreCircleContainer: { marginBottom: 16 },
  scoreCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 48, fontWeight: '700' },
  scoreGrade: { fontSize: 24, fontWeight: '600', marginTop: 4 },
  scoreTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4, marginBottom: 8 },
  trendText: { fontSize: 13, fontWeight: '600' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: 13, fontWeight: '600' },
  breakdownCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  breakdownItem: { marginBottom: 16 },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breakdownIcon: { fontSize: 18, marginRight: 8 },
  breakdownLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  breakdownScore: { fontSize: 14, fontWeight: '700' },
  breakdownBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 4 },
  chartCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 140, alignItems: 'flex-end' },
  chartDay: { flex: 1, alignItems: 'center' },
  chartScore: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  chartBarContainer: { height: 100, width: 24, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4 },
  chartDayLabel: { fontSize: 10, marginTop: 8 },
  insightsSection: { marginBottom: 20 },
  insightCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12 },
  insightIcon: { fontSize: 28 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  insightMessage: { fontSize: 13, lineHeight: 18 },
  recommendationsSection: { marginBottom: 20 },
  recCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12, borderLeftWidth: 4 },
  recIcon: { fontSize: 24 },
  recContent: { flex: 1 },
  recHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '600' },
  recDescription: { fontSize: 13, lineHeight: 18 },
  infoCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
