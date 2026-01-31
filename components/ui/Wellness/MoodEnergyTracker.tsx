import { useAppTheme } from '@/hooks/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const MOOD_STORAGE_KEY = '@hydromate_mood_data';

interface MoodEntry {
  date: string;
  time: string;
  mood: number; // 1-5
  energy: number; // 1-5
  hydration: number; // water intake at time of entry
}

interface MoodEnergyTrackerProps {
  currentHydration: number;
  onEntryAdded?: (entry: MoodEntry) => void;
}

const moodEmojis = ['😫', '😕', '😐', '🙂', '😄'];
const energyEmojis = ['🔋', '🪫', '⚡', '💪', '🚀'];
const moodLabels = ['Awful', 'Bad', 'Okay', 'Good', 'Great'];
const energyLabels = ['Exhausted', 'Tired', 'Normal', 'Energized', 'Supercharged'];

export function MoodEnergyTracker({ currentHydration, onEntryAdded }: MoodEnergyTrackerProps) {
  const { colors, isDark } = useAppTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [todayEntries, setTodayEntries] = useState<MoodEntry[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const scaleAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadTodayEntries(); }, []);

  const loadTodayEntries = async () => {
    try {
      const data = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
      if (data) {
        const all: MoodEntry[] = JSON.parse(data);
        const today = new Date().toISOString().split('T')[0];
        setTodayEntries(all.filter(e => e.date === today));
      }
    } catch (e) { console.error(e); }
  };

  const saveEntry = async () => {
    if (selectedMood === null || selectedEnergy === null) return;
    
    const entry: MoodEntry = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      mood: selectedMood + 1,
      energy: selectedEnergy + 1,
      hydration: currentHydration,
    };

    try {
      const data = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
      const all: MoodEntry[] = data ? JSON.parse(data) : [];
      all.unshift(entry);
      await AsyncStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(all.slice(0, 500)));
      setTodayEntries(prev => [entry, ...prev]);
      onEntryAdded?.(entry);
      
      // Show success animation
      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setShowSuccess(false);
        setSelectedMood(null);
        setSelectedEnergy(null);
      });
    } catch (e) { console.error(e); }
  };

  const handleSelect = (type: 'mood' | 'energy', index: number) => {
    if (type === 'mood') setSelectedMood(index);
    else setSelectedEnergy(index);
    
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const canSubmit = selectedMood !== null && selectedEnergy !== null;

  // Calculate correlation hint
  const getCorrelationHint = () => {
    if (todayEntries.length < 2) return null;
    const avgMood = todayEntries.reduce((s, e) => s + e.mood, 0) / todayEntries.length;
    const avgEnergy = todayEntries.reduce((s, e) => s + e.energy, 0) / todayEntries.length;
    const avgHydration = todayEntries.reduce((s, e) => s + e.hydration, 0) / todayEntries.length;
    
    if (avgHydration > 1500 && avgMood >= 3.5) return '💧 Good hydration = Better mood today!';
    if (avgHydration < 1000 && avgEnergy < 3) return '⚠️ Low water intake may be affecting energy';
    return null;
  };

  const hint = getCorrelationHint();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>How are you feeling?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Quick 3-second check-in</Text>

      {/* Mood Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Mood</Text>
        <View style={styles.emojiRow}>
          {moodEmojis.map((emoji, i) => (
            <Pressable key={`mood-${i}`} onPress={() => handleSelect('mood', i)}>
              <Animated.View style={[
                styles.emojiButton,
                selectedMood === i && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                { transform: [{ scale: scaleAnims[i] }] }
              ]}>
                <Text style={styles.emoji}>{emoji}</Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
        {selectedMood !== null && (
          <Text style={[styles.selectedLabel, { color: colors.primary }]}>{moodLabels[selectedMood]}</Text>
        )}
      </View>

      {/* Energy Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Energy</Text>
        <View style={styles.emojiRow}>
          {energyEmojis.map((emoji, i) => (
            <Pressable key={`energy-${i}`} onPress={() => handleSelect('energy', i)}>
              <Animated.View style={[
                styles.emojiButton,
                selectedEnergy === i && { backgroundColor: '#FF980030', borderColor: '#FF9800' },
                { transform: [{ scale: scaleAnims[i] }] }
              ]}>
                <Text style={styles.emoji}>{emoji}</Text>
              </Animated.View>
            </Pressable>
          ))}
        </View>
        {selectedEnergy !== null && (
          <Text style={[styles.selectedLabel, { color: '#FF9800' }]}>{energyLabels[selectedEnergy]}</Text>
        )}
      </View>

      {/* Submit Button */}
      <Pressable 
        onPress={saveEntry} 
        disabled={!canSubmit}
        style={[styles.submitButton, { backgroundColor: canSubmit ? colors.primary : colors.surfaceVariant }]}
      >
        <Text style={[styles.submitText, { color: canSubmit ? '#fff' : colors.textSecondary }]}>
          Log Feeling
        </Text>
      </Pressable>

      {/* Success Message */}
      {showSuccess && (
        <Animated.View style={[styles.successMessage, { opacity: successAnim, transform: [{ scale: successAnim }] }]}>
          <Text style={styles.successText}>✓ Logged!</Text>
        </Animated.View>
      )}

      {/* Today's entries count */}
      {todayEntries.length > 0 && (
        <Text style={[styles.entriesCount, { color: colors.textSecondary }]}>
          {todayEntries.length} check-in{todayEntries.length > 1 ? 's' : ''} today
        </Text>
      )}

      {/* Correlation hint */}
      {hint && (
        <View style={[styles.hintBox, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
          <Text style={[styles.hintText, { color: colors.text }]}>{hint}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emojiButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  emoji: { fontSize: 28 },
  selectedLabel: { textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: '600' },
  submitButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: 16, fontWeight: '600' },
  successMessage: { position: 'absolute', top: '50%', left: '50%', marginLeft: -40, marginTop: -20, backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  successText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  entriesCount: { textAlign: 'center', marginTop: 12, fontSize: 12 },
  hintBox: { marginTop: 16, padding: 12, borderRadius: 12 },
  hintText: { fontSize: 13, textAlign: 'center' },
});

export default MoodEnergyTracker;