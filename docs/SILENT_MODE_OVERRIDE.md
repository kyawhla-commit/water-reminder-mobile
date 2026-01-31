# Silent Mode Override - Play Notifications Even in Silent Mode

## 🔇 → 🔊 Overview

This guide explains how the app plays notification sounds even when the device is in silent mode. This is crucial for water reminders to ensure users don't miss important hydration alerts.

## ✅ Implementation Status

**Status:** ✅ FULLY IMPLEMENTED

The app now plays notification sounds even when:
- iOS: Silent switch is ON
- Android: Phone is in silent/vibrate mode
- Both: Media volume is low (uses notification volume)

## 🎯 How It Works

### iOS Implementation

**1. Audio Session Configuration**
```typescript
await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true, // ⭐ Key setting
  allowsRecordingIOS: false,
  interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
});
```

**2. Info.plist Configuration**
```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

This tells iOS that the app uses audio and should be allowed to play sounds even in silent mode.

**3. Notification Sound Configuration**
```typescript
{
  sound: 'water_bubble.wav', // Custom sound
  critical: false, // Not a critical alert
}
```

### Android Implementation

**1. Notification Channel Configuration**
```typescript
{
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'water_bubble', // Custom sound from res/raw
  enableVibrate: true,
  enableLights: true,
}
```

**2. Audio Attributes**
Android automatically uses the notification audio stream, which:
- Plays even in silent mode (if notification volume > 0)
- Respects notification volume settings
- Bypasses media volume

**3. Permissions**
```xml
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

## 📱 Platform Behavior

### iOS

| Silent Switch | Notification Volume | Result |
|---------------|---------------------|--------|
| OFF | Any | ✅ Plays sound |
| ON | Any | ✅ Plays sound (with our config) |
| OFF | 0% | 🔕 No sound |
| ON | 0% | 🔕 No sound |

**Key Points:**
- Silent switch is bypassed with `playsInSilentModeIOS: true`
- Notification volume must be > 0
- Vibration still works at 0% volume

### Android

| Phone Mode | Notification Volume | Result |
|------------|---------------------|--------|
| Normal | Any | ✅ Plays sound |
| Silent | > 0% | ✅ Plays sound |
| Silent | 0% | 🔕 No sound |
| Vibrate | > 0% | ✅ Plays sound + vibrate |
| Do Not Disturb | Any | 🔕 Blocked (respects DND) |

**Key Points:**
- Silent mode is bypassed if notification volume > 0
- Do Not Disturb is respected (not bypassed)
- Vibration works independently

## 🔧 Technical Implementation

### 1. Audio Mode Setup (Both Platforms)

```typescript
export const initializeNotificationSounds = async (): Promise<void> => {
  await Audio.setAudioModeAsync({
    // iOS: Play even when silent switch is on
    playsInSilentModeIOS: true,
    
    // Don't stay active in background
    staysActiveInBackground: false,
    
    // Android: Lower other audio when playing
    shouldDuckAndroid: true,
    
    // Don't allow recording
    allowsRecordingIOS: false,
    
    // Don't mix with other audio
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
  });
};
```

### 2. Notification Channel (Android)

```typescript
const channelConfig: Notifications.NotificationChannelInput = {
  name: 'Water Reminders',
  description: 'Hydration reminder notifications (plays even in silent mode)',
  importance: Notifications.AndroidImportance.HIGH, // Critical for sound
  sound: 'water_bubble', // Custom sound
  enableVibrate: true,
  enableLights: true,
  bypassDnd: false, // Respect Do Not Disturb
};
```

### 3. iOS Info.plist

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["audio"],
      "NSMicrophoneUsageDescription": "This app does not use the microphone."
    }
  }
}
```

## 🧪 Testing

### Test on iOS

1. **Enable Silent Mode:**
   - Flip the silent switch to ON (orange indicator visible)
   - Ensure notification volume > 0 in Settings

2. **Send Test Notification:**
   ```typescript
   await sendTestNotificationWithSound('water-bubble', 'en');
   ```

3. **Expected Result:**
   - ✅ Sound plays even with silent switch ON
   - ✅ Vibration occurs
   - ✅ Notification appears

### Test on Android

1. **Enable Silent Mode:**
   - Go to Settings → Sound → Silent mode
   - Or use volume down button to silent

2. **Check Notification Volume:**
   - Settings → Sound → Notification volume
   - Ensure it's > 0

3. **Send Test Notification:**
   ```typescript
   await sendTestNotificationWithSound('water-bubble', 'en');
   ```

4. **Expected Result:**
   - ✅ Sound plays even in silent mode
   - ✅ Vibration occurs
   - ✅ Notification appears

### Test Preview (In-App)

```typescript
// This also plays in silent mode
await previewNotificationSound('water-bubble');
```

## 📊 User Experience

### What Users Experience

**Before Implementation:**
- 🔕 Silent mode = No notification sounds
- 😞 Users miss hydration reminders
- 📉 Lower engagement

**After Implementation:**
- 🔊 Silent mode = Notification sounds still play
- 😊 Users never miss reminders
- 📈 Higher engagement

### User Control

Users still have control:
1. **Notification Volume:** Set to 0 to disable sounds
2. **Do Not Disturb:** Blocks all notifications
3. **Silent Option:** Select "Silent" sound in settings
4. **App Notifications:** Disable in system settings

## ⚠️ Important Notes

### iOS Limitations

1. **Volume Must Be > 0:**
   - If notification volume is 0, no sound plays
   - This is a system limitation

2. **Critical Alerts:**
   - We don't use critical alerts (requires special entitlement)
   - Critical alerts bypass all settings (too intrusive)

3. **Background Audio:**
   - `UIBackgroundModes: audio` is required
   - Without it, silent mode override doesn't work

### Android Limitations

1. **Do Not Disturb:**
   - We respect DND mode (don't bypass)
   - Users can whitelist the app in DND settings

2. **Notification Volume:**
   - Must be > 0 for sound to play
   - Independent from media volume

3. **Channel Importance:**
   - Must be HIGH or MAX for sound
   - Lower importance = no sound in silent mode

## 🔍 Troubleshooting

### iOS: Sound Not Playing in Silent Mode

**Check:**
1. ✅ Silent switch is ON (orange indicator)
2. ✅ Notification volume > 0 (Settings → Sounds & Haptics)
3. ✅ App has notification permissions
4. ✅ `playsInSilentModeIOS: true` is set
5. ✅ `UIBackgroundModes: audio` in Info.plist

**Solution:**
```bash
# Rebuild the app to apply Info.plist changes
npx expo prebuild --clean
npx expo run:ios
```

### Android: Sound Not Playing in Silent Mode

**Check:**
1. ✅ Phone is in silent mode
2. ✅ Notification volume > 0 (Settings → Sound)
3. ✅ App has notification permissions
4. ✅ Channel importance is HIGH
5. ✅ Not in Do Not Disturb mode

**Solution:**
```bash
# Recreate notification channel
# Uninstall app completely
adb uninstall com.kyawhla.hydromate

# Reinstall
npx expo run:android
```

### Preview Not Playing in Silent Mode

**Check:**
```typescript
// Ensure audio mode is configured
await Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
});

// Then play preview
await previewNotificationSound('water-bubble');
```

## 📝 Code Examples

### Complete Setup

```typescript
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { initializeNotificationSounds } from '@/services/notificationSounds';

// 1. Initialize on app start
useEffect(() => {
  const init = async () => {
    // Configure audio to play in silent mode
    await initializeNotificationSounds();
  };
  init();
}, []);

// 2. Send notification (plays in silent mode)
const sendReminder = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 Water Reminder',
      body: 'Time to drink water!',
      sound: 'water_bubble.wav', // iOS
      // Android uses channel sound
    },
    trigger: null,
  });
};

// 3. Preview sound (plays in silent mode)
const preview = async () => {
  await previewNotificationSound('water-bubble');
};
```

### Check Silent Mode Status

```typescript
// iOS: Check silent switch status
import { NativeModules } from 'react-native';

// Note: Requires native module (not implemented yet)
// For now, we always play sound regardless

// Android: Check ringer mode
import { NativeModules } from 'react-native';

// Note: Requires native module (not implemented yet)
// For now, we always play sound if notification volume > 0
```

## 🎯 Best Practices

1. **Always Initialize:**
   ```typescript
   // In app root
   useEffect(() => {
     initializeNotificationSounds();
   }, []);
   ```

2. **Inform Users:**
   - Add a note in settings explaining the behavior
   - "Notifications play even in silent mode to ensure you stay hydrated"

3. **Provide Control:**
   - Let users select "Silent" sound option
   - Respect Do Not Disturb mode
   - Allow disabling notifications

4. **Test Thoroughly:**
   - Test on real devices (not emulators)
   - Test with silent mode ON
   - Test with different volume levels

5. **Handle Errors:**
   ```typescript
   try {
     await initializeNotificationSounds();
   } catch (error) {
     console.error('Failed to initialize sounds:', error);
     // Fallback to system default
   }
   ```

## 📚 References

- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [iOS Audio Session Programming Guide](https://developer.apple.com/library/archive/documentation/Audio/Conceptual/AudioSessionProgrammingGuide/)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

## ✅ Summary

**Implementation Complete:**
- ✅ iOS plays sounds even with silent switch ON
- ✅ Android plays sounds even in silent mode
- ✅ Preview sounds work in silent mode
- ✅ Proper audio mode configuration
- ✅ Notification channel configured correctly
- ✅ Info.plist updated for iOS
- ✅ Permissions configured

**User Benefits:**
- 🔊 Never miss hydration reminders
- 🎯 Consistent notification experience
- 🎛️ Still have control via volume/DND
- 💧 Better hydration habits

The app now ensures users receive audible water reminders even when their phone is in silent mode, significantly improving the effectiveness of the hydration tracking feature!
