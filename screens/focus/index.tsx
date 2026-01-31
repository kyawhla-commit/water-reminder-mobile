import { DEFAULT_FOCUS_DURATION } from '@/config';
import { getTodayFocusStats, saveFocusSession } from '@/services/focus';
import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FocusScreen = () => {
  const router = useRouter();
  const theme = useAppConfigStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_DURATION * 60);
  const [sessionDuration, setSessionDuration] = useState(DEFAULT_FOCUS_DURATION);
  const [todayStats, setTodayStats] = useState({ completed: 0, totalMinutes: 0 });
  
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

  const loadStats = async () => {
    const stats = await getTodayFocusStats();
    setTodayStats(stats);
  };

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

  const progress = 1 - timeLeft / (sessionDuration * 60);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Focus Mode</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Timer Circle */}
        <Animated.View 
          style={[
            styles.timerContainer, 
            { 
              backgroundColor: colors.backgroundLight,
              transform: [{ scale: pulseAnim }],
            }
          ]}
        >
          <View style={[styles.progressRing, { borderColor: colors.neutral }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  borderColor: colors.success,
                  transform: [{ rotate: `${progress * 360}deg` }],
                }
              ]} 
            />
          </View>
          <Text style={[styles.timerText, { color: colors.text }]}>
            {formatTimeDisplay(timeLeft)}
          </Text>
          {!isRunning && (
            <View style={styles.durationAdjust}>
              <TouchableOpacity onPress={() => adjustDuration(-5)}>
                <Ionicons name="remove-circle-outline" size={28} color={colors.textLight} />
              </TouchableOpacity>
              <Text style={[styles.durationText, { color: colors.textLight }]}>
                {sessionDuration} min
              </Text>
              <TouchableOpacity onPress={() => adjustDuration(5)}>
                <Ionicons name="add-circle-outline" size={28} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: colors.success }]}
              onPress={startSession}
            >
              <Ionicons name="play" size={32} color="#fff" />
              <Text style={styles.mainButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.warning }]}
                onPress={pauseSession}
              >
                <Ionicons name="pause" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.neutral }]}
                onPress={resetSession}
              >
                <Ionicons name="refresh" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.backgroundLight }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Today's Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {todayStats.completed}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {todayStats.totalMinutes}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textLight }]}>Minutes</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  timerContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 125,
    borderWidth: 8,
  },
  progressFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 125,
    borderWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
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
});

export default FocusScreen;
