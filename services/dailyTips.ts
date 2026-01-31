import AsyncStorage from '@react-native-async-storage/async-storage';

const TIPS_HISTORY_KEY = 'daily_tips_history';
const TIPS_PREFERENCES_KEY = 'daily_tips_preferences';
const FAVORITE_TIPS_KEY = 'favorite_tips';

/**
 * Tip categories
 */
export type TipCategory =
  | 'hydration'
  | 'health'
  | 'science'
  | 'lifestyle'
  | 'exercise'
  | 'nutrition'
  | 'sleep'
  | 'productivity';

/**
 * Daily tip interface
 */
export interface DailyTip {
  id: string;
  category: TipCategory;
  title: string;
  titleMy: string;
  content: string;
  contentMy: string;
  icon: string;
  source?: string;
}

/**
 * Tip history entry
 */
export interface TipHistoryEntry {
  tipId: string;
  shownAt: string;
  liked: boolean;
}

/**
 * Tips preferences
 */
export interface TipsPreferences {
  enabled: boolean;
  categories: TipCategory[];
  showOnHomeScreen: boolean;
  dailyNotification: boolean;
  notificationTime: string;
}

const defaultPreferences: TipsPreferences = {
  enabled: true,
  categories: ['hydration', 'health', 'science', 'lifestyle', 'exercise', 'nutrition'],
  showOnHomeScreen: true,
  dailyNotification: false,
  notificationTime: '09:00',
};

/**
 * Comprehensive tips database - bilingual (English & Myanmar)
 */
const TIPS_DATABASE: DailyTip[] = [
  // Hydration Tips
  {
    id: 'hydration_1',
    category: 'hydration',
    title: 'Morning Hydration Boost',
    titleMy: 'မနက်ခင်းရေဓာတ်မြှင့်တင်ခြင်း',
    content: 'Drinking water first thing in the morning helps kickstart your metabolism and flush out toxins accumulated overnight.',
    contentMy: 'မနက်ခင်းအစောဆုံးရေသောက်ခြင်းသည် သင့်ဇီဝကမ္မဖြစ်စဉ်ကို စတင်စေပြီး ညဘက်စုပုံထားသော အဆိပ်အတောက်များကို ထုတ်ပစ်ပေးသည်။',
    icon: '🌅',
    source: 'Journal of Clinical Endocrinology',
  },
  {
    id: 'hydration_2',
    category: 'hydration',
    title: 'Water Before Meals',
    titleMy: 'အစားမစားခင်ရေသောက်ပါ',
    content: 'Drinking a glass of water 30 minutes before meals can help with digestion and may reduce calorie intake by making you feel fuller.',
    contentMy: 'အစားမစားခင် မိနစ် ၃၀ အလိုတွင် ရေတစ်ခွက်သောက်ခြင်းသည် အစာခြေခြင်းကို အထောက်အကူပြုပြီး ဝမ်းပြည့်သလိုခံစားရစေ၍ ကယ်လိုရီစားသုံးမှုကို လျှော့ချနိုင်သည်။',
    icon: '🍽️',
    source: 'Obesity Journal',
  },
  {
    id: 'hydration_3',
    category: 'hydration',
    title: 'Room Temperature Water',
    titleMy: 'အခန်းအပူချိန်ရေ',
    content: 'Room temperature water is easier for your body to absorb than cold water, making hydration more efficient.',
    contentMy: 'အခန်းအပူချိန်ရေသည် အေးသောရေထက် သင့်ခန္ဓာကိုယ်အတွက် စုပ်ယူရလွယ်ကူပြီး ရေဓာတ်ဖြည့်တင်းမှုကို ပိုမိုထိရောက်စေသည်။',
    icon: '🌡️',
  },
  {
    id: 'hydration_4',
    category: 'hydration',
    title: 'Hydration and Skin',
    titleMy: 'ရေဓာတ်နှင့် အသားအရေ',
    content: 'Proper hydration helps maintain skin elasticity and can reduce the appearance of wrinkles and fine lines.',
    contentMy: 'သင့်လျော်သောရေဓာတ်သည် အသားအရေပြန်လန်မှုကို ထိန်းသိမ်းပေးပြီး အရေးအကြောင်းများကို လျှော့ချပေးနိုင်သည်။',
    icon: '✨',
  },
  {
    id: 'hydration_5',
    category: 'hydration',
    title: 'Thirst vs Hunger',
    titleMy: 'ရေငတ်ခြင်းနှင့် ဗိုက်ဆာခြင်း',
    content: 'Sometimes thirst is mistaken for hunger. Next time you feel hungry, try drinking water first and wait 15 minutes.',
    contentMy: 'တစ်ခါတစ်ရံ ရေငတ်ခြင်းကို ဗိုက်ဆာခြင်းဟု မှားယွင်းခံစားရတတ်သည်။ နောက်တစ်ကြိမ်ဗိုက်ဆာသည့်အခါ ရေအရင်သောက်ပြီး မိနစ် ၁၅ စောင့်ကြည့်ပါ။',
    icon: '🤔',
  },

  // Health Tips
  {
    id: 'health_1',
    category: 'health',
    title: 'Brain Power',
    titleMy: 'ဦးနှောက်စွမ်းအား',
    content: 'Your brain is 75% water. Even mild dehydration can impair concentration, memory, and mood.',
    contentMy: 'သင့်ဦးနှောက်သည် ရေ ၇၅% ပါဝင်သည်။ အနည်းငယ်ရေဓာတ်ခန်းခြောက်ရုံနှင့်ပင် အာရုံစူးစိုက်မှု၊ မှတ်ဉာဏ်နှင့် စိတ်ခံစားမှုကို ထိခိုက်နိုင်သည်။',
    icon: '🧠',
    source: 'Journal of Nutrition',
  },
  {
    id: 'health_2',
    category: 'health',
    title: 'Kidney Health',
    titleMy: 'ကျောက်ကပ်ကျန်းမာရေး',
    content: 'Adequate water intake helps your kidneys filter waste from your blood and reduces the risk of kidney stones.',
    contentMy: 'လုံလောက်သောရေသောက်ခြင်းသည် သင့်ကျောက်ကပ်များက သွေးထဲမှ အညစ်အကြေးများကို စစ်ထုတ်ရာတွင် အထောက်အကူပြုပြီး ကျောက်ကပ်ကျောက်တည်ခြင်းအန္တရာယ်ကို လျှော့ချပေးသည်။',
    icon: '💪',
  },
  {
    id: 'health_3',
    category: 'health',
    title: 'Joint Lubrication',
    titleMy: 'အဆစ်ချောဆီ',
    content: 'Water helps lubricate and cushion your joints. Staying hydrated can help reduce joint pain and stiffness.',
    contentMy: 'ရေသည် သင့်အဆစ်များကို ချောမွေ့စေပြီး ကာကွယ်ပေးသည်။ ရေဓာတ်ထိန်းထားခြင်းသည် အဆစ်နာကျင်မှုနှင့် တောင့်တင်းမှုကို လျှော့ချပေးနိုင်သည်။',
    icon: '🦴',
  },
  {
    id: 'health_4',
    category: 'health',
    title: 'Immune System',
    titleMy: 'ခုခံအားစနစ်',
    content: 'Proper hydration supports your immune system by helping transport nutrients and remove toxins from your body.',
    contentMy: 'သင့်လျော်သောရေဓာတ်သည် အာဟာရဓာတ်များသယ်ဆောင်ခြင်းနှင့် အဆိပ်အတောက်များဖယ်ရှားခြင်းဖြင့် သင့်ခုခံအားစနစ်ကို ပံ့ပိုးပေးသည်။',
    icon: '🛡️',
  },
  // Science Tips
  {
    id: 'science_1',
    category: 'science',
    title: 'Water Composition',
    titleMy: 'ရေဖွဲ့စည်းပုံ',
    content: 'The human body is about 60% water. This percentage varies by age, sex, and body composition.',
    contentMy: 'လူ့ခန္ဓာကိုယ်သည် ရေ ၆၀% ခန့်ပါဝင်သည်။ ဤရာခိုင်နှုန်းသည် အသက်၊ လိင်နှင့် ခန္ဓာကိုယ်ဖွဲ့စည်းပုံအလိုက် ကွဲပြားသည်။',
    icon: '🔬',
  },
  {
    id: 'science_2',
    category: 'science',
    title: 'Blood Volume',
    titleMy: 'သွေးပမာဏ',
    content: 'Blood is about 90% water. Dehydration can cause blood to become thicker, making your heart work harder.',
    contentMy: 'သွေးသည် ရေ ၉၀% ခန့်ပါဝင်သည်။ ရေဓာတ်ခန်းခြောက်မှုသည် သွေးကို ပိုထူစေပြီး သင့်နှလုံးကို ပိုမိုအလုပ်လုပ်စေသည်။',
    icon: '❤️',
    source: 'American Heart Association',
  },

  // Lifestyle Tips
  {
    id: 'lifestyle_1',
    category: 'lifestyle',
    title: 'Carry a Water Bottle',
    titleMy: 'ရေပုလင်းယူသွားပါ',
    content: 'Keeping a reusable water bottle with you makes it easier to drink water throughout the day and is eco-friendly.',
    contentMy: 'ပြန်သုံးနိုင်သောရေပုလင်းတစ်လုံး ယူသွားခြင်းသည် တစ်နေ့တာလုံး ရေသောက်ရလွယ်ကူစေပြီး သဘာဝပတ်ဝန်းကျင်နှင့်လည်း သဟဇာတဖြစ်သည်။',
    icon: '🍶',
  },
  {
    id: 'lifestyle_2',
    category: 'lifestyle',
    title: 'Flavor Your Water',
    titleMy: 'ရေကို အရသာထည့်ပါ',
    content: 'Add natural flavors like lemon, cucumber, or mint to your water if you find plain water boring.',
    contentMy: 'ရိုးရိုးရေကို ငြီးငွေ့ပါက သံပုရာ၊ သခွားသီး သို့မဟုတ် ပူဒီနာကဲ့သို့ သဘာဝအရသာများ ထည့်ပါ။',
    icon: '🍋',
  },
  {
    id: 'lifestyle_3',
    category: 'lifestyle',
    title: 'Set Reminders',
    titleMy: 'သတိပေးချက်များသတ်မှတ်ပါ',
    content: 'Use app reminders or set hourly alarms to build a consistent hydration habit throughout your day.',
    contentMy: 'တစ်နေ့တာလုံး တသမတ်တည်းရေသောက်အလေ့အထတည်ဆောက်ရန် အက်ပ်သတိပေးချက်များ သို့မဟုတ် နာရီတိုင်းအချက်ပေးသံများ သတ်မှတ်ပါ။',
    icon: '⏰',
  },
  {
    id: 'lifestyle_4',
    category: 'lifestyle',
    title: 'Water-Rich Foods',
    titleMy: 'ရေဓာတ်ကြွယ်ဝသောအစားအစာများ',
    content: 'Eat water-rich foods like watermelon (92% water), cucumbers (95% water), and oranges (86% water) to boost hydration.',
    contentMy: 'ဖရဲသီး (ရေ ၉၂%)၊ သခွားသီး (ရေ ၉၅%)၊ လိမ္မော်သီး (ရေ ၈၆%) ကဲ့သို့ ရေဓာတ်ကြွယ်ဝသောအစားအစာများစားပြီး ရေဓာတ်ဖြည့်တင်းပါ။',
    icon: '🍉',
  },
  // Exercise Tips
  {
    id: 'exercise_1',
    category: 'exercise',
    title: 'Pre-Workout Hydration',
    titleMy: 'လေ့ကျင့်ခန်းမလုပ်ခင် ရေဓာတ်',
    content: 'Drink 17-20 oz of water 2-3 hours before exercise, and another 8 oz 20-30 minutes before starting.',
    contentMy: 'လေ့ကျင့်ခန်းမလုပ်ခင် ၂-၃ နာရီအလို ရေ ၅၀၀-၆၀၀ မီလီလီတာ သောက်ပြီး မစခင် ၂၀-၃၀ မိနစ်အလို နောက်ထပ် ၂၅၀ မီလီလီတာ သောက်ပါ။',
    icon: '🏃',
    source: 'American College of Sports Medicine',
  },
  {
    id: 'exercise_2',
    category: 'exercise',
    title: 'During Exercise',
    titleMy: 'လေ့ကျင့်ခန်းလုပ်နေစဉ်',
    content: 'During exercise, drink 7-10 oz of water every 10-20 minutes to replace fluids lost through sweat.',
    contentMy: 'လေ့ကျင့်ခန်းလုပ်နေစဉ် ချွေးထွက်ခြင်းကြောင့် ဆုံးရှုံးသောအရည်များအစားထိုးရန် ၁၀-၂၀ မိနစ်တိုင်း ရေ ၂၀၀-၃၀၀ မီလီလီတာ သောက်ပါ။',
    icon: '💦',
  },
  {
    id: 'exercise_3',
    category: 'exercise',
    title: 'Post-Workout Recovery',
    titleMy: 'လေ့ကျင့်ခန်းပြီးနောက် ပြန်လည်နာလန်ထူခြင်း',
    content: 'After exercise, drink 16-24 oz of water for every pound of body weight lost during the workout.',
    contentMy: 'လေ့ကျင့်ခန်းပြီးနောက် လေ့ကျင့်ခန်းအတွင်း ဆုံးရှုံးသော ကိုယ်အလေးချိန် ပေါင် ၁ ပေါင်တိုင်းအတွက် ရေ ၅၀၀-၇၀၀ မီလီလီတာ သောက်ပါ။',
    icon: '🏋️',
  },

  // Nutrition Tips
  {
    id: 'nutrition_1',
    category: 'nutrition',
    title: 'Caffeine and Hydration',
    titleMy: 'ကဖိန်းနှင့် ရေဓာတ်',
    content: 'While caffeine has mild diuretic effects, moderate coffee consumption (3-4 cups) still contributes to daily fluid intake.',
    contentMy: 'ကဖိန်းတွင် အနည်းငယ်ဆီးသွားစေသောအကျိုးသက်ရောက်မှုရှိသော်လည်း အလယ်အလတ်ကော်ဖီသောက်ခြင်း (၃-၄ ခွက်) သည် နေ့စဉ်အရည်စားသုံးမှုကို ပံ့ပိုးပေးဆဲဖြစ်သည်။',
    icon: '☕',
    source: 'Mayo Clinic',
  },
  {
    id: 'nutrition_2',
    category: 'nutrition',
    title: 'Alcohol Dehydration',
    titleMy: 'အရက်ကြောင့် ရေဓာတ်ခန်းခြောက်ခြင်း',
    content: 'Alcohol is a diuretic. For every alcoholic drink, try to drink a glass of water to stay hydrated.',
    contentMy: 'အရက်သည် ဆီးသွားစေသည်။ အရက်တစ်ခွက်တိုင်းအတွက် ရေဓာတ်ထိန်းထားရန် ရေတစ်ခွက်သောက်ကြိုးစားပါ။',
    icon: '🍷',
  },
  {
    id: 'nutrition_3',
    category: 'nutrition',
    title: 'Sodium Balance',
    titleMy: 'ဆိုဒီယမ်ချိန်ခွင်လျှာ',
    content: 'Eating too much sodium can cause water retention. Balance salty foods with adequate water intake.',
    contentMy: 'ဆိုဒီယမ်အလွန်အကျွံစားခြင်းသည် ရေသိုလှောင်မှုဖြစ်စေနိုင်သည်။ ငန်သောအစားအစာများကို လုံလောက်သောရေသောက်ခြင်းဖြင့် ချိန်ခွင်လျှာညှိပါ။',
    icon: '🧂',
  },
  // Sleep Tips
  {
    id: 'sleep_1',
    category: 'sleep',
    title: 'Evening Hydration',
    titleMy: 'ညနေခင်းရေဓာတ်',
    content: 'Stop drinking large amounts of water 2 hours before bed to avoid nighttime bathroom trips that disrupt sleep.',
    contentMy: 'အိပ်ရာဝင်ချိန်မတိုင်မီ ၂ နာရီအလို ရေအများကြီးသောက်ခြင်းကို ရပ်ပါ။ အိပ်ရေးပျက်စေသော ညဘက်အိမ်သာသွားခြင်းကို ရှောင်ရှားရန်ဖြစ်သည်။',
    icon: '🌙',
  },
  {
    id: 'sleep_2',
    category: 'sleep',
    title: 'Morning Rehydration',
    titleMy: 'မနက်ခင်းရေဓာတ်ပြန်ဖြည့်ခြင်း',
    content: 'You lose about 1 liter of water while sleeping through breathing and sweating. Rehydrate first thing in the morning.',
    contentMy: 'အိပ်နေစဉ် အသက်ရှူခြင်းနှင့် ချွေးထွက်ခြင်းကြောင့် ရေ ၁ လီတာခန့် ဆုံးရှုံးသည်။ မနက်ခင်းအစောဆုံး ရေဓာတ်ပြန်ဖြည့်ပါ။',
    icon: '😴',
  },
  // Productivity Tips
  {
    id: 'productivity_1',
    category: 'productivity',
    title: 'Focus and Water',
    titleMy: 'အာရုံစူးစိုက်မှုနှင့် ရေ',
    content: 'Studies show that even 1-2% dehydration can significantly impair cognitive performance and concentration.',
    contentMy: 'လေ့လာမှုများအရ ၁-၂% ရေဓာတ်ခန်းခြောက်ရုံနှင့်ပင် သိမြင်နိုင်စွမ်းနှင့် အာရုံစူးစိုက်မှုကို သိသိသာသာ ထိခိုက်စေနိုင်သည်။',
    icon: '🎯',
    source: 'British Journal of Nutrition',
  },
  {
    id: 'productivity_2',
    category: 'productivity',
    title: 'Energy Levels',
    titleMy: 'စွမ်းအင်အဆင့်များ',
    content: 'Feeling tired? Before reaching for coffee, try drinking water. Fatigue is often an early sign of dehydration.',
    contentMy: 'ပင်ပန်းနေသလား? ကော်ဖီမသောက်ခင် ရေသောက်ကြည့်ပါ။ ပင်ပန်းမှုသည် မကြာခဏ ရေဓာတ်ခန်းခြောက်မှု၏ အစောပိုင်းလက္ခဏာဖြစ်သည်။',
    icon: '⚡',
  },
  {
    id: 'productivity_3',
    category: 'productivity',
    title: 'Headache Prevention',
    titleMy: 'ခေါင်းကိုက်ခြင်းကာကွယ်ရေး',
    content: 'Dehydration is a common trigger for headaches. Drinking water regularly can help prevent tension headaches.',
    contentMy: 'ရေဓာတ်ခန်းခြောက်မှုသည် ခေါင်းကိုက်ခြင်း၏ အဖြစ်များသောအကြောင်းရင်းဖြစ်သည်။ ပုံမှန်ရေသောက်ခြင်းသည် တင်းကျပ်မှုခေါင်းကိုက်ခြင်းကို ကာကွယ်ပေးနိုင်သည်။',
    icon: '🤕',
  },
];


/**
 * Get tips preferences
 */
export const getTipsPreferences = async (): Promise<TipsPreferences> => {
  try {
    const data = await AsyncStorage.getItem(TIPS_PREFERENCES_KEY);
    return data ? { ...defaultPreferences, ...JSON.parse(data) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
};

/**
 * Save tips preferences
 */
export const saveTipsPreferences = async (prefs: Partial<TipsPreferences>): Promise<void> => {
  try {
    const current = await getTipsPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(TIPS_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving tips preferences:', error);
  }
};

/**
 * Get tips history
 */
export const getTipsHistory = async (): Promise<TipHistoryEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(TIPS_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save tip to history
 */
const saveTipToHistory = async (tipId: string): Promise<void> => {
  try {
    const history = await getTipsHistory();
    const entry: TipHistoryEntry = {
      tipId,
      shownAt: new Date().toISOString(),
      liked: false,
    };
    
    // Keep last 30 days of history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredHistory = history.filter(
      h => new Date(h.shownAt) > thirtyDaysAgo
    );
    
    filteredHistory.push(entry);
    await AsyncStorage.setItem(TIPS_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error saving tip to history:', error);
  }
};


/**
 * Get today's tip - ensures same tip for the whole day
 */
export const getTodaysTip = async (language: 'en' | 'my' = 'en'): Promise<DailyTip | null> => {
  try {
    const prefs = await getTipsPreferences();
    if (!prefs.enabled) return null;

    const history = await getTipsHistory();
    const today = new Date().toDateString();
    
    // Check if we already have a tip for today
    const todayEntry = history.find(h => 
      new Date(h.shownAt).toDateString() === today
    );
    
    if (todayEntry) {
      const tip = TIPS_DATABASE.find(t => t.id === todayEntry.tipId);
      return tip || null;
    }
    
    // Get tips from enabled categories
    const availableTips = TIPS_DATABASE.filter(t => 
      prefs.categories.includes(t.category)
    );
    
    if (availableTips.length === 0) return null;
    
    // Get recently shown tip IDs (last 7 days)
    const recentTipIds = history
      .filter(h => {
        const shownDate = new Date(h.shownAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return shownDate > sevenDaysAgo;
      })
      .map(h => h.tipId);
    
    // Prefer tips not shown recently
    let eligibleTips = availableTips.filter(t => !recentTipIds.includes(t.id));
    
    // If all tips were shown recently, use all available
    if (eligibleTips.length === 0) {
      eligibleTips = availableTips;
    }
    
    // Use date as seed for consistent daily selection
    const dateNum = new Date().getDate() + new Date().getMonth() * 31;
    const selectedTip = eligibleTips[dateNum % eligibleTips.length];
    
    // Save to history
    await saveTipToHistory(selectedTip.id);
    
    return selectedTip;
  } catch (error) {
    console.error('Error getting today\'s tip:', error);
    return null;
  }
};

/**
 * Get a random tip (for refresh/shuffle)
 */
export const getRandomTip = async (
  excludeId?: string,
  language: 'en' | 'my' = 'en'
): Promise<DailyTip | null> => {
  try {
    const prefs = await getTipsPreferences();
    
    let availableTips = TIPS_DATABASE.filter(t => 
      prefs.categories.includes(t.category)
    );
    
    if (excludeId) {
      availableTips = availableTips.filter(t => t.id !== excludeId);
    }
    
    if (availableTips.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableTips.length);
    return availableTips[randomIndex];
  } catch (error) {
    console.error('Error getting random tip:', error);
    return null;
  }
};

/**
 * Get tips by category
 */
export const getTipsByCategory = (category: TipCategory): DailyTip[] => {
  return TIPS_DATABASE.filter(t => t.category === category);
};

/**
 * Get all tips
 */
export const getAllTips = (): DailyTip[] => {
  return [...TIPS_DATABASE];
};

/**
 * Get tip categories with counts
 */
export const getTipCategories = (): { category: TipCategory; count: number; icon: string }[] => {
  const categoryIcons: Record<TipCategory, string> = {
    hydration: '💧',
    health: '❤️',
    science: '🔬',
    lifestyle: '🌟',
    exercise: '🏃',
    nutrition: '🥗',
    sleep: '😴',
    productivity: '🎯',
  };

  const categories = [...new Set(TIPS_DATABASE.map(t => t.category))];
  
  return categories.map(category => ({
    category,
    count: TIPS_DATABASE.filter(t => t.category === category).length,
    icon: categoryIcons[category],
  }));
};


/**
 * Get favorite tips
 */
export const getFavoriteTips = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITE_TIPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Toggle tip favorite status
 */
export const toggleFavoriteTip = async (tipId: string): Promise<boolean> => {
  try {
    const favorites = await getFavoriteTips();
    const isFavorite = favorites.includes(tipId);
    
    let newFavorites: string[];
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== tipId);
    } else {
      newFavorites = [...favorites, tipId];
    }
    
    await AsyncStorage.setItem(FAVORITE_TIPS_KEY, JSON.stringify(newFavorites));
    return !isFavorite;
  } catch (error) {
    console.error('Error toggling favorite tip:', error);
    return false;
  }
};

/**
 * Check if tip is favorite
 */
export const isTipFavorite = async (tipId: string): Promise<boolean> => {
  const favorites = await getFavoriteTips();
  return favorites.includes(tipId);
};

/**
 * Get favorite tips data
 */
export const getFavoriteTipsData = async (): Promise<DailyTip[]> => {
  const favoriteIds = await getFavoriteTips();
  return TIPS_DATABASE.filter(t => favoriteIds.includes(t.id));
};

/**
 * Get tip statistics
 */
export const getTipStatistics = async (): Promise<{
  totalTips: number;
  tipsViewed: number;
  favoritesCount: number;
  categoriesEnabled: number;
}> => {
  const [history, favorites, prefs] = await Promise.all([
    getTipsHistory(),
    getFavoriteTips(),
    getTipsPreferences(),
  ]);

  const uniqueTipsViewed = new Set(history.map(h => h.tipId)).size;

  return {
    totalTips: TIPS_DATABASE.length,
    tipsViewed: uniqueTipsViewed,
    favoritesCount: favorites.length,
    categoriesEnabled: prefs.categories.length,
  };
};

/**
 * Format tip for display
 */
export const formatTipForDisplay = (
  tip: DailyTip,
  language: 'en' | 'my' = 'en'
): { title: string; content: string; icon: string; category: string; source?: string } => {
  return {
    title: language === 'my' ? tip.titleMy : tip.title,
    content: language === 'my' ? tip.contentMy : tip.content,
    icon: tip.icon,
    category: tip.category,
    source: tip.source,
  };
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (
  category: TipCategory,
  language: 'en' | 'my' = 'en'
): string => {
  const names: Record<TipCategory, { en: string; my: string }> = {
    hydration: { en: 'Hydration', my: 'ရေဓာတ်' },
    health: { en: 'Health', my: 'ကျန်းမာရေး' },
    science: { en: 'Science', my: 'သိပ္ပံ' },
    lifestyle: { en: 'Lifestyle', my: 'လူနေမှုပုံစံ' },
    exercise: { en: 'Exercise', my: 'လေ့ကျင့်ခန်း' },
    nutrition: { en: 'Nutrition', my: 'အာဟာရ' },
    sleep: { en: 'Sleep', my: 'အိပ်စက်ခြင်း' },
    productivity: { en: 'Productivity', my: 'ထုတ်လုပ်နိုင်စွမ်း' },
  };

  return names[category][language];
};
