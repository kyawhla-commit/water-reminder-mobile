import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DEEP_WORK_DURATIONS,
  DeepWorkSession,
  DeepWorkSettings,
  endDeepWorkSession,
  loadDeepWorkSettings,
  saveDeepWorkSettings,
  sendDeepWorkNotification,
  startDeepWorkSession
} from '@/services/focusEnhancements';
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
  View
} from 'react-native';

export default function DeepWorkScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [settings, setSettings] = useState<DeepWorkSettings | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<DeepWorkSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(90);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      // Breathe animation for focus indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      breatheAnim.setValue(0);
    }
  }, [isActive]);

  const loadData = async () => {
    const loadedSettings = await loadDeepWorkSettings();
    setSettings(loadedSettings);
    setSelectedDuration(loadedSettings.defaultDuration);
    setTimeRemaining(loadedSettings.defaultDuration * 60);
  };

  const startSession = useCallback(async () => {
    if (!settings) return;
    const session = await startDeepWorkSession(selectedDuration);
    setCurrentSession(session);
    setIsActive(true);
    setTimeRemaining(selectedDuration * 60);

    await sendDeepWorkNotification('start', isBurmese);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        // Break reminder
        if (settings.breakReminders && prev % (settings.breakInterval * 60) === 0 && prev !== selectedDuration * 60) {
          sendDeepWorkNotification('break', isBurmese);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings, selectedDuration, isBurmese]);

  const endSession = async () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    await sendDeepWorkNotification('end', isBurmese);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowRating(true);
  };

  const cancelSession = () => {
    setIsActive(false);
    setCurrentSession(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (settings) setTimeRemaining(settings.defaultDuration * 60);
  };

  const recordInterruption = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, interruptions: currentSession.interruptions + 1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const submitRating = async (rating: number) => {
    if (currentSession) {
      await endDeepWorkSession(currentSession, rating);
    }
    setShowRating(false);
    setCurrentSession(null);
    if (settings) setTimeRemaining(settings.defaultDuration * 60);
  };

  const updateSetting = async <K extends keyof DeepWorkSettings>(key: K, value: DeepWorkSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    await saveDeepWorkSettings(updated);
    setSettings(updated);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!settings) return 0;
    const total = selectedDuration * 60;
    return ((total - timeRemaining) / total) * 100;
  };

  if (!settings) {
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
            🧠 {isBurmese ? 'Deep Work မုဒ်' : 'Deep Work Mode'}
          </Text>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isActive ? '#9B59B620' : colors.card }]}>
          {isActive ? (
            <>
              <Animated.View style={[styles.breatheIndicator, { opacity: breatheAnim }]}>
                <View style={[styles.breatheDot, { backgroundColor: '#9B59B6' }]} />
              </Animated.View>
              <Text style={[styles.statusText, { color: '#9B59B6' }]}>
                {isBurmese ? 'Deep Work လုပ်နေသည်' : 'Deep Work Active'}
              </Text>
              <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
                {isBurmese ? 'အနှောင့်အယှက်များကို ရှောင်ပါ' : 'Avoid all distractions'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusEmoji}>🎯</Text>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {isBurmese ? 'Deep Work စတင်ရန်အသင့်' : 'Ready for Deep Work'}
              </Text>
              <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
                {isBurmese ? 'အချိန်ရွေးပြီး စတင်ပါ' : 'Select duration and begin'}
              </Text>
            </>
          )}
        </View>

        {/* Timer Circle */}
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.timerCircle, { borderColor: isActive ? '#9B59B6' : colors.surfaceVariant }]}>
            <View style={[styles.progressRing, { backgroundColor: colors.surfaceVariant }]}>
              <View style={[styles.progressFill, { width: `${getProgress()}%`, backgroundColor: '#9B59B6' }]} />
            </View>
            <View style={[styles.timerInner, { backgroundColor: colors.card }]}>
              <Text style={[styles.timerText, { color: isActive ? '#9B59B6' : colors.text }]}>
                {formatTime(timeRemaining)}
              </Text>
              {isActive && currentSession && currentSession.interruptions > 0 && (
                <Text style={[styles.interruptionText, { color: '#E74C3C' }]}>
                  {currentSession.interruptions} {isBurmese ? 'အနှောင့်အယှက်' : 'interruptions'}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Duration Selector (when not active) */}
        {!isActive && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBurmese ? '⏱️ ကြာချိန်ရွေးပါ' : '⏱️ Select Duration'}
            </Text>
            <View style={styles.durationGrid}>
              {DEEP_WORK_DURATIONS.map((dur) => (
                <TouchableOpacity
                  key={dur.id}
                  style={[
                    styles.durationCard,
                    { backgroundColor: colors.card },
                    selectedDuration === dur.minutes && { borderColor: '#9B59B6', borderWidth: 2 },
                  ]}
                  onPress={() => {
                    setSelectedDuration(dur.minutes);
                    setTimeRemaining(dur.minutes * 60);
                  }}
                >
                  <Text style={styles.durationIcon}>{dur.icon}</Text>
                  <Text style={[styles.durationName, { color: colors.text }]}>
                    {isBurmese ? dur.nameMy : dur.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!isActive ? (
            <TouchableOpacity style={[styles.startButton, { backgroundColor: '#9B59B6' }]} onPress={startSession}>
              <Ionicons name="play" size={32} color="#fff" />
              <Text style={styles.startButtonText}>{isBurmese ? 'Deep Work စတင်' : 'Start Deep Work'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: '#E74C3C' }]}
                onPress={cancelSession}
              >
                <Ionicons name="stop" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={recordInterruption}
              >
                <Ionicons name="alert-circle" size={28} color="#E74C3C" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: '#27AE60' }]}
                onPress={endSession}
              >
                <Ionicons name="checkmark" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '✨ Deep Work အင်္ဂါရပ်များ' : '✨ Deep Work Features'}
          </Text>
          <View style={styles.featureRow}>
            <Ionicons name="notifications-off" size={20} color="#9B59B6" />
            <Text style={[styles.featureText, { color: colors.text }]}>
              {isBurmese ? 'အသိပေးချက်များပိတ်ထားသည်' : 'Notifications blocked'}
            </Text>
            {settings.blockNotifications && <Ionicons name="checkmark-circle" size={18} color="#27AE60" />}
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="timer" size={20} color="#9B59B6" />
            <Text style={[styles.featureText, { color: colors.text }]}>
              {isBurmese ? `${settings.breakInterval} မိနစ်တိုင်း အနားယူသတိပေး` : `Break reminder every ${settings.breakInterval}m`}
            </Text>
            {settings.breakReminders && <Ionicons name="checkmark-circle" size={18} color="#27AE60" />}
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="analytics" size={20} color="#9B59B6" />
            <Text style={[styles.featureText, { color: colors.text }]}>
              {isBurmese ? 'အနှောင့်အယှက်မှတ်တမ်း' : 'Interruption tracking'}
            </Text>
            {settings.trackInterruptions && <Ionicons name="checkmark-circle" size={18} color="#27AE60" />}
          </View>
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#2D1F3D' : '#F3E5F5' }]}>
          <Ionicons name="bulb" size={24} color="#9B59B6" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 Deep Work သည် အနှောင့်အယှက်ကင်းသော အာရုံစူးစိုက်မှုဖြစ်သည်။ ဖုန်းကို အဝေးထားပြီး အရေးကြီးသောအလုပ်ကို အာရုံစိုက်ပါ။'
              : '💡 Deep Work is distraction-free focus. Put your phone away and concentrate on important tasks.'}
          </Text>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRating} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.ratingModal, { backgroundColor: colors.card }]}>
            <Text style={styles.ratingEmoji}>🎉</Text>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>
              {isBurmese ? 'Deep Work ပြီးဆုံးပြီ!' : 'Deep Work Complete!'}
            </Text>
            <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>
              {isBurmese ? 'သင့်ထုတ်လုပ်နိုင်စွမ်းကို အဆင့်သတ်မှတ်ပါ' : 'Rate your productivity'}
            </Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => submitRating(star)} style={styles.starButton}>
                  <Text style={styles.starText}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBurmese ? '⚙️ Deep Work ဆက်တင်' : '⚙️ Deep Work Settings'}
              </Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.settingsScroll}>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အသိပေးချက်များပိတ်' : 'Block Notifications'}
                </Text>
                <Switch
                  value={settings.blockNotifications}
                  onValueChange={(v) => updateSetting('blockNotifications', v)}
                  trackColor={{ false: colors.surfaceVariant, true: '#9B59B6' }}
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အနားယူသတိပေး' : 'Break Reminders'}
                </Text>
                <Switch
                  value={settings.breakReminders}
                  onValueChange={(v) => updateSetting('breakReminders', v)}
                  trackColor={{ false: colors.surfaceVariant, true: '#9B59B6' }}
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {isBurmese ? 'အနှောင့်အယှက်မှတ်တမ်း' : 'Track Interruptions'}
                </Text>
                <Switch
                  value={settings.trackInterruptions}
                  onValueChange={(v) => updateSetting('trackInterruptions', v)}
                  trackColor={{ false: colors.surfaceVariant, true: '#9B59B6' }}
                />
              </View>
              <Text style={[styles.settingSection, { color: colors.text }]}>
                {isBurmese ? 'အနားယူကြားကာလ' : 'Break Interval'}
              </Text>
              <View style={styles.intervalOptions}>
                {[30, 45, 60, 90].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.intervalOption,
                      { backgroundColor: colors.surfaceVariant },
                      settings.breakInterval === mins && { backgroundColor: '#9B59B6' },
                    ]}
                    onPress={() => updateSetting('breakInterval', mins)}
                  >
                    <Text style={[styles.intervalText, { color: settings.breakInterval === mins ? '#fff' : colors.text }]}>
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  settingsButton: { padding: 8 },
  statusCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24 },
  breatheIndicator: { marginBottom: 8 },
  breatheDot: { width: 12, height: 12, borderRadius: 6 },
  statusEmoji: { fontSize: 40, marginBottom: 8 },
  statusText: { fontSize: 18, fontWeight: '700' },
  statusSubtext: { fontSize: 13, marginTop: 4 },
  timerContainer: { alignItems: 'center', marginBottom: 32 },
  timerCircle: { width: 260, height: 260, borderRadius: 130, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  progressRing: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  timerInner: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 48, fontWeight: '700' },
  interruptionText: { fontSize: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  durationCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center' },
  durationIcon: { fontSize: 28, marginBottom: 8 },
  durationName: { fontSize: 14, fontWeight: '600' },
  controls: { alignItems: 'center', marginBottom: 24 },
  startButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30, gap: 12 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  activeControls: { flexDirection: 'row', gap: 16 },
  controlButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  featuresCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  featureText: { flex: 1, fontSize: 14 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ratingModal: { width: '85%', borderRadius: 20, padding: 24, alignItems: 'center' },
  ratingEmoji: { fontSize: 56, marginBottom: 16 },
  ratingTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  ratingSubtitle: { fontSize: 14, marginBottom: 20 },
  ratingStars: { flexDirection: 'row', gap: 12 },
  starButton: { padding: 8 },
  starText: { fontSize: 36 },
  settingsModal: { width: '100%', maxHeight: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute', bottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  settingsScroll: { padding: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  settingLabel: { fontSize: 15 },
  settingSection: { fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 12 },
  intervalOptions: { flexDirection: 'row', gap: 10 },
  intervalOption: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  intervalText: { fontSize: 14, fontWeight: '600' },
});
