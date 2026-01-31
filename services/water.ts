import { WaterReminder } from '@/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const WATER_STORAGE_KEY = 'water_reminders';
const DAILY_INTAKE_KEY = 'daily_water_intake';

export const getWaterReminders = async (): Promise<WaterReminder[]> => {
  try {
    const data = await AsyncStorage.getItem(WATER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting water reminders:', error);
    return [];
  }
};

export const saveWaterReminder = async (reminder: Omit<WaterReminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WaterReminder> => {
  try {
    const reminders = await getWaterReminders();
    const newReminder: WaterReminder = {
      ...reminder,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reminders.push(newReminder);
    await AsyncStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(reminders));
    return newReminder;
  } catch (error) {
    console.error('Error saving water reminder:', error);
    throw error;
  }
};

export const updateWaterReminder = async (id: string, updates: Partial<WaterReminder>): Promise<WaterReminder | null> => {
  try {
    const reminders = await getWaterReminders();
    const index = reminders.findIndex((r) => r.id === id);
    if (index === -1) return null;
    
    reminders[index] = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(reminders));
    return reminders[index];
  } catch (error) {
    console.error('Error updating water reminder:', error);
    throw error;
  }
};

export const deleteWaterReminder = async (id: string): Promise<boolean> => {
  try {
    const reminders = await getWaterReminders();
    const filtered = reminders.filter((r) => r.id !== id);
    await AsyncStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting water reminder:', error);
    return false;
  }
};

export const getDailyIntake = async (date: Date = new Date()): Promise<number> => {
  try {
    const key = `${DAILY_INTAKE_KEY}_${date.toISOString().split('T')[0]}`;
    const data = await AsyncStorage.getItem(key);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Error getting daily intake:', error);
    return 0;
  }
};

export const addWaterIntake = async (amount: number, date: Date = new Date()): Promise<number> => {
  try {
    const key = `${DAILY_INTAKE_KEY}_${date.toISOString().split('T')[0]}`;
    const current = await getDailyIntake(date);
    const newTotal = current + amount;
    await AsyncStorage.setItem(key, newTotal.toString());
    return newTotal;
  } catch (error) {
    console.error('Error adding water intake:', error);
    throw error;
  }
};

export const removeWaterIntake = async (amount: number, date: Date = new Date()): Promise<number> => {
  try {
    const key = `${DAILY_INTAKE_KEY}_${date.toISOString().split('T')[0]}`;
    const current = await getDailyIntake(date);
    const newTotal = Math.max(0, current - amount);
    await AsyncStorage.setItem(key, newTotal.toString());
    return newTotal;
  } catch (error) {
    console.error('Error removing water intake:', error);
    throw error;
  }
};

export const resetDailyIntake = async (date: Date = new Date()): Promise<void> => {
  try {
    const key = `${DAILY_INTAKE_KEY}_${date.toISOString().split('T')[0]}`;
    await AsyncStorage.setItem(key, '0');
  } catch (error) {
    console.error('Error resetting daily intake:', error);
    throw error;
  }
};
