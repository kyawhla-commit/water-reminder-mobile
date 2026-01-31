import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  addToRecentlyPlayed,
  CATEGORIES,
  getSoundSource,
  loadSleepSoundSettings,
  PRESET_MIXES,
  SLEEP_SOUNDS,
  SleepSound,
  SleepSoundSettings,
  SoundCategory,
  SoundMix,
  TIMER_OPTIONS,
  toggleFavorite
} from '@/services/sleepSounds';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SleepSoundsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const isBurmese = t('common.done') === 'ပြီးပါပြီ';

  const [settings, setSettings] = useState<SleepSoundSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory | 'all' | 'favorites'>('all');
  const [playingSound, setPlayingSound] = useState<SleepSound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSettings();
    setupAudio();
    
    return () => {
      // Cleanup on unmount
      const cleanup = async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (e) {
            // Ignore cleanup errors
          }
          soundRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (sleepTimer && isPlaying) {
      setTimerRemaining(sleepTimer * 60);
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev && prev <= 1) {
            stopSound();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sleepTimer, isPlaying]);

  const setupAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  };

  const loadSettings = async () => {
    const loaded = await loadSleepSoundSettings();
    setSettings(loaded);
  };

  const [loadingSound, setLoadingSound] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);

  const playSound = async (sound: SleepSound) => {
    setLoadingSound(true);
    setSoundError(null);

    try {
      // Stop current sound if playing
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Get sound source (local asset or remote URL)
      const soundSource = getSoundSource(sound);
      
      // Check if sound is playable
      if (soundSource === null) {
        setSoundError(
          isBurmese
            ? 'ဤအသံဖိုင်မရရှိနိုင်သေးပါ။'
            : 'This sound is not available yet.'
        );
        setLoadingSound(false);
        return;
      }

      // Create and load the new sound
      const { sound: audioSound } = await Audio.Sound.createAsync(
        soundSource,
        {
          shouldPlay: true,
          isLooping: true,
          volume,
          progressUpdateIntervalMillis: 1000,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = audioSound;
      setPlayingSound(sound);
      setIsPlaying(true);
      await addToRecentlyPlayed(sound.id);
      loadSettings();
    } catch (error: any) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
      setPlayingSound(null);

      // Show user-friendly error message
      const errorMessage = error?.message || 'Unknown error';
      if (errorMessage.includes('403') || errorMessage.includes('404')) {
        setSoundError(
          isBurmese
            ? 'အသံဖိုင်ကို ဝင်ရောက်၍မရပါ။ နောက်မှ ထပ်ကြိုးစားပါ။'
            : 'Sound file unavailable. Please try again later.'
        );
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        setSoundError(isBurmese ? 'အင်တာနက်ချိတ်ဆက်မှု စစ်ဆေးပါ။' : 'Check your internet connection.');
      } else {
        setSoundError(
          isBurmese ? 'အသံဖွင့်၍မရပါ။ နောက်မှ ထပ်ကြိုးစားပါ။' : 'Unable to play sound. Please try again.'
        );
      }

      // Clear error after 3 seconds
      setTimeout(() => setSoundError(null), 3000);
    } finally {
      setLoadingSound(false);
    }
  };


  // Playback status update callback
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPlaybackPosition(status.positionMillis);
      if (status.durationMillis) {
        setPlaybackDuration(status.durationMillis);
      }
      // Handle playback finished (shouldn't happen with looping, but just in case)
      if (status.didJustFinish && !status.isLooping) {
        setIsPlaying(false);
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      setIsPlaying(false);
    }
  }, []);

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    } finally {
      setIsPlaying(false);
      setPlayingSound(null);
      setTimerRemaining(null);
      setSleepTimer(null);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current || !playingSound) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      // Try to recover by reloading the sound
      if (playingSound) {
        await playSound(playingSound);
      }
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    
    // Debounce the actual volume change to prevent too many rapid updates
    if (volumeDebounceRef.current) {
      clearTimeout(volumeDebounceRef.current);
    }
    
    volumeDebounceRef.current = setTimeout(async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            await soundRef.current.setVolumeAsync(value);
          }
        } catch (error) {
          console.error('Error setting volume:', error);
        }
      }
    }, 50);
  };

  const handleVolumeSlidingComplete = async (value: number) => {
    // Clear any pending debounced updates
    if (volumeDebounceRef.current) {
      clearTimeout(volumeDebounceRef.current);
    }
    
    setVolume(value);
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.setVolumeAsync(value);
        }
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  };

  const handleToggleFavorite = async (soundId: string) => {
    const updated = await toggleFavorite(soundId);
    setSettings(updated);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMillis = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current && playbackDuration > 0) {
      try {
        const seekPosition = value * playbackDuration;
        await soundRef.current.setPositionAsync(seekPosition);
        setPlaybackPosition(seekPosition);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const getFilteredSounds = (): SleepSound[] => {
    if (selectedCategory === 'all') return SLEEP_SOUNDS;
    if (selectedCategory === 'favorites') {
      return SLEEP_SOUNDS.filter(s => settings?.favorites.includes(s.id));
    }
    return SLEEP_SOUNDS.filter(s => s.category === selectedCategory);
  };

  const renderSoundCard = (sound: SleepSound) => {
    const isCurrentlyPlaying = playingSound?.id === sound.id && isPlaying;
    const isFavorite = settings?.favorites.includes(sound.id);

    return (
      <TouchableOpacity
        key={sound.id}
        style={[
          styles.soundCard,
          { backgroundColor: colors.card },
          isCurrentlyPlaying && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => (isCurrentlyPlaying ? togglePlayPause() : playSound(sound))}
        activeOpacity={0.7}
      >
        <View style={[styles.soundIcon, { backgroundColor: isDark ? '#1E3A5F' : '#E8F0FE' }]}>
          <Text style={styles.soundEmoji}>{sound.icon}</Text>
        </View>
        <Text style={[styles.soundName, { color: colors.text }]}>
          {isBurmese ? sound.nameMy : sound.name}
        </Text>
        <View style={styles.soundActions}>
          <TouchableOpacity onPress={() => handleToggleFavorite(sound.id)}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#E91E63' : colors.textSecondary}
            />
          </TouchableOpacity>
          {isCurrentlyPlaying && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="musical-notes" size={18} color={colors.primary} />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMixCard = (mix: SoundMix) => (
    <TouchableOpacity
      key={mix.id}
      style={[styles.mixCard, { backgroundColor: isDark ? '#1E3A5F' : '#E8F0FE' }]}
      activeOpacity={0.7}
    >
      <View style={styles.mixIcons}>
        {mix.sounds.slice(0, 3).map((s, i) => {
          const sound = SLEEP_SOUNDS.find(ss => ss.id === s.soundId);
          return sound ? (
            <Text key={i} style={styles.mixEmoji}>
              {sound.icon}
            </Text>
          ) : null;
        })}
      </View>
      <Text style={[styles.mixName, { color: colors.text }]}>
        {isBurmese ? mix.nameMy : mix.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isBurmese ? '🌙 အိပ်စက်သံများ' : '🌙 Sleep Sounds'}
          </Text>
          <TouchableOpacity onPress={() => setShowTimerModal(true)} style={styles.timerButton}>
            <Ionicons name="timer-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {soundError && (
          <View style={[styles.errorCard, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="alert-circle" size={20} color="#D32F2F" />
            <Text style={styles.errorText}>{soundError}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {loadingSound && (
          <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {isBurmese ? 'အသံဖွင့်နေသည်...' : 'Loading sound...'}
            </Text>
          </View>
        )}

        {/* Now Playing */}
        {playingSound && (
          <View style={[styles.nowPlayingCard, { backgroundColor: colors.primary }]}>
            <View style={styles.nowPlayingInfo}>
              <Animated.Text style={[styles.nowPlayingEmoji, { transform: [{ scale: pulseAnim }] }]}>
                {playingSound.icon}
              </Animated.Text>
              <View>
                <Text style={styles.nowPlayingLabel}>
                  {isBurmese ? 'ယခုဖွင့်နေသည်' : 'Now Playing'}
                </Text>
                <Text style={styles.nowPlayingName}>
                  {isBurmese ? playingSound.nameMy : playingSound.name}
                </Text>
              </View>
            </View>
            <View style={styles.nowPlayingControls}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={stopSound} style={styles.stopButton}>
                <Ionicons name="stop" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {timerRemaining && (
              <View style={styles.timerBadge}>
                <Ionicons name="timer" size={14} color="#fff" />
                <Text style={styles.timerText}>{formatTime(timerRemaining)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Volume Control */}
        {playingSound && (
          <View style={[styles.volumeCard, { backgroundColor: colors.card }]}>
            <Ionicons name="volume-low" size={20} color={colors.textSecondary} />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              onSlidingComplete={handleVolumeSlidingComplete}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.surfaceVariant}
              thumbTintColor={colors.primary}
            />
            <Ionicons name="volume-high" size={20} color={colors.textSecondary} />
            <Text style={[styles.volumeText, { color: colors.textSecondary }]}>
              {Math.round(volume * 100)}%
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        {playingSound && playbackDuration > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.progressTime, { color: colors.textSecondary }]}>
              {formatMillis(playbackPosition)}
            </Text>
            <Slider
              style={styles.progressSlider}
              minimumValue={0}
              maximumValue={1}
              value={playbackDuration > 0 ? playbackPosition / playbackDuration : 0}
              onSlidingComplete={handleSeek}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.surfaceVariant}
              thumbTintColor={colors.primary}
            />
            <Text style={[styles.progressTime, { color: colors.textSecondary }]}>
              {formatMillis(playbackDuration)}
            </Text>
          </View>
        )}

        {/* Preset Mixes */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isBurmese ? '✨ အကြံပြုမစ်များ' : '✨ Preset Mixes'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mixesRow}>
          {PRESET_MIXES.map(renderMixCard)}
        </ScrollView>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: selectedCategory === 'all' ? colors.primary : colors.surfaceVariant },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryText, { color: selectedCategory === 'all' ? '#fff' : colors.text }]}>
              {isBurmese ? 'အားလုံး' : 'All'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: selectedCategory === 'favorites' ? colors.primary : colors.surfaceVariant },
            ]}
            onPress={() => setSelectedCategory('favorites')}
          >
            <Ionicons
              name="heart"
              size={14}
              color={selectedCategory === 'favorites' ? '#fff' : colors.text}
            />
            <Text style={[styles.categoryText, { color: selectedCategory === 'favorites' ? '#fff' : colors.text }]}>
              {isBurmese ? 'နှစ်သက်' : 'Favorites'}
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                { backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surfaceVariant },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryText, { color: selectedCategory === cat.id ? '#fff' : colors.text }]}>
                {isBurmese ? cat.nameMy : cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sounds Grid */}
        <View style={styles.soundsGrid}>{getFilteredSounds().map(renderSoundCard)}</View>

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Ionicons name="bulb" size={24} color="#FFD93D" />
          <Text style={[styles.tipText, { color: colors.text }]}>
            {isBurmese
              ? '💡 အိပ်ရာဝင်ချိန်တိုင်မာသတ်မှတ်ပြီး အလိုအလျောက်ပိတ်စေပါ'
              : '💡 Set a sleep timer to automatically stop the sound when you fall asleep'}
          </Text>
        </View>
      </ScrollView>

      {/* Timer Modal */}
      <Modal visible={showTimerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isBurmese ? '⏰ အိပ်ရာဝင်ချိန်တိုင်မာ' : '⏰ Sleep Timer'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {isBurmese
                ? 'သတ်မှတ်ထားသောအချိန်ပြီးရင် အသံအလိုအလျောက်ရပ်မည်'
                : 'Sound will automatically stop after the selected time'}
            </Text>

            <View style={styles.timerOptions}>
              {TIMER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timerOption,
                    { backgroundColor: isDark ? '#1E3A5F' : '#F5F5F5' },
                    sleepTimer === option.value && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSleepTimer(option.value)}
                >
                  <Text
                    style={[
                      styles.timerOptionText,
                      { color: sleepTimer === option.value ? '#fff' : colors.text },
                    ]}
                  >
                    {isBurmese ? option.labelMy : option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => {
                  setSleepTimer(null);
                  setShowTimerModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {isBurmese ? 'ပယ်ဖျက်' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowTimerModal(false)}
              >
                <Text style={styles.modalButtonTextWhite}>
                  {isBurmese ? 'သတ်မှတ်' : 'Set Timer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  timerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  nowPlayingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowPlayingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nowPlayingEmoji: { fontSize: 40 },
  nowPlayingLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  nowPlayingName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  nowPlayingControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playPauseButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stopButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  timerBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  timerText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  volumeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12 },
  volumeSlider: { flex: 1, height: 40 },
  volumeText: { fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'right' },
  progressCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 24, gap: 8 },
  progressSlider: { flex: 1, height: 40 },
  progressTime: { fontSize: 12, fontWeight: '500', minWidth: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  mixesRow: { marginBottom: 24 },
  mixCard: { width: 120, padding: 16, borderRadius: 16, marginRight: 12, alignItems: 'center' },
  mixIcons: { flexDirection: 'row', marginBottom: 8 },
  mixEmoji: { fontSize: 24, marginHorizontal: -4 },
  mixName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  categoriesRow: { marginBottom: 20 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, gap: 6 },
  categoryIcon: { fontSize: 14 },
  categoryText: { fontSize: 14, fontWeight: '500' },
  soundsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  soundCard: { width: '47%', padding: 16, borderRadius: 16, alignItems: 'center' },
  soundIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  soundEmoji: { fontSize: 32 },
  soundName: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  soundActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipCard: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 12, alignItems: 'center', marginTop: 24 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  errorCard: { flexDirection: 'row', padding: 12, borderRadius: 12, gap: 10, alignItems: 'center', marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, color: '#D32F2F' },
  loadingCard: { padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  loadingText: { fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  timerOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  timerOption: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  timerOptionText: { fontSize: 14, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  modalButtonTextWhite: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
