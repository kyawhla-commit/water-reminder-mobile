import { checkAndUnlockAchievements } from '@/services/achievements';
import { updateAndroidWidget } from '@/services/androidWidget';
import { updateEcoImpact } from '@/services/ecoImpact';
import { feedPet, loadPet } from '@/services/virtualPet';
import { calculateStats } from '@/services/waterHistory';
import { syncWidgetEntries } from '@/services/widgetSync';
import { useCallback } from 'react';
import { Alert } from 'react-native';

interface UseWaterActionsProps {
  dailyIntake: number;
  dailyWaterGoal: number;
  addIntake: (amount: number) => Promise<number>;
}

export const useWaterActions = ({ dailyIntake, dailyWaterGoal, addIntake }: UseWaterActionsProps) => {
  
  const checkForAchievements = useCallback(async (currentIntake: number) => {
    try {
      const stats = await calculateStats(dailyWaterGoal);
      const newAchievements = await checkAndUnlockAchievements(
        stats.currentStreak,
        stats.monthlyAverage * 30,
        Math.round(stats.goalCompletionRate * stats.totalDaysTracked / 100),
        currentIntake,
        dailyWaterGoal
      );
      
      if (newAchievements.length > 0) {
        const achievement = newAchievements[0];
        Alert.alert(
          `${achievement.icon} Achievement Unlocked!`,
          `${achievement.title}\n${achievement.description}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [dailyWaterGoal]);

  const handleAddWater = useCallback(async (amount: number) => {
    try {
      // addIntake already handles: saving to storage, water history, and widget update
      const newIntake = await addIntake(amount);
      
      // Additional actions not handled by addIntake
      await updateEcoImpact(amount);
      
      // Feed virtual pet
      const pet = await loadPet();
      if (pet) {
        await feedPet(amount);
      }
      
      // Check achievements
      await checkForAchievements(newIntake);
      
    } catch (error) {
      console.error('Error adding water:', error);
      Alert.alert('Error', 'Failed to add water. Please try again.');
    }
  }, [addIntake, checkForAchievements]);

  const syncFromWidget = useCallback(async () => {
    try {
      const result = await syncWidgetEntries(dailyWaterGoal);
      if (result.synced > 0) {
        console.log(`Synced ${result.synced} entries from widget (+${result.totalAmount}ml)`);
        return result;
      }
      return { synced: 0, totalAmount: 0, entries: [] };
    } catch (error) {
      console.error('Error syncing widget entries:', error);
      return { synced: 0, totalAmount: 0, entries: [] };
    }
  }, [dailyWaterGoal]);

  const updateWidget = useCallback(async () => {
    await updateAndroidWidget(dailyIntake, dailyWaterGoal);
  }, [dailyIntake, dailyWaterGoal]);

  return {
    handleAddWater,
    syncFromWidget,
    updateWidget,
    checkForAchievements,
  };
};
