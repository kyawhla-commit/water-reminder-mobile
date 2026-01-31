import { SleepRecord } from '@/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const SLEEP_STORAGE_KEY = 'sleep_records';

export const getSleepRecords = async (): Promise<SleepRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sleep records:', error);
    return [];
  }
};

export const saveSleepRecord = async (record: Omit<SleepRecord, 'id' | 'createdAt'>): Promise<SleepRecord> => {
  try {
    const records = await getSleepRecords();
    const newRecord: SleepRecord = {
      ...record,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    records.push(newRecord);
    await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  } catch (error) {
    console.error('Error saving sleep record:', error);
    throw error;
  }
};

export const updateSleepRecord = async (id: string, updates: Partial<SleepRecord>): Promise<SleepRecord | null> => {
  try {
    const records = await getSleepRecords();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return null;
    
    records[index] = { ...records[index], ...updates };
    await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(records));
    return records[index];
  } catch (error) {
    console.error('Error updating sleep record:', error);
    throw error;
  }
};

export const deleteSleepRecord = async (id: string): Promise<boolean> => {
  try {
    const records = await getSleepRecords();
    const filtered = records.filter((r) => r.id !== id);
    await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting sleep record:', error);
    return false;
  }
};

export const getWeeklySleepStats = async (): Promise<{ average: number; total: number }> => {
  try {
    const records = await getSleepRecords();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyRecords = records.filter(
      (r) => new Date(r.createdAt) >= weekAgo
    );
    
    const total = weeklyRecords.reduce((sum, r) => sum + r.duration, 0);
    const average = weeklyRecords.length > 0 ? total / weeklyRecords.length : 0;
    
    return { average, total };
  } catch (error) {
    console.error('Error getting weekly sleep stats:', error);
    return { average: 0, total: 0 };
  }
};
