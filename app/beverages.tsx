import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    BEVERAGE_CATEGORIES,
    BeverageLogEntry,
    BeverageType,
    DailyBeverageSummary,
    deleteBeverageEntry,
    getAllBeverages,
    getBeverageLog,
    getDailySummary,
    getFavoriteBeverages,
    getHydrationColor,
    getHydrationLabel,
    logBeverage,
    toggleFavorite,
} from '@/services/beverages';
import { useUserProfileStore } from '@/store/userProfile';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function BeveragesScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';
  const { profile } = useUserProfileStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [beverages, setBeverages] = useState<BeverageType[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [todayLog, setTodayLog] = useState<BeverageLogEntry[]>([]);
  const [summary, setSummary] = useState<DailyBeverageSummary | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Add beverage modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBeverage, setSelectedBeverage] = useState<BeverageType | null>(null);
  const [amount, setAmount] = useState(250);
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allBeverages, favs, log, dailySummary] = await Promise.all([
        getAllBeverages(),
        getFavoriteBeverages(),
        getBeverageLog(new Date().toISOString().split('T')[0]),
        getDailySummary(),
      ]);

      setBeverages(allBeverages);
      setFavorites(favs);
      setTodayLog(log);
      setSummary(dailySummary);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSelectBeverage = (beverage: BeverageType) => {
    setSelectedBeverage(beverage);
    setAmount(beverage.defaultAmount);
    setShowAddModal(true);
  };

  const handleAddBeverage = async () => {
    if (!selectedBeverage) return;

    setAdding(true);
    try {
      await logBeverage(selectedBeverage.id, amount);
      setShowAddModal(false);
      setSelectedBeverage(null);
      loadData();
    } catch (error) {
      console.error('Error adding beverage:', error);
      Alert.alert(
        isBurmese ? 'အမှား' : 'Error',
        isBurmese ? 'အချိုရည်ထည့်၍မရပါ' : 'Failed to add beverage'
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEntry = (entry: BeverageLogEntry) => {
    Alert.alert(
      isBurmese ? 'ဖျက်မည်' : 'Delete',
      isBurmese 
        ? `${entry.beverageName} ${entry.amount}ml ကို ဖျက်မည်လား?`
        : `Delete ${entry.amount}ml of ${entry.beverageName}?`,
      [
        { text: isBurmese ? 'မလုပ်တော့ပါ' : 'Cancel', style: 'cancel' },
        {
          text: isBurmese ? 'ဖျက်မည်' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBeverageEntry(entry.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (beverageId: string) => {
    await toggleFavorite(beverageId);
    const newFavorites = await getFavoriteBeverages();
    setFavorites(newFavorites);
  };

  const filteredBeverages = activeCategory === 'all'
    ? beverages
    : beverages.filter(b => b.category === activeCategory);

  const favoriteBeverages = beverages.filter(b => favorites.includes(b.id));

  const effectiveHydration = summary?.effectiveHydration || 0;
  const progress = Math.min(100, (effectiveHydration / profile.dailyWaterGoal) * 100);


  const renderSummaryCard = () => (
    <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>
          {isBurmese ? '💧 ယနေ့ ရေဓာတ်' : '💧 Today\'s Hydration'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/beverage-stats')}>
          <Ionicons name="stats-chart" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>
            {Math.round(effectiveHydration / 10) * 10}ml
          </Text>
          <Text style={styles.summaryStatLabel}>
            {isBurmese ? 'ထိရောက်သော' : 'Effective'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>
            {summary?.totalConsumed || 0}ml
          </Text>
          <Text style={styles.summaryStatLabel}>
            {isBurmese ? 'စုစုပေါင်း' : 'Total'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={styles.summaryStatValue}>
            {summary?.hydrationEfficiency || 100}%
          </Text>
          <Text style={styles.summaryStatLabel}>
            {isBurmese ? 'ထိရောက်မှု' : 'Efficiency'}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress)}% {isBurmese ? 'ပန်းတိုင်' : 'of goal'}
        </Text>
      </View>
    </View>
  );

  const renderFavorites = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {isBurmese ? '⭐ အကြိုက်ဆုံးများ' : '⭐ Favorites'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.favoritesRow}>
          {favoriteBeverages.map(beverage => (
            <TouchableOpacity
              key={beverage.id}
              style={[styles.favoriteCard, { backgroundColor: colors.card }]}
              onPress={() => handleSelectBeverage(beverage)}
            >
              <Text style={styles.favoriteIcon}>{beverage.icon}</Text>
              <Text style={[styles.favoriteName, { color: colors.text }]} numberOfLines={1}>
                {isBurmese ? beverage.nameMy : beverage.name}
              </Text>
              <Text style={[styles.favoriteAmount, { color: colors.textSecondary }]}>
                {beverage.defaultAmount}ml
              </Text>
              <View style={[styles.coefficientBadge, { backgroundColor: getHydrationColor(beverage.hydrationCoefficient) + '20' }]}>
                <Text style={[styles.coefficientText, { color: getHydrationColor(beverage.hydrationCoefficient) }]}>
                  {beverage.hydrationCoefficient >= 0 ? '+' : ''}{Math.round(beverage.hydrationCoefficient * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderCategories = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { backgroundColor: activeCategory === 'all' ? colors.primary : colors.surfaceVariant },
        ]}
        onPress={() => setActiveCategory('all')}
      >
        <Text style={[styles.categoryChipText, { color: activeCategory === 'all' ? '#fff' : colors.text }]}>
          {isBurmese ? 'အားလုံး' : 'All'}
        </Text>
      </TouchableOpacity>
      {BEVERAGE_CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryChip,
            { backgroundColor: activeCategory === cat.id ? colors.primary : colors.surfaceVariant },
          ]}
          onPress={() => setActiveCategory(cat.id)}
        >
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
          <Text style={[styles.categoryChipText, { color: activeCategory === cat.id ? '#fff' : colors.text }]}>
            {isBurmese ? cat.nameMy : cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderBeverageItem = (beverage: BeverageType) => {
    const isFavorite = favorites.includes(beverage.id);
    const hydrationColor = getHydrationColor(beverage.hydrationCoefficient);

    return (
      <TouchableOpacity
        key={beverage.id}
        style={[styles.beverageItem, { backgroundColor: colors.card }]}
        onPress={() => handleSelectBeverage(beverage)}
      >
        <View style={[styles.beverageIconContainer, { backgroundColor: beverage.color + '20' }]}>
          <Text style={styles.beverageIcon}>{beverage.icon}</Text>
        </View>
        <View style={styles.beverageInfo}>
          <Text style={[styles.beverageName, { color: colors.text }]}>
            {isBurmese ? beverage.nameMy : beverage.name}
          </Text>
          <Text style={[styles.beverageDesc, { color: colors.textSecondary }]} numberOfLines={1}>
            {isBurmese ? beverage.descriptionMy : beverage.description}
          </Text>
          <View style={styles.beverageMeta}>
            <View style={[styles.hydrationBadge, { backgroundColor: hydrationColor + '20' }]}>
              <Text style={[styles.hydrationBadgeText, { color: hydrationColor }]}>
                {getHydrationLabel(beverage.hydrationCoefficient, isBurmese ? 'my' : 'en')}
              </Text>
            </View>
            {beverage.caffeineContent !== 'none' && (
              <Text style={[styles.caffeineBadge, { color: colors.textSecondary }]}>
                ☕ {beverage.caffeineContent}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.beverageActions}>
          <TouchableOpacity onPress={() => handleToggleFavorite(beverage.id)}>
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={isFavorite ? '#FFC107' : colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.coefficientLarge, { color: hydrationColor }]}>
            {beverage.hydrationCoefficient >= 0 ? '+' : ''}{Math.round(beverage.hydrationCoefficient * 100)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTodayLog = () => {
    if (todayLog.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '📝 ယနေ့မှတ်တမ်း' : '📝 Today\'s Log'}
        </Text>
        {todayLog.slice().reverse().slice(0, 5).map(entry => (
          <View key={entry.id} style={[styles.logItem, { backgroundColor: colors.card }]}>
            <Text style={styles.logIcon}>{entry.icon}</Text>
            <View style={styles.logInfo}>
              <Text style={[styles.logName, { color: colors.text }]}>{entry.beverageName}</Text>
              <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.logAmounts}>
              <Text style={[styles.logAmount, { color: colors.text }]}>{entry.amount}ml</Text>
              <Text style={[styles.logEffective, { color: getHydrationColor(entry.hydrationCoefficient) }]}>
                → {entry.effectiveHydration}ml
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteEntry(entry)}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };


  const renderAddModal = () => {
    if (!selectedBeverage) return null;

    const effectiveAmount = Math.round(amount * selectedBeverage.hydrationCoefficient);
    const hydrationColor = getHydrationColor(selectedBeverage.hydrationCoefficient);

    return (
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isBurmese ? 'အချိုရည်ထည့်ရန်' : 'Add Beverage'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Selected Beverage */}
            <View style={[styles.selectedBeverage, { backgroundColor: selectedBeverage.color + '15' }]}>
              <Text style={styles.selectedIcon}>{selectedBeverage.icon}</Text>
              <View style={styles.selectedInfo}>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {isBurmese ? selectedBeverage.nameMy : selectedBeverage.name}
                </Text>
                <View style={[styles.hydrationBadge, { backgroundColor: hydrationColor + '20' }]}>
                  <Text style={[styles.hydrationBadgeText, { color: hydrationColor }]}>
                    {getHydrationLabel(selectedBeverage.hydrationCoefficient, isBurmese ? 'my' : 'en')} ({Math.round(selectedBeverage.hydrationCoefficient * 100)}%)
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount Slider */}
            <View style={styles.amountSection}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                {isBurmese ? 'ပမာဏ' : 'Amount'}
              </Text>
              <Text style={[styles.amountValue, { color: colors.primary }]}>{amount}ml</Text>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={1000}
                step={25}
                value={amount}
                onValueChange={setAmount}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surfaceVariant}
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>50ml</Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>500ml</Text>
                <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>1L</Text>
              </View>

              {/* Quick amounts */}
              <View style={styles.quickAmounts}>
                {[150, 200, 250, 330, 500].map(amt => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.quickAmountButton,
                      { backgroundColor: amount === amt ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={() => setAmount(amt)}
                  >
                    <Text style={[styles.quickAmountText, { color: amount === amt ? '#fff' : colors.text }]}>
                      {amt}ml
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Effective Hydration Preview */}
            <View style={[styles.effectivePreview, { backgroundColor: hydrationColor + '15' }]}>
              <View style={styles.effectiveRow}>
                <Text style={[styles.effectiveLabel, { color: colors.textSecondary }]}>
                  {isBurmese ? 'သောက်သုံးမှု' : 'Consumed'}
                </Text>
                <Text style={[styles.effectiveValue, { color: colors.text }]}>{amount}ml</Text>
              </View>
              <View style={styles.effectiveRow}>
                <Text style={[styles.effectiveLabel, { color: colors.textSecondary }]}>
                  {isBurmese ? 'ရေဓာတ်ကိန်းဂဏန်း' : 'Hydration Factor'}
                </Text>
                <Text style={[styles.effectiveValue, { color: hydrationColor }]}>
                  ×{selectedBeverage.hydrationCoefficient.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.effectiveDivider, { backgroundColor: colors.surfaceVariant }]} />
              <View style={styles.effectiveRow}>
                <Text style={[styles.effectiveLabelBold, { color: colors.text }]}>
                  {isBurmese ? 'ထိရောက်သော ရေဓာတ်' : 'Effective Hydration'}
                </Text>
                <Text style={[styles.effectiveValueBold, { color: hydrationColor }]}>
                  {effectiveAmount >= 0 ? '+' : ''}{effectiveAmount}ml
                </Text>
              </View>
            </View>

            {/* Warning for alcohol */}
            {selectedBeverage.hydrationCoefficient < 0 && (
              <View style={[styles.warningBox, { backgroundColor: '#FF572220' }]}>
                <Ionicons name="warning" size={20} color="#FF5722" />
                <Text style={[styles.warningText, { color: '#FF5722' }]}>
                  {isBurmese 
                    ? 'ဤအချိုရည်သည် ရေဓာတ်ခန်းခြောက်စေသည်။ ရေနှင့်တွဲသောက်ပါ။'
                    : 'This beverage causes dehydration. Drink water alongside.'}
                </Text>
              </View>
            )}

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddBeverage}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.addButtonText}>
                    {isBurmese ? 'ထည့်မည်' : 'Add to Log'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isBurmese ? '🥤 အချိုရည်များ' : '🥤 Beverages'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {renderSummaryCard()}
        {renderFavorites()}
        {renderTodayLog()}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBurmese ? '🥤 အချိုရည်အားလုံး' : '🥤 All Beverages'}
          </Text>
          {renderCategories()}
          <View style={styles.beveragesList}>
            {filteredBeverages.map(renderBeverageItem)}
          </View>
        </View>
      </ScrollView>

      {renderAddModal()}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Summary Card
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { color: '#fff', fontSize: 24, fontWeight: '700' },
  summaryStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressContainer: { marginTop: 8 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, textAlign: 'center', marginTop: 8 },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },

  // Favorites
  favoritesRow: { flexDirection: 'row', gap: 12, paddingRight: 16 },
  favoriteCard: { width: 100, padding: 12, borderRadius: 16, alignItems: 'center' },
  favoriteIcon: { fontSize: 32, marginBottom: 8 },
  favoriteName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  favoriteAmount: { fontSize: 11, marginTop: 2 },
  coefficientBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  coefficientText: { fontSize: 10, fontWeight: '700' },

  // Categories
  categoriesScroll: { marginBottom: 12 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6 },
  categoryIcon: { fontSize: 14 },
  categoryChipText: { fontSize: 13, fontWeight: '500' },

  // Beverage Item
  beveragesList: { gap: 10 },
  beverageItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
  beverageIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  beverageIcon: { fontSize: 24 },
  beverageInfo: { flex: 1 },
  beverageName: { fontSize: 15, fontWeight: '600' },
  beverageDesc: { fontSize: 12, marginTop: 2 },
  beverageMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  hydrationBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  hydrationBadgeText: { fontSize: 10, fontWeight: '600' },
  caffeineBadge: { fontSize: 10 },
  beverageActions: { alignItems: 'flex-end', gap: 4 },
  coefficientLarge: { fontSize: 14, fontWeight: '700' },

  // Today's Log
  logItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 },
  logIcon: { fontSize: 24 },
  logInfo: { flex: 1 },
  logName: { fontSize: 14, fontWeight: '500' },
  logTime: { fontSize: 11 },
  logAmounts: { alignItems: 'flex-end' },
  logAmount: { fontSize: 14, fontWeight: '600' },
  logEffective: { fontSize: 12, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  // Selected Beverage
  selectedBeverage: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 20, gap: 12 },
  selectedIcon: { fontSize: 40 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },

  // Amount Section
  amountSection: { marginBottom: 20 },
  amountLabel: { fontSize: 14, marginBottom: 4 },
  amountValue: { fontSize: 36, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 11 },
  quickAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  quickAmountButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  quickAmountText: { fontSize: 13, fontWeight: '500' },

  // Effective Preview
  effectivePreview: { borderRadius: 16, padding: 16, marginBottom: 16 },
  effectiveRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  effectiveLabel: { fontSize: 14 },
  effectiveValue: { fontSize: 14, fontWeight: '600' },
  effectiveDivider: { height: 1, marginVertical: 8 },
  effectiveLabelBold: { fontSize: 15, fontWeight: '600' },
  effectiveValueBold: { fontSize: 18, fontWeight: '700' },

  // Warning
  warningBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16, gap: 10 },
  warningText: { flex: 1, fontSize: 13 },

  // Add Button
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
