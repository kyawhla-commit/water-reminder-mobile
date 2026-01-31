import { WATER_INTAKE_OPTIONS } from '@/config';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface AddWaterModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number) => Promise<number | void>;
}

const AddWaterModal = ({ visible, onClose, onAdd }: AddWaterModalProps) => {
  const { colors } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickAdd = async (amount: number) => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      await onAdd(amount);
      onClose();
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAdd = async () => {
    Keyboard.dismiss();
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setLoading(true);
    try {
      await onAdd(amount);
      setCustomAmount('');
      onClose();
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setCustomAmount('');
    onClose();
  };

  const handleInputFocus = () => {
    // Scroll to bottom when input is focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.container, { backgroundColor: colors.surface }]}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>💧 Add Water</Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.scrollContent}
                >
                  <Text style={[styles.subtitle, { color: colors.text }]}>Quick Add</Text>
                  <View style={styles.quickOptions}>
                    {WATER_INTAKE_OPTIONS.map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={[styles.quickButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleQuickAdd(amount)}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="water" size={16} color="#fff" />
                        <Text style={styles.quickButtonText}>{amount}ml</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.subtitle, { color: colors.text }]}>Custom Amount</Text>
                  <View style={styles.customInput}>
                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                      placeholder="Enter amount"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      returnKeyType="done"
                      onSubmitEditing={handleCustomAdd}
                      onFocus={handleInputFocus}
                    />
                    <Text style={[styles.unit, { color: colors.textSecondary }]}>ml</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: customAmount ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={handleCustomAdd}
                    disabled={!customAmount || loading}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addButtonText, { color: customAmount ? '#fff' : colors.textSecondary }]}>
                      Add Custom Amount
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  scrollContent: { paddingBottom: 20 },
  subtitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  quickButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  customInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  input: { flex: 1, height: 54, borderRadius: 12, paddingHorizontal: 16, fontSize: 18 },
  unit: { fontSize: 18, fontWeight: '500', marginLeft: 12 },
  addButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontSize: 18, fontWeight: '600' },
});

export default AddWaterModal;
