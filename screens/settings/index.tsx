import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const router = useRouter();
  const { theme, setTheme, dailyWaterGoal, sleepGoal } = useAppConfigStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.neutral }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textLight }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundLight }]}>
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            rightElement={
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.neutral, true: colors.primary }}
              />
            }
          />
        </View>

        {/* Goals */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Goals</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundLight }]}>
          <SettingItem
            icon="water-outline"
            title="Daily Water Goal"
            subtitle={`${dailyWaterGoal}ml`}
            onPress={() => router.push('/water-goal-settings')}
          />
          <SettingItem
            icon="bed-outline"
            title="Sleep Goal"
            subtitle={`${sleepGoal} hours`}
            onPress={() => router.push('/bedtime-reminders')}
          />
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>Notifications</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundLight }]}>
          <SettingItem
            icon="notifications-outline"
            title="Notification Settings"
            onPress={() => router.push('/notifications-settings')}
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.textLight }]}>About</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundLight }]}>
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => router.push('/tips')}
          />
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => router.push('/tips')}
          />
        </View>
      </ScrollView>
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default SettingsScreen;
