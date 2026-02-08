import NotificationSoundPicker from '@/components/NotificationSoundPicker';
import SilentModeInfo from '@/components/SilentModeInfo';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    getNotificationSound,
    getSoundOption,
    NotificationSoundId,
} from '@/services/notificationSounds';
import {
    analyzeUserPatterns,
    getNotificationSettings,
    NotificationSettings,
    requestNotificationPermissions,
    saveNotificationSettings,
    saveNotificationSettingsDebounced,
} from '@/services/smartNotifications';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [patterns, setPatterns] = useState<{ peakHours: number[]; lowHours: number[] } | null>(
    null
  );
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSoundId, setSelectedSoundId] = useState<NotificationSoundId>('popping-bubble');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [notifSettings, permission, userPatterns, soundId] = await Promise.all([
      getNotificationSettings(),
      requestNotificationPermissions(),
      analyzeUserPatterns(),
      getNotificationSound(),
    ]);
    setSettings(notifSettings);
    setHasPermission(permission);
    setPatterns(userPatterns);
    setSelectedSoundId(soundId);
  };

  const updateSetting = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    // Use immediate save for critical settings (enabled toggle)
    // Use debounced save for UI controls that change rapidly
    const criticalSettings: (keyof NotificationSettings)[] = ['enabled'];

    if (criticalSettings.includes(key)) {
      await saveNotificationSettings({ [key]: value });
    } else {
      await saveNotificationSettingsDebounced({ [key]: value });
    }
  };

  // Update setting with immediate save (for critical changes)
  const updateSettingImmediate = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveNotificationSettings({ [key]: value });
  };

  if (!settings) return null;

  const SettingRow = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: (val: boolean) => void;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: isDark ? '#3D3D3D' : '#E0E0E0' }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.tint} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.icon }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: colors.tint }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('notifications.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!hasPermission && (
          <View style={[styles.permissionBanner, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.permissionText}>{t('notifications.permissionWarning')}</Text>
          </View>
        )}

        {/* Main Toggle */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <SettingRow
            icon="notifications"
            title={t('notifications.enable')}
            subtitle={t('notifications.enableDesc')}
            value={settings.enabled}
            onToggle={(val) => updateSetting('enabled', val)}
          />
        </View>

        {/* Smart Features */}
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          {t('notifications.smartFeatures')}
        </Text>
        <View style={[styles.section, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <SettingRow
            icon="analytics"
            title={t('notifications.adaptiveReminders')}
            subtitle={t('notifications.adaptiveDesc')}
            value={settings.adaptiveReminders}
            onToggle={(val) => updateSetting('adaptiveReminders', val)}
          />
          <SettingRow
            icon="happy"
            title={t('notifications.motivational')}
            subtitle={t('notifications.motivationalDesc')}
            value={settings.motivationalMessages}
            onToggle={(val) => updateSetting('motivationalMessages', val)}
          />
        </View>

        {/* Sound & Vibration */}
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          {t('notifications.soundVibration')}
        </Text>

        {/* Silent Mode Info */}
        <SilentModeInfo style={{ marginBottom: 12 }} />

        <View style={[styles.section, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <SettingRow
            icon="volume-high"
            title={t('notifications.sound')}
            subtitle={t('notifications.soundDesc')}
            value={settings.soundEnabled}
            onToggle={(val) => updateSetting('soundEnabled', val)}
          />

          {/* Notification Sound Picker */}
          {settings.soundEnabled && (
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: isDark ? '#3D3D3D' : '#E0E0E0' }]}
              onPress={() => setShowSoundPicker(true)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Text style={{ fontSize: 18 }}>
                  {getSoundOption(selectedSoundId)?.icon || '🔔'}
                </Text>
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('common.done') === 'ပြီးပါပြီ' ? 'အသိပေးသံ' : 'Notification Sound'}
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
                  {t('common.done') === 'ပြီးပါပြီ'
                    ? getSoundOption(selectedSoundId)?.nameMy
                    : getSoundOption(selectedSoundId)?.name}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}

          <SettingRow
            icon="phone-portrait"
            title={t('notifications.vibration')}
            subtitle={t('notifications.vibrationDesc')}
            value={settings.vibrationEnabled}
            onToggle={(val) => updateSetting('vibrationEnabled', val)}
          />
        </View>

        {/* Pattern Insights */}
        {patterns && settings.adaptiveReminders && (
          <View style={[styles.insightCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
            <Ionicons name="bulb" size={20} color="#FFD93D" />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>
                {t('notifications.yourPatterns')}
              </Text>
              {patterns.lowHours.length > 0 ? (
                <Text style={[styles.insightText, { color: colors.icon }]}>
                  {t('notifications.forgetPattern', {
                    times: patterns.lowHours
                      .slice(0, 3)
                      .map((h) => `${h}:00`)
                      .join(', '),
                  })}
                </Text>
              ) : (
                <Text style={[styles.insightText, { color: colors.icon }]}>
                  {t('notifications.consistentPattern')}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Quiet Hours */}
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          {t('notifications.quietHours')}
        </Text>
        <View style={[styles.section, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <SettingRow
            icon="moon"
            title={t('notifications.enableQuietHours')}
            subtitle={t('notifications.quietHoursDesc')}
            value={settings.quietHoursEnabled}
            onToggle={(val) => updateSetting('quietHoursEnabled', val)}
          />

          {settings.quietHoursEnabled && (
            <View style={styles.timeContainer}>
              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>
                  {t('notifications.start')}
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5', color: colors.text },
                  ]}
                  value={settings.quietHoursStart}
                  onChangeText={(val) => updateSetting('quietHoursStart', val)}
                  placeholder="22:00"
                  placeholderTextColor={colors.icon}
                />
              </View>
              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>
                  {t('notifications.end')}
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    { backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5', color: colors.text },
                  ]}
                  value={settings.quietHoursEnd}
                  onChangeText={(val) => updateSetting('quietHoursEnd', val)}
                  placeholder="07:00"
                  placeholderTextColor={colors.icon}
                />
              </View>
            </View>
          )}
        </View>

        {/* Frequency */}
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          {t('notifications.frequency')}
        </Text>
        <View style={[styles.section, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <View style={styles.frequencyContainer}>
            {[30, 60, 90, 120].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.frequencyButton,
                  {
                    backgroundColor:
                      settings.reminderInterval === mins
                        ? colors.tint
                        : isDark
                          ? '#3D3D3D'
                          : '#F5F5F5',
                  },
                ]}
                onPress={() => updateSetting('reminderInterval', mins)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    { color: settings.reminderInterval === mins ? '#fff' : colors.text },
                  ]}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.frequencyHint, { color: colors.icon }]}>
            {t('notifications.frequencyHint')}
          </Text>
        </View>

        {/* Test Notifications Button */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}
          onPress={() => router.push('/notification-test' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FF980020' }]}>
            <Ionicons name="flask" size={20} color="#FF9800" />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Test Notifications</Text>
            <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
              Preview scheduled times & send test
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </TouchableOpacity>
      </ScrollView>

      {/* Notification Sound Picker Modal */}
      <NotificationSoundPicker
        visible={showSoundPicker}
        onClose={() => setShowSoundPicker(false)}
        onSoundChange={(soundId) => setSelectedSoundId(soundId)}
      />
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
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  permissionText: { flex: 1, fontSize: 14, color: '#E65100' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  section: { borderRadius: 16, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  insightCard: { flexDirection: 'row', padding: 16, borderRadius: 12, gap: 12, marginTop: 12 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  insightText: { fontSize: 13, lineHeight: 18 },
  timeContainer: { padding: 16, gap: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { fontSize: 16 },
  timeInput: {
    width: 100,
    height: 44,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  frequencyContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  frequencyButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  frequencyText: { fontSize: 16, fontWeight: '600' },
  frequencyHint: { fontSize: 12, paddingHorizontal: 16, paddingBottom: 16 },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
});
