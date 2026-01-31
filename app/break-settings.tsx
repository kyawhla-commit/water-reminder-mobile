import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BreakReminderSettings,
    BreakType,
    getAllBreakTypes,
    getBreakSettings,
    getTodayBreakStats,
    saveBreakSettings,
} from '../services/breakReminders';

export default function BreakSettingsScreen() {
  const [settings, setSettings] = useState<BreakReminderSettings | null>(null);
  const [stats, setStats] = useState<{
    totalBreaks: number;
    completedBreaks: number;
    totalWaterLogged: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const language = 'en'; // TODO: Get from app settings

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsData, statsData] = await Promise.all([
        getBreakSettings(),
        getTodayBreakStats(),
      ]);
      setSettings(settingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading break settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<BreakReminderSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveBreakSettings(updates);
  };

  const toggleBreakType = (type: BreakType) => {
    if (!settings) return;
    const enabled = settings.enabledBreaks.includes(type);
    const newEnabled = enabled
      ? settings.enabledBreaks.filter(t => t !== type)
      : [...settings.enabledBreaks, type];
    updateSettings({ enabledBreaks: newEnabled });
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const breakTypes = getAllBreakTypes(language);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Break Reminders</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Stats */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Today's Breaks</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalBreaks}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {stats.completedBreaks}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#2196F3' }]}>
                  {stats.totalWaterLogged}ml
                </Text>
                <Text style={styles.statLabel}>Water</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Toggle */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Break Reminders</Text>
              <Text style={styles.settingDesc}>
                Get reminded to take breaks during focus sessions
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSettings({ enabled: value })}
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={settings.enabled ? '#2196F3' : '#BDBDBD'}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* Break Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Break Types</Text>
              <Text style={styles.sectionDesc}>
                Choose which types of breaks you want to be reminded about
              </Text>
              
              {breakTypes.map((breakType) => (
                <TouchableOpacity
                  key={breakType.type}
                  style={[
                    styles.breakTypeCard,
                    settings.enabledBreaks.includes(breakType.type) && styles.breakTypeCardActive,
                  ]}
                  onPress={() => toggleBreakType(breakType.type)}
                >
                  <Text style={styles.breakTypeEmoji}>{breakType.emoji}</Text>
                  <View style={styles.breakTypeInfo}>
                    <Text style={styles.breakTypeName}>{breakType.name}</Text>
                    <Text style={styles.breakTypeDesc}>{breakType.description}</Text>
                  </View>
                  <Ionicons
                    name={settings.enabledBreaks.includes(breakType.type) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={settings.enabledBreaks.includes(breakType.type) ? '#4CAF50' : '#CCC'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Intervals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Intervals</Text>
              
              {settings.enabledBreaks.includes('water') && (
                <View style={styles.intervalRow}>
                  <Text style={styles.intervalLabel}>💧 Water Break</Text>
                  <Text style={styles.intervalValue}>{settings.waterInterval} min</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={15}
                    maximumValue={60}
                    step={5}
                    value={settings.waterInterval}
                    onValueChange={(value) => updateSettings({ waterInterval: value })}
                    minimumTrackTintColor="#2196F3"
                    maximumTrackTintColor="#E0E0E0"
                    thumbTintColor="#2196F3"
                  />
                </View>
              )}
              
              {settings.enabledBreaks.includes('eyes') && (
                <View style={styles.intervalRow}>
                  <Text style={styles.intervalLabel}>👀 Eye Rest</Text>
                  <Text style={styles.intervalValue}>{settings.eyeRestInterval} min</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={15}
                    maximumValue={30}
                    step={5}
                    value={settings.eyeRestInterval}
                    onValueChange={(value) => updateSettings({ eyeRestInterval: value })}
                    minimumTrackTintColor="#9C27B0"
                    maximumTrackTintColor="#E0E0E0"
                    thumbTintColor="#9C27B0"
                  />
                </View>
              )}
              
              {settings.enabledBreaks.includes('stretch') && (
                <View style={styles.intervalRow}>
                  <Text style={styles.intervalLabel}>🧘 Stretch Break</Text>
                  <Text style={styles.intervalValue}>{settings.stretchInterval} min</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={30}
                    maximumValue={90}
                    step={15}
                    value={settings.stretchInterval}
                    onValueChange={(value) => updateSettings({ stretchInterval: value })}
                    minimumTrackTintColor="#FF9800"
                    maximumTrackTintColor="#E0E0E0"
                    thumbTintColor="#FF9800"
                  />
                </View>
              )}
            </View>

            {/* Water Integration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Water Reminder Integration</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Integrate with Water Tracker</Text>
                  <Text style={styles.settingDesc}>
                    Sync water breaks with your hydration goals
                  </Text>
                </View>
                <Switch
                  value={settings.integrateWithWaterReminder}
                  onValueChange={(value) => updateSettings({ integrateWithWaterReminder: value })}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={settings.integrateWithWaterReminder ? '#2196F3' : '#BDBDBD'}
                />
              </View>
              
              {settings.integrateWithWaterReminder && (
                <>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>Auto-log Water</Text>
                      <Text style={styles.settingDesc}>
                        Automatically log water when you complete a water break
                      </Text>
                    </View>
                    <Switch
                      value={settings.autoLogWater}
                      onValueChange={(value) => updateSettings({ autoLogWater: value })}
                      trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                      thumbColor={settings.autoLogWater ? '#2196F3' : '#BDBDBD'}
                    />
                  </View>
                  
                  {settings.autoLogWater && (
                    <View style={styles.waterAmountRow}>
                      <Text style={styles.waterAmountLabel}>Amount to log:</Text>
                      <View style={styles.waterAmountOptions}>
                        {[100, 150, 200, 250].map((amount) => (
                          <TouchableOpacity
                            key={amount}
                            style={[
                              styles.waterAmountOption,
                              settings.waterAmountOnBreak === amount && styles.waterAmountOptionActive,
                            ]}
                            onPress={() => updateSettings({ waterAmountOnBreak: amount })}
                          >
                            <Text
                              style={[
                                styles.waterAmountText,
                                settings.waterAmountOnBreak === amount && styles.waterAmountTextActive,
                              ]}
                            >
                              {amount}ml
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Notification Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Sound</Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSettings({ soundEnabled: value })}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={settings.soundEnabled ? '#2196F3' : '#BDBDBD'}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={settings.vibrationEnabled ? '#2196F3' : '#BDBDBD'}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>During Focus Only</Text>
                  <Text style={styles.settingDesc}>
                    Only remind during active focus sessions
                  </Text>
                </View>
                <Switch
                  value={settings.duringFocusOnly}
                  onValueChange={(value) => updateSettings({ duringFocusOnly: value })}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={settings.duringFocusOnly ? '#2196F3' : '#BDBDBD'}
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  breakTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  breakTypeCardActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  breakTypeEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  breakTypeInfo: {
    flex: 1,
  },
  breakTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  breakTypeDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  intervalRow: {
    marginBottom: 20,
  },
  intervalLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  intervalValue: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  waterAmountRow: {
    paddingVertical: 12,
  },
  waterAmountLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  waterAmountOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  waterAmountOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  waterAmountOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  waterAmountText: {
    fontSize: 14,
    color: '#666',
  },
  waterAmountTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
