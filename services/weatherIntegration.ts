import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const WEATHER_CACHE_KEY = 'weather_cache';
const WEATHER_SETTINGS_KEY = 'weather_settings';

export interface LocationDetails {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  climateZone: ClimateZone;
  elevation?: number;
}

export type ClimateZone =
  | 'tropical'
  | 'subtropical'
  | 'arid'
  | 'mediterranean'
  | 'temperate'
  | 'continental'
  | 'polar'
  | 'highland';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  conditionDescription: string;
  icon: string;
  location: string;
  locationDetails: LocationDetails;
  windSpeed: number;
  uvIndex: number;
  precipitation: number;
  pressure: number;
  visibility: number;
  dewPoint: number;
  heatIndex: number;
  lastUpdated: string;
}

export interface WeatherSettings {
  enabled: boolean;
  autoAdjustGoal: boolean;
  temperatureUnit: 'celsius' | 'fahrenheit';
}

export interface HydrationRecommendation {
  adjustedGoal: number;
  increasePercent: number;
  reason: string;
  reasonMy: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
  riskColor: string;
  detailedFactors: HydrationFactor[];
  urgencyMessage: string;
  urgencyMessageMy: string;
}

export interface HydrationFactor {
  factor: string;
  factorMy: string;
  impact: number;
  description: string;
  descriptionMy: string;
}

export const defaultWeatherSettings: WeatherSettings = {
  enabled: true,
  autoAdjustGoal: true,
  temperatureUnit: 'celsius',
};

// Determine climate zone based on latitude and location
const determineClimateZone = (
  latitude: number,
  country: string,
  elevation?: number
): ClimateZone => {
  const absLat = Math.abs(latitude);

  // High elevation areas
  if (elevation && elevation > 2500) {
    return 'highland';
  }

  // Polar regions
  if (absLat >= 66.5) {
    return 'polar';
  }

  // Tropical regions (near equator)
  if (absLat <= 23.5) {
    // Check for arid tropical regions
    const aridCountries = ['SA', 'AE', 'OM', 'YE', 'EG', 'LY', 'SD', 'TD', 'NE', 'ML'];
    if (aridCountries.includes(country)) {
      return 'arid';
    }
    return 'tropical';
  }

  // Subtropical regions
  if (absLat <= 35) {
    // Mediterranean climate countries/regions
    const mediterraneanCountries = ['IT', 'GR', 'ES', 'PT', 'HR', 'TR', 'IL', 'LB', 'TN', 'MA'];
    if (mediterraneanCountries.includes(country)) {
      return 'mediterranean';
    }

    // Arid subtropical
    const aridSubtropical = ['AU', 'ZA', 'MX', 'US']; // Parts of these
    if (aridSubtropical.includes(country) && absLat > 25) {
      return 'arid';
    }

    return 'subtropical';
  }

  // Temperate regions
  if (absLat <= 55) {
    // Continental climate (inland areas)
    const continentalCountries = ['RU', 'KZ', 'MN', 'CN', 'US', 'CA'];
    if (continentalCountries.includes(country)) {
      return 'continental';
    }
    return 'temperate';
  }

  // Subarctic/Continental
  return 'continental';
};

// Get location-specific hydration advice
export interface LocationAdvice {
  climateAdvice: string;
  climateAdviceMy: string;
  seasonalTip: string;
  seasonalTipMy: string;
  localFactors: string[];
  localFactorsMy: string[];
  baselineAdjustment: number;
  climateIcon: string;
}

export const getLocationSpecificAdvice = (
  locationDetails: LocationDetails,
  weather: WeatherData,
  language: string
): LocationAdvice => {
  const { climateZone, country, latitude } = locationDetails;
  const month = new Date().getMonth(); // 0-11
  const isNorthernHemisphere = latitude >= 0;

  // Determine season
  const isSummer = isNorthernHemisphere
    ? month >= 4 && month <= 9
    : month <= 2 || month >= 10;
  const isWinter = !isSummer;

  let climateAdvice = '';
  let climateAdviceMy = '';
  let seasonalTip = '';
  let seasonalTipMy = '';
  const localFactors: string[] = [];
  const localFactorsMy: string[] = [];
  let baselineAdjustment = 0;
  let climateIcon = '🌍';

  switch (climateZone) {
    case 'tropical':
      climateIcon = '🌴';
      baselineAdjustment = 20;
      climateAdvice = `You're in a tropical climate zone. High humidity and temperatures year-round mean your body needs 15-20% more water than temperate regions.`;
      climateAdviceMy = `သင်သည် အပူပိုင်းရာသီဥတုဇုန်တွင် ရှိနေသည်။ တစ်နှစ်ပတ်လုံး စိုထိုင်းမှုနှင့် အပူချိန်မြင့်မားခြင်းကြောင့် သင့်ခန္ဓာကိုယ်သည် အေးသောဒေသများထက် ရေ ၁၅-၂၀% ပိုလိုအပ်သည်။`;
      localFactors.push('Constant high humidity reduces sweat evaporation efficiency');
      localFactors.push('Year-round warm temperatures increase baseline fluid needs');
      localFactorsMy.push('အမြဲတမ်းစိုထိုင်းမှုမြင့်ခြင်းသည် ချွေးခြောက်ခြင်းစွမ်းရည်ကိုလျှော့ချသည်');
      localFactorsMy.push('တစ်နှစ်ပတ်လုံး နွေးသောအပူချိန်သည် အခြေခံအရည်လိုအပ်ချက်ကိုတိုးစေသည်');

      if (weather.humidity > 75) {
        seasonalTip = 'Current high humidity makes it harder for sweat to cool you - drink small amounts frequently rather than large amounts occasionally.';
        seasonalTipMy = 'လက်ရှိစိုထိုင်းမှုမြင့်ခြင်းသည် ချွေးက သင့်ကိုအေးစေရန် ခက်ခဲစေသည် - တစ်ခါတစ်ရံ အများကြီးသောက်မည့်အစား မကြာခဏ အနည်းငယ်စီသောက်ပါ။';
      } else {
        seasonalTip = 'Even on cooler tropical days, maintain consistent hydration as humidity still affects your body.';
        seasonalTipMy = 'အေးသော အပူပိုင်းရက်များတွင်ပင် စိုထိုင်းမှုသည် သင့်ခန္ဓာကိုယ်ကို ဆက်လက်သက်ရောက်နေသောကြောင့် တသမတ်တည်း ရေဓာတ်ထိန်းပါ။';
      }
      break;

    case 'subtropical':
      climateIcon = '🌺';
      baselineAdjustment = 15;
      climateAdvice = `Subtropical climate with distinct wet and dry seasons. Adjust your water intake based on seasonal humidity changes.`;
      climateAdviceMy = `မိုးရာသီနှင့် ခြောက်သွေ့ရာသီ ကွဲပြားသော ဆပ်ထရော့ပစ်ရာသီဥတု။ ရာသီအလိုက် စိုထိုင်းမှုပြောင်းလဲမှုအပေါ် မူတည်၍ ရေသောက်မှုကို ချိန်ညှိပါ။`;
      localFactors.push('Seasonal variation requires adapting hydration habits');
      localFactors.push('Summer months can be extremely demanding on fluid balance');
      localFactorsMy.push('ရာသီအလိုက် ကွဲပြားမှုသည် ရေဓာတ်ထိန်းသိမ်းမှုအလေ့အထကို လိုက်လျောညီထွေဖြစ်စေရန် လိုအပ်သည်');
      localFactorsMy.push('နွေရာသီလများသည် အရည်ဟန်ချက်ညီမှုအတွက် အလွန်ခက်ခဲနိုင်သည်');

      seasonalTip = isSummer
        ? 'Summer in subtropical regions demands extra vigilance - increase intake by 25-30% during peak heat hours.'
        : 'Milder season but don\'t reduce water intake too much - indoor heating/cooling can still dehydrate you.';
      seasonalTipMy = isSummer
        ? 'ဆပ်ထရော့ပစ်ဒေသများတွင် နွေရာသီသည် အထူးသတိထားရန် လိုအပ်သည် - အပူဆုံးအချိန်များတွင် ၂၅-၃၀% တိုးသောက်ပါ။'
        : 'ပိုအေးသောရာသီဖြစ်သော်လည်း ရေသောက်မှုကို အလွန်မလျှော့ပါနှင့် - အတွင်းပိုင်း အပူပေး/အအေးပေးစနစ်များသည် သင့်ကို ရေဓာတ်ခန်းခြောက်စေနိုင်သေးသည်။';
      break;

    case 'arid':
      climateIcon = '🏜️';
      baselineAdjustment = 25;
      climateAdvice = `Desert/arid climate with very low humidity. You lose water rapidly through evaporation, often without noticing sweating.`;
      climateAdviceMy = `စိုထိုင်းမှုအလွန်နိမ့်သော သဲကန္တာရ/ခြောက်သွေ့ရာသီဥတု။ ချွေးထွက်ခြင်းကို မသိလိုက်ဘဲ အငွေ့ပျံခြင်းမှတဆင့် ရေကို လျင်မြန်စွာ ဆုံးရှုံးသည်။`;
      localFactors.push('Extremely low humidity causes rapid invisible water loss');
      localFactors.push('Large day-night temperature swings affect hydration needs');
      localFactors.push('Dry air irritates airways - warm fluids help');
      localFactorsMy.push('အလွန်နိမ့်သောစိုထိုင်းမှုသည် မမြင်နိုင်သောရေဆုံးရှုံးမှုကို လျင်မြန်စွာဖြစ်စေသည်');
      localFactorsMy.push('နေ့နှင့်ည အပူချိန်ကွာခြားမှုကြီးမားခြင်းသည် ရေဓာတ်လိုအပ်ချက်ကို သက်ရောက်သည်');
      localFactorsMy.push('ခြောက်သွေ့သောလေသည် လေလမ်းကြောင်းကို ယားယံစေသည် - နွေးသောအရည်များက အထောက်အကူဖြစ်သည်');

      seasonalTip = 'In arid climates, drink water even when you don\'t feel thirsty. Set regular reminders as thirst is not a reliable indicator here.';
      seasonalTipMy = 'ခြောက်သွေ့သောရာသီဥတုတွင် မငတ်သော်လည်း ရေသောက်ပါ။ ဤနေရာတွင် ငတ်ခြင်းသည် ယုံကြည်စိတ်ချရသော အညွှန်းမဟုတ်သောကြောင့် ပုံမှန်သတိပေးချက်များ သတ်မှတ်ပါ။';
      break;

    case 'mediterranean':
      climateIcon = '🫒';
      baselineAdjustment = 10;
      climateAdvice = `Mediterranean climate with hot, dry summers and mild, wet winters. Summer hydration is critical.`;
      climateAdviceMy = `ပူပြင်းခြောက်သွေ့သော နွေရာသီနှင့် အေးမြစိုစွတ်သော ဆောင်းရာသီရှိသော မြေထဲပင်လယ်ရာသီဥတု။ နွေရာသီ ရေဓာတ်ထိန်းခြင်းသည် အရေးကြီးသည်။`;
      localFactors.push('Dry summer heat requires significant hydration increase');
      localFactors.push('Sea breezes can mask dehydration symptoms');
      localFactorsMy.push('ခြောက်သွေ့သော နွေရာသီအပူသည် ရေဓာတ်သိသိသာသာတိုးမြှင့်ရန် လိုအပ်သည်');
      localFactorsMy.push('ပင်လယ်လေသည် ရေဓာတ်ခန်းခြောက်မှုလက္ခဏာများကို ဖုံးကွယ်နိုင်သည်');

      seasonalTip = isSummer
        ? 'Mediterranean summers are deceptively dry - the sea breeze feels cooling but you\'re still losing fluids rapidly.'
        : 'Winter rains don\'t mean you need less water - indoor heating still dehydrates.';
      seasonalTipMy = isSummer
        ? 'မြေထဲပင်လယ်နွေရာသီများသည် လှည့်စားတတ်သော ခြောက်သွေ့မှုရှိသည် - ပင်လယ်လေသည် အေးမြသလိုခံစားရသော်လည်း အရည်များကို လျင်မြန်စွာ ဆုံးရှုံးနေဆဲဖြစ်သည်။'
        : 'ဆောင်းရာသီမိုးများသည် ရေနည်းနည်းလိုအပ်သည်ဟု မဆိုလိုပါ - အတွင်းပိုင်းအပူပေးစနစ်သည် ရေဓာတ်ခန်းခြောက်စေဆဲဖြစ်သည်။';
      break;

    case 'temperate':
      climateIcon = '🍂';
      baselineAdjustment = 5;
      climateAdvice = `Temperate climate with moderate conditions. Hydration needs vary significantly by season.`;
      climateAdviceMy = `အလယ်အလတ်အခြေအနေရှိသော အေးမြသောရာသီဥတု။ ရေဓာတ်လိုအပ်ချက်သည် ရာသီအလိုက် သိသိသာသာကွဲပြားသည်။`;
      localFactors.push('Four distinct seasons require adapting hydration habits');
      localFactors.push('Central heating in winter significantly increases water needs');
      localFactorsMy.push('ကွဲပြားသော ရာသီလေးခုသည် ရေဓာတ်ထိန်းသိမ်းမှုအလေ့အထကို လိုက်လျောညီထွေဖြစ်စေရန် လိုအပ်သည်');
      localFactorsMy.push('ဆောင်းရာသီတွင် ဗဟိုအပူပေးစနစ်သည် ရေလိုအပ်ချက်ကို သိသိသာသာတိုးစေသည်');

      seasonalTip = isSummer
        ? 'Summer heatwaves in temperate regions can be dangerous - your body isn\'t acclimatized to extreme heat.'
        : 'Cold weather reduces thirst sensation but not water needs - drink warm water or herbal teas.';
      seasonalTipMy = isSummer
        ? 'အေးမြသောဒေသများတွင် နွေရာသီအပူလှိုင်းများသည် အန္တရာယ်ရှိနိုင်သည် - သင့်ခန္ဓာကိုယ်သည် အလွန်အမင်းပူခြင်းနှင့် မကျွမ်းကျင်ပါ။'
        : 'အေးသောရာသီဥတုသည် ငတ်ခံစားမှုကို လျှော့ချသော်လည်း ရေလိုအပ်ချက်ကို မလျှော့ပါ - နွေးသောရေ သို့မဟုတ် ဆေးဖက်ဝင်လက်ဖက်ရည်များ သောက်ပါ။';
      break;

    case 'continental':
      climateIcon = '🌲';
      baselineAdjustment = 8;
      climateAdvice = `Continental climate with extreme temperature variations. Both hot summers and cold winters challenge hydration.`;
      climateAdviceMy = `အပူချိန်ကွာခြားမှု အလွန်ကြီးမားသော တိုက်ကြီးရာသီဥတု။ ပူသောနွေရာသီနှင့် အေးသောဆောင်းရာသီ နှစ်ခုစလုံးသည် ရေဓာတ်ထိန်းခြင်းကို စိန်ခေါ်သည်။`;
      localFactors.push('Extreme seasonal temperature swings require flexible hydration');
      localFactors.push('Very cold winters with dry indoor air increase water loss');
      localFactors.push('Hot summers can rival tropical heat');
      localFactorsMy.push('အလွန်အမင်း ရာသီအလိုက် အပူချိန်ပြောင်းလဲမှုသည် ပြောင်းလွယ်ပြင်လွယ် ရေဓာတ်ထိန်းခြင်း လိုအပ်သည်');
      localFactorsMy.push('ခြောက်သွေ့သော အတွင်းပိုင်းလေနှင့် အလွန်အေးသော ဆောင်းရာသီသည် ရေဆုံးရှုံးမှုကို တိုးစေသည်');
      localFactorsMy.push('ပူသောနွေရာသီများသည် အပူပိုင်းအပူနှင့် ယှဉ်နိုင်သည်');

      seasonalTip = isSummer
        ? 'Continental summers can be intensely hot - treat hydration as seriously as tropical regions during heat waves.'
        : 'Freezing temperatures and indoor heating create very dry conditions - humidify your space and drink warm fluids.';
      seasonalTipMy = isSummer
        ? 'တိုက်ကြီးနွေရာသီများသည် အလွန်ပူနိုင်သည် - အပူလှိုင်းများအတွင်း အပူပိုင်းဒေသများကဲ့သို့ ရေဓာတ်ထိန်းခြင်းကို အလေးအနက်ထားပါ။'
        : 'အေးခဲသောအပူချိန်နှင့် အတွင်းပိုင်းအပူပေးစနစ်သည် အလွန်ခြောက်သွေ့သောအခြေအနေများ ဖန်တီးသည် - သင့်နေရာကို စိုထိုင်းစေပြီး နွေးသောအရည်များ သောက်ပါ။';
      break;

    case 'highland':
      climateIcon = '🏔️';
      baselineAdjustment = 15;
      climateAdvice = `High altitude location. Lower air pressure and oxygen levels increase breathing rate and water loss.`;
      climateAdviceMy = `မြင့်မားသောအမြင့်တည်နေရာ။ လေဖိအားနှင့် အောက်ဆီဂျင်ပမာဏနိမ့်ခြင်းသည် အသက်ရှူနှုန်းနှင့် ရေဆုံးရှုံးမှုကို တိုးစေသည်။`;
      localFactors.push('Altitude increases respiratory water loss significantly');
      localFactors.push('Lower humidity at elevation accelerates dehydration');
      localFactors.push('UV radiation is stronger at high altitudes');
      localFactorsMy.push('အမြင့်သည် အသက်ရှူလမ်းကြောင်း ရေဆုံးရှုံးမှုကို သိသိသာသာတိုးစေသည်');
      localFactorsMy.push('မြင့်သောနေရာတွင် စိုထိုင်းမှုနိမ့်ခြင်းသည် ရေဓာတ်ခန်းခြောက်မှုကို မြန်ဆန်စေသည်');
      localFactorsMy.push('မြင့်မားသောအမြင့်တွင် UV ရောင်ခြည်သည် ပိုပြင်းသည်');

      seasonalTip = 'At high altitude, increase water intake by at least 500ml daily. Your body works harder to get oxygen, losing more water through breathing.';
      seasonalTipMy = 'မြင့်မားသောအမြင့်တွင် နေ့စဉ်ရေသောက်မှုကို အနည်းဆုံး ၅၀၀ml တိုးပါ။ သင့်ခန္ဓာကိုယ်သည် အောက်ဆီဂျင်ရရန် ပိုကြိုးစားရပြီး အသက်ရှူခြင်းမှတဆင့် ရေပိုဆုံးရှုံးသည်။';
      break;

    default:
      climateIcon = '🌍';
      climateAdvice = 'Monitor local weather conditions and adjust hydration accordingly.';
      climateAdviceMy = 'ဒေသတွင်းရာသီဥတုအခြေအနေများကို စောင့်ကြည့်ပြီး ရေဓာတ်ကို လိုက်လျောညီထွေချိန်ညှိပါ။';
      seasonalTip = 'Stay consistent with your water intake regardless of weather.';
      seasonalTipMy = 'ရာသီဥတုမည်သို့ပင်ဖြစ်စေ ရေသောက်မှုကို တသမတ်တည်းထားပါ။';
  }

  return {
    climateAdvice: language === 'my' ? climateAdviceMy : climateAdvice,
    climateAdviceMy,
    seasonalTip: language === 'my' ? seasonalTipMy : seasonalTip,
    seasonalTipMy,
    localFactors: language === 'my' ? localFactorsMy : localFactors,
    localFactorsMy,
    baselineAdjustment,
    climateIcon,
  };
};

// Calculate heat index (feels like temperature considering humidity)
const calculateHeatIndex = (tempC: number, humidity: number): number => {
  if (tempC < 27) return tempC;
  
  const T = (tempC * 9/5) + 32; // Convert to Fahrenheit for formula
  const R = humidity;
  
  let HI = -42.379 + 2.04901523 * T + 10.14333127 * R
    - 0.22475541 * T * R - 0.00683783 * T * T
    - 0.05481717 * R * R + 0.00122874 * T * T * R
    + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
  
  return Math.round((HI - 32) * 5/9); // Convert back to Celsius
};

// Calculate dew point
const calculateDewPoint = (tempC: number, humidity: number): number => {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha));
};

// Determine risk level based on conditions
const determineRiskLevel = (
  heatIndex: number,
  humidity: number,
  uvIndex: number
): { level: 'low' | 'moderate' | 'high' | 'extreme'; color: string } => {
  let riskScore = 0;
  
  // Heat index contribution
  if (heatIndex >= 41) riskScore += 4;
  else if (heatIndex >= 33) riskScore += 3;
  else if (heatIndex >= 27) riskScore += 2;
  else if (heatIndex >= 22) riskScore += 1;
  
  // Humidity contribution
  if (humidity < 30) riskScore += 2;
  else if (humidity > 80) riskScore += 1;
  
  // UV contribution
  if (uvIndex >= 8) riskScore += 2;
  else if (uvIndex >= 6) riskScore += 1;
  
  if (riskScore >= 6) return { level: 'extreme', color: '#D32F2F' };
  if (riskScore >= 4) return { level: 'high', color: '#F57C00' };
  if (riskScore >= 2) return { level: 'moderate', color: '#FBC02D' };
  return { level: 'low', color: '#4CAF50' };
};

// Calculate recommended water increase based on weather
export const calculateWeatherAdjustment = (weather: WeatherData, baseGoal: number): HydrationRecommendation => {
  const factors: HydrationFactor[] = [];
  let totalIncrease = 0;

  // Temperature factor
  if (weather.feelsLike >= 38) {
    totalIncrease += 35;
    factors.push({
      factor: 'Extreme Heat',
      factorMy: 'အလွန်ပူပြင်းခြင်း',
      impact: 35,
      description: `Feels like ${weather.feelsLike}°C - severe dehydration risk`,
      descriptionMy: `${weather.feelsLike}°C ခံစားရသည် - ပြင်းထန်သောရေဓာတ်ခန်းခြောက်မှုအန္တရာယ်`,
    });
  } else if (weather.feelsLike >= 33) {
    totalIncrease += 25;
    factors.push({
      factor: 'Very Hot',
      factorMy: 'အလွန်ပူသည်',
      impact: 25,
      description: `Feels like ${weather.feelsLike}°C - high fluid loss expected`,
      descriptionMy: `${weather.feelsLike}°C ခံစားရသည် - အရည်ဆုံးရှုံးမှုမြင့်မားမည်`,
    });
  } else if (weather.feelsLike >= 28) {
    totalIncrease += 15;
    factors.push({
      factor: 'Hot Weather',
      factorMy: 'ပူသောရာသီဥတု',
      impact: 15,
      description: `Feels like ${weather.feelsLike}°C - increased sweating likely`,
      descriptionMy: `${weather.feelsLike}°C ခံစားရသည် - ချွေးထွက်မှုပိုများနိုင်သည်`,
    });
  } else if (weather.feelsLike >= 24) {
    totalIncrease += 8;
    factors.push({
      factor: 'Warm Weather',
      factorMy: 'နွေးသောရာသီဥတု',
      impact: 8,
      description: `Comfortable ${weather.feelsLike}°C - mild increase recommended`,
      descriptionMy: `သက်တောင့်သက်သာ ${weather.feelsLike}°C - အနည်းငယ်တိုးမြှင့်ရန်အကြံပြုသည်`,
    });
  }

  // Humidity factor
  if (weather.humidity < 25) {
    totalIncrease += 20;
    factors.push({
      factor: 'Very Dry Air',
      factorMy: 'အလွန်ခြောက်သွေ့သောလေ',
      impact: 20,
      description: `${weather.humidity}% humidity - rapid moisture loss through breathing`,
      descriptionMy: `${weather.humidity}% စိုထိုင်းမှု - အသက်ရှူခြင်းမှတဆင့် အစိုဓာတ်လျင်မြန်စွာဆုံးရှုံးခြင်း`,
    });
  } else if (weather.humidity < 40) {
    totalIncrease += 12;
    factors.push({
      factor: 'Dry Conditions',
      factorMy: 'ခြောက်သွေ့သောအခြေအနေ',
      impact: 12,
      description: `${weather.humidity}% humidity - increased insensible water loss`,
      descriptionMy: `${weather.humidity}% စိုထိုင်းမှု - မသိမသာရေဆုံးရှုံးမှုတိုးလာခြင်း`,
    });
  } else if (weather.humidity > 85 && weather.feelsLike > 25) {
    totalIncrease += 15;
    factors.push({
      factor: 'High Humidity',
      factorMy: 'စိုထိုင်းမှုမြင့်မားခြင်း',
      impact: 15,
      description: `${weather.humidity}% humidity - sweat evaporation impaired`,
      descriptionMy: `${weather.humidity}% စိုထိုင်းမှု - ချွေးခြောက်ခြင်းအားနည်းသည်`,
    });
  } else if (weather.humidity > 70 && weather.feelsLike > 25) {
    totalIncrease += 8;
    factors.push({
      factor: 'Humid Weather',
      factorMy: 'စိုစွတ်သောရာသီဥတု',
      impact: 8,
      description: `${weather.humidity}% humidity - reduced cooling efficiency`,
      descriptionMy: `${weather.humidity}% စိုထိုင်းမှု - အအေးခံစွမ်းရည်ကျဆင်းခြင်း`,
    });
  }

  // UV Index factor
  if (weather.uvIndex >= 8) {
    totalIncrease += 15;
    factors.push({
      factor: 'Very High UV',
      factorMy: 'UV အလွန်မြင့်မားခြင်း',
      impact: 15,
      description: `UV Index ${weather.uvIndex} - sun exposure accelerates dehydration`,
      descriptionMy: `UV အညွှန်း ${weather.uvIndex} - နေရောင်ထိတွေ့မှုသည် ရေဓာတ်ခန်းခြောက်မှုကိုမြန်ဆန်စေသည်`,
    });
  } else if (weather.uvIndex >= 6) {
    totalIncrease += 10;
    factors.push({
      factor: 'High UV',
      factorMy: 'UV မြင့်မားခြင်း',
      impact: 10,
      description: `UV Index ${weather.uvIndex} - outdoor activity requires extra hydration`,
      descriptionMy: `UV အညွှန်း ${weather.uvIndex} - အပြင်လှုပ်ရှားမှုအတွက် ရေပိုသောက်ရန်လိုသည်`,
    });
  } else if (weather.uvIndex >= 3) {
    totalIncrease += 5;
    factors.push({
      factor: 'Moderate UV',
      factorMy: 'UV အလယ်အလတ်',
      impact: 5,
      description: `UV Index ${weather.uvIndex} - standard sun protection advised`,
      descriptionMy: `UV အညွှန်း ${weather.uvIndex} - ပုံမှန်နေကာကွယ်မှုအကြံပြုသည်`,
    });
  }

  // Wind factor (increases evaporation)
  if (weather.windSpeed >= 30) {
    totalIncrease += 10;
    factors.push({
      factor: 'Strong Wind',
      factorMy: 'လေပြင်းခြင်း',
      impact: 10,
      description: `${weather.windSpeed} km/h wind - accelerated skin moisture loss`,
      descriptionMy: `${weather.windSpeed} km/h လေ - အရေပြားအစိုဓာတ်ဆုံးရှုံးမှုမြန်ဆန်ခြင်း`,
    });
  } else if (weather.windSpeed >= 20) {
    totalIncrease += 5;
    factors.push({
      factor: 'Breezy',
      factorMy: 'လေတိုက်ခြင်း',
      impact: 5,
      description: `${weather.windSpeed} km/h wind - mild evaporative effect`,
      descriptionMy: `${weather.windSpeed} km/h လေ - အနည်းငယ်အငွေ့ပျံခြင်းအကျိုးသက်ရောက်မှု`,
    });
  }

  // Precipitation factor (rain can still cause dehydration through exertion)
  if (weather.precipitation > 0 && weather.feelsLike > 20) {
    factors.push({
      factor: 'Rain Activity',
      factorMy: 'မိုးရွာခြင်း',
      impact: 0,
      description: 'Rain doesn\'t reduce hydration needs - stay consistent',
      descriptionMy: 'မိုးရွာခြင်းသည် ရေဓာတ်လိုအပ်ချက်ကိုမလျှော့ပါ - တသမတ်တည်းထားပါ',
    });
  }

  const adjustedGoal = Math.round(baseGoal * (1 + totalIncrease / 100));
  const risk = determineRiskLevel(weather.heatIndex, weather.humidity, weather.uvIndex);

  // Generate urgency message
  let urgencyMessage = '';
  let urgencyMessageMy = '';
  
  if (risk.level === 'extreme') {
    urgencyMessage = '⚠️ Critical hydration conditions! Drink water every 15-20 minutes if outdoors.';
    urgencyMessageMy = '⚠️ အရေးကြီးသောရေဓာတ်အခြေအနေ! အပြင်ထွက်လျှင် ၁၅-၂၀ မိနစ်တိုင်း ရေသောက်ပါ။';
  } else if (risk.level === 'high') {
    urgencyMessage = '🔶 Elevated dehydration risk. Increase water intake and avoid prolonged sun exposure.';
    urgencyMessageMy = '🔶 ရေဓာတ်ခန်းခြောက်မှုအန္တရာယ်မြင့်မားသည်။ ရေပိုသောက်ပြီး နေရောင်ကြာရှည်ထိတွေ့ခြင်းကိုရှောင်ပါ။';
  } else if (risk.level === 'moderate') {
    urgencyMessage = '💧 Moderate conditions. Maintain regular hydration throughout the day.';
    urgencyMessageMy = '💧 အလယ်အလတ်အခြေအနေ။ တစ်နေ့တာလုံး ပုံမှန်ရေဓာတ်ထိန်းပါ။';
  } else {
    urgencyMessage = '✅ Good conditions for hydration. Follow your regular water intake schedule.';
    urgencyMessageMy = '✅ ရေဓာတ်အတွက် ကောင်းမွန်သောအခြေအနေ။ ပုံမှန်ရေသောက်အချိန်ဇယားအတိုင်းလိုက်နာပါ။';
  }

  // Build reason string
  const primaryFactors = factors.slice(0, 2).map(f => f.factor).join(' + ');
  const primaryFactorsMy = factors.slice(0, 2).map(f => f.factorMy).join(' + ');

  return {
    adjustedGoal,
    increasePercent: totalIncrease,
    reason: primaryFactors || 'Normal conditions',
    reasonMy: primaryFactorsMy || 'ပုံမှန်အခြေအနေ',
    riskLevel: risk.level,
    riskColor: risk.color,
    detailedFactors: factors,
    urgencyMessage,
    urgencyMessageMy,
  };
};

// Get weather icon based on condition
const getWeatherIcon = (condition: string): string => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('clear sky')) return '☀️';
  if (conditionLower.includes('mainly clear')) return '🌤️';
  if (conditionLower.includes('partly cloudy')) return '⛅';
  if (conditionLower.includes('overcast')) return '☁️';
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
  if (conditionLower.includes('drizzle')) return '🌦️';
  if (conditionLower.includes('heavy rain') || conditionLower.includes('violent')) return '🌧️';
  if (conditionLower.includes('rain')) return '🌧️';
  if (conditionLower.includes('snow')) return '❄️';
  if (conditionLower.includes('thunder')) return '⛈️';
  if (conditionLower.includes('hail')) return '🌨️';
  return '🌤️';
};

// Get detailed weather condition description
const getWeatherConditionDetails = (code: number): { condition: string; description: string } => {
  const conditions: Record<number, { condition: string; description: string }> = {
    0: { condition: 'Clear sky', description: 'Sunny and clear - ideal for outdoor activities with proper sun protection' },
    1: { condition: 'Mainly clear', description: 'Mostly sunny with minimal cloud cover' },
    2: { condition: 'Partly cloudy', description: 'Mix of sun and clouds - comfortable conditions' },
    3: { condition: 'Overcast', description: 'Full cloud cover - reduced UV but maintain hydration' },
    45: { condition: 'Foggy', description: 'Reduced visibility with fog - humid conditions' },
    48: { condition: 'Depositing rime fog', description: 'Freezing fog with ice deposits - cold and damp' },
    51: { condition: 'Light drizzle', description: 'Light precipitation - stay dry but hydrated' },
    53: { condition: 'Moderate drizzle', description: 'Steady light rain - umbrella recommended' },
    55: { condition: 'Dense drizzle', description: 'Heavy drizzle - wet conditions persist' },
    61: { condition: 'Slight rain', description: 'Light rainfall - brief showers expected' },
    63: { condition: 'Moderate rain', description: 'Steady rainfall - plan indoor activities' },
    65: { condition: 'Heavy rain', description: 'Heavy rainfall - flooding possible in low areas' },
    71: { condition: 'Slight snow', description: 'Light snowfall - cold conditions require warm fluids' },
    73: { condition: 'Moderate snow', description: 'Steady snowfall - dress warmly, stay hydrated' },
    75: { condition: 'Heavy snow', description: 'Heavy snowfall - limit outdoor exposure' },
    80: { condition: 'Slight rain showers', description: 'Brief scattered showers - intermittent rain' },
    81: { condition: 'Moderate rain showers', description: 'Frequent showers - keep rain gear handy' },
    82: { condition: 'Violent rain showers', description: 'Intense downpours - seek shelter' },
    95: { condition: 'Thunderstorm', description: 'Lightning and thunder - stay indoors' },
    96: { condition: 'Thunderstorm with hail', description: 'Severe storm with hail - dangerous conditions' },
    99: { condition: 'Thunderstorm with heavy hail', description: 'Extreme storm - take immediate shelter' },
  };
  return conditions[code] || { condition: 'Unknown', description: 'Weather data unavailable' };
};

// Fetch weather from Open-Meteo (free, no API key needed)
export const fetchWeather = async (): Promise<WeatherData | null> => {
  try {
    // Check cache first (valid for 30 minutes)
    const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime();
      if (cacheAge < 30 * 60 * 1000) {
        return cachedData;
      }
    }

    // Get location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return getDefaultWeather();
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Fetch comprehensive weather from Open-Meteo API (including elevation)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure,uv_index&timezone=auto`
    );

    if (!response.ok) {
      throw new Error('Weather API error');
    }

    const data = await response.json();
    const current = data.current;

    // Get location name using reverse geocoding
    const [locationInfo] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const { condition, description } = getWeatherConditionDetails(current.weather_code);
    const temperature = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const feelsLike = Math.round(current.apparent_temperature);
    const heatIndex = calculateHeatIndex(temperature, humidity);
    const dewPoint = calculateDewPoint(temperature, humidity);

    // Build detailed location info
    const countryCode = locationInfo?.isoCountryCode || '';
    const climateZone = determineClimateZone(latitude, countryCode, data.elevation);

    const locationDetails: LocationDetails = {
      city: locationInfo?.city || locationInfo?.subregion || 'Unknown',
      region: locationInfo?.region || '',
      country: locationInfo?.country || 'Unknown',
      countryCode,
      latitude,
      longitude,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      climateZone,
      elevation: data.elevation,
    };

    // Estimate visibility based on weather code (Open-Meteo doesn't provide this directly)
    let visibility = 10; // Default good visibility in km
    if (current.weather_code >= 45 && current.weather_code <= 48) visibility = 1; // Fog
    else if (current.weather_code >= 61 && current.weather_code <= 67) visibility = 5; // Rain
    else if (current.weather_code >= 95) visibility = 3; // Thunderstorm

    const weatherData: WeatherData = {
      temperature,
      feelsLike,
      humidity,
      condition,
      conditionDescription: description,
      icon: getWeatherIcon(condition),
      location: locationDetails.city,
      locationDetails,
      windSpeed: Math.round(current.wind_speed_10m),
      uvIndex: Math.round(current.uv_index || 0),
      precipitation: current.precipitation || 0,
      pressure: Math.round(current.surface_pressure || 1013),
      visibility,
      dewPoint,
      heatIndex,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return getDefaultWeather();
  }
};

const getDefaultWeather = (): WeatherData => ({
  temperature: 25,
  feelsLike: 25,
  humidity: 60,
  condition: 'Unknown',
  conditionDescription: 'Weather data unavailable - using default values',
  icon: '🌤️',
  location: 'Unknown',
  locationDetails: {
    city: 'Unknown',
    region: '',
    country: 'Unknown',
    countryCode: '',
    latitude: 0,
    longitude: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    climateZone: 'temperate',
  },
  windSpeed: 0,
  uvIndex: 0,
  precipitation: 0,
  pressure: 1013,
  visibility: 10,
  dewPoint: 16,
  heatIndex: 25,
  lastUpdated: new Date().toISOString(),
});

export const getWeatherSettings = async (): Promise<WeatherSettings> => {
  try {
    const data = await AsyncStorage.getItem(WEATHER_SETTINGS_KEY);
    return data ? { ...defaultWeatherSettings, ...JSON.parse(data) } : defaultWeatherSettings;
  } catch {
    return defaultWeatherSettings;
  }
};

export const saveWeatherSettings = async (settings: Partial<WeatherSettings>): Promise<void> => {
  const current = await getWeatherSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(updated));
};

// Get hydration tips based on weather
export const getWeatherHydrationTips = (weather: WeatherData, language: string): string[] => {
  const tips: { en: string[]; my: string[] } = { en: [], my: [] };

  // Temperature-based tips
  if (weather.heatIndex >= 38) {
    tips.en.push('🚨 Extreme heat alert! Drink 250ml water every 15-20 minutes when outdoors');
    tips.my.push('🚨 အလွန်ပူပြင်းမှုသတိပေးချက်! အပြင်ထွက်လျှင် ၁၅-၂၀ မိနစ်တိုင်း ရေ ၂၅၀ml သောက်ပါ');
  } else if (weather.heatIndex >= 33) {
    tips.en.push('🔥 High heat index - pre-hydrate before going outside and carry water');
    tips.my.push('🔥 အပူအညွှန်းမြင့်မားသည် - အပြင်မထွက်မီ ရေကြိုသောက်ပြီး ရေယူသွားပါ');
  } else if (weather.feelsLike >= 28) {
    tips.en.push('☀️ Warm conditions - increase water intake by sipping regularly');
    tips.my.push('☀️ နွေးသောအခြေအနေ - ပုံမှန်တစ်ကျိုက်ကျိုက်သောက်ခြင်းဖြင့် ရေပိုသောက်ပါ');
  }

  // Humidity-based tips
  if (weather.humidity < 30) {
    tips.en.push('💨 Very dry air increases invisible water loss - drink even when not thirsty');
    tips.my.push('💨 အလွန်ခြောက်သွေ့သောလေသည် မမြင်နိုင်သောရေဆုံးရှုံးမှုကိုတိုးစေသည် - မငတ်လည်းသောက်ပါ');
  } else if (weather.humidity < 45) {
    tips.en.push('🌬️ Low humidity - your body loses moisture through breathing faster');
    tips.my.push('🌬️ စိုထိုင်းမှုနိမ့်သည် - သင့်ခန္ဓာကိုယ်သည် အသက်ရှူခြင်းမှတဆင့် အစိုဓာတ်ပိုမြန်စွာဆုံးရှုံးသည်');
  } else if (weather.humidity > 80 && weather.feelsLike > 25) {
    tips.en.push('💦 High humidity impairs sweating - you may not feel thirsty but still need water');
    tips.my.push('💦 စိုထိုင်းမှုမြင့်ခြင်းသည် ချွေးထွက်ခြင်းကိုအားနည်းစေသည် - မငတ်သော်လည်း ရေလိုအပ်သေးသည်');
  }

  // UV-based tips
  if (weather.uvIndex >= 8) {
    tips.en.push('🌞 Very high UV - sun exposure dramatically increases fluid needs');
    tips.my.push('🌞 UV အလွန်မြင့်သည် - နေရောင်ထိတွေ့မှုသည် အရည်လိုအပ်ချက်ကို သိသိသာသာတိုးစေသည်');
  } else if (weather.uvIndex >= 6) {
    tips.en.push('☀️ High UV index - seek shade and hydrate frequently');
    tips.my.push('☀️ UV အညွှန်းမြင့်သည် - အရိပ်ရှာပြီး မကြာခဏရေသောက်ပါ');
  }

  // Wind-based tips
  if (weather.windSpeed >= 25) {
    tips.en.push('💨 Windy conditions accelerate skin moisture loss - apply lip balm and drink more');
    tips.my.push('💨 လေပြင်းအခြေအနေသည် အရေပြားအစိုဓာတ်ဆုံးရှုံးမှုကိုမြန်ဆန်စေသည် - နှုတ်ခမ်းဆေးလိမ်းပြီး ရေပိုသောက်ပါ');
  }

  // Condition-specific tips
  if (weather.condition.toLowerCase().includes('clear') || weather.condition.toLowerCase().includes('sunny')) {
    tips.en.push('🕶️ Clear skies mean direct sun - protect yourself and stay hydrated');
    tips.my.push('🕶️ ကောင်းကင်ကြည်လင်ခြင်းသည် နေရောင်တိုက်ရိုက်ထိခြင်းဖြစ်သည် - ကိုယ့်ကိုယ်ကိုကာကွယ်ပြီး ရေဓာတ်ထိန်းပါ');
  }

  if (weather.condition.toLowerCase().includes('rain')) {
    tips.en.push('🌧️ Rainy weather doesn\'t reduce hydration needs - maintain your water intake');
    tips.my.push('🌧️ မိုးရွာခြင်းသည် ရေဓာတ်လိုအပ်ချက်ကိုမလျှော့ပါ - ရေသောက်မှုကိုထိန်းထားပါ');
  }

  // Activity recommendations
  if (weather.heatIndex >= 30) {
    tips.en.push('🏃 If exercising, drink 500-1000ml extra per hour of activity');
    tips.my.push('🏃 လေ့ကျင့်ခန်းလုပ်လျှင် လှုပ်ရှားမှုတစ်နာရီလျှင် ရေ ၅၀၀-၁၀၀၀ml ပိုသောက်ပါ');
  }

  // Default tip if none apply
  if (tips.en.length === 0) {
    tips.en.push('✅ Good conditions - maintain steady hydration throughout the day');
    tips.my.push('✅ ကောင်းမွန်သောအခြေအနေ - တစ်နေ့တာလုံး တည်ငြိမ်သောရေဓာတ်ထိန်းပါ');
  }

  return language === 'my' ? tips.my : tips.en;
};

// Get weather summary for display
export const getWeatherSummary = (
  weather: WeatherData,
  language: string
): {
  headline: string;
  subtext: string;
  locationLine: string;
  metrics: { label: string; value: string; icon: string }[];
} => {
  const isEnglish = language !== 'my';
  const loc = weather.locationDetails;

  const headline = isEnglish
    ? `${weather.icon} ${weather.temperature}°C`
    : `${weather.icon} ${weather.temperature}°C`;

  const subtext = isEnglish
    ? `Feels like ${weather.feelsLike}°C • ${weather.condition}`
    : `${weather.feelsLike}°C ခံစားရသည် • ${weather.condition}`;

  // Build location line with city, region, country
  const locationParts = [loc.city];
  if (loc.region && loc.region !== loc.city) {
    locationParts.push(loc.region);
  }
  if (loc.country) {
    locationParts.push(loc.country);
  }
  const locationLine = locationParts.filter(Boolean).join(', ');

  const metrics = [
    {
      label: isEnglish ? 'Humidity' : 'စိုထိုင်းမှု',
      value: `${weather.humidity}%`,
      icon: '💧',
    },
    {
      label: isEnglish ? 'UV Index' : 'UV အညွှန်း',
      value: `${weather.uvIndex}`,
      icon: '☀️',
    },
    {
      label: isEnglish ? 'Wind' : 'လေ',
      value: `${weather.windSpeed} km/h`,
      icon: '💨',
    },
    {
      label: isEnglish ? 'Heat Index' : 'အပူအညွှန်း',
      value: `${weather.heatIndex}°C`,
      icon: '🌡️',
    },
  ];

  return { headline, subtext, locationLine, metrics };
};

// Get full location display string
export const getLocationDisplayString = (
  locationDetails: LocationDetails,
  format: 'short' | 'medium' | 'full' = 'medium'
): string => {
  const { city, region, country, climateZone, elevation } = locationDetails;

  switch (format) {
    case 'short':
      return city || 'Unknown';
    case 'medium':
      return [city, country].filter(Boolean).join(', ');
    case 'full':
      const parts = [city, region, country].filter(Boolean);
      let result = parts.join(', ');
      if (elevation && elevation > 500) {
        result += ` (${Math.round(elevation)}m elevation)`;
      }
      return result;
    default:
      return city || 'Unknown';
  }
};

// Get climate zone display info
export const getClimateZoneInfo = (
  climateZone: ClimateZone,
  language: string
): { name: string; icon: string; description: string } => {
  const isEnglish = language !== 'my';

  const zoneInfo: Record<
    ClimateZone,
    { name: string; nameMy: string; icon: string; description: string; descriptionMy: string }
  > = {
    tropical: {
      name: 'Tropical',
      nameMy: 'အပူပိုင်း',
      icon: '🌴',
      description: 'Hot and humid year-round',
      descriptionMy: 'တစ်နှစ်ပတ်လုံး ပူပြီး စိုစွတ်သည်',
    },
    subtropical: {
      name: 'Subtropical',
      nameMy: 'ဆပ်ထရော့ပစ်',
      icon: '🌺',
      description: 'Warm with distinct seasons',
      descriptionMy: 'ရာသီကွဲပြားပြီး နွေးသည်',
    },
    arid: {
      name: 'Arid/Desert',
      nameMy: 'ခြောက်သွေ့/သဲကန္တာရ',
      icon: '🏜️',
      description: 'Very dry with extreme temperatures',
      descriptionMy: 'အလွန်ခြောက်သွေ့ပြီး အပူချိန်အလွန်အမင်း',
    },
    mediterranean: {
      name: 'Mediterranean',
      nameMy: 'မြေထဲပင်လယ်',
      icon: '🫒',
      description: 'Dry summers, mild wet winters',
      descriptionMy: 'ခြောက်သွေ့သောနွေရာသီ၊ အေးမြစိုစွတ်သောဆောင်းရာသီ',
    },
    temperate: {
      name: 'Temperate',
      nameMy: 'အေးမြသော',
      icon: '🍂',
      description: 'Moderate with four seasons',
      descriptionMy: 'ရာသီလေးခုနှင့် အလယ်အလတ်',
    },
    continental: {
      name: 'Continental',
      nameMy: 'တိုက်ကြီး',
      icon: '🌲',
      description: 'Extreme seasonal variations',
      descriptionMy: 'ရာသီအလိုက် အလွန်အမင်းကွဲပြားမှု',
    },
    polar: {
      name: 'Polar',
      nameMy: 'ဝင်ရိုးစွန်း',
      icon: '🧊',
      description: 'Extremely cold year-round',
      descriptionMy: 'တစ်နှစ်ပတ်လုံး အလွန်အေးသည်',
    },
    highland: {
      name: 'Highland',
      nameMy: 'တောင်ပေါ်',
      icon: '🏔️',
      description: 'High altitude conditions',
      descriptionMy: 'မြင့်မားသောအမြင့်အခြေအနေ',
    },
  };

  const info = zoneInfo[climateZone];
  return {
    name: isEnglish ? info.name : info.nameMy,
    icon: info.icon,
    description: isEnglish ? info.description : info.descriptionMy,
  };
};

// Format last updated time
export const formatLastUpdated = (isoString: string, language: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (language === 'my') {
    if (diffMinutes < 1) return 'ယခုလေးတင်';
    if (diffMinutes < 60) return `${diffMinutes} မိနစ်အကြာက`;
    return `${Math.floor(diffMinutes / 60)} နာရီအကြာက`;
  }
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  return `${Math.floor(diffMinutes / 60)}h ago`;
};
