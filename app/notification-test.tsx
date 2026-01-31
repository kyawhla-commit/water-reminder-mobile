import { useAppTheme } from '@/hooks/useAppTheme';
import {
    getAdaptiveReminderExplanation,
    getCurrentTimePeriod,
    getDetailedUserPatterns,
    getNotificationSettings,
    getScheduledNotificationsSummary,
    getSoundVibrationStatus,
    NotificationSettings,
    previewScheduledTimes,
    saveNotificationSettings,
    sendPeriodTestNotification,
    sendTestNotification,
    sendTestPersonalizedNotification,
    sendTimeBasedTestNotification,
    testSilentNotification,
    testSoundAndVibrationNotification,
    testSoundNotification,
    testVibrationNotification
} from '@/services/smartNotifications';
import { useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

type TimePeriod = 'morning' | 'midday' | 'afternoon' | 'evening' | 'achievement';

export default function NotificationTestScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const userName = useUserProfileStore((state) => state.profile.name);

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [interval, setIntervalState] = useState(60);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [nextNotification, setNextNotification] = useState<string | null>(null);
  const [previewTimes, setPreviewTimes] = useState<string[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<{ period: string; hourRange: string } | null>(null);
  const [adaptiveInfo, setAdaptiveInfo] = useState<{
    isEnabled: boolean;
    extraReminders: number[];
    explanation: string;
  } | null>(null);
  const [patterns, setPatterns] = useState<{
    peakHours: { hour: number; average: number }[];
    lowHours: number[];
    recommendation: string;
  } | null>(null);
  const [soundVibrationStatus, setSoundVibrationStatus] = useState<{
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    description: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [interval]);

  const loadData = async () => {
    const notifSettings = await getNotificationSettings();
    setSettings(notifSettings);
    setIntervalState(notifSettings.reminderInterval);
    setCurrentPeriod(getCurrentTimePeriod());
    await refreshScheduledInfo();
    await loadAdaptiveInfo();
    await loadPatterns();
    await loadSoundVibrationStatus();
  };

  const loadSoundVibrationStatus = async () => {
    const status = await getSoundVibrationStatus();
    setSoundVibrationStatus(status);
  };

  const refreshScheduledInfo = async () => {
    const summary = await getScheduledNotificationsSummary();
    setScheduledCount(summary.count);
    setScheduledTimes(summary.times);
    setNextNotification(summary.nextNotification);
  };

  const loadAdaptiveInfo = async () => {
    const info = await getAdaptiveReminderExplanation();
    setAdaptiveInfo(info);
  };

  const loadPatterns = async () => {
    const data = await getDetailedUserPatterns();
    setPatterns({
      peakHours: data.peakHours,
      lowHours: data.lowHours,
      recommendation: data.recommendation,
    });
  };

  const updatePreview = async () => {
    const notifSettings = await getNotificationSettings();
    const preview = previewScheduledTimes({ ...notifSettings, reminderInterval: interval });
    setPreviewTimes(preview);
  };

  const handleIntervalChange = async (newInterval: number) => {
    setIntervalState(newInterval);
    await saveNotificationSettings({ reminderInterval: newInterval });
    await refreshScheduledInfo();
    Alert.alert('✅ Updated', `Reminder interval set to ${newInterval} minutes`);
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert('✅ Sent', 'Test notification sent!');
    } else {
      Alert.alert('❌ Failed', 'Could not send notification.');
    }
  };

  const handleTimeBasedTest = async () => {
    const result = await sendTimeBasedTestNotification();
    if (result.success) {
      Alert.alert(
        `✅ ${result.period.charAt(0).toUpperCase() + result.period.slice(1)} Message`,
        `Title: ${result.message.title}\n\nBody: ${result.message.body}`
      );
    } else {
      Alert.alert('❌ Failed', 'Could not send notification.');
    }
  };

  const handlePeriodTest = async (period: TimePeriod) => {
    const success = await sendPeriodTestNotification(period);
    if (success) {
      Alert.alert('✅ Sent', `${period} notification sent!`);
    }
  };

  const handlePersonalizedTest = async () => {
    const name = userName || 'Friend';
    const success = await sendTestPersonalizedNotification(name);
    if (success) {
      Alert.alert('✅ Personalized Sent', `Notification sent with name: "${name}"`);
    } else {
      Alert.alert('❌ Failed', 'Could not send personalized notification.');
    }
  };

  const toggleAdaptive = async () => {
    if (!settings) return;
    const newValue = !settings.adaptiveReminders;
    await saveNotificationSettings({ adaptiveReminders: newValue });
    setSettings({ ...settings, adaptiveReminders: newValue });
    await loadAdaptiveInfo();
    await refreshScheduledInfo();
  };

  const toggleMotivational = async () => {
    if (!settings) return;
    const newValue = !settings.motivationalMessages;
    await saveNotificationSettings({ motivationalMessages: newValue });
    setSettings({ ...settings, motivationalMessages: newValue });
  };

  const toggleSound = async () => {
    if (!settings) return;
    const newValue = !settings.soundEnabled;
    await saveNotificationSettings({ soundEnabled: newValue });
    setSettings({ ...settings, soundEnabled: newValue });
    await loadSoundVibrationStatus();
  };

  const toggleVibration = async () => {
    if (!settings) return;
    const newValue = !settings.vibrationEnabled;
    await saveNotificationSettings({ vibrationEnabled: newValue });
    setSettings({ ...settings, vibrationEnabled: newValue });
    await loadSoundVibrationStatus();
  };

  const handleSoundTest = async () => {
    const success = await testSoundNotification();
    if (success) {
      Alert.alert('🔊 Sound Test', 'Notification sent with sound!');
    }
  };

  const handleVibrationTest = async () => {
    // Also trigger haptic feedback for immediate feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const success = await testVibrationNotification();
    if (success) {
      Alert.alert('📳 Vibration Test', 'Notification sent with vibration!');
    }
  };

  const handleBothTest = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const success = await testSoundAndVibrationNotification();
    if (success) {
      Alert.alert('🔔 Full Alert Test', 'Notification sent with sound and vibration!');
    }
  };

  const handleSilentTest = async () => {
    const success = await testSilentNotification();
    if (success) {
      Alert.alert('🔕 Silent Test', 'Silent notification sent - check your notification panel.');
    }
  };

  const handleHapticTest = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  };

  const periodColors: Record<TimePeriod, string> = {
    morning: '#FF9800',
    midday: '#2196F3',
    afternoon: '#9C27B0',
    evening: '#3F51B5',
    achievement: '#4CAF50',
  };

  const periodIcons: Record<TimePeriod, string> = {
    morning: '🌅',
    midday: '☀️',
    afternoon: '🌤️',
    evening: '🌙',
    achievement: '🏆',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>🧪 Notification Test</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Status */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Current Status</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Scheduled:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>{scheduledCount} notifications</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Interval:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>{interval} minutes</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Next:</Text>
            <Text style={[styles.statusValue, { color: '#4CAF50' }]}>{nextNotification || 'None'}</Text>
          </View>
          {currentPeriod && (
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Current Period:</Text>
              <Text style={[styles.statusValue, { color: periodColors[currentPeriod.period as TimePeriod] }]}>
                {periodIcons[currentPeriod.period as TimePeriod]} {currentPeriod.period} ({currentPeriod.hourRange})
              </Text>
            </View>
          )}
        </View>

        {/* Settings Toggles */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>⚙️ Quick Settings</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Motivational Messages</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Time-based encouraging messages
              </Text>
            </View>
            <Switch
              value={settings?.motivationalMessages ?? true}
              onValueChange={toggleMotivational}
              trackColor={{ false: '#767577', true: '#2196F3' }}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Adaptive Reminders</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Extra reminders when you forget
              </Text>
            </View>
            <Switch
              value={settings?.adaptiveReminders ?? true}
              onValueChange={toggleAdaptive}
              trackColor={{ false: '#767577', true: '#2196F3' }}
            />
          </View>
        </View>

        {/* Sound & Vibration Testing */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🔔 Sound & Vibration</Text>
          
          {/* Current Status */}
          {soundVibrationStatus && (
            <View style={[styles.soundStatusBanner, { backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5' }]}>
              <Text style={[styles.soundStatusText, { color: colors.textSecondary }]}>
                {soundVibrationStatus.description}
              </Text>
            </View>
          )}

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleLabelRow}>
                <Ionicons name="volume-high" size={18} color="#2196F3" />
                <Text style={[styles.toggleLabel, { color: colors.text, marginLeft: 8 }]}>Sound</Text>
              </View>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Play sound with notifications
              </Text>
            </View>
            <Switch
              value={settings?.soundEnabled ?? true}
              onValueChange={toggleSound}
              trackColor={{ false: '#767577', true: '#2196F3' }}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.toggleLabelRow}>
                <Ionicons name="phone-portrait" size={18} color="#9C27B0" />
                <Text style={[styles.toggleLabel, { color: colors.text, marginLeft: 8 }]}>Vibration</Text>
              </View>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Vibrate with notifications
              </Text>
            </View>
            <Switch
              value={settings?.vibrationEnabled ?? true}
              onValueChange={toggleVibration}
              trackColor={{ false: '#767577', true: '#9C27B0' }}
            />
          </View>

          {/* Test Buttons */}
          <Text style={[styles.testSectionLabel, { color: colors.text }]}>Test Notifications:</Text>
          <View style={styles.soundTestGrid}>
            <TouchableOpacity
              style={[styles.soundTestButton, { backgroundColor: '#2196F320' }]}
              onPress={handleSoundTest}
            >
              <Ionicons name="volume-high" size={24} color="#2196F3" />
              <Text style={[styles.soundTestLabel, { color: '#2196F3' }]}>Sound Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.soundTestButton, { backgroundColor: '#9C27B020' }]}
              onPress={handleVibrationTest}
            >
              <Ionicons name="phone-portrait" size={24} color="#9C27B0" />
              <Text style={[styles.soundTestLabel, { color: '#9C27B0' }]}>Vibration Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.soundTestButton, { backgroundColor: '#FF980020' }]}
              onPress={handleBothTest}
            >
              <Ionicons name="notifications" size={24} color="#FF9800" />
              <Text style={[styles.soundTestLabel, { color: '#FF9800' }]}>Both</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.soundTestButton, { backgroundColor: '#60757520' }]}
              onPress={handleSilentTest}
            >
              <Ionicons name="notifications-off" size={24} color="#607575" />
              <Text style={[styles.soundTestLabel, { color: '#607575' }]}>Silent</Text>
            </TouchableOpacity>
          </View>

          {/* Haptic Feedback Test */}
          <Text style={[styles.testSectionLabel, { color: colors.text, marginTop: 16 }]}>Test Haptic Feedback:</Text>
          <View style={styles.hapticGrid}>
            {[
              { type: 'light', label: 'Light', color: '#4CAF50' },
              { type: 'medium', label: 'Medium', color: '#FF9800' },
              { type: 'heavy', label: 'Heavy', color: '#F44336' },
              { type: 'success', label: '✓ Success', color: '#4CAF50' },
              { type: 'warning', label: '⚠ Warning', color: '#FF9800' },
              { type: 'error', label: '✕ Error', color: '#F44336' },
            ].map((item) => (
              <TouchableOpacity
                key={item.type}
                style={[styles.hapticButton, { backgroundColor: item.color + '20' }]}
                onPress={() => handleHapticTest(item.type as any)}
              >
                <Text style={[styles.hapticLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time-Based Messages Test */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🕐 Time-Based Messages</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Messages change based on time of day. Tap to test each period:
          </Text>
          <View style={styles.periodGrid}>
            {(['morning', 'midday', 'afternoon', 'evening', 'achievement'] as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, { backgroundColor: periodColors[period] + '20' }]}
                onPress={() => handlePeriodTest(period)}
              >
                <Text style={styles.periodIcon}>{periodIcons[period]}</Text>
                <Text style={[styles.periodLabel, { color: periodColors[period] }]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.autoTestButton, { backgroundColor: '#2196F3' }]} onPress={handleTimeBasedTest}>
            <Text style={styles.autoTestText}>🎲 Test Current Period Message</Text>
          </TouchableOpacity>
        </View>

        {/* Personalized Messages Test */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>👤 Personalized Messages</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Messages with your name for a personal touch. 40% of reminders use these.
          </Text>
          <View style={[styles.userNameBanner, { backgroundColor: isDark ? '#2D2D2D' : '#E3F2FD' }]}>
            <Ionicons name="person" size={20} color="#2196F3" />
            <Text style={[styles.userNameText, { color: colors.text }]}>
              Current name: {userName || '(Not set)'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.autoTestButton, { backgroundColor: '#E91E63' }]} 
            onPress={handlePersonalizedTest}
          >
            <Text style={styles.autoTestText}>💌 Test Personalized Message</Text>
          </TouchableOpacity>
        </View>

        {/* Adaptive Reminders Info */}
        {adaptiveInfo && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🧠 Adaptive Reminders</Text>
            <View
              style={[
                styles.adaptiveStatus,
                { backgroundColor: adaptiveInfo.isEnabled ? '#4CAF5020' : '#FF980020' },
              ]}
            >
              <Ionicons
                name={adaptiveInfo.isEnabled ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={adaptiveInfo.isEnabled ? '#4CAF50' : '#FF9800'}
              />
              <Text style={[styles.adaptiveStatusText, { color: colors.text }]}>
                {adaptiveInfo.isEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Text style={[styles.adaptiveExplanation, { color: colors.textSecondary }]}>
              {adaptiveInfo.explanation}
            </Text>
            {adaptiveInfo.extraReminders.length > 0 && (
              <View style={styles.extraRemindersContainer}>
                <Text style={[styles.extraRemindersLabel, { color: colors.text }]}>Extra reminder hours:</Text>
                <View style={styles.timesGrid}>
                  {adaptiveInfo.extraReminders.map((hour) => (
                    <View key={hour} style={[styles.timeChip, { backgroundColor: '#FF980020' }]}>
                      <Text style={[styles.timeText, { color: '#FF9800' }]}>{hour}:00</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* User Patterns */}
        {patterns && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📈 Your Drinking Patterns</Text>
            <Text style={[styles.patternRecommendation, { color: colors.textSecondary }]}>
              {patterns.recommendation}
            </Text>
            {patterns.peakHours.length > 0 && (
              <View style={styles.peakHoursContainer}>
                <Text style={[styles.peakHoursLabel, { color: colors.text }]}>Peak drinking hours:</Text>
                <View style={styles.timesGrid}>
                  {patterns.peakHours.slice(0, 5).map((peak) => (
                    <View key={peak.hour} style={[styles.timeChip, { backgroundColor: '#4CAF5020' }]}>
                      <Text style={[styles.timeText, { color: '#4CAF50' }]}>
                        {peak.hour}:00 ({peak.average}ml)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {patterns.lowHours.length > 0 && (
              <View style={styles.lowHoursContainer}>
                <Text style={[styles.lowHoursLabel, { color: colors.text }]}>Low activity hours:</Text>
                <View style={styles.timesGrid}>
                  {patterns.lowHours.map((hour) => (
                    <View key={hour} style={[styles.timeChip, { backgroundColor: '#F4433620' }]}>
                      <Text style={[styles.timeText, { color: '#F44336' }]}>{hour}:00</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Interval Selection */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ Reminder Interval</Text>
          <View style={styles.intervalGrid}>
            {[30, 60, 90, 120].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.intervalButton,
                  { backgroundColor: interval === mins ? '#2196F3' : isDark ? '#3D3D3D' : '#F0F0F0' },
                ]}
                onPress={() => handleIntervalChange(mins)}
              >
                <Text style={[styles.intervalText, { color: interval === mins ? '#fff' : colors.text }]}>
                  {mins < 60 ? `${mins}m` : mins === 60 ? '1h' : `${mins / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview Times */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            📅 Scheduled Times ({previewTimes.length}/day)
          </Text>
          <View style={styles.timesGrid}>
            {previewTimes.map((time, index) => (
              <View key={index} style={[styles.timeChip, { backgroundColor: isDark ? '#3D3D3D' : '#E3F2FD' }]}>
                <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Test Buttons */}
        <TouchableOpacity style={[styles.testButton, { backgroundColor: '#FF9800' }]} onPress={handleTestNotification}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={styles.testButtonText}>Send Basic Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: isDark ? '#3D3D3D' : '#F0F0F0' }]}
          onPress={loadData}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
          <Text style={[styles.refreshButtonText, { color: colors.text }]}>Refresh All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardDesc: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusLabel: { fontSize: 14 },
  statusValue: { fontSize: 14, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  periodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  periodButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  periodIcon: { fontSize: 20, marginBottom: 4 },
  periodLabel: { fontSize: 11, fontWeight: '600' },
  autoTestButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
  autoTestText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  adaptiveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  adaptiveStatusText: { fontSize: 14, fontWeight: '600' },
  adaptiveExplanation: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  extraRemindersContainer: { marginTop: 8 },
  extraRemindersLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  patternRecommendation: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  peakHoursContainer: { marginTop: 8 },
  peakHoursLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  lowHoursContainer: { marginTop: 12 },
  lowHoursLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  intervalGrid: { flexDirection: 'row', gap: 12 },
  intervalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  intervalText: { fontSize: 16, fontWeight: '700' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timeText: { fontSize: 12, fontWeight: '500' },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  testButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: { fontSize: 14, fontWeight: '500' },
  soundStatusBanner: { padding: 12, borderRadius: 8, marginBottom: 12 },
  soundStatusText: { fontSize: 13, textAlign: 'center' },
  userNameBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12,
    gap: 8,
  },
  userNameText: { fontSize: 14, fontWeight: '500' },
  toggleLabelRow: { flexDirection: 'row', alignItems: 'center' },
  testSectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 10 },
  soundTestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  soundTestButton: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  soundTestLabel: { fontSize: 12, fontWeight: '600' },
  hapticGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hapticButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  hapticLabel: { fontSize: 12, fontWeight: '600' },
});
