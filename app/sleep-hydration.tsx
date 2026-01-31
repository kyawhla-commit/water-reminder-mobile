import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    analyzeCorrelation,
    CorrelationAnalysis,
    generateInsights,
    getSleepHydrationData,
    getWeeklySummary,
    SleepHydrationData,
    SleepHydrationInsight,
} from '@/services/sleepHydrationCorrelation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SleepHydrationScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [insights, setInsights] = useState<SleepHydrationInsight[]>([]);
  const [weeklyData, setWeeklyData] = useState<SleepHydrationData[]>([]);
  const [summary, setSummary] = useState<{
    avgWaterPercentage: number;
    avgSleepDuration: number;
    avgSleepQuality: number;
    bestDay: { date: string; sleep: number; water: number } | null;
    worstDay: { date: string; sleep: number; water: number } | null;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [analysisData, insightsData, weekly, summaryData] = await Promise.all([
      analyzeCorrelation(),
      generateInsights(),
      getSleepHydrationData(7),
      getWeeklySummary(),
    ]);

    setAnalysis(analysisData);
    setInsights(insightsData);
    setWeeklyData(weekly);
    setSummary(summaryData);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getCorrelationColor = (strength: string): string => {
    switch (strength) {
      case 'strong':
        return '#4CAF50';
      case 'moderate':
        return '#FF9800';
      case 'weak':
        return '#FFC107';
      default:
        return colors.textSecondary;
    }
  };

  const getInsightColor = (type: string): string => {
    switch (type) {
      case 'positive':
        return isDark ? '#1B3D2F' : '#E8F5E9';
      case 'negative':
        return isDark ? '#3D2B1F' : '#FFF3E0';
      case 'achievement':
        return isDark ? '#3D3B1F' : '#FFF8E1';
      default:
        return isDark ? '#1E3A5F' : '#E3F2FD';
    }
  };

  const renderCorrelationMeter = () => {
    if (!analysis) return null;

    const percentage = Math.abs(analysis.correlation) * 100;
    const isPositive = analysis.direction === 'positive';

    return (
      <View style={[styles.meterCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.meterTitle, { color: colors.text }]}>
          {isBurmese ? '📊 ဆက်စပ်မှုအဆင့်' : '📊 Correlation Strength'}
        </Text>

        <View style={styles.meterContainer}>
          <View style={[styles.meterBackground, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.meterFill,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: getCorrelationColor(analysis.strength),
                },
              ]}
            />
          </View>
          <Text style={[styles.meterValue, { color: getCorrelationColor(analysis.strength) }]}>
            {analysis.strength.toUpperCase()}
          </Text>
        </View>

        <View style={styles.meterLabels}>
          <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>
            {isBurmese ? 'အားနည်း' : 'Weak'}
          </Text>
          <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>
            {isBurmese ? 'ခိုင်မာ' : 'Strong'}
          </Text>
        </View>

        <View style={[styles.directionBadge, { backgroundColor: isPositive ? '#E8F5E9' : '#FFF3E0' }]}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={16}
            color={isPositive ? '#4CAF50' : '#FF9800'}
          />
          <Text style={{ color: isPositive ? '#4CAF50' : '#FF9800', fontWeight: '600', fontSize: 12 }}>
            {isPositive
              ? isBurmese
                ? 'အပြုသဘော'
                : 'Positive'
              : isBurmese
                ? 'အနုတ်လက္ခဏာ'
                : 'Negative'}
          </Text>
        </View>

        <Text style={[styles.dataPoints, { color: colors.textSecondary }]}>
          {isBurmese
            ? `ဒေတာအမှတ် ${analysis.dataPoints} ခုအပေါ်အခြေခံသည်`
            : `Based on ${analysis.dataPoints} data points`}
        </Text>
      </View>
    );
  };

  const renderComparisonCard = () => {
    if (!analysis || analysis.dataPoints < 5) return null;

    return (
      <View style={[styles.comparisonCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.comparisonTitle, { color: colors.text }]}>
          {isBurmese ? '💧 ရေဓာတ်နှင့် အိပ်စက်မှု နှိုင်းယှဉ်ချက်' : '💧 Hydration vs Sleep Comparison'}
        </Text>

        <View style={styles.comparisonRow}>
          {/* Well Hydrated */}
          <View style={[styles.comparisonItem, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}>
            <Text style={styles.comparisonEmoji}>💧</Text>
            <Text style={[styles.comparisonLabel, { color: colors.text }]}>
              {isBurmese ? 'ရေဓာတ်ပြည့်ဝ' : 'Well Hydrated'}
            </Text>
            <Text style={[styles.comparisonSubLabel, { color: colors.textSecondary }]}>
              {isBurmese ? '(≥80% ပန်းတိုင်)' : '(≥80% goal)'}
            </Text>
            <View style={styles.comparisonStats}>
              <View style={styles.comparisonStat}>
                <Ionicons name="moon" size={16} color="#9B59B6" />
                <Text style={[styles.comparisonStatValue, { color: colors.text }]}>
                  {formatDuration(analysis.avgSleepWhenHydrated)}
                </Text>
              </View>
              {analysis.avgQualityWhenHydrated > 0 && (
                <View style={styles.comparisonStat}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={[styles.comparisonStatValue, { color: colors.text }]}>
                    {analysis.avgQualityWhenHydrated.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Dehydrated */}
          <View style={[styles.comparisonItem, { backgroundColor: isDark ? '#3D2B1F' : '#FFF3E0' }]}>
            <Text style={styles.comparisonEmoji}>🏜️</Text>
            <Text style={[styles.comparisonLabel, { color: colors.text }]}>
              {isBurmese ? 'ရေဓာတ်နည်း' : 'Dehydrated'}
            </Text>
            <Text style={[styles.comparisonSubLabel, { color: colors.textSecondary }]}>
              {isBurmese ? '(<60% ပန်းတိုင်)' : '(<60% goal)'}
            </Text>
            <View style={styles.comparisonStats}>
              <View style={styles.comparisonStat}>
                <Ionicons name="moon" size={16} color="#9B59B6" />
                <Text style={[styles.comparisonStatValue, { color: colors.text }]}>
                  {formatDuration(analysis.avgSleepWhenDehydrated)}
                </Text>
              </View>
              {analysis.avgQualityWhenDehydrated > 0 && (
                <View style={styles.comparisonStat}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={[styles.comparisonStatValue, { color: colors.text }]}>
                    {analysis.avgQualityWhenDehydrated.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderWeeklyChart = () => {
    if (weeklyData.length === 0) return null;

    const maxSleep = Math.max(...weeklyData.map((d) => d.sleepDuration), 480);

    return (
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          {isBurmese ? '📅 ဤအပတ်' : '📅 This Week'}
        </Text>

        <View style={styles.chartContainer}>
          {weeklyData.slice(-7).map((day, index) => {
            const sleepHeight = (day.sleepDuration / maxSleep) * 100;
            const waterHeight = day.waterPercentage;
            const dayName = new Date(day.date).toLocaleDateString(isBurmese ? 'my-MM' : 'en-US', {
              weekday: 'short',
            });

            return (
              <View key={day.date} style={styles.chartDay}>
                <View style={styles.chartBars}>
                  <View
                    style={[
                      styles.chartBar,
                      styles.sleepBar,
                      { height: `${sleepHeight}%`, backgroundColor: '#9B59B6' },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      styles.waterBar,
                      { height: `${Math.min(waterHeight, 100)}%`, backgroundColor: '#2196F3' },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayLabel, { color: colors.textSecondary }]}>{dayName}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9B59B6' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {isBurmese ? 'အိပ်စက်မှု' : 'Sleep'}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              {isBurmese ? 'ရေဓာတ်' : 'Hydration'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isBurmese ? '💧😴 ရေဓာတ်-အိပ်စက်မှု' : '💧😴 Sleep & Hydration'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary Stats */}
        {summary && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>💧</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {Math.round(summary.avgWaterPercentage)}%
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {isBurmese ? 'ပျမ်းမျှရေဓာတ်' : 'Avg Hydration'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>😴</Text>
                <Text style={[styles.summaryValue, { color: '#9B59B6' }]}>
                  {formatDuration(summary.avgSleepDuration)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {isBurmese ? 'ပျမ်းမျှအိပ်စက်မှု' : 'Avg Sleep'}
                </Text>
              </View>
              {summary.avgSleepQuality > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryEmoji}>⭐</Text>
                  <Text style={[styles.summaryValue, { color: '#FFD700' }]}>
                    {summary.avgSleepQuality.toFixed(1)}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    {isBurmese ? 'အရည်အသွေး' : 'Quality'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Correlation Meter */}
        {renderCorrelationMeter()}

        {/* Comparison Card */}
        {renderComparisonCard()}

        {/* Weekly Chart */}
        {renderWeeklyChart()}

        {/* Insights */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '💡 တွေ့ရှိချက်များ' : '💡 Insights'}
        </Text>
        {insights.map((insight, index) => (
          <View
            key={index}
            style={[styles.insightCard, { backgroundColor: getInsightColor(insight.type) }]}
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

        {/* Tips Card */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 အိပ်စက်မှုနှင့် ရေသောက်မှုကို ပုံမှန်မှတ်တမ်းတင်ပြီး ပိုမိုတိကျသော ဆက်စပ်မှုများကို ရှာဖွေပါ!'
              : '💡 Log both sleep and water intake regularly to discover more accurate correlations!'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryEmoji: { fontSize: 28, marginBottom: 8 },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 11, marginTop: 4 },
  meterCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  meterTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  meterContainer: { marginBottom: 8 },
  meterBackground: { height: 12, borderRadius: 6, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 6 },
  meterValue: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  meterLabel: { fontSize: 11 },
  directionBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4, marginTop: 12 },
  dataPoints: { fontSize: 11, textAlign: 'center', marginTop: 12 },
  comparisonCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  comparisonTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  comparisonRow: { flexDirection: 'row', gap: 12 },
  comparisonItem: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  comparisonEmoji: { fontSize: 32, marginBottom: 8 },
  comparisonLabel: { fontSize: 13, fontWeight: '600' },
  comparisonSubLabel: { fontSize: 10, marginTop: 2 },
  comparisonStats: { marginTop: 12, gap: 8 },
  comparisonStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comparisonStatValue: { fontSize: 14, fontWeight: '600' },
  chartCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 120, alignItems: 'flex-end' },
  chartDay: { flex: 1, alignItems: 'center' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 2 },
  chartBar: { width: 12, borderRadius: 4 },
  sleepBar: {},
  waterBar: {},
  chartDayLabel: { fontSize: 10, marginTop: 8 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  insightCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12 },
  insightIcon: { fontSize: 28 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  insightMessage: { fontSize: 13, lineHeight: 18 },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center', marginTop: 8 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
