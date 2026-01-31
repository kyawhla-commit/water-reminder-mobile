import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    DailyTip,
    formatTipForDisplay,
    getAllTips,
    getCategoryDisplayName,
    getFavoriteTips,
    getTipCategories,
    getTipsByCategory,
    getTipStatistics,
    TipCategory,
    toggleFavoriteTip,
} from '../services/dailyTips';

type TabType = 'all' | 'favorites' | 'categories';

const CATEGORY_COLORS: Record<TipCategory, string> = {
  hydration: '#E3F2FD',
  health: '#FCE4EC',
  science: '#E8EAF6',
  lifestyle: '#FFF3E0',
  exercise: '#E8F5E9',
  nutrition: '#F1F8E9',
  sleep: '#EDE7F6',
  productivity: '#FFF8E1',
};

export default function TipsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | null>(null);
  const [tips, setTips] = useState<DailyTip[]>([]);
  const [favoriteTipIds, setFavoriteTipIds] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    totalTips: number;
    tipsViewed: number;
    favoritesCount: number;
  } | null>(null);
  const language = 'en';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTips();
  }, [activeTab, selectedCategory]);

  const loadData = async () => {
    const [favorites, statistics] = await Promise.all([
      getFavoriteTips(),
      getTipStatistics(),
    ]);
    setFavoriteTipIds(favorites);
    setStats(statistics);
  };

  const loadTips = async () => {
    if (activeTab === 'all') {
      setTips(getAllTips());
    } else if (activeTab === 'favorites') {
      const favorites = await getFavoriteTips();
      const allTips = getAllTips();
      setTips(allTips.filter(t => favorites.includes(t.id)));
    } else if (selectedCategory) {
      setTips(getTipsByCategory(selectedCategory));
    }
  };

  const handleToggleFavorite = async (tipId: string) => {
    await toggleFavoriteTip(tipId);
    const favorites = await getFavoriteTips();
    setFavoriteTipIds(favorites);
    if (activeTab === 'favorites') {
      loadTips();
    }
  };

  const handleShare = async (tip: DailyTip) => {
    const formatted = formatTipForDisplay(tip, language);
    try {
      await Share.share({
        message: `${formatted.icon} ${formatted.title}\n\n${formatted.content}\n\n- HydroMate Daily Tip`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const categories = getTipCategories();

  const renderTipCard = ({ item }: { item: DailyTip }) => {
    const formatted = formatTipForDisplay(item, language);
    const isFavorite = favoriteTipIds.includes(item.id);

    return (
      <View style={[styles.tipCard, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
        <View style={styles.tipHeader}>
          <View style={styles.tipCategory}>
            <Text style={styles.tipIcon}>{formatted.icon}</Text>
            <Text style={styles.tipCategoryText}>
              {getCategoryDisplayName(item.category, language)}
            </Text>
          </View>
          <View style={styles.tipActions}>
            <TouchableOpacity
              style={styles.tipActionBtn}
              onPress={() => handleToggleFavorite(item.id)}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#E91E63' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tipActionBtn}
              onPress={() => handleShare(item)}
            >
              <Ionicons name="share-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.tipTitle}>{formatted.title}</Text>
        <Text style={styles.tipContent}>{formatted.content}</Text>
        {formatted.source && (
          <Text style={styles.tipSource}>📚 {formatted.source}</Text>
        )}
      </View>
    );
  };

  const renderCategoryCard = ({ item }: { item: { category: TipCategory; count: number; icon: string } }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { backgroundColor: CATEGORY_COLORS[item.category] },
        selectedCategory === item.category && styles.categoryCardSelected,
      ]}
      onPress={() => {
        setSelectedCategory(item.category);
        setActiveTab('categories');
      }}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>
        {getCategoryDisplayName(item.category, language)}
      </Text>
      <Text style={styles.categoryCount}>{item.count} tips</Text>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Tips</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalTips}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.tipsViewed}</Text>
            <Text style={styles.statLabel}>Viewed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favoritesCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => {
            setActiveTab('all');
            setSelectedCategory(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Tips
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => {
            setActiveTab('favorites');
            setSelectedCategory(null);
          }}
        >
          <Ionicons
            name="heart"
            size={16}
            color={activeTab === 'favorites' ? '#2196F3' : '#666'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.tabActive]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
            Categories
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'categories' && !selectedCategory ? (
        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.category}
          numColumns={2}
          contentContainerStyle={styles.categoriesGrid}
          columnWrapperStyle={styles.categoryRow}
        />
      ) : (
        <>
          {selectedCategory && (
            <TouchableOpacity
              style={styles.backToCategories}
              onPress={() => setSelectedCategory(null)}
            >
              <Ionicons name="arrow-back" size={18} color="#2196F3" />
              <Text style={styles.backToCategoriesText}>All Categories</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={tips}
            renderItem={renderTipCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tipsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bulb-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>
                  {activeTab === 'favorites'
                    ? 'No favorite tips yet.\nTap the heart icon to save tips!'
                    : 'No tips available'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  tipsList: {
    padding: 16,
  },
  tipCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  tipCategoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tipActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tipActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tipSource: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  categoriesGrid: {
    padding: 16,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryCardSelected: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  backToCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  backToCategoriesText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
