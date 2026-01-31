import { DEFAULT_FOCUS_DURATION } from '@/config';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import { getTodayFocusStats, saveFocusSession } from '@/services/focus';
import {
    formatMinutesToDisplay,
    getFocusGoalProgress,
    getFocusMotivation,
    loadPomodoroSettings,
    loadPomodoroStats,
    PomodoroSettings,
    PomodoroStats,
} from '@/services/pomodoroTimer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FocusScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_DURATION * 60);
  const [sessionDuration, setSessionDuration] = useState(DEFAULT_FOCUS_DURATION);
  const [todayStats, setTodayStats] = useState({ completed: 0, totalMinutes: 0 });
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings | null>(null);
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadStats();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const loadStats = useCallback(async () => {
    const stats = await getTodayFocusStats();
    setTodayStats(stats);
    const settings = await loadPomodoroSettings();
    setPomodoroSettings(settings);
    const pStats = await loadPomodoroStats();
    setPomodoroStats(pStats);
  }, []);

  const { refreshing, handleRefresh } = usePullRefresh({
    onRefresh: loadStats,
  });

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSession = () => {
    setIsRunning(true);
    setTimeLeft(sessionDuration * 60);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseSession = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetSession = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const completeSession = async () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    await saveFocusSession({
      name: 'Focus Session',
      duration: sessionDuration,
      completedAt: new Date().toISOString(),
    });

    loadStats();
    setTimeLeft(sessionDuration * 60);
  };

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustDuration = (delta: number) => {
    if (!isRunning) {
      const newDuration = Math.max(5, Math.min(120, sessionDuration + delta));
      setSessionDuration(newDuration);
      setTimeLeft(newDuration * 60);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>🎯 Focus Mode</Text>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.success]}
            tintColor={colors.success}
          />
        }
      >
        {/* Timer Circle */}
        <Animated.View
          style={[
            styles.timerContainer,
            {
              backgroundColor: colors.card,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={[styles.timerText, { color: colors.text }]}>{formatTimeDisplay(timeLeft)}</Text>
          {!isRunning && (
            <View style={styles.durationAdjust}>
              <TouchableOpacity onPress={() => adjustDuration(-5)}>
                <Ionicons name="remove-circle-outline" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.durationText, { color: colors.textSecondary }]}>{sessionDuration} min</Text>
              <TouchableOpacity onPress={() => adjustDuration(5)}>
                <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: colors.success }]} onPress={startSession}>
              <Ionicons name="play" size={32} color="#fff" />
              <Text style={styles.mainButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.error }]} onPress={pauseSession}>
                <Ionicons name="pause" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={resetSession}
              >
                <Ionicons name="refresh" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Today's Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{todayStats.completed}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{todayStats.totalMinutes}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Daily Focus Goal Card */}
        {pomodoroSettings && pomodoroStats && (
          <TouchableOpacity
            style={[styles.goalCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/focus-goals' as any)}
          >
            <View style={styles.goalHeader}>
              <Text style={styles.goalEmoji}>🎯</Text>
              <Text style={[styles.goalTitle, { color: colors.text }]}>Daily Focus Goal</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>

            {/* Progress Bar */}
            <View style={styles.goalProgressContainer}>
              <View style={[styles.goalProgressBar, { backgroundColor: colors.surfaceVariant }]}>
                <View
                  style={[
                    styles.goalProgressFill,
                    {
                      width: `${getFocusGoalProgress(pomodoroStats.todayMinutes, pomodoroSettings.dailyMinutesGoal)}%`,
                      backgroundColor:
                        getFocusGoalProgress(pomodoroStats.todayMinutes, pomodoroSettings.dailyMinutesGoal) >= 100
                          ? colors.success
                          : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.goalProgressText, { color: colors.text }]}>
                {getFocusGoalProgress(pomodoroStats.todayMinutes, pomodoroSettings.dailyMinutesGoal)}%
              </Text>
            </View>

            {/* Goal Stats */}
            <View style={styles.goalStats}>
              <View style={styles.goalStatItem}>
                <Text style={[styles.goalStatValue, { color: colors.primary }]}>
                  {formatMinutesToDisplay(pomodoroStats.todayMinutes, false)}
                </Text>
                <Text style={[styles.goalStatLabel, { color: colors.textSecondary }]}>Focused</Text>
              </View>
              <View style={[styles.goalDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.goalStatItem}>
                <Text style={[styles.goalStatValue, { color: colors.success }]}>
                  {formatMinutesToDisplay(pomodoroSettings.dailyMinutesGoal, false)}
                </Text>
                <Text style={[styles.goalStatLabel, { color: colors.textSecondary }]}>Goal</Text>
              </View>
              <View style={[styles.goalDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.goalStatItem}>
                <Text style={[styles.goalStatValue, { color: colors.error }]}>
                  {formatMinutesToDisplay(
                    Math.max(0, pomodoroSettings.dailyMinutesGoal - pomodoroStats.todayMinutes),
                    false
                  )}
                </Text>
                <Text style={[styles.goalStatLabel, { color: colors.textSecondary }]}>Remaining</Text>
              </View>
            </View>

            {/* Motivation */}
            <View
              style={[
                styles.motivationBadge,
                {
                  backgroundColor:
                    getFocusGoalProgress(pomodoroStats.todayMinutes, pomodoroSettings.dailyMinutesGoal) >= 100
                      ? colors.success + '20'
                      : colors.primary + '20',
                },
              ]}
            >
              <Text style={styles.motivationEmoji}>
                {getFocusMotivation(getFocusGoalProgress(pomodoroStats.todayMinutes, pomodoroSettings.dailyMinutesGoal), false).emoji}
              </Text>
              <Text style={[styles.motivationText, { color: colors.text }]}>
                {getFocusMotivation(getFocusGoalProgress(pomodoroStats.todayMinutes, pomodoroSettings.dailyMinutesGoal), false).message}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Pomodoro Timer Link */}
        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/pomodoro' as any)}
        >
          <View style={[styles.featureIcon, { backgroundColor: colors.error + '20' }]}>
            <Text style={styles.featureEmoji}>🍅</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Pomodoro Timer</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Advanced timer with presets, breaks & stats
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Deep Work Mode Link */}
        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/deep-work' as any)}
        >
          <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '20' }]}>
            <Text style={styles.featureEmoji}>🧠</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Deep Work Mode</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Extended focus with DND & interruption tracking
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Focus History Link */}
        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/focus-history' as any)}
        >
          <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
            <Text style={styles.featureEmoji}>📊</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Focus History</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Track productivity patterns over time
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* App Blocker Link */}
        <TouchableOpacity
          style={[styles.featureCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/app-blocker' as any)}
        >
          <View style={[styles.featureIcon, { backgroundColor: colors.error + '20' }]}>
            <Text style={styles.featureEmoji}>🚫</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>App Blocker</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Block distracting apps during focus sessions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Focus Tips */}
        <View style={[styles.tipsCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipsText, { color: colors.text }]}>
            💡 Tip: Use the Pomodoro technique - work for 25 minutes, then take a 5-minute break. After 4 sessions, take a longer break!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  timerContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
  },
  durationAdjust: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  durationText: {
    fontSize: 16,
  },
  controls: {
    marginBottom: 40,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  runningControls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  featureCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  tipsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  // Goal Card Styles
  goalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  goalProgressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalProgressText: {
    fontSize: 16,
    fontWeight: '700',
    width: 45,
    textAlign: 'right',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  goalStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  goalDivider: {
    width: 1,
    height: 30,
    opacity: 0.2,
  },
  motivationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  motivationEmoji: {
    fontSize: 18,
  },
  motivationText: {
    flex: 1,
    fontSize: 13,
  },
});
