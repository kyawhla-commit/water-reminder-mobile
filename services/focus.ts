import { FocusSession } from '@/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const FOCUS_STORAGE_KEY = 'focus_sessions';

export const getFocusSessions = async (): Promise<FocusSession[]> => {
  try {
    const data = await AsyncStorage.getItem(FOCUS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting focus sessions:', error);
    return [];
  }
};

export const saveFocusSession = async (session: Omit<FocusSession, 'id' | 'createdAt'>): Promise<FocusSession> => {
  try {
    const sessions = await getFocusSessions();
    const newSession: FocusSession = {
      ...session,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    await AsyncStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(sessions));
    return newSession;
  } catch (error) {
    console.error('Error saving focus session:', error);
    throw error;
  }
};

export const completeFocusSession = async (id: string): Promise<FocusSession | null> => {
  try {
    const sessions = await getFocusSessions();
    const index = sessions.findIndex((s) => s.id === id);
    if (index === -1) return null;
    
    sessions[index] = {
      ...sessions[index],
      completedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(sessions));
    return sessions[index];
  } catch (error) {
    console.error('Error completing focus session:', error);
    throw error;
  }
};

export const deleteFocusSession = async (id: string): Promise<boolean> => {
  try {
    const sessions = await getFocusSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    await AsyncStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting focus session:', error);
    return false;
  }
};

export const getTodayFocusStats = async (): Promise<{ completed: number; totalMinutes: number }> => {
  try {
    const sessions = await getFocusSessions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.createdAt);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime() && s.completedAt;
    });
    
    return {
      completed: todaySessions.length,
      totalMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
    };
  } catch (error) {
    console.error('Error getting today focus stats:', error);
    return { completed: 0, totalMinutes: 0 };
  }
};
