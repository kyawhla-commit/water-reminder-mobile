import AsyncStorage from '@react-native-async-storage/async-storage';

const PET_STORAGE_KEY = '@hydromate_virtual_pet';

export type PetType = 'plant' | 'fish' | 'cat';
export type PetMood = 'happy' | 'content' | 'thirsty' | 'sad';
export type PetStage = 'baby' | 'child' | 'teen' | 'adult' | 'master';

export interface VirtualPet {
  type: PetType;
  name: string;
  stage: PetStage;
  health: number; // 0-100
  happiness: number; // 0-100
  hydrationStreak: number;
  totalWaterDrunk: number;
  createdAt: string;
  lastFedAt: string;
  accessories: string[];
}

export interface PetConfig {
  type: PetType;
  name: string;
  nameMy: string;
  emoji: string;
  stages: { [key in PetStage]: string };
  moods: { [key in PetMood]: string };
}

export const PET_CONFIGS: PetConfig[] = [
  {
    type: 'plant',
    name: 'Hydro Plant',
    nameMy: 'ရေအပင်',
    emoji: '🌱',
    stages: {
      baby: '🌱',
      child: '🌿',
      teen: '🪴',
      adult: '🌳',
      master: '🌲',
    },
    moods: {
      happy: '✨',
      content: '💚',
      thirsty: '💧',
      sad: '🥀',
    },
  },
  {
    type: 'fish',
    name: 'Aqua Fish',
    nameMy: 'ရေငါး',
    emoji: '🐟',
    stages: {
      baby: '🐟',
      child: '🐠',
      teen: '🐡',
      adult: '🦈',
      master: '🐋',
    },
    moods: {
      happy: '🫧',
      content: '💙',
      thirsty: '😰',
      sad: '😢',
    },
  },
  {
    type: 'cat',
    name: 'Hydro Cat',
    nameMy: 'ရေကြောင်',
    emoji: '🐱',
    stages: {
      baby: '🐱',
      child: '😺',
      teen: '😸',
      adult: '🐈',
      master: '🦁',
    },
    moods: {
      happy: '😻',
      content: '😺',
      thirsty: '🙀',
      sad: '😿',
    },
  },
];

const STAGE_THRESHOLDS = {
  baby: 0,
  child: 5000, // 5L total
  teen: 20000, // 20L total
  adult: 50000, // 50L total
  master: 100000, // 100L total
};

export const getDefaultPet = (): VirtualPet => ({
  type: 'plant',
  name: 'Buddy',
  stage: 'baby',
  health: 100,
  happiness: 100,
  hydrationStreak: 0,
  totalWaterDrunk: 0,
  createdAt: new Date().toISOString(),
  lastFedAt: new Date().toISOString(),
  accessories: [],
});

export const loadPet = async (): Promise<VirtualPet | null> => {
  try {
    const data = await AsyncStorage.getItem(PET_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const savePet = async (pet: VirtualPet): Promise<void> => {
  await AsyncStorage.setItem(PET_STORAGE_KEY, JSON.stringify(pet));
};

export const createPet = async (type: PetType, name: string): Promise<VirtualPet> => {
  const pet: VirtualPet = {
    ...getDefaultPet(),
    type,
    name,
  };
  await savePet(pet);
  return pet;
};

export const feedPet = async (waterAmount: number): Promise<VirtualPet> => {
  let pet = await loadPet();
  if (!pet) pet = getDefaultPet();

  pet.totalWaterDrunk += waterAmount;
  pet.lastFedAt = new Date().toISOString();
  
  // Increase happiness based on water amount
  const happinessGain = Math.min(waterAmount / 50, 10);
  pet.happiness = Math.min(100, pet.happiness + happinessGain);
  
  // Increase health
  const healthGain = Math.min(waterAmount / 100, 5);
  pet.health = Math.min(100, pet.health + healthGain);

  // Update stage based on total water
  pet.stage = calculateStage(pet.totalWaterDrunk);

  await savePet(pet);
  return pet;
};

export const updatePetStreak = async (streak: number): Promise<VirtualPet> => {
  let pet = await loadPet();
  if (!pet) pet = getDefaultPet();

  pet.hydrationStreak = streak;
  
  // Bonus happiness for streaks
  if (streak > 0) {
    pet.happiness = Math.min(100, pet.happiness + streak);
  }

  await savePet(pet);
  return pet;
};

export const decayPetStats = async (): Promise<VirtualPet> => {
  let pet = await loadPet();
  if (!pet) pet = getDefaultPet();

  const lastFed = new Date(pet.lastFedAt);
  const now = new Date();
  const hoursSinceLastFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);

  // Decay happiness and health if not fed recently
  if (hoursSinceLastFed > 4) {
    const decayAmount = Math.min((hoursSinceLastFed - 4) * 2, 30);
    pet.happiness = Math.max(0, pet.happiness - decayAmount);
    pet.health = Math.max(20, pet.health - decayAmount / 2);
  }

  await savePet(pet);
  return pet;
};

export const calculateStage = (totalWater: number): PetStage => {
  if (totalWater >= STAGE_THRESHOLDS.master) return 'master';
  if (totalWater >= STAGE_THRESHOLDS.adult) return 'adult';
  if (totalWater >= STAGE_THRESHOLDS.teen) return 'teen';
  if (totalWater >= STAGE_THRESHOLDS.child) return 'child';
  return 'baby';
};

export const getPetMood = (pet: VirtualPet): PetMood => {
  if (pet.happiness >= 80 && pet.health >= 80) return 'happy';
  if (pet.happiness >= 50 && pet.health >= 50) return 'content';
  if (pet.happiness >= 30 || pet.health >= 30) return 'thirsty';
  return 'sad';
};

export const getPetConfig = (type: PetType): PetConfig => {
  return PET_CONFIGS.find(c => c.type === type) || PET_CONFIGS[0];
};

export const getPetEmoji = (pet: VirtualPet): string => {
  const config = getPetConfig(pet.type);
  return config.stages[pet.stage];
};

export const getPetMoodEmoji = (pet: VirtualPet): string => {
  const config = getPetConfig(pet.type);
  const mood = getPetMood(pet);
  return config.moods[mood];
};

export const getNextStageProgress = (pet: VirtualPet): { current: number; next: number; progress: number } => {
  const stages: PetStage[] = ['baby', 'child', 'teen', 'adult', 'master'];
  const currentIndex = stages.indexOf(pet.stage);
  
  if (currentIndex === stages.length - 1) {
    return { current: pet.totalWaterDrunk, next: STAGE_THRESHOLDS.master, progress: 100 };
  }

  const nextStage = stages[currentIndex + 1];
  const currentThreshold = STAGE_THRESHOLDS[pet.stage];
  const nextThreshold = STAGE_THRESHOLDS[nextStage];
  
  const progress = ((pet.totalWaterDrunk - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  
  return {
    current: pet.totalWaterDrunk,
    next: nextThreshold,
    progress: Math.min(100, Math.max(0, progress)),
  };
};

export const getPetMessage = (pet: VirtualPet, isBurmese: boolean): string => {
  const mood = getPetMood(pet);
  
  const messages = {
    happy: {
      en: ["I'm so happy! Keep drinking water! 💧", "You're the best! I feel amazing!", "Yay! We're doing great together!"],
      my: ["ကျွန်တော် အရမ်းပျော်တယ်! ရေဆက်သောက်ပါ! 💧", "သင်အကောင်းဆုံးပဲ! ကျွန်တော် အရမ်းကောင်းနေတယ်!", "ဟေး! ငါတို့အတူတူ ကောင်းနေတယ်!"],
    },
    content: {
      en: ["I'm doing okay! A little more water would be nice.", "Thanks for taking care of me!", "We're making progress!"],
      my: ["ကျွန်တော် အဆင်ပြေတယ်! ရေနည်းနည်းထပ်သောက်ရင် ကောင်းမယ်။", "ကျွန်တော့်ကို ဂရုစိုက်တဲ့အတွက် ကျေးဇူးတင်ပါတယ်!", "ငါတို့ တိုးတက်နေတယ်!"],
    },
    thirsty: {
      en: ["I'm getting thirsty... please drink some water!", "Don't forget about me! I need water too!", "A glass of water would help us both!"],
      my: ["ကျွန်တော် ရေငတ်လာပြီ... ရေသောက်ပါ!", "ကျွန်တော့်ကို မမေ့နဲ့နော်! ကျွန်တော်လည်း ရေလိုတယ်!", "ရေတစ်ခွက်က ငါတို့နှစ်ယောက်လုံးကို အထောက်အကူဖြစ်မယ်!"],
    },
    sad: {
      en: ["I'm not feeling well... please drink water soon!", "I miss you! Let's hydrate together!", "Help! I need water to feel better!"],
      my: ["ကျွန်တော် မကောင်းဘူး... ရေမြန်မြန်သောက်ပါ!", "သင့်ကို လွမ်းတယ်! အတူတူ ရေသောက်ကြစို့!", "ကူညီပါ! ကောင်းလာဖို့ ရေလိုတယ်!"],
    },
  };

  const langMessages = isBurmese ? messages[mood].my : messages[mood].en;
  return langMessages[Math.floor(Math.random() * langMessages.length)];
};
