import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  calculateFocusStats,
  DailyFocusData,
  FocusHistoryStats,
  FocusSession,
  formatDuration,
  getDailyFocusData,
  getProductivityInsights,
  loadFocusHistory,
} from '@/services/focusEnhancements';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FocusHistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState<FocusHistoryStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyFocusData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    const history = await loadFocusHistory();
    setSessions(history);
    setStats(calculateFocusStats(history));
    setDailyData(getDailyFocusData(history, selectedPeriod));
  };

  const insights = stats ? getProductivityInsights(stats, isBurmese) : [];
  const maxDailyMinutes = Math.max(...dailyData.map((d) => d.minutes), 1);

  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = isBurmese
      ? ['တ', 'တ', 'အ', 'ဗ', 'က', 'သ', 'စ']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[date.getDay()];
  };

  const getProductivityColor = (rating: number): string => {
    if (rating >= 4) return '#27AE60';
    if (rating >= 3) return '#F39C12';
    if (rating >= 2) return '#E67E22';
    return '#E74C3C';
  };

  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{isBurmese ? 'ခဏစောင့်ပါ...' : 'Loading...'}</Text>
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
            📊 {isBurmese ? 'အာရုံစူးစိုက်မှုမှတ်တမ်း' : 'Focus History'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {([7, 14, 30] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                { backgroundColor: colors.card },
                selectedPeriod === period && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: selectedPeriod === period ? '#fff' : colors.text },
                ]}
              >
                {period} {isBurmese ? 'ရက်' : 'Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📈 အကျဉ်းချုပ်' : '📈 Overview'}
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#3498DB' }]}>{stats.totalSessions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အကြိမ်' : 'Sessions'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#27AE60' }]}>
                {formatDuration(stats.totalMinutes, isBurmese)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စုစုပေါင်း' : 'Total'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#E74C3C' }]}>{stats.avgSessionLength}m</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပျမ်းမျှ' : 'Avg'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#9B59B6' }]}>{stats.completionRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပြီးမြောက်' : 'Complete'}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📅 နေ့စဉ်အာရုံစူးစိုက်မှု' : '📅 Daily Focus'}
          </Text>
          <View style={styles.chartContainer}>
            {dailyData.map((day, index) => (
              <View key={day.date} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(day.minutes / maxDailyMinutes) * 100}%`,
                        backgroundColor: day.minutes > 0 ? '#3498DB' : colors.surfaceVariant,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {getDayLabel(day.date)}
                </Text>
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {day.minutes > 0 ? `${day.minutes}m` : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Streaks */}
        <View style={[styles.streakCard, { backgroundColor: colors.card }]}>
          <View style={styles.streakRow}>
            <View style={[styles.streakItem, { backgroundColor: isDark ? '#3D2B1F' : '#FFF3E0' }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakValue, { color: colors.text }]}>{stats.currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'လက်ရှိ' : 'Current'}
              </Text>
            </View>
            <View style={[styles.streakItem, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <Text style={[styles.streakValue, { color: colors.text }]}>{stats.longestStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အကောင်းဆုံး' : 'Best'}
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>
              {isBurmese ? '💡 တွေ့ရှိချက်များ' : '💡 Insights'}
            </Text>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[styles.insightCard, { backgroundColor: colors.card }]}
              >
                <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
                  <Text style={[styles.insightMessage, { color: colors.textSecondary }]}>
                    {insight.message}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Recent Sessions */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>
          {isBurmese ? '🕐 မကြာသေးမီ' : '🕐 Recent Sessions'}
        </Text>
        {sessions.slice(0, 10).map((session) => (
          <View key={session.id} style={[styles.sessionCard, { backgroundColor: colors.card }]}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionEmoji}>
                {session.type === 'deepWork' ? '🧠' : session.type === 'pomodoro' ? '🍅' : '⏱️'}
              </Text>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionType, { color: colors.text }]}>
                  {session.type === 'deepWork'
                    ? isBurmese
                      ? 'Deep Work'
                      : 'Deep Work'
                    : session.type === 'pomodoro'
                      ? 'Pomodoro'
                      : isBurmese
                        ? 'စိတ်ကြိုက်'
                        : 'Custom'}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                  {new Date(session.startTime).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.sessionStats}>
                <Text style={[styles.sessionDuration, { color: '#3498DB' }]}>
                  {session.duration}m
                </Text>
                {session.productivity > 0 && (
                  <View
                    style={[
                      styles.productivityBadge,
                      { backgroundColor: getProductivityColor(session.productivity) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.productivityText,
                        { color: getProductivityColor(session.productivity) },
                      ]}
                    >
                      ⭐ {session.productivity}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}

        {sessions.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isBurmese
                ? 'မှတ်တမ်းမရှိသေးပါ။ အာရုံစူးစိုက်မှုစတင်ပါ!'
                : 'No sessions yet. Start focusing!'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  periodSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  periodButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  periodText: { fontSize: 14, fontWeight: '600' },
  statsCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  chartCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 120 },
  chartBar: { alignItems: 'center', flex: 1 },
  barContainer: { flex: 1, width: '70%', justifyContent: 'flex-end', marginBottom: 4 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, marginTop: 2 },
  barValue: { fontSize: 9, marginTop: 2 },
  streakCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  streakRow: { flexDirection: 'row', gap: 12 },
  streakItem: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  streakEmoji: { fontSize: 28, marginBottom: 8 },
  streakValue: { fontSize: 28, fontWeight: '700' },
  streakLabel: { fontSize: 12, marginTop: 4 },
  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, gap: 12 },
  insightEmoji: { fontSize: 24 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600' },
  insightMessage: { fontSize: 12, marginTop: 2 },
  sessionCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center' },
  sessionEmoji: { fontSize: 24, marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionType: { fontSize: 14, fontWeight: '600' },
  sessionDate: { fontSize: 11, marginTop: 2 },
  sessionStats: { alignItems: 'flex-end' },
  sessionDuration: { fontSize: 16, fontWeight: '700' },
  productivityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  productivityText: { fontSize: 11, fontWeight: '600' },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
