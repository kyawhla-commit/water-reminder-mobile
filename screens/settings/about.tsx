import { useAppConfigStore } from '@/store';
import { darkTheme, lightTheme } from '@/styles/theme';
import { redirectToStore } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AboutScreen = () => {
  const router = useRouter();
  const theme = useAppConfigStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Ionicons name="water" size={48} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>
            Water Reminder & Focus
          </Text>
          <Text style={[styles.version, { color: colors.textLight }]}>Version 1.0.0</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.backgroundLight }]}>
          <TouchableOpacity style={styles.item} onPress={redirectToStore}>
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <Text style={[styles.itemText, { color: colors.text }]}>Rate this app</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.item}
            onPress={() => Linking.openURL('mailto:support@example.com')}
          >
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <Text style={[styles.itemText, { color: colors.text }]}>Contact us</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.item}
            onPress={() => Linking.openURL('https://example.com/privacy')}
          >
            <Ionicons name="shield-outline" size={24} color={colors.primary} />
            <Text style={[styles.itemText, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.item, { borderBottomWidth: 0 }]}
            onPress={() => Linking.openURL('https://example.com/terms')}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={[styles.itemText, { color: colors.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.textLight }]}>
          Made with 💙 for your health
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
});

export default AboutScreen;
