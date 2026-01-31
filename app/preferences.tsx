import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { usePreferencesStore } from '@/store/preferences';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { preferences, setPreference, resetPreferences } = usePreferencesStore();

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    if (preferences.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPreference(key, value);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all preferences to default values. Your data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetPreferences();
            if (preferences.hapticFeedback) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
    iconColor,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    iconColor?: string;
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBg, { backgroundColor: (iconColor || colors.primary) + '20' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor || colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceVariant, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Settings */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APP SETTINGS</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingRow
            icon="hand-left"
            title="Haptic Feedback"
            subtitle="Vibration on interactions"
            value={preferences.hapticFeedback}
            onToggle={(v) => handleToggle('hapticFeedback', v)}
            iconColor="#9C27B0"
          />
          <SettingRow
            icon="volume-high"
            title="Sound Effects"
            subtitle="Play sounds on actions"
            value={preferences.soundEffects}
            onToggle={(v) => handleToggle('soundEffects', v)}
            iconColor="#FF9800"
          />
        </View>

        {/* Display Settings */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DISPLAY</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingRow
            icon="pie-chart"
            title="Show Percentage"
            subtitle="Display progress as percentage"
            value={preferences.showPercentage}
            onToggle={(v) => handleToggle('showPercentage', v)}
            iconColor="#2196F3"
          />
          <SettingRow
            icon="water"
            title="Show Remaining"
            subtitle="Display remaining amount to goal"
            value={preferences.showRemaining}
            onToggle={(v) => handleToggle('showRemaining', v)}
            iconColor="#4CAF50"
          />
          <SettingRow
            icon="contract"
            title="Compact Mode"
            subtitle="Smaller UI elements"
            value={preferences.compactMode}
            onToggle={(v) => handleToggle('compactMode', v)}
            iconColor="#607D8B"
          />
        </View>

        {/* Water Tracking */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WATER TRACKING</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingRow
            icon="cafe"
            title="Track Beverage Types"
            subtitle="Log different drink types"
            value={preferences.trackBeverageTypes}
            onToggle={(v) => handleToggle('trackBeverageTypes', v)}
            iconColor="#795548"
          />
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CELEBRATIONS</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingRow
            icon="trophy"
            title="Celebrate Goals"
            subtitle="Show celebration when goal reached"
            value={preferences.celebrateGoals}
            onToggle={(v) => handleToggle('celebrateGoals', v)}
            iconColor="#FFD700"
          />
          <SettingRow
            icon="flame"
            title="Streak Reminders"
            subtitle="Notify about streak milestones"
            value={preferences.streakReminders}
            onToggle={(v) => handleToggle('streakReminders', v)}
            iconColor="#FF5722"
          />
          <SettingRow
            icon="bar-chart"
            title="Weekly Report"
            subtitle="Send weekly progress summary"
            value={preferences.weeklyReport}
            onToggle={(v) => handleToggle('weeklyReport', v)}
            iconColor="#3F51B5"
          />
        </View>

        {/* Quick Add Amounts Info */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK ADD</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Quick Add Amounts</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              {preferences.quickAddAmounts.join(', ')} ml
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Widget Button 1</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              +{preferences.widgetQuickAdd1} ml
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>Widget Button 2</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              +{preferences.widgetQuickAdd2} ml
            </Text>
          </View>
        </View>

        {/* Usage Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>USAGE</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>App Opens</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {preferences.appOpenCount} times
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text }]}>First Launch</Text>
            <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
              {preferences.firstLaunchDate
                ? new Date(preferences.firstLaunchDate).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.error + '15' }]}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={20} color={colors.error} />
          <Text style={[styles.resetButtonText, { color: colors.error }]}>Reset to Defaults</Text>
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
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 15, fontWeight: '500' },
  infoValue: { fontSize: 14 },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  resetButtonText: { fontSize: 16, fontWeight: '600' },
});
