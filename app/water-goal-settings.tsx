import { useToast } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    calculateWaterGoal,
    ClimateType,
    HealthCondition,
    HYDRATION_FACTS,
    PRESET_GOALS,
    WaterGoalFactors,
    WaterGoalResult,
} from '@/services/waterGoalCalculator';
import { useUserProfileStore } from '@/store/userProfile';
import { formatWaterAmount } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function WaterGoalSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const { profile, setProfile } = useUserProfileStore();

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [showFactsModal, setShowFactsModal] = useState(false);
  const [calculatorFactors, setCalculatorFactors] = useState<WaterGoalFactors>({
    weight: profile.weight,
    weightUnit: profile.weightUnit,
    gender: profile.gender,
    age: 30,
    activityLevel: profile.activityLevel,
    climate: 'temperate',
    healthCondition: 'none',
    caffeineIntake: 'none',
    alcoholIntake: 'none',
  });
  const [calculatedResult, setCalculatedResult] = useState<WaterGoalResult | null>(null);

  // Manual adjustment
  const [manualGoal, setManualGoal] = useState(profile.dailyWaterGoal);

  useEffect(() => {
    // Calculate initial result
    const result = calculateWaterGoal(calculatorFactors);
    setCalculatedResult(result);
  }, [calculatorFactors]);

  const handleSaveGoal = (goal: number) => {
    setProfile({ dailyWaterGoal: goal });
    setManualGoal(goal);
    showToast({
      message: isBurmese
        ? `✅ ရေပန်းတိုင်ကို ${formatWaterAmount(goal)} သို့ သတ်မှတ်လိုက်ပါပြီ`
        : `✅ Daily goal set to ${formatWaterAmount(goal)}`,
      type: 'success',
      duration: 3000,
    });
  };

  const handleApplyCalculated = () => {
    if (calculatedResult) {
      handleSaveGoal(calculatedResult.recommendedGoal);
      setShowCalculator(false);
    }
  };

  const renderPresetCard = (preset: (typeof PRESET_GOALS)[0]) => {
    const isSelected = manualGoal === preset.amount;
    return (
      <TouchableOpacity
        key={preset.id}
        style={[
          styles.presetCard,
          { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : 'transparent' },
          isSelected && styles.presetCardSelected,
        ]}
        onPress={() => handleSaveGoal(preset.amount)}
      >
        <Text style={styles.presetIcon}>{preset.icon}</Text>
        <View style={styles.presetInfo}>
          <Text style={[styles.presetName, { color: colors.text }]}>
            {isBurmese ? preset.nameMy : preset.name}
          </Text>
          <Text style={[styles.presetAmount, { color: colors.primary }]}>
            {formatWaterAmount(preset.amount)}
          </Text>
          <Text style={[styles.presetDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {isBurmese ? preset.suitableForMy : preset.suitableFor}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? '💧 ရေပန်းတိုင်သတ်မှတ်ခြင်း' : '💧 Water Goal Settings'}
        </Text>
        <TouchableOpacity onPress={() => setShowFactsModal(true)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Goal Display */}
        <View style={[styles.currentGoalCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.currentGoalLabel}>
            {isBurmese ? 'လက်ရှိနေ့စဉ်ပန်းတိုင်' : 'Current Daily Goal'}
          </Text>
          <Text style={styles.currentGoalValue}>{formatWaterAmount(profile.dailyWaterGoal)}</Text>
          <Text style={styles.currentGoalHint}>
            {isBurmese
              ? `≈ ${Math.ceil(profile.dailyWaterGoal / 250)} ဖန်ခွက် (၂၅၀ml စီ)`
              : `≈ ${Math.ceil(profile.dailyWaterGoal / 250)} glasses (250ml each)`}
          </Text>
        </View>

        {/* Manual Adjustment */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '🎚️ ကိုယ်တိုင်ချိန်ညှိပါ' : '🎚️ Adjust Manually'}
        </Text>
        <View style={[styles.sliderCard, { backgroundColor: colors.card }]}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderValue, { color: colors.primary }]}>
              {formatWaterAmount(manualGoal)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1000}
            maximumValue={5000}
            step={100}
            value={manualGoal}
            onValueChange={setManualGoal}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.surfaceVariant}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>1L</Text>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>3L</Text>
            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>5L</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={() => handleSaveGoal(manualGoal)}
          >
            <Text style={styles.saveButtonText}>
              {isBurmese ? 'ဤပမာဏကို သိမ်းဆည်းပါ' : 'Save This Amount'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Smart Calculator */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '🧮 စမတ်တွက်ချက်စက်' : '🧮 Smart Calculator'}
        </Text>
        <TouchableOpacity
          style={[styles.calculatorButton, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}
          onPress={() => setShowCalculator(true)}
        >
          <View style={styles.calculatorButtonContent}>
            <Ionicons name="calculator" size={32} color={colors.primary} />
            <View style={styles.calculatorButtonText}>
              <Text style={[styles.calculatorButtonTitle, { color: colors.text }]}>
                {isBurmese ? 'သင့်အတွက် တွက်ချက်ပါ' : 'Calculate Your Ideal Goal'}
              </Text>
              <Text style={[styles.calculatorButtonDesc, { color: colors.textSecondary }]}>
                {isBurmese
                  ? 'ကိုယ်အလေးချိန်၊ လှုပ်ရှားမှု၊ ရာသီဥတု အခြေခံ'
                  : 'Based on weight, activity, climate & more'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Preset Goals */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '⚡ အမြန်ရွေးချယ်မှုများ' : '⚡ Quick Presets'}
        </Text>
        <View style={styles.presetsGrid}>
          {PRESET_GOALS.map(renderPresetCard)}
        </View>

        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: isDark ? '#1E3A5F' : '#FFF8E1' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              {isBurmese ? '💡 သိကောင်းစရာ' : '💡 Did You Know?'}
            </Text>
            <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
              {isBurmese
                ? 'သင့်ခန္ဓာကိုယ်၏ ၆၀% သည် ရေဖြစ်သည်။ ၁-၂% ရေဓာတ်ခန်းခြောက်ရုံဖြင့် စဉ်းစားနိုင်စွမ်းနှင့် စိတ်ခံစားချက်ကို ထိခိုက်နိုင်သည်။'
                : 'Your body is 60% water. Even 1-2% dehydration can affect cognitive function and mood.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Calculator Modal */}
      <Modal visible={showCalculator} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBurmese ? '🧮 ရေပန်းတိုင်တွက်ချက်စက်' : '🧮 Water Goal Calculator'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalculator(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Age */}
              <View style={styles.factorRow}>
                <Text style={[styles.factorLabel, { color: colors.text }]}>
                  {isBurmese ? 'အသက်' : 'Age'}
                </Text>
                <View style={styles.factorValue}>
                  <TouchableOpacity
                    style={[styles.stepButton, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => setCalculatorFactors(f => ({ ...f, age: Math.max(10, f.age - 1) }))}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.factorValueText, { color: colors.text }]}>
                    {calculatorFactors.age}
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepButton, { backgroundColor: colors.surfaceVariant }]}
                    onPress={() => setCalculatorFactors(f => ({ ...f, age: Math.min(100, f.age + 1) }))}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Climate */}
              <Text style={[styles.factorLabel, { color: colors.text, marginTop: 16 }]}>
                {isBurmese ? 'ရာသီဥတု' : 'Climate'}
              </Text>
              <View style={styles.optionsRow}>
                {(['cold', 'temperate', 'hot', 'tropical'] as ClimateType[]).map((climate) => (
                  <TouchableOpacity
                    key={climate}
                    style={[
                      styles.optionChip,
                      { backgroundColor: calculatorFactors.climate === climate ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={() => setCalculatorFactors(f => ({ ...f, climate }))}
                  >
                    <Text style={[
                      styles.optionChipText,
                      { color: calculatorFactors.climate === climate ? '#fff' : colors.text },
                    ]}>
                      {climate === 'cold' ? (isBurmese ? '❄️ အေး' : '❄️ Cold') :
                       climate === 'temperate' ? (isBurmese ? '🌤️ သမ' : '🌤️ Mild') :
                       climate === 'hot' ? (isBurmese ? '☀️ ပူ' : '☀️ Hot') :
                       (isBurmese ? '🌴 အပူပိုင်း' : '🌴 Tropical')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Health Condition */}
              <Text style={[styles.factorLabel, { color: colors.text, marginTop: 16 }]}>
                {isBurmese ? 'ကျန်းမာရေးအခြေအနေ' : 'Health Condition'}
              </Text>
              <View style={styles.optionsRow}>
                {(['none', 'pregnant', 'breastfeeding'] as HealthCondition[]).map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.optionChip,
                      { backgroundColor: calculatorFactors.healthCondition === condition ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={() => setCalculatorFactors(f => ({ ...f, healthCondition: condition }))}
                  >
                    <Text style={[
                      styles.optionChipText,
                      { color: calculatorFactors.healthCondition === condition ? '#fff' : colors.text },
                    ]}>
                      {condition === 'none' ? (isBurmese ? 'ပုံမှန်' : 'Normal') :
                       condition === 'pregnant' ? (isBurmese ? '🤰 ကိုယ်ဝန်' : '🤰 Pregnant') :
                       (isBurmese ? '🤱 နို့တိုက်' : '🤱 Nursing')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Caffeine */}
              <Text style={[styles.factorLabel, { color: colors.text, marginTop: 16 }]}>
                {isBurmese ? 'ကော်ဖီ/လက်ဖက်ရည်' : 'Coffee/Tea Intake'}
              </Text>
              <View style={styles.optionsRow}>
                {(['none', 'moderate', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionChip,
                      { backgroundColor: calculatorFactors.caffeineIntake === level ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={() => setCalculatorFactors(f => ({ ...f, caffeineIntake: level }))}
                  >
                    <Text style={[
                      styles.optionChipText,
                      { color: calculatorFactors.caffeineIntake === level ? '#fff' : colors.text },
                    ]}>
                      {level === 'none' ? (isBurmese ? 'မသောက်' : 'None') :
                       level === 'moderate' ? (isBurmese ? '☕ ၁-၃ ခွက်' : '☕ 1-3 cups') :
                       (isBurmese ? '☕☕ ၄+ ခွက်' : '☕☕ 4+ cups')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Result */}
              {calculatedResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                    {isBurmese ? 'အကြံပြုပမာဏ' : 'Recommended Goal'}
                  </Text>
                  <Text style={[styles.resultValue, { color: colors.primary }]}>
                    {formatWaterAmount(calculatedResult.recommendedGoal)}
                  </Text>
                  <Text style={[styles.resultRange, { color: colors.textSecondary }]}>
                    {isBurmese ? 'အကွာအဝေး' : 'Range'}: {formatWaterAmount(calculatedResult.minimumGoal)} - {formatWaterAmount(calculatedResult.maximumGoal)}
                  </Text>

                  {/* Breakdown */}
                  <View style={styles.breakdownContainer}>
                    <Text style={[styles.breakdownTitle, { color: colors.text }]}>
                      {isBurmese ? 'ခွဲခြမ်းစိတ်ဖြာချက်' : 'Breakdown'}
                    </Text>
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                        {isBurmese ? 'အခြေခံ (ကိုယ်အလေးချိန်)' : 'Base (weight)'}
                      </Text>
                      <Text style={[styles.breakdownValue, { color: colors.text }]}>
                        {formatWaterAmount(calculatedResult.breakdown.baseAmount)}
                      </Text>
                    </View>
                    {calculatedResult.breakdown.activityAdjustment !== 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                          {isBurmese ? 'လှုပ်ရှားမှု' : 'Activity'}
                        </Text>
                        <Text style={[styles.breakdownValue, { color: calculatedResult.breakdown.activityAdjustment > 0 ? '#4CAF50' : '#F44336' }]}>
                          {calculatedResult.breakdown.activityAdjustment > 0 ? '+' : ''}{formatWaterAmount(calculatedResult.breakdown.activityAdjustment)}
                        </Text>
                      </View>
                    )}
                    {calculatedResult.breakdown.climateAdjustment !== 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                          {isBurmese ? 'ရာသီဥတု' : 'Climate'}
                        </Text>
                        <Text style={[styles.breakdownValue, { color: calculatedResult.breakdown.climateAdjustment > 0 ? '#4CAF50' : '#2196F3' }]}>
                          {calculatedResult.breakdown.climateAdjustment > 0 ? '+' : ''}{formatWaterAmount(calculatedResult.breakdown.climateAdjustment)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApplyCalculated}
            >
              <Text style={styles.applyButtonText}>
                {isBurmese ? 'ဤပန်းတိုင်ကို အသုံးပြုပါ' : 'Apply This Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Facts Modal */}
      <Modal visible={showFactsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBurmese ? '📚 ရေဓာတ်အကြောင်း အချက်အလက်များ' : '📚 Hydration Facts'}
              </Text>
              <TouchableOpacity onPress={() => setShowFactsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {HYDRATION_FACTS.map((fact) => (
                <View key={fact.id} style={[styles.factCard, { backgroundColor: colors.card }]}>
                  <View style={styles.factHeader}>
                    <Text style={styles.factIcon}>{fact.icon}</Text>
                    <Text style={[styles.factTitle, { color: colors.text }]}>
                      {isBurmese ? fact.titleMy : fact.title}
                    </Text>
                  </View>
                  <Text style={[styles.factContent, { color: colors.textSecondary }]}>
                    {isBurmese ? fact.contentMy : fact.content}
                  </Text>
                  <View style={[styles.factCategory, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.factCategoryText, { color: colors.primary }]}>
                      {fact.category === 'science' ? (isBurmese ? 'သိပ္ပံ' : 'Science') :
                       fact.category === 'health' ? (isBurmese ? 'ကျန်းမာရေး' : 'Health') :
                       fact.category === 'tips' ? (isBurmese ? 'အကြံပြု' : 'Tips') :
                       (isBurmese ? 'ဒဏ္ဍာရီ' : 'Myth Buster')}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  infoButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },

  // Current Goal
  currentGoalCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  currentGoalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  currentGoalValue: { color: '#fff', fontSize: 48, fontWeight: '700' },
  currentGoalHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },

  // Slider
  sliderCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  sliderHeader: { alignItems: 'center', marginBottom: 8 },
  sliderValue: { fontSize: 32, fontWeight: '700' },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabel: { fontSize: 12 },
  saveButton: { marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Calculator Button
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  calculatorButtonContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  calculatorButtonText: { flex: 1 },
  calculatorButtonTitle: { fontSize: 16, fontWeight: '600' },
  calculatorButtonDesc: { fontSize: 13, marginTop: 2 },

  // Presets
  presetsGrid: { gap: 12 },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  presetCardSelected: { borderWidth: 2 },
  presetIcon: { fontSize: 32 },
  presetInfo: { flex: 1 },
  presetName: { fontSize: 16, fontWeight: '600' },
  presetAmount: { fontSize: 20, fontWeight: '700', marginVertical: 2 },
  presetDesc: { fontSize: 12 },

  // Tips
  tipsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 16,
  },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  tipsText: { fontSize: 13, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalScroll: { padding: 20 },

  // Calculator Factors
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorLabel: { fontSize: 16, fontWeight: '500' },
  factorValue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  factorValueText: { fontSize: 20, fontWeight: '600', minWidth: 40, textAlign: 'center' },
  stepButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  optionChipText: { fontSize: 13, fontWeight: '500' },

  // Result
  resultCard: { borderRadius: 16, padding: 20, marginTop: 24, alignItems: 'center' },
  resultLabel: { fontSize: 14, marginBottom: 4 },
  resultValue: { fontSize: 40, fontWeight: '700' },
  resultRange: { fontSize: 13, marginTop: 4 },
  breakdownContainer: { width: '100%', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  breakdownTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownLabel: { fontSize: 13 },
  breakdownValue: { fontSize: 13, fontWeight: '600' },
  applyButton: { margin: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Facts
  factCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  factHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  factIcon: { fontSize: 24 },
  factTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  factContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  factCategory: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  factCategoryText: { fontSize: 11, fontWeight: '600' },
});
