import { NativeModules, Platform } from 'react-native';

const { HydroMateWidget } = NativeModules;

interface WidgetModule {
  updateWidget: (currentIntake: number, dailyGoal: number) => Promise<boolean>;
  resetWidget: () => Promise<boolean>;
}

const isAndroid = Platform.OS === 'android';

/**
 * Update the Android home screen widget with current water intake data
 */
export const updateAndroidWidget = async (
  currentIntake: number,
  dailyGoal: number
): Promise<boolean> => {
  if (!isAndroid || !HydroMateWidget) {
    console.log('Widget module not available');
    return false;
  }

  try {
    const result = await (HydroMateWidget as WidgetModule).updateWidget(
      currentIntake,
      dailyGoal
    );
    return result;
  } catch (error) {
    console.error('Error updating widget:', error);
    return false;
  }
};

/**
 * Reset the widget's daily intake (call at midnight)
 */
export const resetAndroidWidget = async (): Promise<boolean> => {
  if (!isAndroid || !HydroMateWidget) {
    return false;
  }

  try {
    const result = await (HydroMateWidget as WidgetModule).resetWidget();
    return result;
  } catch (error) {
    console.error('Error resetting widget:', error);
    return false;
  }
};

/**
 * Check if widget module is available
 */
export const isWidgetAvailable = (): boolean => {
  return isAndroid && !!HydroMateWidget;
};
