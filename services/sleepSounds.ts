import { getLocalAsset, hasLocalAsset } from '@/assets/sounds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVPlaybackSource } from 'expo-av';

const SLEEP_SOUNDS_KEY = '@hydromate_sleep_sounds';

export type SoundCategory = 'nature' | 'ambient' | 'music' | 'noise';

export interface SleepSound {
  id: string;
  name: string;
  nameMy: string;
  icon: string;
  category: SoundCategory;
  description: string;
  descriptionMy: string;
  // Fallback URL if local asset not available
  fallbackUrl: string;
  isPremium: boolean;
}

// Get the audio source for a sound (local asset or remote URL)
// Returns null if no valid source is available
export const getSoundSource = (sound: SleepSound): AVPlaybackSource | null => {
  // Prefer local asset if available
  const localAsset = getLocalAsset(sound.id);
  if (localAsset !== null) {
    // Local asset is a number (require() returns a number for assets)
    return localAsset as AVPlaybackSource;
  }
  // Fall back to remote URL if available
  if (sound.fallbackUrl && sound.fallbackUrl.trim() !== '') {
    return { uri: sound.fallbackUrl };
  }
  // No valid source available
  return null;
};

// Check if sound is playable (has either local asset or valid fallback URL)
export const isSoundPlayable = (sound: SleepSound): boolean => {
  return hasLocalAsset(sound.id) || (!!sound.fallbackUrl && sound.fallbackUrl.trim() !== '');
};

// Check if sound has local asset
export const isSoundLocal = (soundId: string): boolean => {
  return hasLocalAsset(soundId);
};

export interface SoundMix {
  id: string;
  name: string;
  nameMy: string;
  sounds: { soundId: string; volume: number }[];
  createdAt: string;
}

export interface SleepSoundSettings {
  favorites: string[];
  recentlyPlayed: string[];
  customMixes: SoundMix[];
  sleepTimer: number | null; // minutes
  fadeOutDuration: number; // seconds
  lastPlayedSoundId: string | null;
}

// Sleep sounds data
// Local assets are preferred when available (add .mp3 files to assets/sounds/)
// Falls back to remote URLs if local assets not found
export const SLEEP_SOUNDS: SleepSound[] = [
  // Nature Sounds
  {
    id: 'rain',
    name: 'Rain',
    nameMy: 'မိုးရွာသံ',
    icon: '🌧️',
    category: 'nature',
    description: 'Gentle rain falling on leaves',
    descriptionMy: 'အရွက်ပေါ်သို့ ဖွဲဖွဲမိုးရွာသံ',
    fallbackUrl: 'https://www.soundjay.com/nature/rain-01.mp3',
    isPremium: false,
  },
  {
    id: 'thunderstorm',
    name: 'Thunderstorm',
    nameMy: 'မိုးကြိုးသံ',
    icon: '⛈️',
    category: 'nature',
    description: 'Distant thunder with rain',
    descriptionMy: 'အဝေးမှ မိုးကြိုးသံနှင့် မိုးရွာသံ',
    fallbackUrl: 'https://www.soundjay.com/nature/thunder-01.mp3',
    isPremium: false,
  },
  {
    id: 'rolling-wave',
    name: 'Ocean Waves',
    nameMy: 'ပင်လယ်လှိုင်းသံ',
    icon: '🌊',
    category: 'nature',
    description: 'Calm ocean waves on the shore',
    descriptionMy: 'ကမ်းခြေပေါ်သို့ ငြိမ်သက်သော လှိုင်းသံ',
    fallbackUrl: 'https://www.soundjay.com/nature/ocean-wave-1.mp3',
    isPremium: false,
  },
  {
    id: 'forest',
    name: 'Forest',
    nameMy: 'တောတောင်သံ',
    icon: '🌲',
    category: 'nature',
    description: 'Birds chirping in a peaceful forest',
    descriptionMy: 'ငြိမ်သက်သော တောထဲမှ ငှက်မြည်သံ',
    fallbackUrl: 'https://www.soundjay.com/nature/birds-1.mp3',
    isPremium: false,
  },
  {
    id: 'stream',
    name: 'River Stream',
    nameMy: 'မြစ်ချောင်းသံ',
    icon: '🏞️',
    category: 'nature',
    description: 'Gentle flowing water',
    descriptionMy: 'ဖြည်းဖြည်းစီးဆင်းသော ရေသံ',
    fallbackUrl: 'https://www.soundjay.com/nature/stream-1.mp3',
    isPremium: false,
  },
  {
    id: 'wind',
    name: 'Wind',
    nameMy: 'လေတိုက်သံ',
    icon: '💨',
    category: 'nature',
    description: 'Soft wind through trees',
    descriptionMy: 'သစ်ပင်များကြားမှ ဖြတ်သန်းသော လေသံ',
    fallbackUrl: 'https://www.soundjay.com/nature/wind-howl-1.mp3',
    isPremium: false,
  },
  // Ambient Sounds
  {
    id: 'cricke',
    name: 'Fireplace',
    nameMy: 'မီးလှုံသံ',
    icon: '🔥',
    category: 'ambient',
    description: 'Crackling fireplace',
    descriptionMy: 'ပြိတ်ပြိတ်မြည်သော မီးလှုံသံ',
    fallbackUrl: 'https://www.soundjay.com/nature/campfire-1.mp3',
    isPremium: false,
  },
  // {
  //   id: 'cafe',
  //   name: 'Coffee Shop',
  //   nameMy: 'ကော်ဖီဆိုင်',
  //   icon: '☕',
  //   category: 'ambient',
  //   description: 'Quiet cafe ambiance',
  //   descriptionMy: 'တိတ်ဆိတ်သော ကော်ဖီဆိုင်ပတ်ဝန်းကျင်',
  //   fallbackUrl: 'https://www.soundjay.com/human/restaurant-ambience-1.mp3',
  //   isPremium: false,
  // },
  // {
  //   id: 'train',
  //   name: 'Train Journey',
  //   nameMy: 'ရထားခရီး',
  //   icon: '🚂',
  //   category: 'ambient',
  //   description: 'Rhythmic train on tracks',
  //   descriptionMy: 'သံလမ်းပေါ်မှ ရထားသံ',
  //   fallbackUrl: 'https://www.soundjay.com/transportation/train-pass-by-1.mp3',
  //   isPremium: false,
  // },
  // {
  //   id: 'night',
  //   name: 'Night Crickets',
  //   nameMy: 'ညပိုးမွှားသံ',
  //   icon: '🦗',
  //   category: 'ambient',
  //   description: 'Peaceful night with crickets',
  //   descriptionMy: 'ငြိမ်သက်သော ညနှင့် ပိုးမွှားသံ',
  //   fallbackUrl: 'https://www.soundjay.com/nature/crickets-1.mp3',
  //   isPremium: false,
  // },
  // White/Pink/Brown Noise
  // {
  //   id: 'white-noise',
  //   name: 'White Noise',
  //   nameMy: 'အဖြူရောင်ဆူညံသံ',
  //   icon: '📻',
  //   category: 'noise',
  //   description: 'Classic white noise',
  //   descriptionMy: 'ရိုးရာအဖြူရောင်ဆူညံသံ',
  //   fallbackUrl: 'https://www.soundjay.com/misc/static-noise-1.mp3',
  //   isPremium: false,
  // },
  // {
  //   id: 'pink-noise',
  //   name: 'Pink Noise',
  //   nameMy: 'ပန်းရောင်ဆူညံသံ',
  //   icon: '🎀',
  //   category: 'noise',
  //   description: 'Softer, balanced noise',
  //   descriptionMy: 'ပိုပျော့ပြီး ချိန်ညှိထားသော ဆူညံသံ',
  //   fallbackUrl: 'https://www.soundjay.com/nature/rain-03.mp3',
  //   isPremium: false,
  // },
  // {
  //   id: 'brown-noise',
  //   name: 'Brown Noise',
  //   nameMy: 'အညိုရောင်ဆူညံသံ',
  //   icon: '🟤',
  //   category: 'noise',
  //   description: 'Deep, rumbling noise',
  //   descriptionMy: 'နက်ရှိုင်းသော ဂွမ်းဂွမ်းမြည်သံ',
  //   fallbackUrl: 'https://www.soundjay.com/nature/thunder-02.mp3',
  //   isPremium: false,
  // },
  // {
  //   id: 'fan',
  //   name: 'Fan',
  //   nameMy: 'ပန်ကာသံ',
  //   icon: '🌀',
  //   category: 'noise',
  //   description: 'Steady fan humming',
  //   descriptionMy: 'တည်ငြိမ်သော ပန်ကာသံ',
  //   fallbackUrl: 'https://www.soundjay.com/mechanical/air-conditioner-1.mp3',
  //   isPremium: false,
  // },
  // Music - Relaxing songs
  {
    id: 'htone-rai-khun',
    name: '17 Years Old',
    nameMy: '၁၇အရွယ် - ထွိုင်ရုဲင်းခွန်',
    icon: '🎵',
    category: 'music',
    description: 'Htone Rai Khun - Relaxing Myanmar song',
    descriptionMy: 'ထွိုင်ရုဲင်းခွန် - အနားယူရန် မြန်မာသီချင်း',
    fallbackUrl: '',
    isPremium: false,
  },
];

// Preset mixes
export const PRESET_MIXES: SoundMix[] = [
  {
    id: 'rainy-night',
    name: 'Rainy Night',
    nameMy: 'မိုးရွာသောည',
    sounds: [
      { soundId: 'rain', volume: 0.7 },
      { soundId: 'thunder', volume: 0.3 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cozy-cabin',
    name: 'Cozy Cabin',
    nameMy: 'နွေးထွေးသောအိမ်',
    sounds: [
      { soundId: 'fireplace', volume: 0.6 },
      { soundId: 'rain', volume: 0.4 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'beach-retreat',
    name: 'Beach Retreat',
    nameMy: 'ကမ်းခြေအနားယူ',
    sounds: [
      { soundId: 'ocean', volume: 0.7 },
      { soundId: 'wind', volume: 0.3 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'forest-morning',
    name: 'Forest Morning',
    nameMy: 'တောတောင်နံနက်ခင်း',
    sounds: [
      { soundId: 'forest', volume: 0.6 },
      { soundId: 'river', volume: 0.4 },
    ],
    createdAt: new Date().toISOString(),
  },
];

const getDefaultSettings = (): SleepSoundSettings => ({
  favorites: [],
  recentlyPlayed: [],
  customMixes: [],
  sleepTimer: null,
  fadeOutDuration: 30,
  lastPlayedSoundId: null,
});

export const loadSleepSoundSettings = async (): Promise<SleepSoundSettings> => {
  try {
    const data = await AsyncStorage.getItem(SLEEP_SOUNDS_KEY);
    return data ? { ...getDefaultSettings(), ...JSON.parse(data) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
};

export const saveSleepSoundSettings = async (settings: SleepSoundSettings): Promise<void> => {
  await AsyncStorage.setItem(SLEEP_SOUNDS_KEY, JSON.stringify(settings));
};

export const toggleFavorite = async (soundId: string): Promise<SleepSoundSettings> => {
  const settings = await loadSleepSoundSettings();
  const index = settings.favorites.indexOf(soundId);
  if (index >= 0) {
    settings.favorites.splice(index, 1);
  } else {
    settings.favorites.push(soundId);
  }
  await saveSleepSoundSettings(settings);
  return settings;
};

export const addToRecentlyPlayed = async (soundId: string): Promise<void> => {
  const settings = await loadSleepSoundSettings();
  settings.recentlyPlayed = [soundId, ...settings.recentlyPlayed.filter(id => id !== soundId)].slice(0, 10);
  settings.lastPlayedSoundId = soundId;
  await saveSleepSoundSettings(settings);
};

export const getSoundById = (id: string): SleepSound | undefined => {
  return SLEEP_SOUNDS.find(s => s.id === id);
};

export const getSoundsByCategory = (category: SoundCategory): SleepSound[] => {
  return SLEEP_SOUNDS.filter(s => s.category === category);
};

export const saveSleepTimer = async (minutes: number | null): Promise<void> => {
  const settings = await loadSleepSoundSettings();
  settings.sleepTimer = minutes;
  await saveSleepSoundSettings(settings);
};

export const saveCustomMix = async (mix: SoundMix): Promise<void> => {
  const settings = await loadSleepSoundSettings();
  const existingIndex = settings.customMixes.findIndex(m => m.id === mix.id);
  if (existingIndex >= 0) {
    settings.customMixes[existingIndex] = mix;
  } else {
    settings.customMixes.push(mix);
  }
  await saveSleepSoundSettings(settings);
};

export const deleteCustomMix = async (mixId: string): Promise<void> => {
  const settings = await loadSleepSoundSettings();
  settings.customMixes = settings.customMixes.filter(m => m.id !== mixId);
  await saveSleepSoundSettings(settings);
};

export const TIMER_OPTIONS = [
  { value: 15, label: '15 min', labelMy: '၁၅ မိနစ်' },
  { value: 30, label: '30 min', labelMy: '၃၀ မိနစ်' },
  { value: 45, label: '45 min', labelMy: '၄၅ မိနစ်' },
  { value: 60, label: '1 hour', labelMy: '၁ နာရီ' },
  { value: 90, label: '1.5 hours', labelMy: '၁.၅ နာရီ' },
  { value: 120, label: '2 hours', labelMy: '၂ နာရီ' },
];

export const CATEGORIES: { id: SoundCategory; name: string; nameMy: string; icon: string }[] = [
  { id: 'nature', name: 'Nature', nameMy: 'သဘာဝ', icon: '🌿' },
  { id: 'ambient', name: 'Ambient', nameMy: 'ပတ်ဝန်းကျင်', icon: '🏠' },
  { id: 'music', name: 'Music', nameMy: 'သီချင်း', icon: '🎵' },
  { id: 'noise', name: 'Noise', nameMy: 'ဆူညံသံ', icon: '📻' },
];
