import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AppBlockerSettings,
  loadAppBlockerSettings,
  saveAppBlockerSettings,
  SUGGESTED_APPS_TO_BLOCK
} from '@/services/focusEnhancements';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function AppBlockerScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [settings, setSettings] = useState<AppBlockerSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loaded = await loadAppBlockerSettings();
    // Initialize with suggested apps if empty
    if (loaded.blockedApps.length === 0) {
      loaded.blockedApps = SUGGESTED_APPS_TO_BLOCK.map((app, index) => ({
        ...app,
        id: `app_${index}`,
        isBlocked: false,
      }));
    }
    setSettings(loaded);
  };

  const updateSetting = async <K extends keyof AppBlockerSettings>(key: K, value: AppBlockerSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    await saveAppBlockerSettings(updated);
    setSettings(updated);
  };

  const toggleAppBlock = async (appId: string) => {
    if (!settings) return;
    const updatedApps = settings.blockedApps.map((app) =>
      app.id === appId ? { ...app, isBlocked: !app.isBlocked } : app
    );
    const updated = { ...settings, blockedApps: updatedApps };
    await saveAppBlockerSettings(updated);
    setSettings(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const blockAllInCategory = async (category: string) => {
    if (!settings) return;
    const updatedApps = settings.blockedApps.map((app) =>
      app.category === category ? { ...app, isBlocked: true } : app
    );
    const updated = { ...settings, blockedApps: updatedApps };
    await saveAppBlockerSettings(updated);
    setSettings(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const unblockAll = async () => {
    if (!settings) return;
    Alert.alert(
      isBurmese ? 'အားလုံးပိတ်ဖြုတ်မည်' : 'Unblock All',
      isBurmese ? 'အက်ပ်အားလုံးကို ပိတ်ဖြုတ်မည်လား?' : 'Unblock all apps?',
      [
        { text: isBurmese ? 'မလုပ်ပါ' : 'Cancel', style: 'cancel' },
        {
          text: isBurmese ? 'ပိတ်ဖြုတ်မည်' : 'Unblock',
          onPress: async () => {
            const updatedApps = settings.blockedApps.map((app) => ({ ...app, isBlocked: false }));
            const updated = { ...settings, blockedApps: updatedApps };
            await saveAppBlockerSettings(updated);
            setSettings(updated);
          },
        },
      ]
    );
  };

  const categories = [
    { id: 'all', name: isBurmese ? 'အားလုံး' : 'All', icon: '📱' },
    { id: 'social', name: isBurmese ? 'လူမှုကွန်ရက်' : 'Social', icon: '👥' },
    { id: 'entertainment', name: isBurmese ? 'ဖျော်ဖြေရေး' : 'Entertainment', icon: '🎬' },
    { id: 'games', name: isBurmese ? 'ဂိမ်းများ' : 'Games', icon: '🎮' },
    { id: 'news', name: isBurmese ? 'သတင်း' : 'News', icon: '📰' },
  ];

  const filteredApps =
    selectedCategory === 'all'
      ? settings?.blockedApps || []
      : settings?.blockedApps.filter((app) => app.category === selectedCategory) || [];

  const blockedCount = settings?.blockedApps.filter((app) => app.isBlocked).length || 0;

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
            🚫 {isBurmese ? 'အက်ပ်ပိတ်ဆို့ခြင်း' : 'App Blocker'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: settings.enabled ? '#E74C3C20' : colors.card }]}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {isBurmese ? 'အက်ပ်ပိတ်ဆို့ခြင်း' : 'App Blocking'}
              </Text>
              <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
                {blockedCount} {isBurmese ? 'အက်ပ်ပိတ်ထားသည်' : 'apps blocked'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(v) => updateSetting('enabled', v)}
              trackColor={{ false: colors.surfaceVariant, true: '#E74C3C' }}
            />
          </View>
        </View>

        {/* When to Block */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '⏰ ဘယ်အချိန်ပိတ်မလဲ' : '⏰ When to Block'}
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🍅</Text>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'Pomodoro အတွင်း' : 'During Pomodoro'}
              </Text>
            </View>
            <Switch
              value={settings.blockDuringFocus}
              onValueChange={(v) => updateSetting('blockDuringFocus', v)}
              trackColor={{ false: colors.surfaceVariant, true: '#E74C3C' }}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🧠</Text>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'Deep Work အတွင်း' : 'During Deep Work'}
              </Text>
            </View>
            <Switch
              value={settings.blockDuringDeepWork}
              onValueChange={(v) => updateSetting('blockDuringDeepWork', v)}
              trackColor={{ false: colors.surfaceVariant, true: '#E74C3C' }}
            />
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                { backgroundColor: colors.card },
                selectedCategory === cat.id && { backgroundColor: '#E74C3C' },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[styles.categoryText, { color: selectedCategory === cat.id ? '#fff' : colors.text }]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {selectedCategory !== 'all' && (
            <TouchableOpacity
              style={[styles.quickButton, { backgroundColor: '#E74C3C' }]}
              onPress={() => blockAllInCategory(selectedCategory)}
            >
              <Ionicons name="ban" size={16} color="#fff" />
              <Text style={styles.quickButtonText}>
                {isBurmese ? 'အားလုံးပိတ်' : 'Block All'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={unblockAll}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.text} />
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              {isBurmese ? 'အားလုံးဖွင့်' : 'Unblock All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Apps List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '📱 အက်ပ်များ' : '📱 Apps'}
        </Text>
        {filteredApps.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={[styles.appCard, { backgroundColor: colors.card }]}
            onPress={() => toggleAppBlock(app.id)}
          >
            <Text style={styles.appIcon}>{app.icon}</Text>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: colors.text }]}>{app.name}</Text>
              <Text style={[styles.appCategory, { color: colors.textSecondary }]}>
                {categories.find((c) => c.id === app.category)?.name}
              </Text>
            </View>
            <View
              style={[
                styles.blockBadge,
                { backgroundColor: app.isBlocked ? '#E74C3C' : colors.surfaceVariant },
              ]}
            >
              <Ionicons
                name={app.isBlocked ? 'ban' : 'checkmark'}
                size={18}
                color={app.isBlocked ? '#fff' : colors.text}
              />
            </View>
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#3D2020' : '#FFEBEE' }]}>
          <Ionicons name="information-circle" size={24} color="#E74C3C" />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {isBurmese
              ? '⚠️ အက်ပ်ပိတ်ဆို့ခြင်းသည် သတိပေးချက်သာဖြစ်သည်။ Android တွင် အမှန်တကယ်ပိတ်ဆို့ရန် Digital Wellbeing သို့မဟုတ် အခြားအက်ပ်များလိုအပ်သည်။'
              : '⚠️ App blocking is a reminder feature. For actual blocking on Android, use Digital Wellbeing or dedicated apps.'}
          </Text>
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 အကြံပြုချက်: လူမှုကွန်ရက်အက်ပ်များကို ပိတ်ထားခြင်းသည် အာရုံစူးစိုက်မှုကို သိသိသာသာတိုးတက်စေသည်။'
              : '💡 Tip: Blocking social media apps significantly improves focus and productivity.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  statusCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTitle: { fontSize: 16, fontWeight: '600' },
  statusSubtitle: { fontSize: 13, marginTop: 4 },
  settingsCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 20 },
  settingLabel: { fontSize: 14 },
  categoryScroll: { marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10, gap: 6 },
  categoryIcon: { fontSize: 16 },
  categoryText: { fontSize: 13, fontWeight: '500' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  quickButtonText: { fontSize: 13, fontWeight: '500', color: '#fff' },
  appCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
  appIcon: { fontSize: 28, marginRight: 14 },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '600' },
  appCategory: { fontSize: 12, marginTop: 2 },
  blockBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, marginTop: 8, marginBottom: 12, gap: 12 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
