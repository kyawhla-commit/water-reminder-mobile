// Toast notifications
export { Toast, type ToastConfig, type ToastType } from './Toast';
export { ToastProvider, useToast } from './Toast/ToastProvider';

// Skeleton loading
export {
    InlineSkeleton,
    PulseSkeleton,
    ShimmerSkeleton,
    SkeletonBeverageGrid,
    SkeletonCard,
    SkeletonHomeScreen,
    SkeletonList,
    SkeletonLoader,
    SkeletonSettingsScreen,
    SkeletonStatsScreen,
    SkeletonWaterProgress
} from './SkeletonLoader';

// Water fill animation
export { WaterFillAnimation } from './WaterFillAnimation';
export { EnhancedWaterFill } from './WaterFillAnimation/EnhancedWaterFill';

// Ripple animation
export { RippleAnimation, WaterRippleEffect } from './RippleAnimation';

// Confetti celebration
export { ConfettiCelebration, StarBurst, WaterGoalCelebration } from './ConfettiCelebration';

// Water feedback (added toast, goal celebration, undo)
export { GoalReachedCelebration, QuickFeedback, WaterAddedToast } from './WaterFeedback';
export { WaterFeedbackProvider, useWaterFeedback } from './WaterFeedback/WaterFeedbackProvider';

// Onboarding components
export {
    AnimatedOnboardingScreen,
    OnboardingWaterProgress,
    ProgressIndicator,
    SkipConfirmation,
    WaterGoalStep,
    WelcomeAnimation,
    type OnboardingStep
} from './Onboarding';

// Theme transition
export { AnimatedBackground, ThemeTransition } from './ThemeTransition';

// Micro-interactions
export {
    AnimatedNumber,
    BouncePressable,
    FadeInView,
    HighlightPressable,
    PulseView,
    ScalePressable,
    ShakeView,
    SpinIcon,
    StaggeredList
} from './MicroInteractions';

// Interactive components (buttons, cards, swipeable)
export {
    AnimatedTabs, InteractiveButton,
    InteractiveCard,
    SwipeableItem
} from './InteractiveComponents';

// Charts & Visualizations
export {
    AnimatedBar,
    AnimatedBarChart,
    CircularProgress,
    EmptyState,
    LineChart,
    PeriodComparison,
    ProgressRings,
    TrendLineChart
} from './Charts';

// Illustrations
export {
    AchievementBadge,
    EmptyStateIllustration,
    MotivationalScene,
    WaterDropCharacter
} from './Illustrations';

// CTA Buttons
export {
    CircularProgressCTA,
    FloatingCTA,
    PillCTA,
    PrimaryCTA,
    QuickAction
} from './CTAButton';

// Glassmorphism Effects
export {
    GlassBackdrop,
    GlassButton,
    GlassCard,
    GlassChip,
    GlassGradientCard,
    GlassInputContainer,
    GlassPanel,
    GlassStatCard
} from './Glassmorphism';

// Accessibility Components
export {
    AccessibilityProvider,
    AccessibleButton,
    AccessibleCard,
    AccessibleIconButton,
    AccessibleListItem,
    AccessibleProgress,
    AccessibleText,
    AccessibleToggle,
    announceForAccessibility,
    highContrastColors,
    setAccessibilityFocus,
    useAccessibility,
    useHighContrastColors
} from './Accessibility';

// Wellness Dashboard Components
export {
    BodyHydration,
    MiniWellnessScore,
    MoodEnergyTracker,
    PersonalizedTips,
    WeeklyReport,
    WellnessScoreRing
} from './Wellness';

