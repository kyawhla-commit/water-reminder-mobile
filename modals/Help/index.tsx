import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const HelpModal = ({ visible, onClose }: HelpModalProps) => {
  const theme = useAppConfigStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const helpItems = [
    {
      icon: 'water-outline',
      title: 'Water Tracking',
      description: 'Track your daily water intake by tapping the quick add buttons or entering a custom amount. Set your daily goal in settings.',
    },
    {
      icon: 'moon-outline',
      title: 'Sleep Tracking',
      description: 'Log your sleep duration and quality each morning. View your weekly average to understand your sleep patterns.',
    },
    {
      icon: 'timer-outline',
      title: 'Focus Mode',
      description: 'Use the Pomodoro technique to stay focused. Start a session, work until the timer ends, then take a break.',
    },
    {
      icon: 'notifications-outline',
      title: 'Reminders',
      description: 'Enable notifications to get reminded to drink water, go to sleep, or take breaks during focus sessions.',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Help & Tips</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {helpItems.map((item, index) => (
              <View key={index} style={[styles.helpItem, { borderBottomColor: colors.neutral }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.helpContent}>
                  <Text style={[styles.helpTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.helpDescription, { color: colors.textLight }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  helpItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HelpModal;
