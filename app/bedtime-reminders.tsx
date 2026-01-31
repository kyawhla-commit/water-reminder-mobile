import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    BEDTIME_PRESETS,
    BedtimeRoutineStep,
    BedtimeSettings,
    generateBedtimeRoutine,
    getCurrentWindDownTips,
    getTimeUntilBedtime,
    isWindDownTime,
    loadBedtimeSettings,
    saveBedtimeSettings,
    WIND_DOWN_DURATIONS,
    WIND_DOWN_TIPS,
    WindDownTip
} from '@/services/bedtimeReminders';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BedtimeRemindersScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [settings, setSettings] = useState<BedtimeSettings | null>(null);
  const [timeUntilBed, setTimeUntilBed] = useState({ hours: 0, minutes: 0, isPast: false });
  const [isWindDown, setIsWindDown] = useState(false);
  const [currentTips, setCurrentTips] = useState<WindDownTip[]>([]);
  const [routine, setRoutine] = useState<BedtimeRoutineStep[]>([]);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      updateTimeInfo();
      const interval = setInterval(updateTimeInfo, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [settings]);

  const loadSettings = async () => {
    const loaded = await loadBedtimeSettings();
    setSettings(loaded);
    setRoutine(generateBedtimeRoutine(loaded.bedtime));
  };

  const updateTimeInfo = () => {
    if (!settings) return;
    const time = getTimeUntilBedtime(settings.bedtime);
    setTimeUntilBed(time);
    setIsWindDown(isWindDownTime(settings.bedtime, settings.windDownMinutes));
    setCurrentTips(getCurrentWindDownTips(settings.bedtime, settings.windDownMinutes));
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;
    const updated = { ...settings, enabled: !settings.enabled };
    await saveBedtimeSettings(updated);
    setSettings(updated);
  };

  const handleBedtimeChange = async (bedtime: string) => {
    if (!settings) return;
    const updated = { ...settings, bedtime };
    await saveBedtimeSettings(updated);
    setSettings(updated);
    setRoutine(generateBedtimeRoutine(bedtime));
    setShowBedtimePicker(false);
  };

  const handleDurationChange = async (duration: number) => {
    if (!settings) return;
    const updated = { ...settings, windDownMinutes: duration };
    await saveBedtimeSettings(updated);
    setSettings(updated);
    setShowDurationPicker(false);
  };

  const handleToggleReminder = async (reminderId: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      reminders: settings.reminders.map((r) =>
        r.id === reminderId ? { ...r, enabled: !r.enabled } : r
      ),
    };
    await saveBedtimeSettings(updated);
    setSettings(updated);
  };

  const handleToggleSetting = async (key: 'soundEnabled' | 'vibrationEnabled' | 'weekdaysOnly') => {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    await saveBedtimeSettings(updated);
    setSettings(updated);
  };

  const formatBedtime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(isBurmese ? 'my-MM' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getReminderIcon = (type: string): string => {
    switch (type) {
      case 'wind-down':
        return '🌙';
      case 'screen-time':
        return '📱';
      case 'hydration':
        return '💧';
      case 'bedtime':
        return '😴';
      default:
        return '⏰';
    }
  };

  const getReminderLabel = (type: string): string => {
    const labels = {
      'wind-down': isBurmese ? 'အနားယူချိန်' : 'Wind-Down',
      'screen-time': isBurmese ? 'ဖန်သားပြင်ကင်း' : 'Screen-Free',
      hydration: isBurmese ? 'ရေဓာတ်' : 'Hydration',
      bedtime: isBurmese ? 'အိပ်ရာဝင်ချိန်' : 'Bedtime',
    };
    return labels[type as keyof typeof labels] || type;
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
            {isBurmese ? '🌙 အိပ်ရာဝင်သတိပေး' : '🌙 Bedtime Reminders'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Time Until Bedtime Card */}
        <View
          style={[
            styles.countdownCard,
            {
              backgroundColor: isWindDown
                ? isDark
                  ? '#2D1B4E'
                  : '#EDE7F6'
                : colors.card,
            },
          ]}
        >
          {isWindDown && (
            <View style={[styles.windDownBadge, { backgroundColor: '#9C27B0' }]}>
              <Text style={styles.windDownBadgeText}>
                {isBurmese ? '🌙 အနားယူချိန်' : '🌙 Wind-Down Time'}
              </Text>
            </View>
          )}

          <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
            {isBurmese ? 'အိပ်ရာဝင်ချိန်အထိ' : 'Time until bedtime'}
          </Text>
          <View style={styles.countdownTime}>
            <Text style={[styles.countdownNumber, { color: colors.primary }]}>
              {timeUntilBed.hours}
            </Text>
            <Text style={[styles.countdownUnit, { color: colors.textSecondary }]}>
              {isBurmese ? 'နာရီ' : 'hr'}
            </Text>
            <Text style={[styles.countdownNumber, { color: colors.primary }]}>
              {timeUntilBed.minutes}
            </Text>
            <Text style={[styles.countdownUnit, { color: colors.textSecondary }]}>
              {isBurmese ? 'မိနစ်' : 'min'}
            </Text>
          </View>
          <Text style={[styles.bedtimeText, { color: colors.text }]}>
            {isBurmese ? 'အိပ်ရာဝင်ချိန်: ' : 'Bedtime: '}
            {formatBedtime(settings.bedtime)}
          </Text>
        </View>

        {/* Current Wind-Down Tips */}
        {isWindDown && currentTips.length > 0 && (
          <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBurmese ? '💡 ယခုလုပ်သင့်သည်' : '💡 Do This Now'}
            </Text>
            {currentTips.slice(0, 3).map((tip) => (
              <View key={tip.id} style={[styles.tipItem, { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' }]}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>
                    {isBurmese ? tip.titleMy : tip.title}
                  </Text>
                  <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                    {isBurmese ? tip.descriptionMy : tip.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Enable Toggle */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'အိပ်ရာဝင်သတိပေးများ' : 'Bedtime Reminders'}
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {isBurmese ? 'အိပ်ရာဝင်ချိန်နီးရင် သတိပေးမည်' : 'Get notified before bedtime'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Bedtime Setting */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '⏰ အိပ်ရာဝင်ချိန်' : '⏰ Bedtime'}
          </Text>

          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' }]}
            onPress={() => setShowBedtimePicker(true)}
          >
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.pickerButtonText, { color: colors.text }]}>
              {formatBedtime(settings.bedtime)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' }]}
            onPress={() => setShowDurationPicker(true)}
          >
            <Ionicons name="hourglass" size={24} color={colors.primary} />
            <View style={styles.pickerButtonContent}>
              <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                {isBurmese ? 'အနားယူချိန်' : 'Wind-Down Duration'}
              </Text>
              <Text style={[styles.pickerButtonSubtext, { color: colors.textSecondary }]}>
                {settings.windDownMinutes} {isBurmese ? 'မိနစ်' : 'minutes'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Reminders */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🔔 သတိပေးချက်များ' : '🔔 Reminders'}
          </Text>

          {settings.reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderRow}>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderIcon}>{getReminderIcon(reminder.type)}</Text>
                <View>
                  <Text style={[styles.reminderLabel, { color: colors.text }]}>
                    {getReminderLabel(reminder.type)}
                  </Text>
                  <Text style={[styles.reminderTime, { color: colors.textSecondary }]}>
                    {reminder.minutesBefore} {isBurmese ? 'မိနစ်အလို' : 'min before'}
                  </Text>
                </View>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={() => handleToggleReminder(reminder.id)}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Notification Settings */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🔊 အသံနှင့် တုန်ခါမှု' : '🔊 Sound & Vibration'}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'အသံ' : 'Sound'}
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={() => handleToggleSetting('soundEnabled')}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'တုန်ခါမှု' : 'Vibration'}
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={() => handleToggleSetting('vibrationEnabled')}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'ရုံးဖွင့်ရက်များသာ' : 'Weekdays Only'}
              </Text>
            </View>
            <Switch
              value={settings.weekdaysOnly}
              onValueChange={() => handleToggleSetting('weekdaysOnly')}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Bedtime Routine */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📋 အိပ်ရာဝင်အလေ့အထ' : '📋 Bedtime Routine'}
          </Text>

          {routine.map((step, index) => (
            <View key={step.id} style={styles.routineStep}>
              <View style={styles.routineTimeline}>
                <View style={[styles.routineDot, { backgroundColor: colors.primary }]} />
                {index < routine.length - 1 && (
                  <View style={[styles.routineLine, { backgroundColor: colors.surfaceVariant }]} />
                )}
              </View>
              <View style={styles.routineContent}>
                <Text style={[styles.routineTime, { color: colors.primary }]}>{step.time}</Text>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineIcon}>{step.icon}</Text>
                  <View>
                    <Text style={[styles.routineTitle, { color: colors.text }]}>
                      {isBurmese ? step.titleMy : step.title}
                    </Text>
                    <Text style={[styles.routineDescription, { color: colors.textSecondary }]}>
                      {isBurmese ? step.descriptionMy : step.description}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Wind-Down Tips */}
        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '💡 အိပ်စက်မှုအကြံပြုချက်များ' : '💡 Sleep Tips'}
          </Text>

          {WIND_DOWN_TIPS.slice(0, 5).map((tip) => (
            <View key={tip.id} style={[styles.tipItem, { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' }]}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  {isBurmese ? tip.titleMy : tip.title}
                </Text>
                <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                  {isBurmese ? tip.descriptionMy : tip.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bedtime Picker Modal */}
      <Modal visible={showBedtimePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isBurmese ? 'အိပ်ရာဝင်ချိန်ရွေးပါ' : 'Select Bedtime'}
            </Text>
            <View style={styles.presetGrid}>
              {BEDTIME_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' },
                    settings.bedtime === preset.value && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleBedtimeChange(preset.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: settings.bedtime === preset.value ? '#fff' : colors.text },
                    ]}
                  >
                    {isBurmese ? preset.labelMy : preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowBedtimePicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text }]}>
                {isBurmese ? 'ပိတ်မည်' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Duration Picker Modal */}
      <Modal visible={showDurationPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isBurmese ? 'အနားယူချိန်ရွေးပါ' : 'Select Wind-Down Duration'}
            </Text>
            <View style={styles.presetGrid}>
              {WIND_DOWN_DURATIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.presetButton,
                    { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' },
                    settings.windDownMinutes === duration.value && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleDurationChange(duration.value)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      { color: settings.windDownMinutes === duration.value ? '#fff' : colors.text },
                    ]}
                  >
                    {isBurmese ? duration.labelMy : duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setShowDurationPicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text }]}>
                {isBurmese ? 'ပိတ်မည်' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  countdownCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  windDownBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  windDownBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  countdownLabel: { fontSize: 14, marginBottom: 8 },
  countdownTime: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  countdownNumber: { fontSize: 48, fontWeight: '700' },
  countdownUnit: { fontSize: 18 },
  bedtimeText: { fontSize: 16, fontWeight: '500', marginTop: 12 },
  tipsCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  settingCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingDescription: { fontSize: 12, marginTop: 2 },
  pickerButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, gap: 12 },
  pickerButtonContent: { flex: 1 },
  pickerButtonText: { fontSize: 16, fontWeight: '500' },
  pickerButtonSubtext: { fontSize: 12, marginTop: 2 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  reminderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderIcon: { fontSize: 24 },
  reminderLabel: { fontSize: 15, fontWeight: '500' },
  reminderTime: { fontSize: 12, marginTop: 2 },
  routineStep: { flexDirection: 'row', marginBottom: 4 },
  routineTimeline: { width: 24, alignItems: 'center' },
  routineDot: { width: 12, height: 12, borderRadius: 6 },
  routineLine: { width: 2, flex: 1, marginVertical: 4 },
  routineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  routineTime: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  routineInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  routineIcon: { fontSize: 20 },
  routineTitle: { fontSize: 14, fontWeight: '500' },
  routineDescription: { fontSize: 12, marginTop: 2 },
  tipItem: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 8, gap: 12 },
  tipIcon: { fontSize: 24 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '500' },
  tipDescription: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  presetButton: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  presetText: { fontSize: 14, fontWeight: '600' },
  modalCloseButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '600' },
});
