# Notification Sounds API Reference

## Quick Reference

### Import
```typescript
import {
  // Types
  NotificationSoundId,
  NotificationSoundOption,
  NOTIFICATION_SOUNDS,
  
  // Core Functions
  getNotificationSound,
  setNotificationSound,
  getSoundOption,
  
  // Preview
  previewNotificationSound,
  stopSoundPreview,
  
  // Testing
  sendTestNotificationWithSound,
  validateSoundFiles,
  
  // Initialization
  initializeNotificationSounds,
  getNotificationChannelId,
} from '@/services/notificationSounds';
```

## Types

### NotificationSoundId
```typescript
type NotificationSoundId = 
  | 'default'
  | 'water-bubble'
  | 'liquid-bubble'
  | 'silent';
```

### NotificationSoundOption
```typescript
interface NotificationSoundOption {
  id: NotificationSoundId;
  name: string;              // English name
  nameMy: string;            // Burmese name
  icon: string;              // Emoji icon
  description: string;       // English description
  descriptionMy: string;     // Burmese description
  androidSound: string | null;  // Android filename (no ext)
  iosSound: string | null;      // iOS filename (with ext)
  previewAsset: any;            // require() for preview
  isPremium: boolean;           // Premium flag
}
```

## Constants

### NOTIFICATION_SOUNDS
```typescript
const NOTIFICATION_SOUNDS: NotificationSoundOption[]
```
Array of all available sound options.

**Example:**
```typescript
NOTIFICATION_SOUNDS.forEach(sound => {
  console.log(`${sound.icon} ${sound.name}`);
});
```

## Core Functions

### getNotificationSound()
Get the currently selected notification sound.

**Signature:**
```typescript
getNotificationSound(): Promise<NotificationSoundId>
```

**Returns:** Promise resolving to the sound ID

**Default:** `'water-bubble'`

**Example:**
```typescript
const currentSound = await getNotificationSound();
console.log('Current sound:', currentSound); // 'water-bubble'
```

---

### setNotificationSound()
Set the notification sound preference.

**Signature:**
```typescript
setNotificationSound(soundId: NotificationSoundId): Promise<void>
```

**Parameters:**
- `soundId` - The sound ID to set

**Side Effects:**
- Saves to AsyncStorage
- Recreates Android notification channel (if Android)

**Example:**
```typescript
await setNotificationSound('liquid-bubble');
```

---

### getSoundOption()
Get the full sound option object by ID.

**Signature:**
```typescript
getSoundOption(soundId: NotificationSoundId): NotificationSoundOption | undefined
```

**Parameters:**
- `soundId` - The sound ID to look up

**Returns:** Sound option object or undefined

**Example:**
```typescript
const option = getSoundOption('water-bubble');
console.log(option.name);        // 'Water Bubble'
console.log(option.nameMy);      // 'ရေပူဖောင်းသံ'
console.log(option.icon);        // '💧'
```

## Preview Functions

### previewNotificationSound()
Play a sound preview in the app.

**Signature:**
```typescript
previewNotificationSound(soundId: NotificationSoundId): Promise<boolean>
```

**Parameters:**
- `soundId` - The sound ID to preview

**Returns:** Promise resolving to success boolean

**Notes:**
- Uses expo-av for playback
- Auto-stops when finished
- Returns true for 'silent' and 'default' (no preview available)

**Example:**
```typescript
const success = await previewNotificationSound('water-bubble');
if (success) {
  console.log('Preview playing...');
}
```

---

### stopSoundPreview()
Stop the currently playing preview.

**Signature:**
```typescript
stopSoundPreview(): Promise<void>
```

**Example:**
```typescript
await stopSoundPreview();
```

## Testing Functions

### sendTestNotificationWithSound()
Send a test notification with the specified sound.

**Signature:**
```typescript
sendTestNotificationWithSound(
  soundId?: NotificationSoundId,
  language?: 'en' | 'my'
): Promise<boolean>
```

**Parameters:**
- `soundId` - Sound to test (optional, defaults to current)
- `language` - Language for message (optional, defaults to 'en')

**Returns:** Promise resolving to success boolean

**Side Effects:**
- Recreates Android channel with specified sound
- Sends immediate notification

**Example:**
```typescript
// Test current sound in English
await sendTestNotificationWithSound();

// Test specific sound in Burmese
await sendTestNotificationWithSound('liquid-bubble', 'my');
```

---

### validateSoundFiles()
Validate that all sound files exist and can be loaded.

**Signature:**
```typescript
validateSoundFiles(): Promise<{
  valid: string[];
  missing: string[];
}>
```

**Returns:** Promise resolving to validation results

**Example:**
```typescript
const { valid, missing } = await validateSoundFiles();
console.log('Valid sounds:', valid);     // ['water-bubble', 'liquid-bubble']
console.log('Missing sounds:', missing); // []

if (missing.length > 0) {
  console.error('Missing sound files:', missing);
}
```

## Initialization Functions

### initializeNotificationSounds()
Initialize the notification sounds system.

**Signature:**
```typescript
initializeNotificationSounds(): Promise<void>
```

**Side Effects:**
- Configures audio mode
- Sets up Android notification channel (if Android)
- Logs initialization status

**Usage:** Call once on app startup

**Example:**
```typescript
// In app initialization
useEffect(() => {
  initializeNotificationSounds();
}, []);
```

---

### getNotificationChannelId()
Get the notification channel ID.

**Signature:**
```typescript
getNotificationChannelId(): string
```

**Returns:** The channel ID string

**Value:** `'hydromate-water-reminders'`

**Example:**
```typescript
const channelId = getNotificationChannelId();
console.log('Channel ID:', channelId);
```

## Usage Examples

### Basic Setup
```typescript
import { initializeNotificationSounds } from '@/services/notificationSounds';

// Initialize on app start
useEffect(() => {
  const init = async () => {
    await initializeNotificationSounds();
  };
  init();
}, []);
```

### Sound Selection UI
```typescript
import { 
  NOTIFICATION_SOUNDS, 
  getNotificationSound,
  setNotificationSound,
  previewNotificationSound 
} from '@/services/notificationSounds';

const [selectedSound, setSelectedSound] = useState<NotificationSoundId>('water-bubble');

// Load current sound
useEffect(() => {
  const load = async () => {
    const current = await getNotificationSound();
    setSelectedSound(current);
  };
  load();
}, []);

// Handle selection
const handleSelect = async (soundId: NotificationSoundId) => {
  setSelectedSound(soundId);
  await setNotificationSound(soundId);
};

// Handle preview
const handlePreview = async (soundId: NotificationSoundId) => {
  await previewNotificationSound(soundId);
};

// Render
return (
  <View>
    {NOTIFICATION_SOUNDS.map(sound => (
      <TouchableOpacity
        key={sound.id}
        onPress={() => handleSelect(sound.id)}
      >
        <Text>{sound.icon} {sound.name}</Text>
        <TouchableOpacity onPress={() => handlePreview(sound.id)}>
          <Text>Preview</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ))}
  </View>
);
```

### Testing
```typescript
import { 
  validateSoundFiles,
  sendTestNotificationWithSound 
} from '@/services/notificationSounds';

// Validate files
const { valid, missing } = await validateSoundFiles();
if (missing.length > 0) {
  Alert.alert('Error', `Missing sound files: ${missing.join(', ')}`);
}

// Send test
const success = await sendTestNotificationWithSound('water-bubble', 'en');
if (success) {
  Alert.alert('Success', 'Test notification sent!');
}
```

### Bilingual Support
```typescript
import { getSoundOption } from '@/services/notificationSounds';
import { useTranslation } from '@/hooks/useTranslation';

const { t } = useTranslation();
const isBurmese = t('common.done') === 'ပြီးပါပြီ';

const sound = getSoundOption('water-bubble');
const name = isBurmese ? sound.nameMy : sound.name;
const description = isBurmese ? sound.descriptionMy : sound.description;

console.log(name);        // 'Water Bubble' or 'ရေပူဖောင်းသံ'
console.log(description); // English or Burmese description
```

## Error Handling

All async functions use try-catch internally and return safe defaults:

```typescript
// getNotificationSound - returns 'water-bubble' on error
try {
  const sound = await getNotificationSound();
} catch {
  // Already handled, returns default
}

// previewNotificationSound - returns false on error
const success = await previewNotificationSound('water-bubble');
if (!success) {
  console.log('Preview failed');
}

// sendTestNotificationWithSound - returns false on error
const sent = await sendTestNotificationWithSound();
if (!sent) {
  Alert.alert('Error', 'Could not send test notification');
}
```

## Platform Differences

### Android
```typescript
// Sound configured at channel level
await setNotificationSound('water-bubble');
// This recreates the channel with new sound

// Sound files must be in res/raw/
// android/app/src/main/res/raw/water_bubble.wav

// Reference without extension
androidSound: 'water_bubble'
```

### iOS
```typescript
// Sound configured per notification
{
  sound: 'water_bubble.wav', // With extension
}

// Sound files in app bundle
// assets/sounds/water_bubble.wav

// Reference with extension
iosSound: 'water_bubble.wav'
```

## Best Practices

1. **Initialize early:**
   ```typescript
   // In app root
   useEffect(() => {
     initializeNotificationSounds();
   }, []);
   ```

2. **Validate files in development:**
   ```typescript
   if (__DEV__) {
     validateSoundFiles().then(({ missing }) => {
       if (missing.length > 0) {
         console.warn('Missing sound files:', missing);
       }
     });
   }
   ```

3. **Provide preview:**
   ```typescript
   // Always let users preview before selecting
   <Button onPress={() => previewNotificationSound(soundId)}>
     Preview
   </Button>
   ```

4. **Handle errors gracefully:**
   ```typescript
   const success = await setNotificationSound(soundId);
   if (!success) {
     Alert.alert('Error', 'Could not change sound');
   }
   ```

5. **Support bilingual:**
   ```typescript
   // Always check language and use appropriate labels
   const name = isBurmese ? sound.nameMy : sound.name;
   ```

## Constants Reference

### Channel ID
```typescript
'hydromate-water-reminders'
```

### Storage Key
```typescript
'@hydromate_notification_sound'
```

### Default Sound
```typescript
'water-bubble'
```

### Sound File Locations
```typescript
// Assets (preview)
'assets/sounds/water_bubble.wav'
'assets/sounds/liquid_bubble.wav'

// Android (notifications)
'android/app/src/main/res/raw/water_bubble.wav'
'android/app/src/main/res/raw/liquid_bubble.wav'
```

## See Also

- [Quick Start Guide](./NOTIFICATION_SOUNDS_QUICKSTART.md)
- [Setup Guide](./NOTIFICATION_SOUNDS_SETUP.md)
- [Implementation Details](./NOTIFICATION_SOUNDS_IMPLEMENTATION.md)
- [Test Script](../scripts/test-notification-sounds.ts)
