import AsyncStorage from '@react-native-async-storage/async-storage';

const ECO_IMPACT_KEY = 'eco_impact_data';

export interface EcoImpactData {
  totalWaterDrank: number; // in ml
  plasticBottlesSaved: number;
  co2Saved: number; // in grams
  treesEquivalent: number;
  lastUpdated: string;
}

// Average plastic bottle is 500ml
const BOTTLE_SIZE_ML = 500;
// CO2 to produce one plastic bottle: ~82.8g
const CO2_PER_BOTTLE = 82.8;
// One tree absorbs ~21kg CO2 per year
const CO2_PER_TREE_YEAR = 21000;

export const getEcoImpact = async (): Promise<EcoImpactData> => {
  try {
    const data = await AsyncStorage.getItem(ECO_IMPACT_KEY);
    return data ? JSON.parse(data) : {
      totalWaterDrank: 0,
      plasticBottlesSaved: 0,
      co2Saved: 0,
      treesEquivalent: 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return {
      totalWaterDrank: 0,
      plasticBottlesSaved: 0,
      co2Saved: 0,
      treesEquivalent: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

export const updateEcoImpact = async (waterAmount: number): Promise<EcoImpactData> => {
  const current = await getEcoImpact();
  
  const newTotal = current.totalWaterDrank + waterAmount;
  const bottlesSaved = Math.floor(newTotal / BOTTLE_SIZE_ML);
  const co2Saved = bottlesSaved * CO2_PER_BOTTLE;
  const treesEquivalent = co2Saved / CO2_PER_TREE_YEAR;

  const updated: EcoImpactData = {
    totalWaterDrank: newTotal,
    plasticBottlesSaved: bottlesSaved,
    co2Saved: Math.round(co2Saved),
    treesEquivalent: parseFloat(treesEquivalent.toFixed(3)),
    lastUpdated: new Date().toISOString(),
  };

  await AsyncStorage.setItem(ECO_IMPACT_KEY, JSON.stringify(updated));
  return updated;
};

export const getEcoFacts = (language: string): { icon: string; fact: string }[] => {
  const facts = {
    en: [
      { icon: '🌊', fact: 'It takes 3 liters of water to produce 1 liter of bottled water.' },
      { icon: '🏭', fact: 'Plastic bottles take 450 years to decompose in landfills.' },
      { icon: '🐢', fact: '8 million tons of plastic enter our oceans every year.' },
      { icon: '⚡', fact: 'Recycling one plastic bottle saves enough energy to power a lightbulb for 3 hours.' },
      { icon: '🌍', fact: 'Only 9% of all plastic ever produced has been recycled.' },
      { icon: '💧', fact: 'Using a reusable bottle for 1 year saves an average of 156 plastic bottles.' },
    ],
    my: [
      { icon: '🌊', fact: 'ပုလင်းရေ ၁ လီတာထုတ်လုပ်ရန် ရေ ၃ လီတာလိုအပ်သည်။' },
      { icon: '🏭', fact: 'ပလတ်စတစ်ပုလင်းများ ပျက်စီးရန် နှစ် ၄၅၀ ကြာသည်။' },
      { icon: '🐢', fact: 'နှစ်စဉ် ပလတ်စတစ်တန် ၈ သန်း သမုဒ္ဒရာထဲသို့ဝင်ရောက်သည်။' },
      { icon: '⚡', fact: 'ပလတ်စတစ်ပုလင်း ၁ ခုပြန်လည်အသုံးပြုခြင်းသည် မီးသီး ၃ နာရီစာစွမ်းအင်ချွေတာသည်။' },
      { icon: '🌍', fact: 'ထုတ်လုပ်ခဲ့သော ပလတ်စတစ်၏ ၉% သာ ပြန်လည်အသုံးပြုခဲ့သည်။' },
      { icon: '💧', fact: 'ပြန်သုံးပုလင်း ၁ နှစ်သုံးခြင်းသည် ပလတ်စတစ်ပုလင်း ၁၅၆ ခုချွေတာသည်။' },
    ],
  };
  return facts[language as keyof typeof facts] || facts.en;
};
