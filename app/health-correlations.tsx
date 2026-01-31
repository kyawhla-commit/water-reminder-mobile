import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWaterTracker } from '@/hooks/useWaterTracker';
import {
    analyzeCorrelations,
    CorrelationInsight,
    DailyHealthLog,
    ENERGY_EMOJIS,
    ENERGY_LABELS,
    EnergyLevel,
    getRecentLogs,
    getTodayLog,
    getWeeklyAverages,
    logDailyHealth,
    MOOD_EMOJIS,
    MOOD_LABELS,
    MoodLevel,
    SKIN_EMOJIS,
    SKIN_LABELS,
    SkinHealth,
} from '@/services/healthCorrelations';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HealthCorrelationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { dailyIntake, dailyWaterGoal } = useWaterTracker();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [todayLog, setTodayLog] = useState<DailyHealthLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyHealthLog[]>([]);
  const [insights, setInsights] = useState<CorrelationInsight[]>([]);
  const [averages, setAverages] = useState({ avgMood: 0, avgEnergy: 0, avgSkin: 0, avgWater: 0 });
  const [selectedMood, setSelectedMood] = useState<MoodLevel>(3);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>(3);
  const [selectedSkin, setSelectedSkin] = useState<SkinHealth>(3);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const today = await getTodayLog();
    if (today) {
      setTodayLog(today);
      setSelectedMood(today.mood);
      setSelectedEnergy(today.energy);
      setSelectedSkin(today.skinHealth);
      setHasLoggedToday(true);
    }

    const logs = await getRecentLogs(7);
    setRecentLogs(logs);

    const correlations = await analyzeCorrelations(dailyWaterGoal);
    setInsights(correlations);

    const avgs = await getWeeklyAverages();
    setAverages(avgs);
  };

  const handleSaveLog = async () => {
    await logDailyHealth(dailyIntake, selectedMood, selectedEnergy, selectedSkin);
    setHasLoggedToday(true);
    loadData();
  };

  const renderLevelSelector = <T extends number>(
    title: string,
    emojis: { [key: number]: string },
    labels: { en: { [key: number]: string }; my: { [key: number]: string } },
    selected: T,
    onSelect: (level: T) => void,
    color: string
  ) => (
    <View style={styles.selectorSection}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.levelRow}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelButton,
              { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' },
              selected === level && { backgroundColor: color, borderColor: color },
            ]}
            onPress={() => onSelect(level as T)}
          >
            <Text style={styles.levelEmoji}>{emojis[level as keyof typeof emojis]}</Text>
            <Text
              style={[
                styles.levelLabel,
                { color: selected === level ? '#fff' : colors.textSecondary },
              ]}
            >
              {isBurmese ? labels.my[level as keyof typeof labels.my] : labels.en[level as keyof typeof labels.en]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isBurmese ? '📊 ကျန်းမာရေးဆက်စပ်မှု' : '📊 Health Correlations'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Today's Log */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isBurmese ? '📝 ယနေ့မှတ်တမ်း' : "📝 Today's Log"}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {isBurmese
              ? 'သင့်ခံစားမှုကို မှတ်တမ်းတင်ပြီး ရေဓာတ်နဲ့ ဆက်စပ်မှုကို ကြည့်ပါ'
              : 'Track how you feel and see correlations with hydration'}
          </Text>

          {renderLevelSelector<MoodLevel>(
            isBurmese ? 'စိတ်ခံစားမှု' : 'Mood',
            MOOD_EMOJIS,
            MOOD_LABELS,
            selectedMood,
            setSelectedMood,
            '#9C27B0'
          )}

          {renderLevelSelector<EnergyLevel>(
            isBurmese ? 'စွမ်းအင်' : 'Energy',
            ENERGY_EMOJIS,
            ENERGY_LABELS,
            selectedEnergy,
            setSelectedEnergy,
            '#FF9800'
          )}

          {renderLevelSelector<SkinHealth>(
            isBurmese ? 'အသားအရေ' : 'Skin Health',
            SKIN_EMOJIS,
            SKIN_LABELS,
            selectedSkin,
            setSelectedSkin,
            '#4CAF50'
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveLog}
          >
            <Ionicons name={hasLoggedToday ? 'checkmark-circle' : 'save'} size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {hasLoggedToday
                ? isBurmese ? 'အပ်ဒိတ်လုပ်မည်' : 'Update Log'
                : isBurmese ? 'သိမ်းဆည်းမည်' : 'Save Log'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Averages */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isBurmese ? '📈 အပတ်စဉ်ပျမ်းမျှ' : '📈 Weekly Averages'}
          </Text>

          <View style={styles.averagesRow}>
            <View style={[styles.averageItem, { backgroundColor: isDark ? '#2D1B4E' : '#F3E5F5' }]}>
              <Text style={styles.averageEmoji}>{MOOD_EMOJIS[Math.round(averages.avgMood) as MoodLevel] || '😐'}</Text>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {averages.avgMood.toFixed(1)}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စိတ်ခံစားမှု' : 'Mood'}
              </Text>
            </View>

            <View style={[styles.averageItem, { backgroundColor: isDark ? '#3D2B1F' : '#FFF3E0' }]}>
              <Text style={styles.averageEmoji}>{ENERGY_EMOJIS[Math.round(averages.avgEnergy) as EnergyLevel] || '😌'}</Text>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {averages.avgEnergy.toFixed(1)}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စွမ်းအင်' : 'Energy'}
              </Text>
            </View>

            <View style={[styles.averageItem, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}>
              <Text style={styles.averageEmoji}>{SKIN_EMOJIS[Math.round(averages.avgSkin) as SkinHealth] || '😊'}</Text>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {averages.avgSkin.toFixed(1)}
              </Text>
              <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အသားအရေ' : 'Skin'}
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {isBurmese ? '💡 တွေ့ရှိချက်များ' : '💡 Insights'}
            </Text>

            {insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightItem,
                  {
                    backgroundColor:
                      insight.correlation === 'positive'
                        ? isDark ? '#1B3D2F' : '#E8F5E9'
                        : isDark ? '#3D2B1F' : '#FFF3E0',
                  },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>
                    {insight.type === 'mood' ? '😊' : insight.type === 'energy' ? '⚡' : '✨'}
                  </Text>
                  <View style={styles.insightStrength}>
                    <View
                      style={[
                        styles.strengthBar,
                        {
                          width: `${insight.strength}%`,
                          backgroundColor: insight.correlation === 'positive' ? '#4CAF50' : '#FF9800',
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {isBurmese ? insight.messageMy : insight.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent History */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isBurmese ? '📅 မကြာသေးမီမှတ်တမ်း' : '📅 Recent History'}
          </Text>

          {recentLogs.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isBurmese
                ? 'မှတ်တမ်းမရှိသေးပါ။ ယနေ့စတင်မှတ်တမ်းတင်ပါ!'
                : 'No logs yet. Start tracking today!'}
            </Text>
          ) : (
            recentLogs.map((log, index) => (
              <View
                key={log.date}
                style={[
                  styles.historyItem,
                  { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' },
                  index === 0 && { borderLeftColor: colors.primary, borderLeftWidth: 3 },
                ]}
              >
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {new Date(log.date).toLocaleDateString(isBurmese ? 'my-MM' : 'en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={styles.historyStats}>
                  <Text style={styles.historyEmoji}>{MOOD_EMOJIS[log.mood]}</Text>
                  <Text style={styles.historyEmoji}>{ENERGY_EMOJIS[log.energy]}</Text>
                  <Text style={styles.historyEmoji}>{SKIN_EMOJIS[log.skinHealth]}</Text>
                  <Text style={[styles.historyWater, { color: colors.primary }]}>
                    💧 {(log.waterIntake / 1000).toFixed(1)}L
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 ရက် ၅ ရက်ထက်ပိုမှတ်တမ်းတင်ပြီးရင် ဆက်စပ်မှုတွေ့ရှိချက်များ ပေါ်လာပါမည်!'
              : '💡 Log for 5+ days to see correlation insights between hydration and your wellbeing!'}
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
  card: { borderRadius: 20, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  cardSubtitle: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  selectorSection: { marginBottom: 20 },
  selectorTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelButton: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  levelEmoji: { fontSize: 24, marginBottom: 4 },
  levelLabel: { fontSize: 9, textAlign: 'center' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  averagesRow: { flexDirection: 'row', gap: 12 },
  averageItem: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  averageEmoji: { fontSize: 32, marginBottom: 8 },
  averageValue: { fontSize: 20, fontWeight: '700' },
  averageLabel: { fontSize: 11, marginTop: 4 },
  insightItem: { padding: 16, borderRadius: 12, marginBottom: 12 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightIcon: { fontSize: 24, marginRight: 12 },
  insightStrength: { flex: 1, height: 6, backgroundColor: '#E0E0E0', borderRadius: 3 },
  strengthBar: { height: '100%', borderRadius: 3 },
  insightText: { fontSize: 13, lineHeight: 18 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  historyDate: { fontSize: 12 },
  historyStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyEmoji: { fontSize: 18 },
  historyWater: { fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', padding: 20 },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
