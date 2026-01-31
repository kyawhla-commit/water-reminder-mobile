import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { getArticlesByCategory, HealthArticle } from '@/services/healthArticles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HealthArticlesScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentLanguage } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<HealthArticle | null>(null);

  const articles = getArticlesByCategory(activeCategory);
  const t = (en: string, my: string) => currentLanguage === 'my' ? my : en;

  const categories = [
    { id: 'all', label: t('All', 'အားလုံး'), icon: 'grid' },
    { id: 'benefits', label: t('Benefits', 'အကျိုးကျေးဇူး'), icon: 'heart' },
    { id: 'tips', label: t('Tips', 'အကြံပြုချက်'), icon: 'bulb' },
    { id: 'science', label: t('Science', 'သိပ္ပံ'), icon: 'flask' },
    { id: 'myths', label: t('Myths', 'မှားယွင်းချက်'), icon: 'help-circle' },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      benefits: '#4CAF50',
      tips: '#FF9800',
      science: '#2196F3',
      myths: '#9C27B0',
    };
    return colors[category] || '#607D8B';
  };

  const ArticleCard = ({ article }: { article: HealthArticle }) => {
    const title = currentLanguage === 'my' ? article.titleMy : article.title;
    const summary = currentLanguage === 'my' ? article.summaryMy : article.summary;

    return (
      <TouchableOpacity
        style={[styles.articleCard, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}
        onPress={() => setSelectedArticle(article)}
      >
        <View style={[styles.articleIcon, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
          <Text style={styles.articleEmoji}>{article.icon}</Text>
        </View>
        <View style={styles.articleContent}>
          <Text style={[styles.articleTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.articleSummary, { color: colors.textSecondary }]} numberOfLines={2}>
            {summary}
          </Text>
          <View style={styles.articleMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(article.category) }]}>
                {article.category}
              </Text>
            </View>
            <Text style={[styles.readTime, { color: colors.textSecondary }]}>
              {article.readTime} {t('min read', 'မိနစ်')}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const ArticleModal = () => {
    if (!selectedArticle) return null;
    const title = currentLanguage === 'my' ? selectedArticle.titleMy : selectedArticle.title;
    const content = currentLanguage === 'my' ? selectedArticle.contentMy : selectedArticle.content;

    return (
      <Modal visible={!!selectedArticle} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={[styles.modalHero, { backgroundColor: getCategoryColor(selectedArticle.category) + '20' }]}>
              <Text style={styles.modalEmoji}>{selectedArticle.icon}</Text>
              <Text style={[styles.modalHeroTitle, { color: colors.text }]}>{title}</Text>
              <View style={styles.modalMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedArticle.category) }]}>
                  <Text style={styles.categoryTextWhite}>{selectedArticle.category}</Text>
                </View>
                <Text style={[styles.readTime, { color: colors.textSecondary }]}>
                  📖 {selectedArticle.readTime} {t('min read', 'မိနစ်')}
                </Text>
              </View>
            </View>

            {content.map((paragraph, index) => (
              <View key={index} style={styles.paragraphContainer}>
                <View style={[styles.bulletPoint, { backgroundColor: getCategoryColor(selectedArticle.category) }]} />
                <Text style={[styles.paragraph, { color: colors.text }]}>{paragraph}</Text>
              </View>
            ))}

            <View style={[styles.tipBox, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                {t(
                  'Remember: Staying hydrated is one of the simplest ways to improve your health!',
                  'မှတ်ထားပါ: ရေဓာတ်ထိန်းထားခြင်းသည် သင့်ကျန်းမာရေးတိုးတက်စေရန် အရိုးရှင်းဆုံးနည်းလမ်းတစ်ခုဖြစ်သည်!'
                )}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          📚 {t('Health Articles', 'ကျန်းမာရေးဆောင်းပါးများ')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTab,
                { backgroundColor: activeCategory === cat.id ? colors.primary : isDark ? '#2D2D2D' : '#F5F5F5' }
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={activeCategory === cat.id ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.categoryTabText, { color: activeCategory === cat.id ? '#fff' : colors.text }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Articles List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </ScrollView>

      <ArticleModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  categoryScroll: { maxHeight: 50 },
  categoryContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  categoryTabText: { fontSize: 13, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 100 },
  articleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  articleIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  articleEmoji: { fontSize: 24 },
  articleContent: { flex: 1, marginLeft: 12 },
  articleTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  articleSummary: { fontSize: 13, lineHeight: 18 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  categoryTextWhite: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', color: '#fff' },
  readTime: { fontSize: 11 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  modalContent: { padding: 16, paddingBottom: 40 },
  modalHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalHeroTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paragraphContainer: { flexDirection: 'row', marginBottom: 16 },
  bulletPoint: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  paragraph: { flex: 1, fontSize: 15, lineHeight: 24 },
  tipBox: { flexDirection: 'row', padding: 16, borderRadius: 12, marginTop: 8, gap: 12, alignItems: 'center' },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
