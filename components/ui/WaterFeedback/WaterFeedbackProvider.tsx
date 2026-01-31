import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { GoalReachedCelebration, QuickFeedback, WaterAddedToast } from './index';

interface WaterEntry {
  id: string;
  amount: number;
  beverageName: string;
  timestamp: number;
}

interface WaterFeedbackContextType {
  showWaterAdded: (amount: number, beverageName?: string, onUndo?: () => void) => void;
  showGoalReached: (goalAmount: number) => void;
  showQuickFeedback: (message: string, icon?: string) => void;
  lastUndoneEntry: WaterEntry | null;
}

const WaterFeedbackContext = createContext<WaterFeedbackContextType | undefined>(undefined);

interface WaterFeedbackProviderProps {
  children: React.ReactNode;
  onShare?: () => void;
}

export function WaterFeedbackProvider({ children, onShare }: WaterFeedbackProviderProps) {
  // Water added toast state
  const [waterAddedVisible, setWaterAddedVisible] = useState(false);
  const [waterAddedAmount, setWaterAddedAmount] = useState(0);
  const [waterAddedBeverage, setWaterAddedBeverage] = useState('Water');

  // Store the undo callback for the current toast
  const undoCallbackRef = useRef<(() => void) | null>(null);

  // Goal reached state
  const [goalReachedVisible, setGoalReachedVisible] = useState(false);
  const [goalAmount, setGoalAmount] = useState(0);

  // Quick feedback state
  const [quickFeedbackVisible, setQuickFeedbackVisible] = useState(false);
  const [quickFeedbackMessage, setQuickFeedbackMessage] = useState('');
  const [quickFeedbackIcon, setQuickFeedbackIcon] = useState('✓');

  // Track last undone entry
  const [lastUndoneEntry, setLastUndoneEntry] = useState<WaterEntry | null>(null);

  const showWaterAdded = useCallback((amount: number, beverageName = 'Water', onUndo?: () => void) => {
    setWaterAddedAmount(amount);
    setWaterAddedBeverage(beverageName);
    undoCallbackRef.current = onUndo || null;
    setWaterAddedVisible(true);
  }, []);

  const showGoalReached = useCallback((amount: number) => {
    setGoalAmount(amount);
    setGoalReachedVisible(true);
  }, []);

  const showQuickFeedback = useCallback((message: string, icon = '✓') => {
    setQuickFeedbackMessage(message);
    setQuickFeedbackIcon(icon);
    setQuickFeedbackVisible(true);
  }, []);

  const handleUndo = useCallback(() => {
    const entry: WaterEntry = {
      id: `entry-${Date.now()}`,
      amount: waterAddedAmount,
      beverageName: waterAddedBeverage,
      timestamp: Date.now(),
    };
    setLastUndoneEntry(entry);

    // Call the registered undo callback
    if (undoCallbackRef.current) {
      undoCallbackRef.current();
    }
  }, [waterAddedAmount, waterAddedBeverage]);

  const handleWaterAddedHide = useCallback(() => {
    setWaterAddedVisible(false);
    undoCallbackRef.current = null;
  }, []);

  const handleGoalReachedDismiss = useCallback(() => {
    setGoalReachedVisible(false);
  }, []);

  const handleQuickFeedbackHide = useCallback(() => {
    setQuickFeedbackVisible(false);
  }, []);

  return (
    <WaterFeedbackContext.Provider
      value={{
        showWaterAdded,
        showGoalReached,
        showQuickFeedback,
        lastUndoneEntry,
      }}
    >
      {children}

      <WaterAddedToast
        visible={waterAddedVisible}
        amount={waterAddedAmount}
        beverageName={waterAddedBeverage}
        onUndo={handleUndo}
        onHide={handleWaterAddedHide}
      />

      <GoalReachedCelebration
        visible={goalReachedVisible}
        goalAmount={goalAmount}
        onDismiss={handleGoalReachedDismiss}
        onShare={onShare}
      />

      <QuickFeedback
        visible={quickFeedbackVisible}
        message={quickFeedbackMessage}
        icon={quickFeedbackIcon}
        onHide={handleQuickFeedbackHide}
      />
    </WaterFeedbackContext.Provider>
  );
}

export function useWaterFeedback() {
  const context = useContext(WaterFeedbackContext);
  if (!context) {
    throw new Error('useWaterFeedback must be used within a WaterFeedbackProvider');
  }
  return context;
}

export default WaterFeedbackProvider;
