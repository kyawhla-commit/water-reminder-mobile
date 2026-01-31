import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { clearMessageCache } from '@/services/smartNotifications';
import type { LanguageCode } from '@/store/language';
import { LANGUAGES, useLanguageStore } from '@/store/language';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { colors, isDark } = useAppTheme();
  const { t, currentLanguage } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    // Clear cached notification messages when language changes
    // This ensures messages are regenerated in the new language
    clearMessageCache();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.selectLanguage')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageItem,
                  { borderBottomColor: colors.divider },
                  currentLanguage === item.code && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => handleSelect(item.code)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, { color: colors.text }]}>{item.nativeName}</Text>
                  <Text style={[styles.languageNameEn, { color: colors.textSecondary }]}>{item.name}</Text>
                </View>
                {currentLanguage === item.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
  },
  languageNameEn: {
    fontSize: 14,
    marginTop: 2,
  },
});
