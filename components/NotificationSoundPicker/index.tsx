import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    getNotificationSound,
    NOTIFICATION_SOUNDS,
    NotificationSoundId,
    previewNotificationSound,
    sendTestNotificationWithSound,
    setNotificationSound,
    stopSoundPreview
} from '@/services/notificationSounds';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface NotificationSoundPickerProps {
  visible: boolean;
  onClose: () => void;
  onSoundChange?: (soundId: NotificationSoundId) => void;
}

export default function NotificationSoundPicker({
  visible,
  onClose,
  onSoundChange,
}: NotificationSoundPickerProps) {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [selectedSound, setSelectedSound] = useState<NotificationSoundId>('water-bubble');
  const [playingSound, setPlayingSound] = useState<NotificationSoundId | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentSound();
    }
    return () => {
      stopSoundPreview();
    };
  }, [visible]);

  const loadCurrentSound = async () => {
    const current = await getNotificationSound();
    setSelectedSound(current);
  };

  const handleSelectSound = async (soundId: NotificationSoundId) => {
    setSelectedSound(soundId);
    setLoading(true);

    try {
      await setNotificationSound(soundId);
      onSoundChange?.(soundId);
    } catch (error) {
      console.error('Error setting sound:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSound = async (soundId: NotificationSoundId) => {
    if (playingSound === soundId) {
      await stopSoundPreview();
      setPlayingSound(null);
      return;
    }

    setPlayingSound(soundId);
    await previewNotificationSound(soundId);

    // Auto-clear playing state after preview
    setTimeout(() => {
      setPlayingSound(null);
    }, 3000);
  };

  const handleTestNotification = async () => {
    setLoading(true);
    await sendTestNotificationWithSound(selectedSound);
    setLoading(false);
  };

  const renderSoundItem = ({ item }: { item: (typeof NOTIFICATION_SOUNDS)[0] }) => {
    const isSelected = selectedSound === item.id;
    const isPlaying = playingSound === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.soundItem,
          { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : 'transparent' },
          isSelected && styles.soundItemSelected,
        ]}
        onPress={() => handleSelectSound(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.soundInfo}>
          <Text style={styles.soundIcon}>{item.icon}</Text>
          <View style={styles.soundText}>
            <Text style={[styles.soundName, { color: colors.text }]}>
              {isBurmese ? item.nameMy : item.name}
            </Text>
            <Text style={[styles.soundDesc, { color: colors.textSecondary }]} numberOfLines={1}>
              {isBurmese ? item.descriptionMy : item.description}
            </Text>
          </View>
        </View>

        <View style={styles.soundActions}>
          {item.id !== 'silent' && item.id !== 'default' && (
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: isDark ? '#1E3A5F' : '#E8F0FE' }]}
              onPress={() => handlePreviewSound(item.id)}
            >
              <Ionicons
                name={isPlaying ? 'stop' : 'play'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isBurmese ? '🔔 အသိပေးသံရွေးချယ်ပါ' : '🔔 Notification Sound'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {isBurmese
              ? 'ရေသောက်သတိပေးချက်များအတွက် သဘာဝရေသံများကို ရွေးချယ်ပါ'
              : 'Choose a nature-inspired water sound for your hydration reminders'}
          </Text>

          {/* Sound List */}
          <FlatList
            data={NOTIFICATION_SOUNDS}
            keyExtractor={(item) => item.id}
            renderItem={renderSoundItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Test Button */}
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={handleTestNotification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="notifications" size={20} color="#fff" />
                <Text style={styles.testButtonText}>
                  {isBurmese ? 'စမ်းသပ်အသိပေးချက်ပို့ပါ' : 'Send Test Notification'}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
    maxHeight: '80%',
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
  description: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  soundItemSelected: {
    borderWidth: 2,
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  soundIcon: {
    fontSize: 28,
  },
  soundText: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  soundDesc: {
    fontSize: 12,
  },
  soundActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
