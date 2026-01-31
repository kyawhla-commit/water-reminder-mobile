# Notification Sounds - Quick Start Guide

## 🚀 Quick Implementation

### 1. Initialize on App Start

Add to your app's initialization (e.g., `app/_layout.tsx` or `App.tsx`):

```typescript
import { initializeNotificationSounds } from '@/services/notificationSounds';

// In your app initialization
useEffect(() => {
  const init = async () => {
    await initializeNotificationSounds();
  };
  init();
}, []);
```

### 2. Let Users Select Sounds

The app already has a sound picker component. Users can access it via:
- **Settings → Notifications → Notification Sound**

Or use the component directly:

```typescript
import NotificationSoundPicker from '@/components/NotificationSoundPicker';

<NotificationSoundPicker
  visible={showPicker}
  onClose={() => setShowPicker(false)}
  onSoundChange={(soundId) => console.log('Selected:', soundId)}
/>
```

### 3. Test the Implementation

Use the test screen to verify everything works:
- Navigate to **Settings → Notifications → Test Notifications**
- Or go to `/notification-test` route

## 🎵 Available Sounds

| Sound | ID | Description |
|-------|-----|-------------|
| 💧 Water Bubble | `water-bubble` | Gentle water bubble sound (default) |
| 🫧 Liquid Bubble | `liquid-bubble` | Soft liquid bubble pop |
| 🔔 System Default | `default` | Device's default notification sound |
| 🔕 Silent | `silent` | No sound, visual only |

## 🔧 Common Tasks

### Get Current Sound
```typescript
import { getNotificationSound } from '@/services/notificationSounds';

const currentSound = await getNotificationSound();
console.log('Current sound:', currentSound); // 'water-bubble'
```

### Change Sound
```typescript
import { setNotificationSound } from '@/services/notificationSounds';

await setNotificationSound('liquid-bubble');
```

### Preview Sound
```typescript
import { previewNotificationSound, stopSoundPreview } from '@/services/notificationSounds';

// Play preview
await previewNotificationSound('water-bubble');

// Stop preview
await stopSoundPreview();
```

### Send Test Notification
```typescript
import { sendTestNotificationWithSound } from '@/services/notificationSounds';

// English
await sendTestNotificationWithSound('water-bubble', 'en');

// Burmese
await sendTestNotificationWithSound('water-bubble', 'my');
```

## 🐛 Troubleshooting

### Sound Not Playing?

1. **Check files exist:**
   ```bash
   ls -la assets/sounds/water_bubble.wav
   ls -la android/app/src/main/res/raw/water_bubble.wav
   ```

2. **Verify on real device:**
   - Emulators may not play sounds correctly
   - Test on actual Android/iOS device

3. **Check volume:**
   - Ensure device volume is up
   - Check notification volume specifically (Android)

4. **Try system default:**
   - Select "System Default" sound
   - If it works, issue is with custom sound files

### Preview Works But Notification Doesn't?

This means files are in `assets/sounds/` but missing from `android/app/src/main/res/raw/`:

```bash
# Copy sound files to Android resources
cp assets/sounds/water_bubble.wav android/app/src/main/res/raw/
cp assets/sounds/liquid_bubble.wav android/app/src/main/res/raw/

# Rebuild the app
npm run android
```

### Channel Not Updating?

Android caches notification channel settings. To force update:

1. **Uninstall app completely:**
   ```bash
   adb uninstall com.yourapp.package
   ```

2. **Reinstall:**
   ```bash
   npm run android
   ```

Or use the test screen which recreates the channel automatically.

## 📱 Platform Differences

### Android
- Sounds configured at channel level
- Must recreate channel to change sound
- Files must be in `res/raw/` directory
- Reference without extension: `'water_bubble'`

### iOS
- Sounds configured per notification
- More flexible sound management
- Files can be in app bundle
- Reference with extension: `'water_bubble.wav'`

## 🧪 Testing Checklist

- [ ] Sound files exist in both locations
- [ ] Preview works for all sounds
- [ ] Test notification plays sound
- [ ] Sound persists after app restart
- [ ] Bilingual labels display correctly
- [ ] Silent mode works (no sound)
- [ ] System default works

## 📚 API Reference

### Core Functions

```typescript
// Get/Set sound preference
getNotificationSound(): Promise<NotificationSoundId>
setNotificationSound(soundId: NotificationSoundId): Promise<void>

// Preview
previewNotificationSound(soundId: NotificationSoundId): Promise<boolean>
stopSoundPreview(): Promise<void>

// Testing
sendTestNotificationWithSound(soundId?: NotificationSoundId, language?: 'en' | 'my'): Promise<boolean>
validateSoundFiles(): Promise<{ valid: string[]; missing: string[] }>

// Initialization
initializeNotificationSounds(): Promise<void>
getNotificationChannelId(): string
```

### Sound Options

```typescript
interface NotificationSoundOption {
  id: NotificationSoundId;
  name: string;              // English name
  nameMy: string;            // Burmese name
  icon: string;              // Emoji icon
  description: string;       // English description
  descriptionMy: string;     // Burmese description
  androidSound: string | null;  // Android res/raw filename
  iosSound: string | null;      // iOS bundle filename
  previewAsset: any;            // require() for preview
  isPremium: boolean;           // Premium feature flag
}
```

## 🎯 Next Steps

1. ✅ Initialize sounds on app start
2. ✅ Test on real device
3. ✅ Verify all sounds work
4. 🔄 Add more custom sounds (optional)
5. 🔄 Implement premium sounds (optional)

## 💡 Tips

- **Keep sounds short** - 1-3 seconds max
- **Test on real devices** - Emulators are unreliable
- **Provide preview** - Let users hear before selecting
- **Include silent option** - Some users prefer visual-only
- **Use appropriate format** - WAV or MP3 work best
- **Bilingual support** - Always provide translations

## 🆘 Need Help?

Check the full documentation:
- [NOTIFICATION_SOUNDS_SETUP.md](./NOTIFICATION_SOUNDS_SETUP.md) - Complete setup guide
- [Test Script](../scripts/test-notification-sounds.ts) - Automated testing

Or run the test screen in the app:
```
Settings → Notifications → Test Notifications
```
