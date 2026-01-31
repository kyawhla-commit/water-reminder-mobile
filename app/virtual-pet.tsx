import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWaterTracker } from '@/hooks/useWaterTracker';
import {
    createPet,
    decayPetStats,
    feedPet,
    getNextStageProgress,
    getPetConfig,
    getPetEmoji,
    getPetMessage,
    getPetMood,
    getPetMoodEmoji,
    loadPet,
    PET_CONFIGS,
    PetType,
    VirtualPet,
} from '@/services/virtualPet';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function VirtualPetScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { dailyIntake } = useWaterTracker();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [pet, setPet] = useState<VirtualPet | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<PetType>('plant');
  const [petName, setPetName] = useState('');
  const [bounceAnim] = useState(new Animated.Value(1));
  const [lastFedAmount, setLastFedAmount] = useState(0);

  useEffect(() => {
    loadPetData();
  }, []);

  useEffect(() => {
    if (pet && dailyIntake > lastFedAmount) {
      const newWater = dailyIntake - lastFedAmount;
      if (newWater > 0) {
        handleFeedPet(newWater);
        setLastFedAmount(dailyIntake);
      }
    }
  }, [dailyIntake]);

  useEffect(() => {
    // Bounce animation
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  const loadPetData = async () => {
    const loadedPet = await loadPet();
    if (loadedPet) {
      const decayedPet = await decayPetStats();
      setPet(decayedPet);
      setLastFedAmount(dailyIntake);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleCreatePet = async () => {
    if (!petName.trim()) return;
    const newPet = await createPet(selectedType, petName.trim());
    setPet(newPet);
    setShowCreateModal(false);
    setPetName('');
  };

  const handleFeedPet = async (amount: number) => {
    const updatedPet = await feedPet(amount);
    setPet(updatedPet);
  };

  if (!pet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBurmese ? 'သင့်အိမ်မွေးတိရစ္ဆာန်ဖန်တီးပါ' : 'Create Your Pet'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {isBurmese ? 'ရေသောက်လေ သင့်အိမ်မွေးကြီးထွားလေ!' : 'The more you drink, the more it grows!'}
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>
                {isBurmese ? 'အမျိုးအစားရွေးပါ' : 'Choose Type'}
              </Text>
              <View style={styles.typeSelector}>
                {PET_CONFIGS.map((config) => (
                  <TouchableOpacity
                    key={config.type}
                    style={[
                      styles.typeOption,
                      { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' },
                      selectedType === config.type && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedType(config.type)}
                  >
                    <Text style={styles.typeEmoji}>{config.emoji}</Text>
                    <Text style={[styles.typeName, { color: colors.text }]}>
                      {isBurmese ? config.nameMy : config.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>
                {isBurmese ? 'နာမည်ပေးပါ' : 'Give it a name'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                value={petName}
                onChangeText={setPetName}
                placeholder={isBurmese ? 'နာမည်ရိုက်ပါ...' : 'Enter name...'}
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreatePet}
              >
                <Text style={styles.createButtonText}>
                  {isBurmese ? 'ဖန်တီးမည်' : 'Create Pet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const config = getPetConfig(pet.type);
  const mood = getPetMood(pet);
  const progress = getNextStageProgress(pet);
  const message = getPetMessage(pet, isBurmese);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isBurmese ? '🐾 အိမ်မွေးတိရစ္ဆာန်' : '🐾 Virtual Pet'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Pet Display */}
        <View style={[styles.petCard, { backgroundColor: colors.card }]}>
          <View style={[styles.petBackground, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
            <Animated.Text style={[styles.petEmoji, { transform: [{ scale: bounceAnim }] }]}>
              {getPetEmoji(pet)}
            </Animated.Text>
            <Text style={styles.moodEmoji}>{getPetMoodEmoji(pet)}</Text>
          </View>

          <Text style={[styles.petName, { color: colors.text }]}>{pet.name}</Text>
          <Text style={[styles.petStage, { color: colors.primary }]}>
            {isBurmese ? `အဆင့်: ${pet.stage}` : `Stage: ${pet.stage.charAt(0).toUpperCase() + pet.stage.slice(1)}`}
          </Text>

          {/* Message Bubble */}
          <View style={[styles.messageBubble, { backgroundColor: isDark ? '#2D4A6F' : '#F0F7FF' }]}>
            <Text style={[styles.messageText, { color: colors.text }]}>{message}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '📊 အခြေအနေ' : '📊 Stats'}
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ကျန်းမာရေး' : 'Health'}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pet.health}%`, backgroundColor: '#4CAF50' },
                  ]}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(pet.health)}%</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပျော်ရွှင်မှု' : 'Happiness'}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pet.happiness}%`, backgroundColor: '#FFD93D' },
                  ]}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(pet.happiness)}%</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'နောက်အဆင့်သို့' : 'Next Stage'}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress.progress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {(progress.current / 1000).toFixed(1)}L / {(progress.next / 1000).toFixed(0)}L
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={[styles.achievementsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🏆 မှတ်တမ်း' : '🏆 Records'}
          </Text>

          <View style={styles.achievementRow}>
            <View style={[styles.achievementItem, { backgroundColor: isDark ? '#1E3A5F' : '#E8F5E9' }]}>
              <Text style={styles.achievementEmoji}>💧</Text>
              <Text style={[styles.achievementValue, { color: colors.text }]}>
                {(pet.totalWaterDrunk / 1000).toFixed(1)}L
              </Text>
              <Text style={[styles.achievementLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'စုစုပေါင်း' : 'Total Water'}
              </Text>
            </View>

            <View style={[styles.achievementItem, { backgroundColor: isDark ? '#1E3A5F' : '#FFF3E0' }]}>
              <Text style={styles.achievementEmoji}>🔥</Text>
              <Text style={[styles.achievementValue, { color: colors.text }]}>
                {pet.hydrationStreak}
              </Text>
              <Text style={[styles.achievementLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ဆက်တိုက်ရက်' : 'Day Streak'}
              </Text>
            </View>

            <View style={[styles.achievementItem, { backgroundColor: isDark ? '#1E3A5F' : '#F3E5F5' }]}>
              <Text style={styles.achievementEmoji}>📅</Text>
              <Text style={[styles.achievementValue, { color: colors.text }]}>
                {Math.floor((Date.now() - new Date(pet.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </Text>
              <Text style={[styles.achievementLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'အတူနေရက်' : 'Days Together'}
              </Text>
            </View>
          </View>
        </View>

        {/* Evolution Guide */}
        <View style={[styles.evolutionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🌟 ဆင့်ကဲပြောင်းလဲမှု' : '🌟 Evolution Guide'}
          </Text>

          <View style={styles.evolutionRow}>
            {(['baby', 'child', 'teen', 'adult', 'master'] as const).map((stage, index) => (
              <View key={stage} style={styles.evolutionItem}>
                <Text
                  style={[
                    styles.evolutionEmoji,
                    pet.stage === stage && styles.currentStage,
                  ]}
                >
                  {config.stages[stage]}
                </Text>
                <Text style={[styles.evolutionLabel, { color: colors.textSecondary }]}>
                  {index === 0 ? '0L' : index === 1 ? '5L' : index === 2 ? '20L' : index === 3 ? '50L' : '100L'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 ရေသောက်တိုင်း သင့်အိမ်မွေးပျော်ရွှင်ပြီး ကြီးထွားပါမည်!'
              : '💡 Every time you drink water, your pet gets happier and grows!'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  petCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  petBackground: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  petEmoji: { fontSize: 80 },
  moodEmoji: { fontSize: 30, position: 'absolute', bottom: 10, right: 10 },
  petName: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  petStage: { fontSize: 14, fontWeight: '600', marginBottom: 16 },
  messageBubble: { padding: 16, borderRadius: 16, maxWidth: '90%' },
  messageText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  statsCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  statRow: { marginBottom: 16 },
  statItem: { flex: 1 },
  statLabel: { fontSize: 13, marginBottom: 8 },
  progressBar: { height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  statValue: { fontSize: 12, marginTop: 4, textAlign: 'right' },
  achievementsCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  achievementRow: { flexDirection: 'row', gap: 12 },
  achievementItem: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  achievementEmoji: { fontSize: 28, marginBottom: 8 },
  achievementValue: { fontSize: 20, fontWeight: '700' },
  achievementLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  evolutionCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  evolutionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  evolutionItem: { alignItems: 'center' },
  evolutionEmoji: { fontSize: 32, opacity: 0.5 },
  currentStage: { opacity: 1, transform: [{ scale: 1.2 }] },
  evolutionLabel: { fontSize: 10, marginTop: 4 },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center' },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeOption: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  typeEmoji: { fontSize: 40, marginBottom: 8 },
  typeName: { fontSize: 12, fontWeight: '600' },
  input: { padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 24 },
  createButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
