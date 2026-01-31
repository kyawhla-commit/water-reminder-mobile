import { useCallback, useState } from 'react';

interface UsePullRefreshOptions {
  onRefresh: () => Promise<void>;
  minDelay?: number; // Minimum delay to show refresh indicator
}

export const usePullRefresh = ({ onRefresh, minDelay = 500 }: UsePullRefreshOptions) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    const startTime = Date.now();
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      // Ensure minimum delay for better UX
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, minDelay - elapsed);
      
      setTimeout(() => {
        setRefreshing(false);
      }, remainingDelay);
    }
  }, [onRefresh, minDelay]);

  return {
    refreshing,
    handleRefresh,
  };
};
