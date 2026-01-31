// Sound asset mappings for local audio files
// Add mp3 files to this directory and register them below

// Map of sound IDs to their local asset sources
const htoneRaiKhun = require('./htone-rai-khun.mp3');
const rollingWave = require('./rolling-wave.mp3');
const waterBubble = require('./water_bubble.wav');
const liquidBubble = require('./liquid_bubble.wav');
const rain = require('./Rain.mp3');
const stream = require('./Stream.mp3');
const thunderStorm = require('./Heavy-Thunderstorm.mp3');
const wind = require('./wind.mp3');
const forest = require('./Forest.mp3');
const oceanSound = require('./Ocean-Sounds.mp3');
const cricke = require('./Cricket.mp3');
const animal = require('./Animals.mp3');

export const SOUND_ASSETS: Record<string, number> = {
  'htone-rai-khun': htoneRaiKhun,
  'rolling-wave': rollingWave,
  'water-bubble': waterBubble,
  'liquid-bubble': liquidBubble,
  'animal': animal,
  'cricket': cricke,
  'forest': forest,
  'thunderstorm': thunderStorm,
  'oceanSound': oceanSound,
  'rain': rain,
  'stream': stream,
  'wind': wind,
};

// Notification sound assets
export const NOTIFICATION_SOUND_ASSETS: Record<string, number> = {
  'water-bubble': waterBubble,
  'liquid-bubble': liquidBubble,
};

// Check if a local asset exists for a sound ID
export const hasLocalAsset = (soundId: string): boolean => {
  return soundId in SOUND_ASSETS;
};

// Get local asset for a sound ID
export const getLocalAsset = (soundId: string): number | null => {
  return SOUND_ASSETS[soundId] || null;
};

// Get notification sound asset
export const getNotificationSoundAsset = (soundId: string): number | null => {
  return NOTIFICATION_SOUND_ASSETS[soundId] || null;
};
