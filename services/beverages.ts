/**
 * Beverage Types Service
 * 
 * Tracks different drink types with hydration coefficients.
 * Scientific basis for hydration values:
 * - Water: 100% hydration (baseline)
 * - Tea/Coffee: ~80-95% (mild diuretic effect is largely offset)
 * - Milk: ~90% (good hydration + nutrients)
 * - Juice: ~85-90% (sugar content slightly reduces absorption)
 * - Soda: ~70-80% (sugar and caffeine reduce effectiveness)
 * - Sports drinks: ~95% (designed for hydration)
 * - Alcohol: Negative (diuretic, causes net fluid loss)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// ============ STORAGE KEYS ============
const BEVERAGE_LOG_KEY = 'beverage_log';
const CUSTOM_BEVERAGES_KEY = 'custom_beverages';
const FAVORITE_BEVERAGES_KEY = 'favorite_beverages';

// ============ TYPES ============

export interface BeverageType {
  id: string;
  name: string;
  nameMy: string;
  icon: string;
  color: string;
  hydrationCoefficient: number; // 0-1 for positive, negative for dehydrating
  caffeineContent: 'none' | 'low' | 'moderate' | 'high';
  category: 'water' | 'hot' | 'cold' | 'dairy' | 'alcohol' | 'sports' | 'other';
  defaultAmount: number; // ml
  isCustom: boolean;
  description: string;
  descriptionMy: string;
}

export interface BeverageLogEntry {
  id: string;
  beverageId: string;
  beverageName: string;
  icon: string;
  amount: number; // ml consumed
  effectiveHydration: number; // ml after coefficient applied
  hydrationCoefficient: number;
  timestamp: string;
  date: string; // YYYY-MM-DD for grouping
}

export interface DailyBeverageSummary {
  date: string;
  totalConsumed: number; // raw ml
  effectiveHydration: number; // after coefficients
  beverageBreakdown: {
    beverageId: string;
    beverageName: string;
    icon: string;
    totalAmount: number;
    effectiveAmount: number;
    count: number;
  }[];
  hydrationEfficiency: number; // percentage
}

// ============ PREDEFINED BEVERAGES ============

export const BEVERAGES: BeverageType[] = [
  // Water variants
  {
    id: 'water',
    name: 'Water',
    nameMy: 'ရေ',
    icon: '💧',
    color: '#2196F3',
    hydrationCoefficient: 1.0,
    caffeineContent: 'none',
    category: 'water',
    defaultAmount: 250,
    isCustom: false,
    description: 'Pure hydration - the gold standard',
    descriptionMy: 'သန့်စင်သော ရေဓာတ် - ရွှေစံနှုန်း',
  },
  {
    id: 'sparkling_water',
    name: 'Sparkling Water',
    nameMy: 'ဆိုဒါရေ',
    icon: '🫧',
    color: '#64B5F6',
    hydrationCoefficient: 1.0,
    caffeineContent: 'none',
    category: 'water',
    defaultAmount: 250,
    isCustom: false,
    description: 'Same hydration as still water',
    descriptionMy: 'ရေနှင့် ရေဓာတ်တူညီသည်',
  },
  {
    id: 'coconut_water',
    name: 'Coconut Water',
    nameMy: 'အုန်းရည်',
    icon: '🥥',
    color: '#8D6E63',
    hydrationCoefficient: 1.0,
    caffeineContent: 'none',
    category: 'water',
    defaultAmount: 250,
    isCustom: false,
    description: 'Natural electrolytes for excellent hydration',
    descriptionMy: 'သဘာဝ ဓာတ်ဆားများဖြင့် အကောင်းဆုံး ရေဓာတ်',
  },

  // Hot beverages
  {
    id: 'green_tea',
    name: 'Green Tea',
    nameMy: 'လက်ဖက်ရည်စိမ်း',
    icon: '🍵',
    color: '#81C784',
    hydrationCoefficient: 0.95,
    caffeineContent: 'low',
    category: 'hot',
    defaultAmount: 200,
    isCustom: false,
    description: 'Low caffeine, high antioxidants',
    descriptionMy: 'ကဖိန်းနည်း၊ အောက်ဆီဒင့်များများ',
  },
  {
    id: 'black_tea',
    name: 'Black Tea',
    nameMy: 'လက်ဖက်ရည်',
    icon: '🫖',
    color: '#A1887F',
    hydrationCoefficient: 0.90,
    caffeineContent: 'moderate',
    category: 'hot',
    defaultAmount: 200,
    isCustom: false,
    description: 'Moderate caffeine, good hydration',
    descriptionMy: 'အလယ်အလတ် ကဖိန်း၊ ရေဓာတ်ကောင်း',
  },
  {
    id: 'coffee',
    name: 'Coffee',
    nameMy: 'ကော်ဖီ',
    icon: '☕',
    color: '#795548',
    hydrationCoefficient: 0.80,
    caffeineContent: 'high',
    category: 'hot',
    defaultAmount: 150,
    isCustom: false,
    description: 'High caffeine slightly reduces hydration',
    descriptionMy: 'ကဖိန်းများခြင်းက ရေဓာတ်ကို အနည်းငယ်လျှော့ချသည်',
  },
  {
    id: 'herbal_tea',
    name: 'Herbal Tea',
    nameMy: 'ဆေးဖက်ဝင်လက်ဖက်ရည်',
    icon: '🌿',
    color: '#AED581',
    hydrationCoefficient: 0.98,
    caffeineContent: 'none',
    category: 'hot',
    defaultAmount: 200,
    isCustom: false,
    description: 'Caffeine-free, almost like water',
    descriptionMy: 'ကဖိန်းမပါ၊ ရေနှင့်နီးပါးတူ',
  },
  {
    id: 'hot_chocolate',
    name: 'Hot Chocolate',
    nameMy: 'ချောကလက်ပူ',
    icon: '🍫',
    color: '#6D4C41',
    hydrationCoefficient: 0.85,
    caffeineContent: 'low',
    category: 'hot',
    defaultAmount: 200,
    isCustom: false,
    description: 'Sugar content slightly reduces absorption',
    descriptionMy: 'သကြားပါဝင်မှုက စုပ်ယူမှုကို အနည်းငယ်လျှော့ချသည်',
  },


  // Cold beverages
  {
    id: 'orange_juice',
    name: 'Orange Juice',
    nameMy: 'လိမ္မော်ရည်',
    icon: '🍊',
    color: '#FF9800',
    hydrationCoefficient: 0.85,
    caffeineContent: 'none',
    category: 'cold',
    defaultAmount: 200,
    isCustom: false,
    description: 'Natural sugars slightly reduce absorption',
    descriptionMy: 'သဘာဝသကြားက စုပ်ယူမှုကို အနည်းငယ်လျှော့ချသည်',
  },
  {
    id: 'apple_juice',
    name: 'Apple Juice',
    nameMy: 'ပန်းသီးရည်',
    icon: '🍎',
    color: '#F44336',
    hydrationCoefficient: 0.85,
    caffeineContent: 'none',
    category: 'cold',
    defaultAmount: 200,
    isCustom: false,
    description: 'Good hydration with vitamins',
    descriptionMy: 'ဗီတာမင်များနှင့် ရေဓာတ်ကောင်း',
  },
  {
    id: 'smoothie',
    name: 'Smoothie',
    nameMy: 'စမူသီ',
    icon: '🥤',
    color: '#E91E63',
    hydrationCoefficient: 0.80,
    caffeineContent: 'none',
    category: 'cold',
    defaultAmount: 300,
    isCustom: false,
    description: 'Thick consistency, moderate hydration',
    descriptionMy: 'ပျစ်သော အနှစ်၊ အလယ်အလတ် ရေဓာတ်',
  },
  {
    id: 'lemonade',
    name: 'Lemonade',
    nameMy: 'သံပုရာရည်',
    icon: '🍋',
    color: '#FFEB3B',
    hydrationCoefficient: 0.85,
    caffeineContent: 'none',
    category: 'cold',
    defaultAmount: 250,
    isCustom: false,
    description: 'Refreshing with good hydration',
    descriptionMy: 'လန်းဆန်းပြီး ရေဓာတ်ကောင်း',
  },
  {
    id: 'iced_tea',
    name: 'Iced Tea',
    nameMy: 'လက်ဖက်ရည်အေး',
    icon: '🧊',
    color: '#FFCA28',
    hydrationCoefficient: 0.85,
    caffeineContent: 'moderate',
    category: 'cold',
    defaultAmount: 300,
    isCustom: false,
    description: 'Often sweetened, moderate hydration',
    descriptionMy: 'များသောအားဖြင့် ချိုသည်၊ အလယ်အလတ် ရေဓာတ်',
  },
  {
    id: 'soda',
    name: 'Soda / Soft Drink',
    nameMy: 'အချိုရည်',
    icon: '🥤',
    color: '#F44336',
    hydrationCoefficient: 0.70,
    caffeineContent: 'moderate',
    category: 'cold',
    defaultAmount: 330,
    isCustom: false,
    description: 'High sugar reduces hydration effectiveness',
    descriptionMy: 'သကြားများခြင်းက ရေဓာတ်ထိရောက်မှုကို လျှော့ချသည်',
  },
  {
    id: 'energy_drink',
    name: 'Energy Drink',
    nameMy: 'အားဖြည့်အချိုရည်',
    icon: '⚡',
    color: '#76FF03',
    hydrationCoefficient: 0.60,
    caffeineContent: 'high',
    category: 'cold',
    defaultAmount: 250,
    isCustom: false,
    description: 'High caffeine and sugar, poor hydration',
    descriptionMy: 'ကဖိန်းနှင့်သကြားများ၊ ရေဓာတ်ညံ့',
  },

  // Dairy
  {
    id: 'milk',
    name: 'Milk',
    nameMy: 'နို့',
    icon: '🥛',
    color: '#FAFAFA',
    hydrationCoefficient: 0.90,
    caffeineContent: 'none',
    category: 'dairy',
    defaultAmount: 200,
    isCustom: false,
    description: 'Good hydration with protein and calcium',
    descriptionMy: 'ပရိုတင်းနှင့် ကယ်လ်ဆီယမ်ပါ ရေဓာတ်ကောင်း',
  },
  {
    id: 'yogurt_drink',
    name: 'Yogurt Drink',
    nameMy: 'ဒိန်ချဉ်အရည်',
    icon: '🥛',
    color: '#FFF9C4',
    hydrationCoefficient: 0.85,
    caffeineContent: 'none',
    category: 'dairy',
    defaultAmount: 200,
    isCustom: false,
    description: 'Probiotics with good hydration',
    descriptionMy: 'ပရိုဘိုင်အိုတစ်များနှင့် ရေဓာတ်ကောင်း',
  },

  // Sports drinks
  {
    id: 'sports_drink',
    name: 'Sports Drink',
    nameMy: 'အားကစားအချိုရည်',
    icon: '🏃',
    color: '#00BCD4',
    hydrationCoefficient: 0.95,
    caffeineContent: 'none',
    category: 'sports',
    defaultAmount: 500,
    isCustom: false,
    description: 'Electrolytes for optimal hydration during exercise',
    descriptionMy: 'လေ့ကျင့်ခန်းအတွင်း အကောင်းဆုံး ရေဓာတ်အတွက် ဓာတ်ဆားများ',
  },
  {
    id: 'electrolyte_water',
    name: 'Electrolyte Water',
    nameMy: 'ဓာတ်ဆားရေ',
    icon: '💪',
    color: '#03A9F4',
    hydrationCoefficient: 1.0,
    caffeineContent: 'none',
    category: 'sports',
    defaultAmount: 500,
    isCustom: false,
    description: 'Enhanced water with minerals',
    descriptionMy: 'သတ္တုဓာတ်များပါ မြှင့်တင်ထားသော ရေ',
  },

  // Alcohol (negative hydration)
  {
    id: 'beer',
    name: 'Beer',
    nameMy: 'ဘီယာ',
    icon: '🍺',
    color: '#FFC107',
    hydrationCoefficient: -0.20,
    caffeineContent: 'none',
    category: 'alcohol',
    defaultAmount: 330,
    isCustom: false,
    description: '⚠️ Causes net fluid loss - drink water alongside',
    descriptionMy: '⚠️ အသားတင် အရည်ဆုံးရှုံးစေသည် - ရေနှင့်တွဲသောက်ပါ',
  },
  {
    id: 'wine',
    name: 'Wine',
    nameMy: 'ဝိုင်',
    icon: '🍷',
    color: '#9C27B0',
    hydrationCoefficient: -0.30,
    caffeineContent: 'none',
    category: 'alcohol',
    defaultAmount: 150,
    isCustom: false,
    description: '⚠️ Moderate dehydration - drink water between glasses',
    descriptionMy: '⚠️ အလယ်အလတ် ရေဓာတ်ခန်းခြောက်စေသည် - ဖန်ခွက်ကြားတွင် ရေသောက်ပါ',
  },
  {
    id: 'spirits',
    name: 'Spirits / Liquor',
    nameMy: 'အရက်ပြင်း',
    icon: '🥃',
    color: '#FF5722',
    hydrationCoefficient: -0.50,
    caffeineContent: 'none',
    category: 'alcohol',
    defaultAmount: 45,
    isCustom: false,
    description: '⚠️ Strong dehydration - always drink water alongside',
    descriptionMy: '⚠️ ပြင်းထန်သော ရေဓာတ်ခန်းခြောက်စေသည် - အမြဲရေနှင့်တွဲသောက်ပါ',
  },
  {
    id: 'cocktail',
    name: 'Cocktail',
    nameMy: 'ကော့တေးလ်',
    icon: '🍹',
    color: '#E91E63',
    hydrationCoefficient: -0.25,
    caffeineContent: 'none',
    category: 'alcohol',
    defaultAmount: 200,
    isCustom: false,
    description: '⚠️ Mixed drinks still cause dehydration',
    descriptionMy: '⚠️ ရောစပ်အချိုရည်များလည်း ရေဓာတ်ခန်းခြောက်စေသည်',
  },
];

// ============ BEVERAGE CATEGORIES ============

export interface BeverageCategory {
  id: string;
  name: string;
  nameMy: string;
  icon: string;
  color: string;
}

export const BEVERAGE_CATEGORIES: BeverageCategory[] = [
  { id: 'water', name: 'Water', nameMy: 'ရေ', icon: '💧', color: '#2196F3' },
  { id: 'hot', name: 'Hot Drinks', nameMy: 'အပူအချိုရည်', icon: '☕', color: '#795548' },
  { id: 'cold', name: 'Cold Drinks', nameMy: 'အအေးအချိုရည်', icon: '🧊', color: '#00BCD4' },
  { id: 'dairy', name: 'Dairy', nameMy: 'နို့ထွက်ပစ္စည်း', icon: '🥛', color: '#FAFAFA' },
  { id: 'sports', name: 'Sports', nameMy: 'အားကစား', icon: '🏃', color: '#4CAF50' },
  { id: 'alcohol', name: 'Alcohol', nameMy: 'အရက်', icon: '🍺', color: '#FF5722' },
  { id: 'other', name: 'Other', nameMy: 'အခြား', icon: '🥤', color: '#9E9E9E' },
];


// ============ STORAGE FUNCTIONS ============

export const getBeverageLog = async (date?: string): Promise<BeverageLogEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(BEVERAGE_LOG_KEY);
    const allEntries: BeverageLogEntry[] = data ? JSON.parse(data) : [];
    
    if (date) {
      return allEntries.filter(entry => entry.date === date);
    }
    return allEntries;
  } catch (error) {
    console.error('Error getting beverage log:', error);
    return [];
  }
};

export const logBeverage = async (
  beverageId: string,
  amount: number,
  timestamp?: Date
): Promise<BeverageLogEntry | null> => {
  try {
    const beverage = getBeverageById(beverageId);
    if (!beverage) return null;

    const now = timestamp || new Date();
    const effectiveHydration = Math.round(amount * beverage.hydrationCoefficient);

    const entry: BeverageLogEntry = {
      id: uuidv4(),
      beverageId: beverage.id,
      beverageName: beverage.name,
      icon: beverage.icon,
      amount,
      effectiveHydration,
      hydrationCoefficient: beverage.hydrationCoefficient,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
    };

    const allEntries = await getBeverageLog();
    allEntries.push(entry);
    await AsyncStorage.setItem(BEVERAGE_LOG_KEY, JSON.stringify(allEntries));

    return entry;
  } catch (error) {
    console.error('Error logging beverage:', error);
    return null;
  }
};

export const deleteBeverageEntry = async (entryId: string): Promise<boolean> => {
  try {
    const allEntries = await getBeverageLog();
    const filtered = allEntries.filter(e => e.id !== entryId);
    await AsyncStorage.setItem(BEVERAGE_LOG_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting beverage entry:', error);
    return false;
  }
};

export const getDailySummary = async (date?: string): Promise<DailyBeverageSummary> => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const entries = await getBeverageLog(targetDate);

  const breakdown: Map<string, {
    beverageId: string;
    beverageName: string;
    icon: string;
    totalAmount: number;
    effectiveAmount: number;
    count: number;
  }> = new Map();

  let totalConsumed = 0;
  let effectiveHydration = 0;

  entries.forEach(entry => {
    totalConsumed += entry.amount;
    effectiveHydration += entry.effectiveHydration;

    const existing = breakdown.get(entry.beverageId);
    if (existing) {
      existing.totalAmount += entry.amount;
      existing.effectiveAmount += entry.effectiveHydration;
      existing.count += 1;
    } else {
      breakdown.set(entry.beverageId, {
        beverageId: entry.beverageId,
        beverageName: entry.beverageName,
        icon: entry.icon,
        totalAmount: entry.amount,
        effectiveAmount: entry.effectiveHydration,
        count: 1,
      });
    }
  });

  const hydrationEfficiency = totalConsumed > 0 
    ? Math.round((effectiveHydration / totalConsumed) * 100) 
    : 100;

  return {
    date: targetDate,
    totalConsumed,
    effectiveHydration,
    beverageBreakdown: Array.from(breakdown.values()),
    hydrationEfficiency,
  };
};

// ============ BEVERAGE HELPERS ============

export const getBeverageById = (id: string): BeverageType | undefined => {
  return BEVERAGES.find(b => b.id === id);
};

export const getBeveragesByCategory = (category: string): BeverageType[] => {
  return BEVERAGES.filter(b => b.category === category);
};

export const calculateEffectiveHydration = (beverageId: string, amount: number): number => {
  const beverage = getBeverageById(beverageId);
  if (!beverage) return amount;
  return Math.round(amount * beverage.hydrationCoefficient);
};

export const getHydrationColor = (coefficient: number): string => {
  if (coefficient >= 0.95) return '#4CAF50'; // Excellent - green
  if (coefficient >= 0.85) return '#8BC34A'; // Good - light green
  if (coefficient >= 0.70) return '#FFC107'; // Moderate - yellow
  if (coefficient >= 0.50) return '#FF9800'; // Poor - orange
  if (coefficient >= 0) return '#F44336';    // Bad - red
  return '#9C27B0';                          // Negative - purple (alcohol)
};

export const getHydrationLabel = (
  coefficient: number,
  language: 'en' | 'my' = 'en'
): string => {
  if (coefficient >= 0.95) return language === 'my' ? 'အကောင်းဆုံး' : 'Excellent';
  if (coefficient >= 0.85) return language === 'my' ? 'ကောင်း' : 'Good';
  if (coefficient >= 0.70) return language === 'my' ? 'အလယ်အလတ်' : 'Moderate';
  if (coefficient >= 0.50) return language === 'my' ? 'ညံ့' : 'Poor';
  if (coefficient >= 0) return language === 'my' ? 'အလွန်ညံ့' : 'Very Poor';
  return language === 'my' ? '⚠️ ရေဓာတ်ခန်းခြောက်စေသည်' : '⚠️ Dehydrating';
};

// ============ CUSTOM BEVERAGES ============

export const getCustomBeverages = async (): Promise<BeverageType[]> => {
  try {
    const data = await AsyncStorage.getItem(CUSTOM_BEVERAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting custom beverages:', error);
    return [];
  }
};

export const addCustomBeverage = async (
  beverage: Omit<BeverageType, 'id' | 'isCustom'>
): Promise<BeverageType> => {
  const customBeverages = await getCustomBeverages();
  
  const newBeverage: BeverageType = {
    ...beverage,
    id: `custom_${uuidv4()}`,
    isCustom: true,
  };

  customBeverages.push(newBeverage);
  await AsyncStorage.setItem(CUSTOM_BEVERAGES_KEY, JSON.stringify(customBeverages));
  
  return newBeverage;
};

export const deleteCustomBeverage = async (id: string): Promise<boolean> => {
  try {
    const customBeverages = await getCustomBeverages();
    const filtered = customBeverages.filter(b => b.id !== id);
    await AsyncStorage.setItem(CUSTOM_BEVERAGES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting custom beverage:', error);
    return false;
  }
};

export const getAllBeverages = async (): Promise<BeverageType[]> => {
  const customBeverages = await getCustomBeverages();
  return [...BEVERAGES, ...customBeverages];
};

// ============ FAVORITES ============

export const getFavoriteBeverages = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITE_BEVERAGES_KEY);
    return data ? JSON.parse(data) : ['water', 'coffee', 'green_tea'];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return ['water', 'coffee', 'green_tea'];
  }
};

export const toggleFavorite = async (beverageId: string): Promise<boolean> => {
  try {
    const favorites = await getFavoriteBeverages();
    const index = favorites.indexOf(beverageId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(beverageId);
    }
    
    await AsyncStorage.setItem(FAVORITE_BEVERAGES_KEY, JSON.stringify(favorites));
    return index === -1; // Returns true if added, false if removed
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

// ============ STATISTICS ============

export interface BeverageStats {
  mostConsumed: { beverage: BeverageType; count: number } | null;
  averageEfficiency: number;
  totalByCategory: { category: string; amount: number }[];
  weeklyTrend: { date: string; effective: number; total: number }[];
}

export const getBeverageStats = async (days: number = 7): Promise<BeverageStats> => {
  const allEntries = await getBeverageLog();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const recentEntries = allEntries.filter(e => e.date >= cutoffStr);

  // Most consumed beverage
  const beverageCounts: Map<string, number> = new Map();
  recentEntries.forEach(e => {
    beverageCounts.set(e.beverageId, (beverageCounts.get(e.beverageId) || 0) + 1);
  });

  let mostConsumed: { beverage: BeverageType; count: number } | null = null;
  let maxCount = 0;
  beverageCounts.forEach((count, id) => {
    if (count > maxCount) {
      const beverage = getBeverageById(id);
      if (beverage) {
        mostConsumed = { beverage, count };
        maxCount = count;
      }
    }
  });

  // Average efficiency
  const totalConsumed = recentEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalEffective = recentEntries.reduce((sum, e) => sum + e.effectiveHydration, 0);
  const averageEfficiency = totalConsumed > 0 
    ? Math.round((totalEffective / totalConsumed) * 100) 
    : 100;

  // Total by category
  const categoryTotals: Map<string, number> = new Map();
  recentEntries.forEach(e => {
    const beverage = getBeverageById(e.beverageId);
    if (beverage) {
      categoryTotals.set(
        beverage.category,
        (categoryTotals.get(beverage.category) || 0) + e.amount
      );
    }
  });

  const totalByCategory = Array.from(categoryTotals.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));

  // Weekly trend
  const weeklyTrend: { date: string; effective: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayEntries = recentEntries.filter(e => e.date === dateStr);
    weeklyTrend.push({
      date: dateStr,
      effective: dayEntries.reduce((sum, e) => sum + e.effectiveHydration, 0),
      total: dayEntries.reduce((sum, e) => sum + e.amount, 0),
    });
  }

  return {
    mostConsumed,
    averageEfficiency,
    totalByCategory,
    weeklyTrend,
  };
};
