import LanguageSelector from '@/components/LanguageSelector';
import ThemeSelector from '@/components/ThemeSelector';
import { FadeInView, ScalePressable } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGES } from '@/store/language';
import { useUserProfileStore } from '@/store/userProfile';
import { formatWaterAmount } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode } = useAppTheme();
  const { t, currentLanguage } = useTranslation();
  const { profile } = useUserProfileStore();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const currentLangInfo = LANGUAGES.find((l) => l.code === currentLanguage);
  const themeLabel = mode === 'system' ? t('settings.systemDefault') : mode === 'dark' ? t('settings.darkMode') : t('settings.lightMode');

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    iconColor,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    iconColor?: string;
  }) => (
    <ScalePressable
      style={[styles.settingItem, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      scaleValue={0.98}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBg, { backgroundColor: (iconColor || colors.primary) + '20' }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={iconColor || colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />)}
    </ScalePressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView duration={400}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        </FadeInView>

        {/* Profile Card */}
        <FadeInView delay={100} duration={400}>
          <ScalePressable style={[styles.profileCard, { backgroundColor: colors.card }]} scaleValue={0.98}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{profile.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile.name || t('settings.user')}</Text>
              <Text style={[styles.profileGoal, { color: colors.textSecondary }]}>
                {t('settings.dailyGoalLabel')}: {formatWaterAmount(profile.dailyWaterGoal)}
              </Text>
            </View>
          </ScalePressable>
        </FadeInView>

        {/* Appearance */}
        <FadeInView delay={200} duration={400}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.appearance')}</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="color-palette"
              title={t('settings.theme')}
              subtitle={themeLabel}
              iconColor={isDark ? '#CE93D8' : '#9C27B0'}
              onPress={() => setShowThemeSelector(true)}
            />
            <SettingItem
              icon="language"
              title={t('settings.language')}
              subtitle={`${currentLangInfo?.flag} ${currentLangInfo?.nativeName}`}
              iconColor={isDark ? '#FFB74D' : '#FF9800'}
              onPress={() => setShowLanguageSelector(true)}
            />
            <SettingItem
              icon="options"
              title={t('settings.preferences')}
              subtitle={t('settings.preferencesDesc')}
              iconColor={isDark ? '#90A4AE' : '#607D8B'}
              onPress={() => router.push('/preferences' as any)}
            />
          </View>
        </FadeInView>

        {/* Goals */}
        <FadeInView delay={300} duration={400}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.goals')}</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="water"
              title={t('settings.dailyWaterGoal')}
              subtitle={formatWaterAmount(profile.dailyWaterGoal)}
              iconColor={colors.water}
              onPress={() => router.push('/water-goal-settings' as any)}
            />
            <SettingItem
              icon="bed"
              title={t('settings.sleepGoal')}
              subtitle={`${profile.sleepTime} - ${profile.wakeTime}`}
              iconColor={isDark ? '#CE93D8' : '#9C27B0'}
            />
          </View>
        </FadeInView>

        {/* Notifications */}
        <FadeInView delay={400} duration={400}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.notifications')}</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="notifications"
              title={t('settings.smartNotifications')}
              subtitle={t('settings.adaptiveReminders')}
              iconColor={isDark ? '#FFB74D' : '#FF9800'}
              onPress={() => router.push('/notifications-settings' as any)}
            />
          </View>
        </FadeInView>

        {/* About */}
        <FadeInView delay={500} duration={400}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.about')}</Text>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <SettingItem 
              icon="information-circle" 
              title={t('settings.about')} 
              subtitle={`${t('settings.version')} 1.0.0`} 
              iconColor={isDark ? '#90A4AE' : '#607D8B'} 
            />
            <SettingItem 
              icon="help-circle" 
              title={t('settings.helpSupport')} 
              iconColor={isDark ? '#81C784' : '#4CAF50'} 
            />
          </View>
        </FadeInView>
      </ScrollView>

      <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />
      <ThemeSelector visible={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileInfo: { marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileGoal: { fontSize: 14, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  section: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
});
