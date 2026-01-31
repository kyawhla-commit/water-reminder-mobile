import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SilentModeInfoProps {
  style?: any;
}

export default function SilentModeInfo({ style }: SilentModeInfoProps) {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name="volume-high" size={20} color="#2196F3" />
        <Ionicons name="phone-portrait" size={20} color="#2196F3" style={styles.phoneIcon} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? '🔊 အသံတိတ်မုဒ်တွင်ပင် အလုပ်လုပ်သည်' : '🔊 Works in Silent Mode'}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isBurmese
            ? 'သင့်ဖုန်းကို အသံတိတ်ထားသော်လည်း ရေသောက်သတိပေးချက်များကို ကြားရပါမည်။ ဤသို့ဖြင့် သင်သည် အရေးကြီးသော ရေဓာတ်ဖြည့်တင်းမှုများကို လက်လွတ်မခံရပါ။'
            : 'Notifications will play sound even when your phone is in silent mode. This ensures you never miss important hydration reminders.'}
        </Text>
        <View style={styles.controlsInfo}>
          <Text style={[styles.controlsText, { color: colors.textSecondary }]}>
            {isBurmese
              ? '💡 သင်သည် အသံပိတ်ရန် "အသံတိတ်" ကို ရွေးချယ်နိုင်သည် သို့မဟုတ် အသိပေးချက်အသံကို 0 သို့ ချိန်ညှိနိုင်သည်။'
              : '💡 You can still control this by selecting "Silent" sound or setting notification volume to 0.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneIcon: {
    marginLeft: -8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  controlsInfo: {
    marginTop: 4,
  },
  controlsText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
