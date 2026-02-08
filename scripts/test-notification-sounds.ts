/**
 * Notification Sounds Test Script
 * Run this to validate notification sound implementation
 */

import * as Notifications from 'expo-notifications';
import {
    getNotificationChannelId,
    getNotificationSound,
    getSoundOption,
    initializeNotificationSounds,
    NOTIFICATION_SOUNDS,
    previewNotificationSound,
    sendTestNotificationWithSound,
    setNotificationSound,
    stopSoundPreview,
    validateSoundFiles,
} from '../services/notificationSounds';

// Test results interface
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  error?: any;
}

const results: TestResult[] = [];

// Helper to add test result
const addResult = (name: string, passed: boolean, message: string, error?: any) => {
  results.push({ name, passed, message, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (error) console.error('   Error:', error);
};

// Test 1: Validate sound files exist
const testSoundFiles = async () => {
  try {
    const { valid, missing } = await validateSoundFiles();

    if (missing.length === 0) {
      addResult(
        'Sound Files',
        true,
        `All ${valid.length} sound files are valid: ${valid.join(', ')}`
      );
    } else {
      addResult(
        'Sound Files',
        false,
        `Missing sound files: ${missing.join(', ')}. Valid: ${valid.join(', ')}`
      );
    }
  } catch (error) {
    addResult('Sound Files', false, 'Failed to validate sound files', error);
  }
};

// Test 2: Initialize notification sounds
const testInitialization = async () => {
  try {
    await initializeNotificationSounds();
    addResult('Initialization', true, 'Notification sounds initialized successfully');
  } catch (error) {
    addResult('Initialization', false, 'Failed to initialize notification sounds', error);
  }
};

// Test 3: Get/Set sound preference
const testSoundPreference = async () => {
  try {
    // Get current sound
    const currentSound = await getNotificationSound();
    console.log(`   Current sound: ${currentSound}`);

    // Set to popping-bubble
    await setNotificationSound('popping-bubble');
    const newSound = await getNotificationSound();

    if (newSound === 'popping-bubble') {
      addResult('Sound Preference', true, 'Successfully saved and retrieved sound preference');
    } else {
      addResult('Sound Preference', false, `Expected 'popping-bubble', got '${newSound}'`);
    }

    // Restore original
    await setNotificationSound(currentSound);
  } catch (error) {
    addResult('Sound Preference', false, 'Failed to get/set sound preference', error);
  }
};

// Test 4: Sound options configuration
const testSoundOptions = () => {
  try {
    const requiredFields = ['id', 'name', 'nameMy', 'icon', 'description', 'descriptionMy'];
    let allValid = true;

    for (const sound of NOTIFICATION_SOUNDS) {
      for (const field of requiredFields) {
        if (!(field in sound)) {
          addResult('Sound Options', false, `Sound '${sound.id}' missing field: ${field}`);
          allValid = false;
        }
      }

      // Check that non-silent sounds have preview assets
      if (sound.id !== 'silent' && !sound.previewAsset) {
        addResult('Sound Options', false, `Sound '${sound.id}' missing preview asset`);
        allValid = false;
      }
    }

    if (allValid) {
      addResult(
        'Sound Options',
        true,
        `All ${NOTIFICATION_SOUNDS.length} sound options are properly configured`
      );
    }
  } catch (error) {
    addResult('Sound Options', false, 'Failed to validate sound options', error);
  }
};

// Test 5: Preview functionality
const testPreview = async () => {
  try {
    // Test popping-bubble preview
    const success = await previewNotificationSound('popping-bubble');

    if (success) {
      // Wait a bit for sound to play
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stop preview
      await stopSoundPreview();

      addResult('Preview', true, 'Sound preview works correctly');
    } else {
      addResult('Preview', false, 'Preview returned false');
    }
  } catch (error) {
    addResult('Preview', false, 'Failed to preview sound', error);
  }
};

// Test 6: Notification channel
const testNotificationChannel = async () => {
  try {
    const channelId = getNotificationChannelId();
    console.log(`   Channel ID: ${channelId}`);

    // Get all channels
    const channels = await Notifications.getNotificationChannelsAsync();
    const ourChannel = channels.find((ch) => ch.id === channelId);

    if (ourChannel) {
      console.log(`   Channel found:`, {
        name: ourChannel.name,
        importance: ourChannel.importance,
        sound: ourChannel.sound,
      });
      addResult('Notification Channel', true, `Channel '${channelId}' exists and is configured`);
    } else {
      addResult('Notification Channel', false, `Channel '${channelId}' not found`);
    }
  } catch (error) {
    addResult('Notification Channel', false, 'Failed to check notification channel', error);
  }
};

// Test 7: Test notification
const testNotification = async () => {
  try {
    const success = await sendTestNotificationWithSound('popping-bubble', 'en');

    if (success) {
      addResult('Test Notification', true, 'Test notification sent successfully');
    } else {
      addResult('Test Notification', false, 'Failed to send test notification');
    }
  } catch (error) {
    addResult('Test Notification', false, 'Error sending test notification', error);
  }
};

// Test 8: Bilingual support
const testBilingualSupport = () => {
  try {
    let allValid = true;

    for (const sound of NOTIFICATION_SOUNDS) {
      const option = getSoundOption(sound.id);

      if (!option) {
        addResult('Bilingual Support', false, `Could not get option for sound: ${sound.id}`);
        allValid = false;
        continue;
      }

      // Check English
      if (!option.name || !option.description) {
        addResult('Bilingual Support', false, `Sound '${sound.id}' missing English text`);
        allValid = false;
      }

      // Check Burmese
      if (!option.nameMy || !option.descriptionMy) {
        addResult('Bilingual Support', false, `Sound '${sound.id}' missing Burmese text`);
        allValid = false;
      }
    }

    if (allValid) {
      addResult('Bilingual Support', true, 'All sounds have English and Burmese translations');
    }
  } catch (error) {
    addResult('Bilingual Support', false, 'Failed to validate bilingual support', error);
  }
};

// Main test runner
export const runNotificationSoundTests = async () => {
  console.log('\n🧪 Running Notification Sounds Tests...\n');

  // Run tests in sequence
  testSoundOptions();
  await testSoundFiles();
  await testInitialization();
  await testSoundPreference();
  await testNotificationChannel();
  await testPreview();
  testBilingualSupport();
  await testNotification();

  // Print summary
  console.log('\n📊 Test Summary\n');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
  }

  return {
    passed,
    failed,
    total,
    results,
  };
};

// Export for use in app
export default runNotificationSoundTests;
