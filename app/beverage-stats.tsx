import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    BEVERAGE_CATEGORIES,
    BeverageStats,
    getBeverageStats,
    getHydrationColor,
} from '@/services/beverages';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BeverageStatsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BeverageStats | null>(null);
  const [period, setPeriod] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getBeverageStats(period);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return BEVERAGE_CATEGORIES.find(c => c.id === categoryId) || {
      name: categoryId,
      nameMy: categoryId,
      icon: '🥤',
      color: '#9E9E9E',
    };
  };

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: colors.card }]}>
      {([7, 14, 30] as const).map(p => (
        <TouchableOpacity
          key={p}
          style={[
            styles.periodButton,
            { backgroundColor: period === p ? colors.primary : 'transparent' },
          ]}
          onPress={() => setPeriod(p)}
        >
          <Text style={[styles.periodText, { color: period === p ? '#fff' : colors.text }]}>
            {p} {isBurmese ? 'ရက်' : 'days'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEfficiencyCard = () => (
    <View style={[styles.efficiencyCard, { backgroundColor: colors.primary }]}>
      <Text style={styles.efficiencyTitle}>
        {isBurmese ? '💧 ရေဓာတ်ထိရောက်မှု' : '💧 Hydration Efficiency'}
      </Text>
      <Text style={styles.efficiencyValue}>{stats?.averageEfficiency || 100}%</Text>
      <Text style={styles.efficiencyDesc}>
        {isBurmese 
          ? 'သင်သောက်သုံးသော အချိုရည်များ၏ ပျမ်းမျှ ရေဓာတ်ထိရောက်မှု'
          : 'Average hydration efficiency of your beverages'}
      </Text>
      <View style={styles.efficiencyBar}>
        <View style={[styles.efficiencyFill, { width: `${stats?.averageEfficiency || 100}%` }]} />
      </View>
    </View>
  );

  const renderMostConsumed = () => {
    if (!stats?.mostConsumed) return null;

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {isBurmese ? '🏆 အများဆုံးသောက်သုံးသော' : '🏆 Most Consumed'}
        </Text>
        <View style={styles.mostConsumedContent}>
          <Text style={styles.mostConsumedIcon}>{stats.mostConsumed.beverage.icon}</Text>
          <View style={styles.mostConsumedInfo}>
            <Text style={[styles.mostConsumedName, { color: colors.text }]}>
              {isBurmese ? stats.mostConsumed.beverage.nameMy : stats.mostConsumed.beverage.name}
            </Text>
            <Text style={[styles.mostConsumedCount, { color: colors.textSecondary }]}>
              {stats.mostConsumed.count} {isBurmese ? 'ကြိမ်' : 'times'}
            </Text>
          </View>
          <View style={[styles.coefficientBadge, { backgroundColor: getHydrationColor(stats.mostConsumed.beverage.hydrationCoefficient) + '20' }]}>
            <Text style={[styles.coefficientText, { color: getHydrationColor(stats.mostConsumed.beverage.hydrationCoefficient) }]}>
              {Math.round(stats.mostConsumed.beverage.hydrationCoefficient * 100)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!stats?.totalByCategory.length) return null;

    const maxAmount = Math.max(...stats.totalByCategory.map(c => c.amount));

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {isBurmese ? '📊 အမျိုးအစားအလိုက်' : '📊 By Category'}
        </Text>
        {stats.totalByCategory
          .sort((a, b) => b.amount - a.amount)
          .map(item => {
            const category = getCategoryInfo(item.category);
            const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

            return (
              <View key={item.category} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryName, { color: colors.text }]}>
                    {isBurmese ? category.nameMy : category.name}
                  </Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <View style={[styles.categoryBar, { backgroundColor: colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${percentage}%`, backgroundColor: category.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>
                    {(item.amount / 1000).toFixed(1)}L
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
    );
  };

  const renderWeeklyTrend = () => {
    if (!stats?.weeklyTrend.length) return null;

    const maxEffective = Math.max(...stats.weeklyTrend.map(d => d.effective), 1);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {isBurmese ? '📈 နေ့စဉ်လမ်းကြောင်း' : '📈 Daily Trend'}
        </Text>
        <View style={styles.trendChart}>
          {stats.weeklyTrend.slice(-7).map((day, index) => {
            const height = maxEffective > 0 ? (day.effective / maxEffective) * 100 : 0;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);

            return (
              <View key={day.date} style={styles.trendBarContainer}>
                <View style={styles.trendBarWrapper}>
                  <View
                    style={[
                      styles.trendBar,
                      { height: `${height}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>{dayName}</Text>
                <Text style={[styles.trendValue, { color: colors.text }]}>
                  {day.effective > 0 ? `${(day.effective / 1000).toFixed(1)}` : '-'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTips = () => (
    <View style={[styles.tipsCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
      <Ionicons name="bulb" size={24} color="#FFC107" />
      <View style={styles.tipsContent}>
        <Text style={[styles.tipsTitle, { color: colors.text }]}>
          {isBurmese ? '💡 အကြံပြုချက်' : '💡 Tip'}
        </Text>
        <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
          {stats && stats.averageEfficiency < 85
            ? (isBurmese 
                ? 'ရေဓာတ်ထိရောက်မှု တိုးမြှင့်ရန် ရေနှင့် ဆေးဖက်ဝင်လက်ဖက်ရည် ပိုသောက်ပါ။'
                : 'Drink more water and herbal tea to improve your hydration efficiency.')
            : (isBurmese
                ? 'ကောင်းပါတယ်! သင့်အချိုရည်ရွေးချယ်မှုများသည် ရေဓာတ်အတွက် ကောင်းမွန်ပါသည်။'
                : 'Great job! Your beverage choices are good for hydration.')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? '📊 အချိုရည်စာရင်းအင်း' : '📊 Beverage Stats'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderPeriodSelector()}
        {renderEfficiencyCard()}
        {renderMostConsumed()}
        {renderCategoryBreakdown()}
        {renderWeeklyTrend()}
        {renderTips()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Period Selector
  periodSelector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  periodButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  periodText: { fontSize: 14, fontWeight: '600' },

  // Efficiency Card
  efficiencyCard: { borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' },
  efficiencyTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 8 },
  efficiencyValue: { color: '#fff', fontSize: 48, fontWeight: '700' },
  efficiencyDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center', marginTop: 8 },
  efficiencyBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  efficiencyFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },

  // Card
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },

  // Most Consumed
  mostConsumedContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mostConsumedIcon: { fontSize: 40 },
  mostConsumedInfo: { flex: 1 },
  mostConsumedName: { fontSize: 16, fontWeight: '600' },
  mostConsumedCount: { fontSize: 13, marginTop: 2 },
  coefficientBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  coefficientText: { fontSize: 14, fontWeight: '700' },

  // Category Breakdown
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', width: 100, gap: 8 },
  categoryIcon: { fontSize: 18 },
  categoryName: { fontSize: 13 },
  categoryBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 4 },
  categoryAmount: { fontSize: 12, width: 40, textAlign: 'right' },

  // Weekly Trend
  trendChart: { flexDirection: 'row', justifyContent: 'space-between', height: 120 },
  trendBarContainer: { alignItems: 'center', flex: 1 },
  trendBarWrapper: { flex: 1, width: 20, justifyContent: 'flex-end' },
  trendBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  trendLabel: { fontSize: 10, marginTop: 4 },
  trendValue: { fontSize: 10, fontWeight: '600' },

  // Tips
  tipsCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12 },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  tipsText: { fontSize: 13, lineHeight: 18 },
});
