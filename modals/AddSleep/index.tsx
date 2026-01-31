import { Colors } from '@/constants/theme';
import { saveSleepRecord } from '@/services/sleep';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

interface AddSleepModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const AddSleepModal = ({ visible, onClose, onAdd }: AddSleepModalProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [hours, setHours] = useState('7');
  const [minutes, setMinutes] = useState('30');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const duration = h * 60 + m;

    if (duration <= 0) return;

    setLoading(true);
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - duration * 60 * 1000);

      await saveSleepRecord({
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        duration,
        quality,
        notes: notes || undefined,
      });

      onAdd();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving sleep record:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHours('7');
    setMinutes('30');
    setQuality(3);
    setNotes('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#2D2D2D' : '#fff' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Log Sleep</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.icon }]}>Duration</Text>
          <View style={styles.durationRow}>
            <View style={styles.durationInput}>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#3D3D3D' : '#F0F0F0', color: colors.text }]}
                keyboardType="numeric"
                value={hours}
                onChangeText={setHours}
                maxLength={2}
              />
              <Text style={[styles.unit, { color: colors.icon }]}>hours</Text>
            </View>
            <View style={styles.durationInput}>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#3D3D3D' : '#F0F0F0', color: colors.text }]}
                keyboardType="numeric"
                value={minutes}
                onChangeText={setMinutes}
                maxLength={2}
              />
              <Text style={[styles.unit, { color: colors.icon }]}>min</Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.icon }]}>Sleep Quality</Text>
          <View style={styles.qualityRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setQuality(star)}>
                <Ionicons
                  name={star <= quality ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= quality ? '#FFD700' : colors.icon}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: '#9B59B6' }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Sleep Record'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, textTransform: 'uppercase' },
  durationRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  durationInput: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 24, textAlign: 'center' },
  unit: { fontSize: 16, marginLeft: 8 },
  qualityRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default AddSleepModal;
