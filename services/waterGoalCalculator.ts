/**
 * Water Goal Calculator Service
 * 
 * Scientific approach to calculating daily water intake based on:
 * - Body weight
 * - Activity level
 * - Climate/weather
 * - Health conditions
 * - Age and gender
 * 
 * References:
 * - National Academies of Sciences (2004): Dietary Reference Intakes
 * - European Food Safety Authority (EFSA) guidelines
 * - American College of Sports Medicine recommendations
 */

import type { ActivityLevel, Gender } from '@/store/userProfile';

// ============ TYPES ============

export type ClimateType = 'cold' | 'temperate' | 'hot' | 'tropical';
export type HealthCondition = 'none' | 'pregnant' | 'breastfeeding' | 'kidney_issues' | 'heart_condition';

export interface WaterGoalFactors {
  weight: number;
  weightUnit: 'kg' | 'lbs';
  gender: Gender;
  age: number;
  activityLevel: ActivityLevel;
  climate: ClimateType;
  healthCondition: HealthCondition;
  caffeineIntake: 'none' | 'moderate' | 'high'; // cups per day
  alcoholIntake: 'none' | 'occasional' | 'regular';
}

export interface WaterGoalResult {
  recommendedGoal: number; // in ml
  minimumGoal: number;
  maximumGoal: number;
  breakdown: {
    baseAmount: number;
    activityAdjustment: number;
    climateAdjustment: number;
    healthAdjustment: number;
    otherAdjustments: number;
  };
  tips: string[];
  tipsMy: string[];
}

// ============ CONSTANTS ============

// Base water intake: ml per kg of body weight
const BASE_ML_PER_KG = 30; // General recommendation: 30-35ml per kg

// Activity level multipliers
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.0,      // Desk job, minimal exercise
  light: 1.1,          // Light exercise 1-3 days/week
  moderate: 1.2,       // Moderate exercise 3-5 days/week
  active: 1.35,        // Hard exercise 6-7 days/week
  very_active: 1.5,    // Very hard exercise, physical job
};

// Climate adjustments (percentage increase)
const CLIMATE_ADJUSTMENTS: Record<ClimateType, number> = {
  cold: -0.05,         // 5% less in cold weather
  temperate: 0,        // No adjustment
  hot: 0.15,           // 15% more in hot weather
  tropical: 0.25,      // 25% more in tropical/humid climate
};

// Gender base adjustments
const GENDER_BASE: Record<Gender, number> = {
  male: 3700,          // EFSA recommendation for men
  female: 2700,        // EFSA recommendation for women
  other: 3000,         // Average
};

// Health condition adjustments
const HEALTH_ADJUSTMENTS: Record<HealthCondition, number> = {
  none: 0,
  pregnant: 300,       // +300ml during pregnancy
  breastfeeding: 700,  // +700ml while breastfeeding
  kidney_issues: -500, // Consult doctor - may need less
  heart_condition: -300, // Consult doctor - may need less
};

// Age-based adjustments (percentage)
const getAgeAdjustment = (age: number): number => {
  if (age < 18) return -0.1;      // Children need relatively less
  if (age < 30) return 0;         // Young adults - baseline
  if (age < 50) return 0;         // Adults - baseline
  if (age < 65) return -0.05;     // Older adults - slightly less
  return -0.1;                    // Seniors - reduced kidney function
};


// ============ CALCULATOR FUNCTIONS ============

/**
 * Calculate recommended daily water intake based on multiple factors
 */
export const calculateWaterGoal = (factors: WaterGoalFactors): WaterGoalResult => {
  // Convert weight to kg if needed
  const weightKg = factors.weightUnit === 'lbs' 
    ? factors.weight * 0.453592 
    : factors.weight;

  // 1. Base calculation (weight-based)
  const baseAmount = Math.round(weightKg * BASE_ML_PER_KG);

  // 2. Activity adjustment
  const activityMultiplier = ACTIVITY_MULTIPLIERS[factors.activityLevel];
  const activityAdjustment = Math.round(baseAmount * (activityMultiplier - 1));

  // 3. Climate adjustment
  const climateMultiplier = CLIMATE_ADJUSTMENTS[factors.climate];
  const climateAdjustment = Math.round(baseAmount * climateMultiplier);

  // 4. Health condition adjustment
  const healthAdjustment = HEALTH_ADJUSTMENTS[factors.healthCondition];

  // 5. Age adjustment
  const ageMultiplier = getAgeAdjustment(factors.age);
  const ageAdjustment = Math.round(baseAmount * ageMultiplier);

  // 6. Caffeine/Alcohol adjustments
  let otherAdjustments = 0;
  if (factors.caffeineIntake === 'moderate') otherAdjustments += 200;
  if (factors.caffeineIntake === 'high') otherAdjustments += 400;
  if (factors.alcoholIntake === 'occasional') otherAdjustments += 150;
  if (factors.alcoholIntake === 'regular') otherAdjustments += 300;

  // Calculate total
  const totalAdjustments = activityAdjustment + climateAdjustment + healthAdjustment + ageAdjustment + otherAdjustments;
  const recommendedGoal = Math.round((baseAmount + totalAdjustments) / 100) * 100; // Round to nearest 100ml

  // Calculate min/max range (±15%)
  const minimumGoal = Math.round(recommendedGoal * 0.85 / 100) * 100;
  const maximumGoal = Math.round(recommendedGoal * 1.15 / 100) * 100;

  // Generate tips
  const { tips, tipsMy } = generateTips(factors, recommendedGoal);

  return {
    recommendedGoal: Math.max(1500, Math.min(5000, recommendedGoal)), // Clamp between 1.5L and 5L
    minimumGoal: Math.max(1200, minimumGoal),
    maximumGoal: Math.min(6000, maximumGoal),
    breakdown: {
      baseAmount,
      activityAdjustment,
      climateAdjustment,
      healthAdjustment,
      otherAdjustments: ageAdjustment + otherAdjustments,
    },
    tips,
    tipsMy,
  };
};

/**
 * Simple calculation based on weight only (quick estimate)
 */
export const calculateSimpleGoal = (weightKg: number, activityLevel: ActivityLevel): number => {
  const base = weightKg * BASE_ML_PER_KG;
  const adjusted = base * ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(adjusted / 100) * 100;
};

/**
 * Generate personalized tips based on factors
 */
const generateTips = (factors: WaterGoalFactors, goal: number): { tips: string[]; tipsMy: string[] } => {
  const tips: string[] = [];
  const tipsMy: string[] = [];

  // Activity tips
  if (factors.activityLevel === 'active' || factors.activityLevel === 'very_active') {
    tips.push('Drink 500ml extra water for every hour of intense exercise');
    tipsMy.push('ပြင်းထန်သော လေ့ကျင့်ခန်း တစ်နာရီတိုင်း ရေ 500ml ပိုသောက်ပါ');
  }

  // Climate tips
  if (factors.climate === 'hot' || factors.climate === 'tropical') {
    tips.push('In hot weather, drink water before you feel thirsty');
    tipsMy.push('ပူပြင်းသောရာသီတွင် ရေငတ်မခံစားရမီ ရေသောက်ပါ');
  }

  // Caffeine tips
  if (factors.caffeineIntake !== 'none') {
    tips.push('For every cup of coffee, drink an extra glass of water');
    tipsMy.push('ကော်ဖီတစ်ခွက်တိုင်း ရေတစ်ဖန်ခွက် ပိုသောက်ပါ');
  }

  // Health tips
  if (factors.healthCondition === 'pregnant') {
    tips.push('Stay well hydrated for healthy pregnancy - consult your doctor');
    tipsMy.push('ကျန်းမာသော ကိုယ်ဝန်အတွက် ရေဓာတ်ပြည့်ဝအောင် ထားပါ - ဆရာဝန်နှင့် တိုင်ပင်ပါ');
  }

  // General tips
  tips.push('Start your day with a glass of water');
  tipsMy.push('နေ့စတင်ချိန် ရေတစ်ဖန်ခွက်ဖြင့် စတင်ပါ');

  tips.push('Keep a water bottle with you throughout the day');
  tipsMy.push('တစ်နေ့တာလုံး ရေပုလင်းတစ်လုံး ဆောင်ထားပါ');

  if (goal > 2500) {
    tips.push('Spread your intake evenly - aim for a glass every 1-2 hours');
    tipsMy.push('တစ်ညီတစ်ညာ သောက်ပါ - ၁-၂ နာရီတိုင်း တစ်ဖန်ခွက်');
  }

  return { tips, tipsMy };
};


// ============ EDUCATIONAL CONTENT ============

export interface HydrationFact {
  id: string;
  title: string;
  titleMy: string;
  content: string;
  contentMy: string;
  icon: string;
  category: 'science' | 'health' | 'tips' | 'myths';
}

export const HYDRATION_FACTS: HydrationFact[] = [
  {
    id: 'body-water',
    title: 'Your Body is 60% Water',
    titleMy: 'သင့်ခန္ဓာကိုယ်၏ ၆၀% သည် ရေဖြစ်သည်',
    content: 'Water is essential for every cell, tissue, and organ. Your brain is 73% water, lungs are 83% water, and even bones are 31% water.',
    contentMy: 'ရေသည် ဆဲလ်၊ တစ်ရှူး နှင့် အင်္ဂါအားလုံးအတွက် မရှိမဖြစ်လိုအပ်သည်။ ဦးနှောက်သည် ရေ ၇၃%၊ အဆုတ်သည် ရေ ၈၃%၊ အရိုးများပင် ရေ ၃၁% ပါဝင်သည်။',
    icon: '💧',
    category: 'science',
  },
  {
    id: 'dehydration-effects',
    title: 'Even Mild Dehydration Affects You',
    titleMy: 'အနည်းငယ် ရေဓာတ်ခန်းခြောက်ခြင်းပင် သင့်ကို သက်ရောက်သည်',
    content: 'Just 1-2% dehydration can impair cognitive function, mood, and physical performance. You may feel tired, have headaches, or difficulty concentrating.',
    contentMy: '၁-၂% ရေဓာတ်ခန်းခြောက်ရုံဖြင့် စဉ်းစားနိုင်စွမ်း၊ စိတ်ခံစားချက် နှင့် ကိုယ်ခန္ဓာစွမ်းဆောင်ရည်ကို ထိခိုက်နိုင်သည်။',
    icon: '🧠',
    category: 'health',
  },
  {
    id: 'weight-formula',
    title: 'The Weight-Based Formula',
    titleMy: 'ကိုယ်အလေးချိန်အခြေခံ ဖော်မြူလာ',
    content: 'A common guideline is 30-35ml of water per kg of body weight. A 70kg person needs about 2.1-2.5 liters daily as a baseline.',
    contentMy: 'အသုံးများသော လမ်းညွှန်ချက်မှာ ကိုယ်အလေးချိန် ၁ ကီလိုဂရမ်လျှင် ရေ ၃၀-၃၅ မီလီလီတာ ဖြစ်သည်။ ၇၀ ကီလိုဂရမ် လူတစ်ယောက်သည် နေ့စဉ် ၂.၁-၂.၅ လီတာ လိုအပ်သည်။',
    icon: '⚖️',
    category: 'science',
  },
  {
    id: 'activity-needs',
    title: 'Exercise Increases Water Needs',
    titleMy: 'လေ့ကျင့်ခန်းသည် ရေလိုအပ်ချက်ကို တိုးစေသည်',
    content: 'During exercise, you can lose 0.5-2 liters of water per hour through sweat. Drink 500ml extra for every hour of moderate to intense activity.',
    contentMy: 'လေ့ကျင့်ခန်းလုပ်စဉ် ချွေးထွက်ခြင်းဖြင့် တစ်နာရီလျှင် ရေ ၀.၅-၂ လီတာ ဆုံးရှုံးနိုင်သည်။ အလယ်အလတ်မှ ပြင်းထန်သော လှုပ်ရှားမှုတိုင်း ရေ ၅၀၀ မီလီလီတာ ပိုသောက်ပါ။',
    icon: '🏃',
    category: 'health',
  },
  {
    id: 'myth-8-glasses',
    title: 'The 8 Glasses Myth',
    titleMy: '၈ ဖန်ခွက် ဒဏ္ဍာရီ',
    content: 'The "8 glasses a day" rule has no scientific basis. Your actual needs depend on weight, activity, climate, and diet. Some people need more, some less.',
    contentMy: '"တစ်နေ့ ၈ ဖန်ခွက်" စည်းမျဉ်းသည် သိပ္ပံအခြေခံမရှိပါ။ သင့်အမှန်တကယ် လိုအပ်ချက်သည် ကိုယ်အလေးချိန်၊ လှုပ်ရှားမှု၊ ရာသီဥတု နှင့် အစားအသောက်ပေါ် မူတည်သည်။',
    icon: '🔍',
    category: 'myths',
  },
  {
    id: 'food-water',
    title: 'Food Provides Water Too',
    titleMy: 'အစားအစာများမှလည်း ရေရရှိသည်',
    content: 'About 20% of daily water intake comes from food. Fruits and vegetables like watermelon (92% water), cucumber (95%), and oranges (87%) contribute significantly.',
    contentMy: 'နေ့စဉ် ရေသောက်သုံးမှု၏ ၂၀% ခန့်သည် အစားအစာမှ ရရှိသည်။ ဖရဲသီး (ရေ ၉၂%)၊ သခွားသီး (၉၅%)၊ လိမ္မော်သီး (၈၇%) ကဲ့သို့ သစ်သီးနှင့် ဟင်းသီးဟင်းရွက်များသည် သိသိသာသာ အထောက်အကူပြုသည်။',
    icon: '🍉',
    category: 'tips',
  },
  {
    id: 'morning-water',
    title: 'Morning Hydration is Crucial',
    titleMy: 'နံနက်ခင်း ရေဓာတ်ဖြည့်တင်းခြင်း အရေးကြီးသည်',
    content: 'After 6-8 hours of sleep, your body is naturally dehydrated. Drinking water first thing in the morning kickstarts your metabolism and helps flush toxins.',
    contentMy: '၆-၈ နာရီ အိပ်ပြီးနောက် သင့်ခန္ဓာကိုယ်သည် သဘာဝအလျောက် ရေဓာတ်ခန်းခြောက်နေသည်။ နံနက်ခင်း ပထမဆုံး ရေသောက်ခြင်းသည် ဇီဝဖြစ်စဉ်ကို စတင်စေပြီး အဆိပ်အတောက်များကို ဖယ်ရှားရန် ကူညီသည်။',
    icon: '🌅',
    category: 'tips',
  },
  {
    id: 'urine-color',
    title: 'Check Your Urine Color',
    titleMy: 'သင့်ဆီးအရောင်ကို စစ်ဆေးပါ',
    content: 'Pale yellow urine indicates good hydration. Dark yellow or amber means you need more water. Clear urine might mean you\'re overhydrating.',
    contentMy: 'အဖျော့ရောင်ဝါ ဆီးသည် ရေဓာတ်ကောင်းကြောင်း ပြသည်။ အရောင်ရင့်ဝါ သို့မဟုတ် ပယင်းရောင်ဆိုလျှင် ရေပိုလိုအပ်သည်။ ကြည်လင်သော ဆီးသည် ရေအလွန်အကျွံ သောက်နေကြောင်း ဖြစ်နိုင်သည်။',
    icon: '🚽',
    category: 'tips',
  },
  {
    id: 'climate-impact',
    title: 'Climate Affects Your Needs',
    titleMy: 'ရာသီဥတုသည် သင့်လိုအပ်ချက်ကို သက်ရောက်သည်',
    content: 'Hot and humid weather increases water loss through sweat. In tropical climates, you may need 25-50% more water than in temperate regions.',
    contentMy: 'ပူပြင်းစိုထိုင်းသော ရာသီဥတုသည် ချွေးထွက်ခြင်းဖြင့် ရေဆုံးရှုံးမှုကို တိုးစေသည်။ အပူပိုင်းဒေသများတွင် သမပိုင်းဒေသများထက် ရေ ၂၅-၅၀% ပိုလိုအပ်နိုင်သည်။',
    icon: '🌡️',
    category: 'science',
  },
  {
    id: 'caffeine-myth',
    title: 'Coffee Doesn\'t Dehydrate You',
    titleMy: 'ကော်ဖီသည် သင့်ကို ရေဓာတ်မခန်းခြောက်စေပါ',
    content: 'Moderate caffeine intake (3-4 cups) doesn\'t cause significant dehydration. However, it\'s still good to balance coffee with water.',
    contentMy: 'အလယ်အလတ် ကဖိန်းသောက်သုံးမှု (၃-၄ ခွက်) သည် သိသာသော ရေဓာတ်ခန်းခြောက်မှုကို မဖြစ်စေပါ။ သို့သော် ကော်ဖီနှင့် ရေကို ချိန်ခွင်ညှိခြင်းသည် ကောင်းပါသည်။',
    icon: '☕',
    category: 'myths',
  },
];

// ============ PRESET GOALS ============

export interface PresetGoal {
  id: string;
  name: string;
  nameMy: string;
  amount: number;
  description: string;
  descriptionMy: string;
  icon: string;
  suitableFor: string;
  suitableForMy: string;
}

export const PRESET_GOALS: PresetGoal[] = [
  {
    id: 'light',
    name: 'Light',
    nameMy: 'ပေါ့ပါး',
    amount: 1500,
    description: '1.5 liters - Minimum for sedentary lifestyle',
    descriptionMy: '၁.၅ လီတာ - ထိုင်နေသော လူနေမှုပုံစံအတွက် အနည်းဆုံး',
    icon: '💧',
    suitableFor: 'Small body frame, sedentary work, cool climate',
    suitableForMy: 'ခန္ဓာကိုယ်သေးသူ၊ ထိုင်နေအလုပ်၊ အေးသောရာသီဥတု',
  },
  {
    id: 'moderate',
    name: 'Moderate',
    nameMy: 'အလယ်အလတ်',
    amount: 2000,
    description: '2 liters - Standard recommendation',
    descriptionMy: '၂ လီတာ - စံအကြံပြုချက်',
    icon: '💦',
    suitableFor: 'Average adult, light activity, temperate climate',
    suitableForMy: 'ပျမ်းမျှလူကြီး၊ ပေါ့ပါးသောလှုပ်ရှားမှု၊ သမပိုင်းရာသီဥတု',
  },
  {
    id: 'active',
    name: 'Active',
    nameMy: 'တက်ကြွ',
    amount: 2500,
    description: '2.5 liters - For active individuals',
    descriptionMy: '၂.၅ လီတာ - တက်ကြွသူများအတွက်',
    icon: '🏃',
    suitableFor: 'Regular exercise, moderate climate, larger body',
    suitableForMy: 'ပုံမှန်လေ့ကျင့်ခန်း၊ အလယ်အလတ်ရာသီဥတု၊ ခန္ဓာကိုယ်ကြီးသူ',
  },
  {
    id: 'athletic',
    name: 'Athletic',
    nameMy: 'အားကစား',
    amount: 3000,
    description: '3 liters - For athletes and heavy exercise',
    descriptionMy: '၃ လီတာ - အားကစားသမားများနှင့် ပြင်းထန်သောလေ့ကျင့်ခန်း',
    icon: '🏋️',
    suitableFor: 'Athletes, hot climate, physical labor',
    suitableForMy: 'အားကစားသမားများ၊ ပူပြင်းသောရာသီဥတု၊ ကိုယ်ကာယအလုပ်',
  },
  {
    id: 'intense',
    name: 'Intense',
    nameMy: 'ပြင်းထန်',
    amount: 3500,
    description: '3.5 liters - For extreme conditions',
    descriptionMy: '၃.၅ လီတာ - အလွန်အကျွံအခြေအနေများအတွက်',
    icon: '🔥',
    suitableFor: 'Professional athletes, tropical climate, heavy sweating',
    suitableForMy: 'ပရော်ဖက်ရှင်နယ်အားကစားသမားများ၊ အပူပိုင်းရာသီဥတု၊ ချွေးများများထွက်သူ',
  },
];
