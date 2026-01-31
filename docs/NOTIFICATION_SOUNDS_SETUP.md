# Notification Sounds Setup Guide

## Overview
This guide explains how to implement and test custom notification sounds for water reminders in the HydroMate app.

## Sound Files

### Available Sounds
1. **Water Bubble** (`water_bubble.wav`) - Gentle water bubble sound
2. **Liquid Bubble** (`liquid_bubble.wav`) - Soft liquid bubble pop sound
3. **System Default** - Uses device's default notification sound
4. **Silent** - No sound, visual notification only

### File Locations

#### Assets (for preview in app)
```
assets/sounds/
├── water_bubble.wav
└── liquid_bubble.wav
```

#### Android Resources (for actual notifications)
```
android/app/src/main/res/raw/
├── water_bubble.wav
└── liquid_bubble.wav
```

**Important:** Sound files must be in both locations:
- `assets/sounds/` - Used for in-app preview with expo-av
- `android/app/src/main/res/raw/` - Used by Android notification system

## Implementation Details

### 1. Notification Channel Management

Android requires notification channels to be configured with sounds. The channel ID is:
```typescript
const NOTIFICATION_CHANNEL_ID = 'hydromate-water-reminders';
```

**Key Points:**
- Android doesn't allow modifying channel sound after creation
- To change sound, we delete and recreate the channel
- Channel configuration includes sound, vibration, lights, and priority

### 2. Sound Configuration

```typescript
export interface NotificationSoundOption {
  id: NotificationSoundId;
  name: string;
  nameMy: string;
  icon: string;
  description: string;
  descriptionMy: string;
  androidSound: string | null;  // Filename in res/raw (without extension)
  iosSound: string | null;       // Filename for iOS
  previewAsset: any;             // require() for preview
  isPremium: boolean;
}
```

### 3. Platform Differences

#### Android
- Sounds are configured at the channel level
- Reference files in `res/raw` without extension: `'water_bubble'`
- Channel must be recreated to change sound

#### iOS
- Sounds can be specified per notification
- Reference files with extension: `'water_bubble.wav'`
- More flexible sound management

## Testing

### 1. In-App Preview
Users can preview sounds before selecting them:
```typescript
await previewNotificationSound('water-bubble');
```

### 2. Test Notification
Send a test notification with the selected sound:
```typescript
await sendTestNotificationWithSound('water-bubble', 'en');
```

### 3. Validate Sound Files
Check if sound files exist and can be loaded:
```typescript
const { valid, missing } = await validateSoundFiles();
console.log('Valid sounds:', valid);
console.log('Missing sounds:', missing);
```

## Usage in App

### 1. Initialize on App Start
```typescript
import { initializeNotificationSounds } from '@/services/notificationSounds';

// In your app initialization
await initializeNotificationSounds();
```

### 2. User Selection
Users can select sounds via:
- Settings → Notifications → Notification Sound
- Or directly in the NotificationSoundPicker component

### 3. Automatic Application
When a sound is selected:
1. Preference is saved to AsyncStorage
2. Android notification channel is updated
3. All future notifications use the new sound

## Troubleshooting

### Sound Not Playing

1. **Check file exists in both locations:**
   ```bash
   ls -la assets/sounds/water_bubble.wav
   ls -la android/app/src/main/res/raw/water_bubble.wav
   ```

2. **Verify channel configuration:**
   ```typescript
   const channels = await Notifications.getNotificationChannelsAsync();
   console.log('Channels:', channels);
   ```

3. **Test with system default first:**
   - Select "System Default" sound
   - If it works, issue is with custom sound files

4. **Check Android logs:**
   ```bash
   npx react-native log-android
   ```

### Preview Works But Notification Doesn't

This usually means:
- File exists in `assets/sounds/` (preview works)
- File missing in `android/app/src/main/res/raw/` (notification fails)

**Solution:** Copy sound files to Android resources:
```bash
cp assets/sounds/water_bubble.wav android/app/src/main/res/raw/
cp assets/sounds/liquid_bubble.wav android/app/src/main/res/raw/
```

### Channel Not Updating

Android caches channel settings. To force update:
1. Uninstall the app completely
2. Reinstall
3. Or use the test screen to recreate channel

## Adding New Sounds

### 1. Add Sound File
```bash
# Add to assets
cp new_sound.wav assets/sounds/

# Add to Android resources
cp new_sound.wav android/app/src/main/res/raw/
```

### 2. Update Sound Options
```typescript
// In services/notificationSounds.ts
export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  // ... existing sounds
  {
    id: 'new-sound',
    name: 'New Sound',
    nameMy: 'အသံအသစ်',
    icon: '🎵',
    description: 'Description',
    descriptionMy: 'ဖော်ပြချက်',
    androidSound: 'new_sound',
    iosSound: 'new_sound.wav',
    previewAsset: require('../assets/sounds/new_sound.wav'),
    isPremium: false,
  },
];
```

### 3. Update Type
```typescript
export type NotificationSoundId =
  | 'default'
  | 'water-bubble'
  | 'liquid-bubble'
  | 'new-sound'  // Add here
  | 'silent';
```

## Best Practices

1. **Keep sounds short** - 1-3 seconds max
2. **Use appropriate format** - WAV or MP3
3. **Test on real devices** - Emulators may not play sounds correctly
4. **Provide preview** - Let users hear before selecting
5. **Include silent option** - Some users prefer visual-only
6. **Bilingual labels** - Support multiple languages

## API Reference

### Main Functions

```typescript
// Get current sound preference
getNotificationSound(): Promise<NotificationSoundId>

// Set sound preference
setNotificationSound(soundId: NotificationSoundId): Promise<void>

// Preview sound in app
previewNotificationSound(soundId: NotificationSoundId): Promise<boolean>

// Stop preview
stopSoundPreview(): Promise<void>

// Send test notification
sendTestNotificationWithSound(soundId?: NotificationSoundId, language?: 'en' | 'my'): Promise<boolean>

// Initialize system
initializeNotificationSounds(): Promise<void>

// Validate files
validateSoundFiles(): Promise<{ valid: string[]; missing: string[] }>

// Get channel ID
getNotificationChannelId(): string
```

## Integration with Smart Notifications

The notification sounds service integrates with the smart notifications system:

```typescript
import { getNotificationChannelId } from '@/services/notificationSounds';
import { scheduleSmartReminders } from '@/services/smartNotifications';

// Smart reminders automatically use the selected sound
await scheduleSmartReminders(settings);
```

The channel ID is used when scheduling notifications to ensure they use the correct sound configuration.
