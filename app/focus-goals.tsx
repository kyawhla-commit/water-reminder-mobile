import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    DAILY_MINUTES_GOAL_OPTIONS,
    FOCUS_GOAL_PRESETS,
    formatMinutesToDisplay,
    getFocusGoalProgress,
    getFocusMotivation,
    loadPomodoroSettings,
    loadPomodoroStats,
    PomodoroSettings,
    PomodoroStats,
    savePomodoroSettings,
} from '@/services/pomodoroTimer';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FocusGoalsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [stats, setStats] = useState<PomodoroStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedSettings, loadedStats] = await Promise.all([loadPomodoroSettings(), loadPomodoroStats()]);
    setSettings(loadedSettings);
    setStats(loadedStats);
  };

  const updateGoal = async (minutes: number) => {
    if (!settings) return;
    const updated = { ...settings, dailyMinutesGoal: minutes };
    await savePomodoroSettings(updated);
    setSettings(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const applyPreset = async (preset: (typeof FOCUS_GOAL_PRESETS)[0]) => {
    if (!settings) return;
    const updated = {
      ...settings,
      dailyMinutesGoal: preset.minutes,
      dailyGoal: preset.sessions,
    };
    await savePomodoroSettings(updated);
    setSettings(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!settings || !stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{isBurmese ? 'ခဏစောင့်ပါ...' : 'Loading...'}</Text>
      </View>
    );
  }

  const progress = getFocusGoalProgress(stats.todayMinutes, settings.dailyMinutesGoal);
  const motivation = getFocusMotivation(progress, isBurmese);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            🎯 {isBurmese ? 'နေ့စဉ်အာရုံစူးစိုက်မှုပန်းတိုင်' : 'Daily Focus Goal'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Today's Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressCircleContainer}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: progress >= 100 ? '#27AE60' : '#3498DB' },
              ]}
            >
              <Text style={[styles.progressPercent, { color: progress >= 100 ? '#27AE60' : '#3498DB' }]}>
                {progress}%
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပြီးစီး' : 'Complete'}
              </Text>
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStatRow}>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အာရုံစူးစိုက်ပြီး' : 'Focused'}
              </Text>
              <Text style={[styles.progressStatValue, { color: '#3498DB' }]}>
                {formatMinutesToDisplay(stats.todayMinutes, isBurmese)}
              </Text>
            </View>
            <View style={styles.progressStatRow}>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပန်းတိုင်' : 'Goal'}
              </Text>
              <Text style={[styles.progressStatValue, { color: '#27AE60' }]}>
                {formatMinutesToDisplay(settings.dailyMinutesGoal, isBurmese)}
              </Text>
            </View>
            <View style={styles.progressStatRow}>
              <Text style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ကျန်ရှိ' : 'Remaining'}
              </Text>
              <Text style={[styles.progressStatValue, { color: '#E74C3C' }]}>
                {formatMinutesToDisplay(Math.max(0, settings.dailyMinutesGoal - stats.todayMinutes), isBurmese)}
              </Text>
            </View>
          </View>

          {/* Motivation Badge */}
          <View
            style={[styles.motivationCard, { backgroundColor: progress >= 100 ? '#27AE6020' : '#3498DB20' }]}
          >
            <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
            <Text style={[styles.motivationText, { color: colors.text }]}>{motivation.message}</Text>
          </View>
        </View>

        {/* Goal Presets */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '⚡ ပန်းတိုင်အကြံပြုချက်များ' : '⚡ Goal Presets'}
        </Text>
        <View style={styles.presetsGrid}>
          {FOCUS_GOAL_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                { backgroundColor: colors.card },
                settings.dailyMinutesGoal === preset.minutes && {
                  borderColor: '#3498DB',
                  borderWidth: 2,
                },
              ]}
              onPress={() => applyPreset(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text style={[styles.presetName, { color: colors.text }]}>
                {isBurmese ? preset.nameMy : preset.name}
              </Text>
              <Text style={[styles.presetMinutes, { color: '#3498DB' }]}>
                {formatMinutesToDisplay(preset.minutes, isBurmese)}
              </Text>
              <Text style={[styles.presetSessions, { color: colors.textSecondary }]}>
                {preset.sessions} {isBurmese ? 'အကြိမ်' : 'sessions'}
              </Text>
              <Text style={[styles.presetDesc, { color: colors.textSecondary }]}>
                {isBurmese ? preset.descriptionMy : preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Goal */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '🎚️ စိတ်ကြိုက်ပန်းတိုင်' : '🎚️ Custom Goal'}
        </Text>
        <View style={[styles.customGoalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.customGoalLabel, { color: colors.textSecondary }]}>
            {isBurmese ? 'နေ့စဉ်အာရုံစူးစိုက်မှုပန်းတိုင် (မိနစ်)' : 'Daily Focus Goal (minutes)'}
          </Text>
          <View style={styles.customGoalOptions}>
            {DAILY_MINUTES_GOAL_OPTIONS.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.customGoalOption,
                  { backgroundColor: colors.surfaceVariant },
                  settings.dailyMinutesGoal === minutes && { backgroundColor: '#3498DB' },
                ]}
                onPress={() => updateGoal(minutes)}
              >
                <Text
                  style={[
                    styles.customGoalText,
                    { color: settings.dailyMinutesGoal === minutes ? '#fff' : colors.text },
                  ]}
                >
                  {formatMinutesToDisplay(minutes, isBurmese)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '📊 အပတ်စဉ်အကျဉ်းချုပ်' : '📊 Weekly Summary'}
        </Text>
        <View style={[styles.weeklyCard, { backgroundColor: colors.card }]}>
          <View style={styles.weeklyRow}>
            <View style={[styles.weeklyItem, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
              <Text style={styles.weeklyEmoji}>⏱️</Text>
              <Text style={[styles.weeklyValue, { color: colors.text }]}>
                {formatMinutesToDisplay(stats.weekMinutes, isBurmese)}
              </Text>
              <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စုစုပေါင်း' : 'Total'}
              </Text>
            </View>
            <View style={[styles.weeklyItem, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}>
              <Text style={styles.weeklyEmoji}>🍅</Text>
              <Text style={[styles.weeklyValue, { color: colors.text }]}>{stats.weekSessions}</Text>
              <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အကြိမ်' : 'Sessions'}
              </Text>
            </View>
            <View style={[styles.weeklyItem, { backgroundColor: isDark ? '#3D2B1F' : '#FFF3E0' }]}>
              <Text style={styles.weeklyEmoji}>📈</Text>
              <Text style={[styles.weeklyValue, { color: colors.text }]}>
                {stats.weekSessions > 0 ? Math.round(stats.weekMinutes / stats.weekSessions) : 0}m
              </Text>
              <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပျမ်းမျှ' : 'Avg/Session'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 အကြံပြုချက်: သင့်ပန်းတိုင်ကို ရောက်ရှိနိုင်သော ပမာဏဖြင့် စတင်ပြီး တဖြည်းဖြည်း တိုးမြှင့်ပါ။'
              : '💡 Tip: Start with an achievable goal and gradually increase it as you build your focus habit.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 36,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  progressStats: {
    gap: 12,
    marginBottom: 16,
  },
  progressStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 14,
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  motivationEmoji: {
    fontSize: 24,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  presetCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  presetIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  presetMinutes: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetSessions: {
    fontSize: 12,
    marginBottom: 6,
  },
  presetDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  customGoalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  customGoalLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  customGoalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  customGoalOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  customGoalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weeklyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  weeklyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weeklyItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  weeklyEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  weeklyValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  weeklyLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
