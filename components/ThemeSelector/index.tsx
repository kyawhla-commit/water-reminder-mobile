import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemeMode } from '@/store/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { mode: ThemeMode; icon: string; labelKey: string }[] = [
  { mode: 'light', icon: 'sunny', labelKey: 'settings.lightMode' },
  { mode: 'dark', icon: 'moon', labelKey: 'settings.darkMode' },
  { mode: 'system', icon: 'phone-portrait', labelKey: 'settings.systemDefault' },
];

export default function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { colors, mode, setMode } = useAppTheme();
  const { t } = useTranslation();

  const handleSelect = (selectedMode: ThemeMode) => {
    setMode(selectedMode);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.theme')}</Text>

          {THEME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.option,
                { borderColor: colors.border },
                mode === option.mode && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
              ]}
              onPress={() => handleSelect(option.mode)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={mode === option.mode ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text style={[styles.optionText, { color: colors.text }]}>{t(option.labelKey)}</Text>
              {mode === option.mode && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

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
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
