import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    DAILY_GOAL_OPTIONS,
    DURATION_OPTIONS,
    formatTime,
    getNextPhase,
    getPhaseColor,
    getPhaseDuration,
    getPhaseEmoji,
    getPhaseLabel,
    getRandomHydrationTip,
    HYDRATION_AMOUNTS,
    loadPomodoroSettings,
    loadPomodoroStats,
    POMODORO_PRESETS,
    PomodoroSettings,
    PomodoroStats,
    recordCompletedSession,
    savePomodoroSettings,
    sendPhaseNotification,
    TimerPhase,
} from '@/services/pomodoroTimer';
import { addWaterIntake } from '@/services/water';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PomodoroScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hydrationTip, setHydrationTip] = useState<{ emoji: string; tip: string } | null>(null);
  const [waterLogged, setWaterLogged] = useState(false);
  const [breakWaterTotal, setBreakWaterTotal] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const loadData = async () => {
    const [loadedSettings, loadedStats] = await Promise.all([
      loadPomodoroSettings(),
      loadPomodoroStats(),
    ]);
    setSettings(loadedSettings);
    setStats(loadedStats);
    setTimeRemaining(loadedSettings.workDuration * 60);
  };

  const startTimer = useCallback(() => {
    if (!settings) return;
    
    const newPhase = phase === 'idle' ? 'work' : phase;
    setPhase(newPhase);
    setIsRunning(true);
    
    if (phase === 'idle') {
      setTimeRemaining(settings.workDuration * 60);
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings, phase]);

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('idle');
    setSessionsCompleted(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (settings) setTimeRemaining(settings.workDuration * 60);
  };

  const skipPhase = () => {
    if (!settings) return;
    handlePhaseComplete();
  };

  const handlePhaseComplete = async () => {
    if (!settings) return;

    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (phase === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      const updatedStats = await recordCompletedSession(settings.workDuration, settings.dailyGoal);
      setStats(updatedStats);
    }

    const nextPhase = getNextPhase(phase, sessionsCompleted, settings.sessionsUntilLongBreak);
    await sendPhaseNotification(nextPhase, settings);

    // Set hydration tip for break phases
    if ((nextPhase === 'shortBreak' || nextPhase === 'longBreak') && settings.hydrationRemindersEnabled) {
      setHydrationTip(getRandomHydrationTip(isBurmese));
      setWaterLogged(false);
    } else {
      setHydrationTip(null);
    }

    setPhase(nextPhase);
    setTimeRemaining(getPhaseDuration(nextPhase, settings));

    const shouldAutoStart =
      (nextPhase === 'work' && settings.autoStartWork) ||
      ((nextPhase === 'shortBreak' || nextPhase === 'longBreak') && settings.autoStartBreaks);

    if (shouldAutoStart) {
      setTimeout(() => startTimer(), 1000);
    }
  };

  const logWater = async (amount: number) => {
    if (!settings) return;
    try {
      await addWaterIntake(amount);
      setWaterLogged(true);
      setBreakWaterTotal((prev) => prev + amount);
      if (settings.vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error logging water:', error);
    }
  };

  const applyPreset = async (preset: typeof POMODORO_PRESETS[0]) => {
    if (!settings) return;
    const updated: PomodoroSettings = {
      ...settings,
      workDuration: preset.work,
      shortBreakDuration: preset.shortBreak,
      longBreakDuration: preset.longBreak,
      sessionsUntilLongBreak: preset.sessions,
    };
    await savePomodoroSettings(updated);
    setSettings(updated);
    if (!isRunning) setTimeRemaining(preset.work * 60);
  };

  const updateSetting = async <K extends keyof PomodoroSettings>(key: K, value: PomodoroSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    await savePomodoroSettings(updated);
    setSettings(updated);
    if (!isRunning && key === 'workDuration') {
      setTimeRemaining((value as number) * 60);
    }
  };

  const getProgress = (): number => {
    if (!settings || phase === 'idle') return 0;
    const totalDuration = getPhaseDuration(phase, settings);
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  };

  if (!settings || !stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{isBurmese ? 'ခဏစောင့်ပါ...' : 'Loading...'}</Text>
      </View>
    );
  }

  const phaseColor = getPhaseColor(phase);
  const progress = getProgress();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            🍅 {isBurmese ? 'ပိုမိုဒိုရို တိုင်မာ' : 'Pomodoro Timer'}
          </Text>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Phase Indicator */}
        <View style={[styles.phaseCard, { backgroundColor: phaseColor + '20' }]}>
          <Text style={styles.phaseEmoji}>{getPhaseEmoji(phase)}</Text>
          <Text style={[styles.phaseLabel, { color: phaseColor }]}>
            {getPhaseLabel(phase, isBurmese)}
          </Text>
          <Text style={[styles.sessionCount, { color: colors.textSecondary }]}>
            {isBurmese ? `အကြိမ် ${sessionsCompleted}/${settings.sessionsUntilLongBreak}` : `Session ${sessionsCompleted}/${settings.sessionsUntilLongBreak}`}
          </Text>
        </View>

        {/* Timer Circle */}
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.timerCircle, { borderColor: phaseColor }]}>
            <View style={[styles.progressRing, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: phaseColor,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <View style={[styles.timerInner, { backgroundColor: colors.card }]}>
              <Text style={[styles.timerText, { color: phaseColor }]}>{formatTime(timeRemaining)}</Text>
              <Text style={[styles.timerSubtext, { color: colors.textSecondary }]}>
                {phase === 'work'
                  ? isBurmese ? 'အာရုံစူးစိုက်ပါ' : 'Stay focused'
                  : phase === 'idle'
                    ? isBurmese ? 'စတင်ရန်အသင့်' : 'Ready to start'
                    : isBurmese ? 'အနားယူပါ' : 'Take a break'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: phaseColor }]}
              onPress={startTimer}
            >
              <Ionicons name="play" size={32} color="#fff" />
              <Text style={styles.mainButtonText}>{isBurmese ? 'စတင်' : 'Start'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: '#FF6B6B' }]}
                onPress={pauseTimer}
              >
                <Ionicons name="pause" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={skipPhase}
              >
                <Ionicons name="play-skip-forward" size={28} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={resetTimer}
              >
                <Ionicons name="refresh" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hydration Reminder Card - Shows during breaks */}
        {(phase === 'shortBreak' || phase === 'longBreak') && settings.hydrationRemindersEnabled && (
          <View style={[styles.hydrationCard, { backgroundColor: isDark ? '#1B3D4D' : '#E0F7FA' }]}>
            <View style={styles.hydrationHeader}>
              <Text style={styles.hydrationEmoji}>💧</Text>
              <Text style={[styles.hydrationTitle, { color: colors.text }]}>
                {isBurmese ? 'ရေသောက်ချိန်!' : 'Time to Hydrate!'}
              </Text>
              {waterLogged && (
                <View style={styles.loggedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                </View>
              )}
            </View>

            {hydrationTip && (
              <View style={styles.hydrationTipRow}>
                <Text style={styles.tipEmoji}>{hydrationTip.emoji}</Text>
                <Text style={[styles.hydrationTipText, { color: colors.textSecondary }]}>
                  {hydrationTip.tip}
                </Text>
              </View>
            )}

            <Text style={[styles.hydrationSubtitle, { color: colors.textSecondary }]}>
              {isBurmese ? 'အမြန်ထည့်ရန်' : 'Quick Add Water'}
            </Text>

            <View style={styles.waterButtons}>
              {HYDRATION_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.waterButton,
                    { backgroundColor: colors.card },
                    amount === settings.hydrationAmount && { borderColor: '#3498DB', borderWidth: 2 },
                  ]}
                  onPress={() => logWater(amount)}
                >
                  <Text style={styles.waterButtonEmoji}>💧</Text>
                  <Text style={[styles.waterButtonText, { color: colors.text }]}>{amount}ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            {breakWaterTotal > 0 && (
              <View style={styles.breakWaterTotal}>
                <Ionicons name="water" size={16} color="#3498DB" />
                <Text style={[styles.breakWaterText, { color: colors.textSecondary }]}>
                  {isBurmese
                    ? `ဤအနားယူချိန်တွင် ${breakWaterTotal}ml သောက်ပြီး`
                    : `${breakWaterTotal}ml logged this break`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Presets */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '⚡ အမြန်ရွေးချယ်မှု' : '⚡ Quick Presets'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
          {POMODORO_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                { backgroundColor: colors.card },
                settings.workDuration === preset.work && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => applyPreset(preset)}
            >
              <Text style={styles.presetEmoji}>{preset.icon}</Text>
              <Text style={[styles.presetName, { color: colors.text }]}>
                {isBurmese ? preset.nameMy : preset.name}
              </Text>
              <Text style={[styles.presetDuration, { color: colors.textSecondary }]}>
                {preset.work}/{preset.shortBreak}/{preset.longBreak}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📊 ယနေ့တိုးတက်မှု' : "📊 Today's Progress"}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.todaySessions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အကြိမ်' : 'Sessions'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#27AE60' }]}>{stats.todayMinutes}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'မိနစ်' : 'Minutes'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#E74C3C' }]}>{settings.dailyGoal}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပန်းတိုင်' : 'Goal'}
              </Text>
            </View>
          </View>
          <View style={styles.goalProgress}>
            <View style={[styles.goalBar, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.goalFill,
                  {
                    width: `${Math.min(100, (stats.todaySessions / settings.dailyGoal) * 100)}%`,
                    backgroundColor: stats.todaySessions >= settings.dailyGoal ? '#27AE60' : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.goalText, { color: colors.textSecondary }]}>
              {Math.round((stats.todaySessions / settings.dailyGoal) * 100)}%
            </Text>
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={[styles.weeklyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📈 အပတ်စဉ်စာရင်း' : '📈 Weekly Stats'}
          </Text>
          <View style={styles.weeklyRow}>
            <View style={[styles.weeklyItem, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
              <Text style={styles.weeklyEmoji}>🍅</Text>
              <Text style={[styles.weeklyValue, { color: colors.text }]}>{stats.weekSessions}</Text>
              <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အကြိမ်' : 'Sessions'}
              </Text>
            </View>
            <View style={[styles.weeklyItem, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}>
              <Text style={styles.weeklyEmoji}>⏱️</Text>
              <Text style={[styles.weeklyValue, { color: colors.text }]}>{Math.round(stats.weekMinutes / 60)}h</Text>
              <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စုစုပေါင်း' : 'Total'}
              </Text>
            </View>
            <View style={[styles.weeklyItem, { backgroundColor: isDark ? '#3D2B1F' : '#FFF3E0' }]}>
              <Text style={styles.weeklyEmoji}>🔥</Text>
              <Text style={[styles.weeklyValue, { color: colors.text }]}>{stats.currentStreak}</Text>
              <Text style={[styles.weeklyLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ဆက်တိုက်' : 'Streak'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 ပိုမိုဒိုရိုနည်းပညာ: ၂၅ မိနစ်အလုပ်လုပ်ပြီး ၅ မိနစ်အနားယူပါ။ ၄ ကြိမ်ပြီးရင် ရှည်ရှည်အနားယူပါ။'
              : '💡 Pomodoro technique: Work 25 min, break 5 min. After 4 sessions, take a longer break.'}
          </Text>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBurmese ? '⚙️ ဆက်တင်များ' : '⚙️ Settings'}
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Duration Settings */}
              <Text style={[styles.settingSection, { color: colors.text }]}>
                {isBurmese ? '⏱️ ကြာချိန်များ' : '⏱️ Durations'}
              </Text>
              
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အလုပ်လုပ်ချိန်' : 'Work Duration'}
                </Text>
                <View style={styles.durationPicker}>
                  {DURATION_OPTIONS.work.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.durationOption,
                        { backgroundColor: colors.surfaceVariant },
                        settings.workDuration === d && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => updateSetting('workDuration', d)}
                    >
                      <Text style={[
                        styles.durationText,
                        { color: settings.workDuration === d ? '#fff' : colors.text },
                      ]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အနားယူချိန်တို' : 'Short Break'}
                </Text>
                <View style={styles.durationPicker}>
                  {DURATION_OPTIONS.shortBreak.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.durationOption,
                        { backgroundColor: colors.surfaceVariant },
                        settings.shortBreakDuration === d && { backgroundColor: '#27AE60' },
                      ]}
                      onPress={() => updateSetting('shortBreakDuration', d)}
                    >
                      <Text style={[
                        styles.durationText,
                        { color: settings.shortBreakDuration === d ? '#fff' : colors.text },
                      ]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အနားယူချိန်ရှည်' : 'Long Break'}
                </Text>
                <View style={styles.durationPicker}>
                  {DURATION_OPTIONS.longBreak.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.durationOption,
                        { backgroundColor: colors.surfaceVariant },
                        settings.longBreakDuration === d && { backgroundColor: '#3498DB' },
                      ]}
                      onPress={() => updateSetting('longBreakDuration', d)}
                    >
                      <Text style={[
                        styles.durationText,
                        { color: settings.longBreakDuration === d ? '#fff' : colors.text },
                      ]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Daily Goal */}
              <Text style={[styles.settingSection, { color: colors.text }]}>
                {isBurmese ? '🎯 နေ့စဉ်ပန်းတိုင်' : '🎯 Daily Goal'}
              </Text>
              <View style={styles.durationPicker}>
                {DAILY_GOAL_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.goalOption,
                      { backgroundColor: colors.surfaceVariant },
                      settings.dailyGoal === g && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => updateSetting('dailyGoal', g)}
                  >
                    <Text style={[
                      styles.durationText,
                      { color: settings.dailyGoal === g ? '#fff' : colors.text },
                    ]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Toggle Settings */}
              <Text style={[styles.settingSection, { color: colors.text }]}>
                {isBurmese ? '🔔 အသိပေးချက်များ' : '🔔 Notifications'}
              </Text>

              <View style={styles.toggleRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အသံဖွင့်' : 'Sound'}
                </Text>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(v) => updateSetting('soundEnabled', v)}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'တုန်ခါမှု' : 'Vibration'}
                </Text>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(v) => updateSetting('vibrationEnabled', v)}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အကြောင်းကြားချက်' : 'Notifications'}
                </Text>
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(v) => updateSetting('notificationsEnabled', v)}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                />
              </View>

              <Text style={[styles.settingSection, { color: colors.text }]}>
                {isBurmese ? '🤖 အလိုအလျောက်' : '🤖 Auto Start'}
              </Text>

              <View style={styles.toggleRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အနားယူချိန်အလိုအလျောက်စတင်' : 'Auto-start breaks'}
                </Text>
                <Switch
                  value={settings.autoStartBreaks}
                  onValueChange={(v) => updateSetting('autoStartBreaks', v)}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အလုပ်ချိန်အလိုအလျောက်စတင်' : 'Auto-start work'}
                </Text>
                <Switch
                  value={settings.autoStartWork}
                  onValueChange={(v) => updateSetting('autoStartWork', v)}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                />
              </View>

              {/* Hydration Settings */}
              <Text style={[styles.settingSection, { color: colors.text }]}>
                {isBurmese ? '💧 ရေသောက်သတိပေး' : '💧 Hydration Reminders'}
              </Text>

              <View style={styles.toggleRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အနားယူချိန်တွင် ရေသောက်သတိပေး' : 'Remind to drink during breaks'}
                </Text>
                <Switch
                  value={settings.hydrationRemindersEnabled}
                  onValueChange={(v) => updateSetting('hydrationRemindersEnabled', v)}
                  trackColor={{ false: colors.surfaceVariant, true: '#3498DB' }}
                />
              </View>

              {settings.hydrationRemindersEnabled && (
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    {isBurmese ? 'အကြံပြုရေပမာဏ' : 'Suggested Amount'}
                  </Text>
                  <View style={styles.durationPicker}>
                    {HYDRATION_AMOUNTS.map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[
                          styles.durationOption,
                          { backgroundColor: colors.surfaceVariant },
                          settings.hydrationAmount === amount && { backgroundColor: '#3498DB' },
                        ]}
                        onPress={() => updateSetting('hydrationAmount', amount)}
                      >
                        <Text
                          style={[
                            styles.durationText,
                            { color: settings.hydrationAmount === amount ? '#fff' : colors.text },
                          ]}
                        >
                          {amount}ml
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 22,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
  },
  phaseCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  phaseEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  sessionCount: {
    fontSize: 14,
    marginTop: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerInner: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
  },
  timerSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    gap: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  runningControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetsRow: {
    marginBottom: 24,
  },
  presetCard: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  presetEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetDuration: {
    fontSize: 10,
    marginTop: 4,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
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
    fontSize: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
  },
  settingSection: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  durationPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 48,
    alignItems: 'center',
  },
  goalOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 56,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  // Hydration Card Styles
  hydrationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hydrationEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  hydrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  loggedBadge: {
    marginLeft: 8,
  },
  hydrationTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  hydrationTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  hydrationSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  waterButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  waterButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  waterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakWaterTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  breakWaterText: {
    fontSize: 13,
  },
});
