# 🎵 Sleep Sounds & Audio Assets

This folder contains local audio files for the HydroMate app's sleep sounds and relaxation features.

## 📁 Folder Structure

```
assets/sounds/
├── index.ts          # Sound asset registry
├── README.md         # This file
├── rain.mp3          # Nature sounds
├── ocean.mp3
├── forest.mp3
├── ...
└── htone-rai-khun.mp3  # Music tracks
```

## 🌿 Sleep Sounds (Looping Ambient)

These are longer audio files (30s - 2min) that loop continuously for sleep/relaxation:

| File Name | Category | Description |
|-----------|----------|-------------|
| `rain.mp3` | Nature | Gentle rain falling |
| `thunder.mp3` | Nature | Distant thunderstorm |
| `ocean.mp3` | Nature | Ocean waves on shore |
| `forest.mp3` | Nature | Birds chirping in forest |
| `river.mp3` | Nature | Flowing stream |
| `wind.mp3` | Nature | Soft wind through trees |
| `fireplace.mp3` | Ambient | Crackling fire |
| `cafe.mp3` | Ambient | Coffee shop ambiance |
| `train.mp3` | Ambient | Train on tracks |
| `night.mp3` | Ambient | Night crickets |
| `white-noise.mp3` | Noise | Classic white noise |
| `pink-noise.mp3` | Noise | Softer balanced noise |
| `brown-noise.mp3` | Noise | Deep rumbling noise |
| `fan.mp3` | Noise | Steady fan humming |

## 🎶 Music Tracks

Relaxing songs for the music category:

| File Name | Artist/Title | Notes |
|-----------|--------------|-------|
| `htone-rai-khun.mp3` | ထွိုင်ရုဲင်းခွန် - 17 Years Old | Myanmar relaxation song |

## 📝 How to Add New Sounds

### Step 1: Get the Audio File
Download royalty-free audio from:
- [Freesound.org](https://freesound.org) - Free with attribution
- [Pixabay](https://pixabay.com/sound-effects/) - Free for commercial use
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free for commercial use
- [Zapsplat](https://www.zapsplat.com) - Free with attribution

### Step 2: Prepare the File
- Format: MP3 (recommended) or WAV
- Duration: 30 seconds to 2 minutes (will loop seamlessly)
- Quality: 128kbps or higher
- Sample Rate: 44.1kHz
- Keep file size under 2MB for app bundle optimization

### Step 3: Add to Project
1. Place the file in this folder (`assets/sounds/`)
2. Update `index.ts`:

```typescript
// Add the require statement
const rain = require('./rain.mp3');

// Add to SOUND_ASSETS map
export const SOUND_ASSETS: Record<string, number> = {
  'rain': rain,
  // ... other sounds
};
```

### Step 4: Register in Sleep Sounds Service
Edit `services/sleepSounds.ts` and add entry to `SLEEP_SOUNDS` array:

```typescript
{
  id: 'rain',
  name: 'Rain',
  nameMy: 'မိုးရွာသံ',
  icon: '🌧️',
  category: 'nature',
  description: 'Gentle rain falling on leaves',
  descriptionMy: 'အရွက်ပေါ်သို့ ဖွဲဖွဲမိုးရွာသံ',
  fallbackUrl: 'https://example.com/rain.mp3', // Optional fallback
  isPremium: false,
},
```

### Step 5: Rebuild
```bash
npx expo start --clear
```

## ⚙️ Metro Configuration

The app's `metro.config.js` is already configured to handle MP3 files as assets:

```javascript
config.resolver.assetExts.push('mp3');
```

## 🔊 Audio Playback Notes

- **Looping**: All sleep sounds loop automatically
- **Background Play**: Audio continues when app is backgrounded
- **Volume Control**: Users can adjust volume via the in-app slider
- **Progress Bar**: Shows current position in the audio track
- **Fallback**: If local asset missing, falls back to remote URL

## 📱 Platform Considerations

### Android
- MP3 files are bundled into the APK
- Larger files increase app download size

### iOS
- MP3 files are included in the app bundle
- Consider using AAC for better iOS optimization

## 🎨 Sound Categories

| Category | Icon | Description |
|----------|------|-------------|
| Nature | 🌿 | Natural environmental sounds |
| Ambient | 🏠 | Indoor/urban ambient sounds |
| Music | 🎵 | Relaxing music tracks |
| Noise | 📻 | White/pink/brown noise |

## ⚠️ Important Notes

1. **File Naming**: Use lowercase with hyphens (e.g., `white-noise.mp3`)
2. **Bundle Size**: Keep total sounds under 20MB for reasonable app size
3. **Licensing**: Ensure all audio is properly licensed for commercial use
4. **Attribution**: Keep track of attribution requirements in this README

## 📄 Attribution

| Sound | Source | License |
|-------|--------|---------|
| (Add your attributions here) | | |

---

*Last updated: January 2026*
