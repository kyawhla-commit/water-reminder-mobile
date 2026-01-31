import { NativeModules, Platform } from 'react-native';
import { saveWaterEntry } from './waterHistory';

const { HydroMateWidget } = NativeModules;

export interface WidgetEntry {
  amount: number;
  timestamp: number;
  date: string;
  time: string;
}

export interface WidgetData {
  currentIntake: number;
  dailyGoal: number;
  lastSyncDate: string;
}

/**
 * Check if widget module is available (Android only)
 */
export const isWidgetAvailable = (): boolean => {
  return Platform.OS === 'android' && HydroMateWidget != null;
};

/**
 * Check if a specific method exists on the native module
 */
const hasMethod = (methodName: string): boolean => {
  return isWidgetAvailable() && typeof HydroMateWidget[methodName] === 'function';
};

/**
 * Update widget display with current intake and goal
 */
export const updateWidget = async (currentIntake: number, dailyGoal: number): Promise<boolean> => {
  if (!hasMethod('updateWidget')) return false;

  try {
    await HydroMateWidget.updateWidget(currentIntake, dailyGoal);
    return true;
  } catch (error) {
    console.error('Failed to update widget:', error);
    return false;
  }
};

/**
 * Reset widget intake to 0 (for new day)
 */
export const resetWidget = async (): Promise<boolean> => {
  if (!hasMethod('resetWidget')) return false;

  try {
    await HydroMateWidget.resetWidget();
    return true;
  } catch (error) {
    console.error('Failed to reset widget:', error);
    return false;
  }
};

/**
 * Get pending water entries added from widget
 */
export const getPendingWidgetEntries = async (): Promise<WidgetEntry[]> => {
  if (!hasMethod('getPendingEntries')) return [];

  try {
    const entries = await HydroMateWidget.getPendingEntries();
    return entries || [];
  } catch (error) {
    console.error('Failed to get pending entries:', error);
    return [];
  }
};

/**
 * Clear pending entries after sync
 */
export const clearPendingEntries = async (): Promise<boolean> => {
  if (!hasMethod('clearPendingEntries')) return false;

  try {
    await HydroMateWidget.clearPendingEntries();
    return true;
  } catch (error) {
    console.error('Failed to clear pending entries:', error);
    return false;
  }
};

/**
 * Get current widget data
 */
export const getWidgetData = async (): Promise<WidgetData | null> => {
  if (!hasMethod('getWidgetData')) return null;

  try {
    return await HydroMateWidget.getWidgetData();
  } catch (error) {
    console.error('Failed to get widget data:', error);
    return null;
  }
};

/**
 * Sync pending widget entries to app storage
 * Call this when app opens or resumes
 */
export const syncWidgetEntries = async (dailyGoal: number): Promise<{
  synced: number;
  totalAmount: number;
  entries: WidgetEntry[];
}> => {
  if (!isWidgetAvailable()) {
    return { synced: 0, totalAmount: 0, entries: [] };
  }

  try {
    let entries: WidgetEntry[] = [];

    // Try the atomic method first, fall back to separate get/clear
    if (hasMethod('syncAndClearPendingEntries')) {
      entries = await HydroMateWidget.syncAndClearPendingEntries();
    } else if (hasMethod('getPendingEntries')) {
      // Fallback: get entries then clear them separately
      entries = await HydroMateWidget.getPendingEntries();
      if (entries && entries.length > 0 && hasMethod('clearPendingEntries')) {
        await HydroMateWidget.clearPendingEntries();
      }
    } else {
      // New methods not available yet - app needs rebuild
      console.log('Widget sync methods not available. Please rebuild the app.');
      return { synced: 0, totalAmount: 0, entries: [] };
    }

    if (!entries || entries.length === 0) {
      return { synced: 0, totalAmount: 0, entries: [] };
    }

    let totalAmount = 0;

    // Save each entry to water history
    for (const entry of entries) {
      try {
        // Create date from the entry's date and time
        const [year, month, day] = entry.date.split('-').map(Number);
        const [hours, minutes] = entry.time.split(':').map(Number);
        const entryDate = new Date(year, month - 1, day, hours, minutes);

        await saveWaterEntry(entry.amount, dailyGoal, entryDate);
        totalAmount += entry.amount;
      } catch (entryError) {
        console.error('Failed to save widget entry:', entryError);
      }
    }

    console.log(`Synced ${entries.length} widget entries, total: ${totalAmount}ml`);

    return {
      synced: entries.length,
      totalAmount,
      entries,
    };
  } catch (error) {
    console.error('Failed to sync widget entries:', error);
    return { synced: 0, totalAmount: 0, entries: [] };
  }
};

/**
 * Full sync: sync pending entries and update widget with current state
 */
export const fullWidgetSync = async (
  currentIntake: number,
  dailyGoal: number
): Promise<{
  synced: number;
  newTotal: number;
}> => {
  // First sync any pending entries from widget
  const syncResult = await syncWidgetEntries(dailyGoal);

  // Calculate new total
  const newTotal = currentIntake + syncResult.totalAmount;

  // Update widget with new total
  await updateWidget(newTotal, dailyGoal);

  return {
    synced: syncResult.synced,
    newTotal,
  };
};

/**
 * Initialize widget with current app state
 * Call this on app startup
 */
export const initializeWidget = async (currentIntake: number, dailyGoal: number): Promise<void> => {
  if (!isWidgetAvailable()) return;

  try {
    // Sync any pending entries first (if methods available)
    const syncResult = await syncWidgetEntries(dailyGoal);

    // Update widget with current state (including synced entries)
    const newTotal = currentIntake + syncResult.totalAmount;
    await updateWidget(newTotal, dailyGoal);

    if (syncResult.synced > 0) {
      console.log(`Widget initialized. Synced ${syncResult.synced} entries (+${syncResult.totalAmount}ml)`);
    }
  } catch (error) {
    console.error('Failed to initialize widget:', error);
  }
};
