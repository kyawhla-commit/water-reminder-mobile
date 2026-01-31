import { cancelAllNotifications, scheduleWaterReminder } from '@/hooks/useNotifications';
import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const NotificationsScreen = () => {
  const router = useRouter();
  const theme = useAppConfigStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  
  const [waterReminders, setWaterReminders] = useState(true);
  const [sleepReminders, setSleepReminders] = useState(true);
  const [focusReminders, setFocusReminders] = useState(false);

  const handleWaterRemindersToggle = async (value: boolean) => {
    setWaterReminders(value);
    if (value) {
      await scheduleWaterReminder(60);
    } else {
      await cancelAllNotifications();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.backgroundLight }]}>
          <View style={[styles.settingItem, { borderBottomColor: colors.neutral }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="water-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Water Reminders</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textLight }]}>
                  Remind me to drink water every hour
                </Text>
              </View>
            </View>
            <Switch
              value={waterReminders}
              onValueChange={handleWaterRemindersToggle}
              trackColor={{ false: colors.neutral, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.neutral }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color={colors.secondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Sleep Reminders</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textLight }]}>
                  Remind me when it's time to sleep
                </Text>
              </View>
            </View>
            <Switch
              value={sleepReminders}
              onValueChange={setSleepReminders}
              trackColor={{ false: colors.neutral, true: colors.secondary }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="timer-outline" size={24} color={colors.success} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Focus Reminders</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textLight }]}>
                  Remind me to take breaks during focus
                </Text>
              </View>
            </View>
            <Switch
              value={focusReminders}
              onValueChange={setFocusReminders}
              trackColor={{ false: colors.neutral, true: colors.success }}
            />
          </View>
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

export default NotificationsScreen;
