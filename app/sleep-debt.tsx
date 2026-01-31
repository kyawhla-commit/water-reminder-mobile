import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    calculateRecommendedBedtime,
    calculateSleepDebt,
    findSmartWakeTimes,
    formatDebtDuration,
    getDayNameMy,
    getDebtStatusMessage,
    loadSmartAlarmSettings,
    saveSmartAlarmSettings,
    SleepDebtData,
    SmartAlarmSettings,
    SmartWakeTime,
    SNOOZE_OPTIONS,
    WINDOW_OPTIONS,
} from '@/services/sleepDebtCalculator';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SleepDebtScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [debtData, setDebtData] = useState<SleepDebtData | null>(null);
  const [alarmSettings, setAlarmSettings] = useState<SmartAlarmSettings | null>(null);
  const [smartWakeTimes, setSmartWakeTimes] = useState<SmartWakeTime[]>([]);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'debt' | 'alarm'>('debt');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [debt, alarm] = await Promise.all([calculateSleepDebt(), loadSmartAlarmSettings()]);
    setDebtData(debt);
    setAlarmSettings(alarm);
    if (alarm.enabled) {
      calculateSmartWake(alarm);
    }
  };

  const calculateSmartWake = (settings: SmartAlarmSettings) => {
    const now = new Date();
    const [hours, minutes] = settings.targetWakeTime.split(':').map(Number);
    const targetWake = new Date();
    targetWake.setHours(hours, minutes, 0, 0);
    if (targetWake <= now) {
      targetWake.setDate(targetWake.getDate() + 1);
    }
    const bedtime = new Date(now);
    bedtime.setHours(22, 0, 0, 0);
    const wakeTimes = findSmartWakeTimes(bedtime, targetWake, settings.windowMinutes);
    setSmartWakeTimes(wakeTimes);
  };

  const handleToggleAlarm = async () => {
    if (!alarmSettings) return;
    const updated = { ...alarmSettings, enabled: !alarmSettings.enabled };
    await saveSmartAlarmSettings(updated);
    setAlarmSettings(updated);
    if (updated.enabled) calculateSmartWake(updated);
  };

  const handleToggleDay = async (index: number) => {
    if (!alarmSettings) return;
    const newDays = [...alarmSettings.daysEnabled];
    newDays[index] = !newDays[index];
    const updated = { ...alarmSettings, daysEnabled: newDays };
    await saveSmartAlarmSettings(updated);
    setAlarmSettings(updated);
  };

  const handleWindowChange = async (value: number) => {
    if (!alarmSettings) return;
    const updated = { ...alarmSettings, windowMinutes: value };
    await saveSmartAlarmSettings(updated);
    setAlarmSettings(updated);
    calculateSmartWake(updated);
  };

  const handleSnoozeChange = async (value: number) => {
    if (!alarmSettings) return;
    const updated = { ...alarmSettings, snoozeMinutes: value };
    await saveSmartAlarmSettings(updated);
    setAlarmSettings(updated);
  };

  const getDebtColor = (debt: number): string => {
    if (debt <= 0) return '#4CAF50';
    if (debt <= 120) return '#8BC34A';
    if (debt <= 300) return '#FF9800';
    return '#F44336';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(isBurmese ? 'my-MM' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderDebtTab = () => {
    if (!debtData) return null;
    const status = getDebtStatusMessage(debtData.currentDebt, isBurmese);
    const debtColor = getDebtColor(debtData.currentDebt);

    return (
      <>
        <View style={[styles.debtCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>
            {isBurmese ? 'လက်ရှိအိပ်ရေးပျက်မှု' : 'Current Sleep Debt'}
          </Text>
          <View style={styles.debtValueRow}>
            <Text style={[styles.debtValue, { color: debtColor }]}>
              {debtData.currentDebt <= 0 ? '+' : '-'}
              {formatDebtDuration(debtData.currentDebt, isBurmese)}
            </Text>
            <View style={[styles.debtBadge, { backgroundColor: debtColor + '20' }]}>
              <Text style={[styles.debtBadgeText, { color: debtColor }]}>
                {debtData.currentDebt <= 0 ? (isBurmese ? 'ပိုလျှံ' : 'Surplus') : (isBurmese ? 'ပျက်' : 'Debt')}
              </Text>
            </View>
          </View>
          <Text style={[styles.statusMessage, { color: colors.text }]}>{status.message}</Text>
        </View>


        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: getDebtColor(debtData.weeklyDebt) }]}>
              {formatDebtDuration(Math.abs(debtData.weeklyDebt), isBurmese)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'ဤအပတ်' : 'This Week'}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceVariant }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: getDebtColor(debtData.monthlyDebt) }]}>
              {formatDebtDuration(Math.abs(debtData.monthlyDebt), isBurmese)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'ဤလ' : 'This Month'}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceVariant }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {Math.floor(debtData.dailyGoal / 60)}h
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isBurmese ? 'ပန်းတိုင်' : 'Goal'}
            </Text>
          </View>
        </View>

        {debtData.currentDebt > 0 && (
          <View style={[styles.recoveryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isBurmese ? '📅 ပြန်လည်ကောင်းမွန်ရေးအစီအစဉ်' : '📅 Recovery Plan'}
            </Text>
            <Text style={[styles.recoverySubtitle, { color: colors.textSecondary }]}>
              {isBurmese ? 'အိပ်ရေးပျက်မှုပြန်လည်ကောင်းမွန်ရန် အကြံပြုချက်' : 'Recommended sleep to recover debt'}
            </Text>
            {debtData.recoveryPlan.map((day, index) => (
              <View key={day.date} style={[styles.recoveryDay, { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' }]}>
                <View style={styles.recoveryDayInfo}>
                  <Text style={[styles.recoveryDayName, { color: colors.text }]}>
                    {isBurmese ? getDayNameMy(day.dayName) : day.dayName}
                  </Text>
                  {day.isWeekend && (
                    <View style={[styles.weekendBadge, { backgroundColor: '#9C27B020' }]}>
                      <Text style={{ color: '#9C27B0', fontSize: 10 }}>
                        {isBurmese ? 'အားလပ်ရက်' : 'Weekend'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.recoveryDayTime}>
                  <Text style={[styles.recoveryDuration, { color: colors.primary }]}>
                    {Math.floor(day.recommendedSleep / 60)}h {day.recommendedSleep % 60}m
                  </Text>
                  {day.extraSleep > 0 && (
                    <Text style={[styles.extraSleep, { color: '#4CAF50' }]}>
                      +{day.extraSleep}m
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}


        <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📊 မကြာသေးမီမှတ်တမ်း' : '📊 Recent History'}
          </Text>
          <View style={styles.historyChart}>
            {debtData.debtHistory.slice(-7).map((entry, index) => {
              const height = Math.min(100, (entry.actual / debtData.dailyGoal) * 100);
              const isToday = index === debtData.debtHistory.slice(-7).length - 1;
              return (
                <View key={entry.date} style={styles.historyBar}>
                  <Text style={[styles.historyValue, { color: colors.textSecondary }]}>
                    {Math.floor(entry.actual / 60)}h
                  </Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.barGoal, { backgroundColor: colors.surfaceVariant }]} />
                    <View
                      style={[
                        styles.barActual,
                        {
                          height: `${height}%`,
                          backgroundColor: entry.actual >= debtData.dailyGoal ? '#4CAF50' : '#FF9800',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.historyDay, { color: isToday ? colors.primary : colors.textSecondary }]}>
                    {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.historyLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပန်းတိုင်ရောက်' : 'Goal Met'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပန်းတိုင်မရောက်' : 'Below Goal'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 အိပ်ရေးပျက်မှုကို တစ်ညတည်းနှင့် ပြန်မကောင်းနိုင်ပါ။ တစ်ပတ်အတွင်း ဖြည်းဖြည်းပြန်လည်ကောင်းမွန်ပါ။'
              : '💡 Sleep debt can\'t be recovered in one night. Gradually catch up over a week for best results.'}
          </Text>
        </View>
      </>
    );
  };

  const renderAlarmTab = () => {
    if (!alarmSettings) return null;
    const recommendations = calculateRecommendedBedtime(alarmSettings.targetWakeTime);

    return (
      <>
        <View style={[styles.alarmCard, { backgroundColor: colors.card }]}>
          <View style={styles.alarmHeader}>
            <View>
              <Text style={[styles.alarmLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စမတ်နိုးစက်' : 'Smart Alarm'}
              </Text>
              <Text style={[styles.alarmTime, { color: colors.primary }]}>
                {formatTime(new Date(`2000-01-01T${alarmSettings.targetWakeTime}`))}
              </Text>
            </View>
            <Switch
              value={alarmSettings.enabled}
              onValueChange={handleToggleAlarm}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {alarmSettings.enabled && alarmSettings.smartWakeEnabled && smartWakeTimes.length > 0 && (
            <View style={[styles.smartWakeInfo, { backgroundColor: isDark ? '#1B3D2F' : '#E8F5E9' }]}>
              <Ionicons name="sunny" size={20} color="#4CAF50" />
              <Text style={[styles.smartWakeText, { color: colors.text }]}>
                {isBurmese ? 'အကောင်းဆုံးနိုးချိန်: ' : 'Optimal wake: '}
                {formatTime(smartWakeTimes[0].time)}
                <Text style={{ color: colors.textSecondary }}>
                  {' '}({smartWakeTimes[0].minutesBeforeTarget}m {isBurmese ? 'စောစော' : 'early'})
                </Text>
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.daysCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📅 ရက်များ' : '📅 Days'}
          </Text>
          <View style={styles.daysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  { backgroundColor: alarmSettings.daysEnabled[index] ? colors.primary : colors.surfaceVariant },
                ]}
                onPress={() => handleToggleDay(index)}
              >
                <Text style={[styles.dayText, { color: alarmSettings.daysEnabled[index] ? '#fff' : colors.text }]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '⚙️ ဆက်တင်များ' : '⚙️ Settings'}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isBurmese ? 'စမတ်နိုးခြင်း' : 'Smart Wake'}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                {isBurmese ? 'အိပ်စက်မှုအဆင့်ပေါ့တွင် နိုး' : 'Wake during light sleep phase'}
              </Text>
            </View>
            <Switch
              value={alarmSettings.smartWakeEnabled}
              onValueChange={async () => {
                const updated = { ...alarmSettings, smartWakeEnabled: !alarmSettings.smartWakeEnabled };
                await saveSmartAlarmSettings(updated);
                setAlarmSettings(updated);
              }}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <Text style={[styles.settingSubtitle, { color: colors.text }]}>
            {isBurmese ? 'နိုးချိန်ပြတင်းပေါက်' : 'Wake Window'}
          </Text>
          <View style={styles.optionsRow}>
            {WINDOW_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionButton,
                  { backgroundColor: alarmSettings.windowMinutes === opt.value ? colors.primary : colors.surfaceVariant },
                ]}
                onPress={() => handleWindowChange(opt.value)}
              >
                <Text style={{ color: alarmSettings.windowMinutes === opt.value ? '#fff' : colors.text }}>
                  {isBurmese ? opt.labelMy : opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.settingSubtitle, { color: colors.text }]}>
            {isBurmese ? 'နောက်ဆုတ်ချိန်' : 'Snooze Duration'}
          </Text>
          <View style={styles.optionsRow}>
            {SNOOZE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionButton,
                  { backgroundColor: alarmSettings.snoozeMinutes === opt.value ? colors.primary : colors.surfaceVariant },
                ]}
                onPress={() => handleSnoozeChange(opt.value)}
              >
                <Text style={{ color: alarmSettings.snoozeMinutes === opt.value ? '#fff' : colors.text }}>
                  {isBurmese ? opt.labelMy : opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      
  <View style={[styles.bedtimeCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🛏️ အကြံပြုအိပ်ရာဝင်ချိန်' : '🛏️ Recommended Bedtimes'}
          </Text>
          <Text style={[styles.bedtimeSubtitle, { color: colors.textSecondary }]}>
            {isBurmese ? 'အိပ်စက်မှုစက်ဝန်းအပေါ်အခြေခံသည်' : 'Based on sleep cycles for optimal wake'}
          </Text>
          {recommendations.map((rec) => (
            <View key={rec.cycles} style={[styles.bedtimeOption, { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' }]}>
              <View>
                <Text style={[styles.bedtimeTime, { color: colors.text }]}>{formatTime(rec.bedtime)}</Text>
                <Text style={[styles.bedtimeCycles, { color: colors.textSecondary }]}>
                  {rec.cycles} {isBurmese ? 'စက်ဝန်း' : 'cycles'} ({rec.cycles * 1.5}h)
                </Text>
              </View>
              <View style={[styles.cyclesBadge, { backgroundColor: rec.cycles === 5 ? '#4CAF5020' : colors.surfaceVariant }]}>
                <Text style={{ color: rec.cycles === 5 ? '#4CAF50' : colors.textSecondary, fontSize: 12 }}>
                  {rec.cycles === 5 ? (isBurmese ? 'အကြံပြု' : 'Recommended') : (isBurmese ? 'ရွေးချယ်နိုင်' : 'Optional')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: isDark ? '#2D1B4E' : '#EDE7F6' }]}>
          <Ionicons name="moon" size={24} color="#9C27B0" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 အိပ်စက်မှုစက်ဝန်းတစ်ခုသည် ၉၀ မိနစ်ခန့်ကြာသည်။ စက်ဝန်းပြီးဆုံးချိန်တွင် နိုးခြင်းသည် ပိုလန်းဆန်းစေသည်။'
              : '💡 Each sleep cycle is ~90 min. Waking at the end of a cycle helps you feel more refreshed.'}
          </Text>
        </View>
      </>
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isBurmese ? '😴 အိပ်ရေးပျက်မှု & နိုးစက်' : '😴 Sleep Debt & Alarm'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'debt' && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedTab('debt')}
          >
            <Text style={[styles.tabText, { color: selectedTab === 'debt' ? '#fff' : colors.text }]}>
              {isBurmese ? '📊 အိပ်ရေးပျက်' : '📊 Sleep Debt'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'alarm' && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedTab('alarm')}
          >
            <Text style={[styles.tabText, { color: selectedTab === 'alarm' ? '#fff' : colors.text }]}>
              {isBurmese ? '⏰ စမတ်နိုးစက်' : '⏰ Smart Alarm'}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'debt' ? renderDebtTab() : renderAlarmTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  tabContainer: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  tab: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  debtCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  debtLabel: { fontSize: 14, marginBottom: 8 },
  debtValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  debtValue: { fontSize: 36, fontWeight: '700' },
  debtBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  debtBadgeText: { fontSize: 12, fontWeight: '600' },
  statusMessage: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  statsRow: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, marginHorizontal: 8 },
  recoveryCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  recoverySubtitle: { fontSize: 12, marginBottom: 16 },
  recoveryDay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  recoveryDayInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recoveryDayName: { fontSize: 14, fontWeight: '500' },
  weekendBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  recoveryDayTime: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recoveryDuration: { fontSize: 14, fontWeight: '600' },
  extraSleep: { fontSize: 12, fontWeight: '600' },
  historyCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  historyChart: { flexDirection: 'row', justifyContent: 'space-between', height: 120, marginBottom: 12 },
  historyBar: { flex: 1, alignItems: 'center' },
  historyValue: { fontSize: 10, marginBottom: 4 },
  barContainer: { flex: 1, width: 20, justifyContent: 'flex-end', position: 'relative' },
  barGoal: { position: 'absolute', bottom: 0, width: '100%', height: '100%', borderRadius: 4, opacity: 0.3 },
  barActual: { width: '100%', borderRadius: 4 },
  historyDay: { fontSize: 10, marginTop: 4 },
  historyLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11 },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  alarmCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  alarmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alarmLabel: { fontSize: 14 },
  alarmTime: { fontSize: 36, fontWeight: '700' },
  smartWakeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 16 },
  smartWakeText: { fontSize: 13 },
  daysCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14, fontWeight: '600' },
  settingsCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  settingSubtitle: { fontSize: 14, fontWeight: '500', marginBottom: 12, marginTop: 8 },
  optionsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  optionButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  bedtimeCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  bedtimeSubtitle: { fontSize: 12, marginBottom: 16 },
  bedtimeOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
  bedtimeTime: { fontSize: 18, fontWeight: '600' },
  bedtimeCycles: { fontSize: 12, marginTop: 2 },
  cyclesBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
