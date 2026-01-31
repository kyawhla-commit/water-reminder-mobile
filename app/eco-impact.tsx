import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { EcoImpactData, getEcoFacts, getEcoImpact } from '@/services/ecoImpact';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EcoImpactScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentLanguage } = useTranslation();
  const [ecoData, setEcoData] = useState<EcoImpactData | null>(null);
  const [facts, setFacts] = useState<{ icon: string; fact: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getEcoImpact();
    setEcoData(data);
    setFacts(getEcoFacts(currentLanguage));
  };

  const StatCard = ({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.statEmoji}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  const t = (en: string, my: string) => currentLanguage === 'my' ? my : en;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          🌍 {t('Eco Impact', 'သဘာဝပတ်ဝန်းကျင်အကျိုးသက်ရောက်မှု')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' }]}>
          <Text style={styles.heroEmoji}>🌱</Text>
          <Text style={[styles.heroTitle, { color: isDark ? '#A5D6A7' : '#2E7D32' }]}>
            {t('Your Environmental Impact', 'သင့်သဘာဝပတ်ဝန်းကျင်အကျိုးသက်ရောက်မှု')}
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDark ? '#81C784' : '#388E3C' }]}>
            {t('By using a reusable bottle, you\'re making a difference!', 'ပြန်သုံးပုလင်းသုံးခြင်းဖြင့် သင်ကွာခြားမှုဖန်တီးနေပါသည်!')}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="🍶"
            value={ecoData?.plasticBottlesSaved.toString() || '0'}
            label={t('Bottles Saved', 'ချွေတာသောပုလင်း')}
            color="#4CAF50"
          />
          <StatCard
            icon="💨"
            value={`${((ecoData?.co2Saved || 0) / 1000).toFixed(1)}kg`}
            label={t('CO₂ Saved', 'ချွေတာသော CO₂')}
            color="#2196F3"
          />
          <StatCard
            icon="🌳"
            value={(ecoData?.treesEquivalent || 0).toFixed(2)}
            label={t('Trees Equivalent', 'သစ်ပင်ညီမျှ')}
            color="#FF9800"
          />
          <StatCard
            icon="💧"
            value={`${((ecoData?.totalWaterDrank || 0) / 1000).toFixed(1)}L`}
            label={t('Total Water', 'စုစုပေါင်းရေ')}
            color="#00BCD4"
          />
        </View>

        {/* Impact Visualization */}
        <View style={[styles.impactCard, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('Your Impact Visualized', 'သင့်အကျိုးသက်ရောက်မှုပုံဖော်ခြင်း')}
          </Text>
          <View style={styles.bottleRow}>
            {Array.from({ length: Math.min(ecoData?.plasticBottlesSaved || 0, 20) }).map((_, i) => (
              <Text key={i} style={styles.bottleEmoji}>🍶</Text>
            ))}
            {(ecoData?.plasticBottlesSaved || 0) > 20 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                +{(ecoData?.plasticBottlesSaved || 0) - 20} {t('more', 'ပိုများ')}
              </Text>
            )}
          </View>
        </View>

        {/* Eco Facts */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          💡 {t('Did You Know?', 'သင်သိပါသလား?')}
        </Text>
        {facts.map((fact, index) => (
          <View key={index} style={[styles.factCard, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
            <Text style={styles.factIcon}>{fact.icon}</Text>
            <Text style={[styles.factText, { color: colors.text }]}>{fact.fact}</Text>
          </View>
        ))}

        {/* Call to Action */}
        <View style={[styles.ctaCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Text style={styles.ctaEmoji}>🎯</Text>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>
            {t('Keep Going!', 'ဆက်လက်ကြိုးစားပါ!')}
          </Text>
          <Text style={[styles.ctaText, { color: colors.textSecondary }]}>
            {t(
              'Every glass of water from your reusable bottle helps protect our planet.',
              'သင့်ပြန်သုံးပုလင်းမှ ရေတစ်ခွက်တိုင်းသည် ကျွန်ုပ်တို့ဂြိုဟ်ကို ကာကွယ်ရန် အထောက်အကူပြုသည်။'
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 100 },
  heroCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', padding: 16, borderRadius: 16, alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  impactCard: { borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  bottleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bottleEmoji: { fontSize: 20 },
  moreText: { fontSize: 14, alignSelf: 'center', marginLeft: 8 },
  sectionHeader: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  factCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, gap: 12 },
  factIcon: { fontSize: 24 },
  factText: { flex: 1, fontSize: 14, lineHeight: 20 },
  ctaCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 10 },
  ctaEmoji: { fontSize: 32, marginBottom: 8 },
  ctaTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  ctaText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
