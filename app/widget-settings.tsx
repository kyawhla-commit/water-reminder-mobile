import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getWidgetConfig,
    getWidgetStatus,
    isWidgetSupported,
    saveWidgetConfig,
    WidgetConfig,
} from '../services/widget';

const QUICK_ADD_OPTIONS = [100, 150, 200, 250, 300, 350, 400, 500];

export default function WidgetSettingsScreen() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetStatus, setWidgetStatus] = useState<{
    isSupported: boolean;
    hasData: boolean;
    lastSync: string | null;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [configData, status] = await Promise.all([getWidgetConfig(), getWidgetStatus()]);
      setConfig(configData);
      setWidgetStatus(status);
    } catch (error) {
      console.error('Error loading widget settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<WidgetConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await saveWidgetConfig(updates);
  };

  const handleQuickAddSelect = (index: number, amount: number) => {
    if (!config) return;
    const newAmounts = [...config.quickAddAmounts];
    newAmounts[index] = amount;
    updateConfig({ quickAddAmounts: newAmounts });
  };

  const openWidgetInstructions = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Add Widget to Home Screen',
        '1. Long press on your home screen\n2. Tap "Widgets"\n3. Find "HydroMate Water Tracker"\n4. Drag it to your home screen',
        [{ text: 'Got it!' }]
      );
    } else {
      Alert.alert(
        'Add Widget to Home Screen',
        '1. Long press on your home screen\n2. Tap the "+" button in the top left\n3. Search for "HydroMate"\n4. Choose a widget size and tap "Add Widget"',
        [{ text: 'Got it!' }]
      );
    }
  };

  if (isLoading || !config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSupported = isWidgetSupported();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Widget Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Widget Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Widget Preview</Text>
          <View style={styles.widgetPreview}>
            <Text style={styles.previewTitle}>💧 HydroMate</Text>
            <Text style={styles.previewPercentage}>65%</Text>
            <View style={styles.previewProgressContainer}>
              <View style={[styles.previewProgress, { width: '65%' }]} />
            </View>
            <Text style={styles.previewIntake}>1300 / 2000 ml</Text>
            <View style={styles.previewButtons}>
              <View style={styles.previewButton}>
                <Text style={styles.previewButtonText}>+{config.quickAddAmounts[0]}ml</Text>
              </View>
              <View style={styles.previewButton}>
                <Text style={styles.previewButtonText}>+{config.quickAddAmounts[1]}ml</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Platform Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Platform</Text>
              <Text style={styles.statusValue}>{Platform.OS === 'android' ? 'Android' : 'iOS'}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Widget Support</Text>
              <View
                style={[styles.statusBadge, isSupported ? styles.statusBadgeSuccess : styles.statusBadgeWarning]}
              >
                <Text style={styles.statusBadgeText}>{isSupported ? 'Available' : 'Limited'}</Text>
              </View>
            </View>
            {widgetStatus?.lastSync && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Sync</Text>
                <Text style={styles.statusValue}>
                  {new Date(widgetStatus.lastSync).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add Buttons</Text>
          <Text style={styles.sectionDescription}>
            Choose the amounts for the widget's quick add buttons
          </Text>

          {[0, 1].map((index) => (
            <View key={index} style={styles.quickAddSection}>
              <Text style={styles.quickAddLabel}>Button {index + 1}</Text>
              <View style={styles.quickAddOptions}>
                {QUICK_ADD_OPTIONS.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickAddOption,
                      config.quickAddAmounts[index] === amount && styles.quickAddOptionSelected,
                    ]}
                    onPress={() => handleQuickAddSelect(index, amount)}
                  >
                    <Text
                      style={[
                        styles.quickAddOptionText,
                        config.quickAddAmounts[index] === amount && styles.quickAddOptionTextSelected,
                      ]}
                    >
                      {amount}ml
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Display Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Options</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Show Percentage</Text>
              <Text style={styles.optionDescription}>Display progress as percentage</Text>
            </View>
            <Switch
              value={config.showPercentage}
              onValueChange={(value) => updateConfig({ showPercentage: value })}
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={config.showPercentage ? '#2196F3' : '#BDBDBD'}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Show Streak</Text>
              <Text style={styles.optionDescription}>Display current streak days</Text>
            </View>
            <Switch
              value={config.showStreak}
              onValueChange={(value) => updateConfig({ showStreak: value })}
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={config.showStreak ? '#2196F3' : '#BDBDBD'}
            />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Widget Theme</Text>
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[styles.themeOption, config.theme === theme && styles.themeOptionSelected]}
                onPress={() => updateConfig({ theme })}
              >
                <Ionicons
                  name={theme === 'light' ? 'sunny' : theme === 'dark' ? 'moon' : 'phone-portrait'}
                  size={24}
                  color={config.theme === theme ? '#2196F3' : '#666'}
                />
                <Text
                  style={[styles.themeOptionText, config.theme === theme && styles.themeOptionTextSelected]}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Add Widget</Text>
          <TouchableOpacity style={styles.instructionCard} onPress={openWidgetInstructions}>
            <Ionicons name="help-circle-outline" size={24} color="#2196F3" />
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Add to Home Screen</Text>
              <Text style={styles.instructionDescription}>
                Tap here for step-by-step instructions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* iOS Note */}
        {Platform.OS === 'ios' && (
          <View style={styles.noteSection}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.noteText}>
              iOS widget support requires additional setup. The widget will be available in a future
              update.
            </Text>
          </View>
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
  previewSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  widgetPreview: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  previewPercentage: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 8,
  },
  previewProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  previewProgress: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  previewIntake: {
    fontSize: 12,
    color: '#666',
  },
  previewButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  previewButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  quickAddSection: {
    marginBottom: 16,
  },
  quickAddLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quickAddOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAddOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  quickAddOptionText: {
    fontSize: 13,
    color: '#666',
  },
  quickAddOptionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  themeOptionText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  themeOptionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  instructionContent: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  instructionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 32,
  },
});
