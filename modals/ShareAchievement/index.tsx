import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    createChallengeShareText,
    createStreakShareText,
    createWeeklyProgressShareText,
} from '@/services/social';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ShareAchievementModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'achievement' | 'streak' | 'weekly' | 'challenge';
  data: {
    title?: string;
    titleMy?: string;
    description?: string;
    descriptionMy?: string;
    icon?: string;
    streak?: number;
    weeklyIntake?: number;
    goalPercentage?: number;
    challengeTitle?: string;
    isWinner?: boolean;
  };
}

export default function ShareAchievementModal({
  visible,
  onClose,
  type,
  data,
}: ShareAchievementModalProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';
  const language = isBurmese ? 'my' : 'en';

  const getShareText = (): string => {
    switch (type) {
      case 'streak':
        return createStreakShareText(data.streak || 0, language);
      case 'weekly':
        return createWeeklyProgressShareText(
          data.weeklyIntake || 0,
          data.goalPercentage || 0,
          language
        );
      case 'challenge':
        return createChallengeShareText(
          data.challengeTitle || '',
          data.isWinner || false,
          language
        );
      case 'achievement':
      default:
        const title = isBurmese ? data.titleMy : data.title;
        const desc = isBurmese ? data.descriptionMy : data.description;
        return isBurmese
          ? `🎉 HydroMate တွင် "${title}" ရရှိလိုက်ပါပြီ! ${data.icon}\n\n${desc}\n\n💧 ကျွန်တော်/မနဲ့အတူ ရေဓာတ်ထိန်းထားပါ! #HydroMate`
          : `🎉 I just unlocked "${title}" in HydroMate! ${data.icon}\n\n${desc}\n\n💧 Stay hydrated with me! #HydroMate`;
    }
  };

  const handleShare = async (platform?: string) => {
    try {
      const message = getShareText();
      await Share.share({ message });
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getPreviewTitle = (): string => {
    switch (type) {
      case 'streak':
        return isBurmese ? `🔥 ${data.streak} ရက်ဆက်တိုက်!` : `🔥 ${data.streak} Day Streak!`;
      case 'weekly':
        return isBurmese ? '📊 အပတ်စဉ်တိုးတက်မှု' : '📊 Weekly Progress';
      case 'challenge':
        return data.isWinner
          ? (isBurmese ? '🏆 စိန်ခေါ်မှုအနိုင်ရ!' : '🏆 Challenge Won!')
          : (isBurmese ? '🎯 စိန်ခေါ်မှုပါဝင်' : '🎯 Challenge Joined');
      default:
        return isBurmese ? data.titleMy || '' : data.title || '';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isBurmese ? '🎉 အောင်မြင်မှုမျှဝေမည်' : '🎉 Share Achievement'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Preview Card */}
          <View style={[styles.previewCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.previewIcon}>{data.icon || '🏆'}</Text>
            <Text style={styles.previewTitle}>{getPreviewTitle()}</Text>
            <Text style={styles.previewSubtitle}>
              {type === 'streak' && (isBurmese ? 'ရေဓာတ်ပန်းတိုင်ဆက်တိုက်ရောက်နေပါပြီ!' : 'Hydration goal streak!')}
              {type === 'weekly' && (isBurmese ? `${((data.weeklyIntake || 0) / 1000).toFixed(1)}L သောက်ပြီး` : `${((data.weeklyIntake || 0) / 1000).toFixed(1)}L consumed`)}
              {type === 'challenge' && (data.challengeTitle || '')}
              {type === 'achievement' && (isBurmese ? data.descriptionMy : data.description)}
            </Text>
            <View style={styles.appBadge}>
              <Text style={styles.appBadgeText}>💧 HydroMate</Text>
            </View>
          </View>

          {/* Share Options */}
          <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>
            {isBurmese ? 'မျှဝေရန်' : 'Share via'}
          </Text>
          
          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={[styles.shareOption, { backgroundColor: colors.card }]}
              onPress={() => handleShare()}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: colors.text }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareOption, { backgroundColor: colors.card }]}
              onPress={() => handleShare()}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#1DA1F2' }]}>
                <Ionicons name="logo-twitter" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: colors.text }]}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareOption, { backgroundColor: colors.card }]}
              onPress={() => handleShare()}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#4267B2' }]}>
                <Ionicons name="logo-facebook" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: colors.text }]}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareOption, { backgroundColor: colors.card }]}
              onPress={() => handleShare()}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#7C3AED' }]}>
                <Ionicons name="share-social" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: colors.text }]}>
                {isBurmese ? 'အခြား' : 'More'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Copy Link Button */}
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => handleShare()}
          >
            <Ionicons name="copy-outline" size={20} color={colors.primary} />
            <Text style={[styles.copyButtonText, { color: colors.primary }]}>
              {isBurmese ? 'စာသားကူးယူရန်' : 'Copy Text'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  previewCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  appBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
  },
  appBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shareLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  shareOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    width: '23%',
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
