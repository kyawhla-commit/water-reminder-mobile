import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Water Added Toast with undo option
interface WaterAddedToastProps {
  visible: boolean;
  amount: number;
  beverageName?: string;
  onUndo: () => void;
  onHide: () => void;
  undoTimeout?: number;
}

export function WaterAddedToast({
  visible,
  amount,
  beverageName = 'Water',
  onUndo,
  onHide,
  undoTimeout = 5000,
}: WaterAddedToastProps) {
  const { colors, isDark } = useAppTheme();

  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const dropletScale = useRef(new Animated.Value(0)).current;
  const dropletRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      translateY.setValue(100);
      opacity.setValue(0);
      progressAnim.setValue(1);
      dropletScale.setValue(0);
      dropletRotate.setValue(0);

      // Show toast
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Droplet animation
        Animated.sequence([
          Animated.spring(dropletScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(dropletRotate, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Progress bar countdown
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: undoTimeout,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, undoTimeout);

      return () => clearTimeout(timer);
    }
  }, [visible, undoTimeout]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  const handleUndo = () => {
    onUndo();
    hideToast();
  };

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const dropletRotation = dropletRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.cardElevated : colors.card,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: isDark ? colors.surfaceVariant : colors.border }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.content}>
        {/* Animated droplet icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primary + '20',
              transform: [{ scale: dropletScale }, { rotate: dropletRotation }],
            },
          ]}
        >
          <Text style={styles.dropletEmoji}>💧</Text>
        </Animated.View>

        {/* Message */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>+{amount}ml added!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{beverageName}</Text>
        </View>

        {/* Undo button */}
        <TouchableOpacity style={[styles.undoButton, { backgroundColor: colors.primary }]} onPress={handleUndo}>
          <Ionicons name="arrow-undo" size={16} color="#fff" />
          <Text style={styles.undoText}>Undo</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Goal Reached Celebration
interface GoalReachedCelebrationProps {
  visible: boolean;
  goalAmount: number;
  onDismiss: () => void;
  onShare?: () => void;
}

export function GoalReachedCelebration({ visible, goalAmount, onDismiss, onShare }: GoalReachedCelebrationProps) {
  const { colors, isDark } = useAppTheme();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      trophyBounce.setValue(0);
      confettiAnim.setValue(0);
      glowAnim.setValue(0);

      // Animate in
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Trophy bounce
        Animated.loop(
          Animated.sequence([
            Animated.timing(trophyBounce, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(trophyBounce, {
              toValue: 0,
              duration: 400,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
      ]).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Confetti burst
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const trophyTranslateY = trophyBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <Animated.View style={[styles.celebrationOverlay, { opacity: opacityAnim }]}>
      <Animated.View
        style={[
          styles.celebrationCard,
          {
            backgroundColor: isDark ? colors.card : colors.surface,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: colors.success,
              opacity: glowAnim.interpolate({
                inputRange: [0.5, 1],
                outputRange: [0.1, 0.3],
              }),
            },
          ]}
        />

        {/* Confetti particles */}
        <ConfettiParticles animValue={confettiAnim} />

        {/* Trophy */}
        <Animated.View style={[styles.trophyContainer, { transform: [{ translateY: trophyTranslateY }] }]}>
          <Text style={styles.trophyEmoji}>🏆</Text>
        </Animated.View>

        {/* Message */}
        <Text style={[styles.celebrationTitle, { color: colors.text }]}>Goal Reached!</Text>
        <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
          You drank {goalAmount}ml today!
        </Text>
        <Text style={[styles.celebrationMessage, { color: colors.success }]}>
          💪 Keep up the great work!
        </Text>

        {/* Buttons */}
        <View style={styles.celebrationButtons}>
          {onShare && (
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={onShare}
            >
              <Ionicons name="share-social" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.dismissButton, { borderColor: colors.border }]}
            onPress={handleDismiss}
          >
            <Text style={[styles.dismissButtonText, { color: colors.text }]}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Confetti particles component
function ConfettiParticles({ animValue }: { animValue: Animated.Value }) {
  const particles = [
    { emoji: '🎉', x: -60, delay: 0 },
    { emoji: '✨', x: 60, delay: 100 },
    { emoji: '💧', x: -40, delay: 200 },
    { emoji: '⭐', x: 40, delay: 150 },
    { emoji: '🎊', x: -20, delay: 50 },
    { emoji: '💫', x: 20, delay: 250 },
  ];

  return (
    <>
      {particles.map((particle, index) => {
        const translateY = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -150 - Math.random() * 50],
        });
        const translateX = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.x],
        });
        const opacity = animValue.interpolate({
          inputRange: [0, 0.3, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.8],
        });

        return (
          <Animated.Text
            key={index}
            style={[
              styles.confettiParticle,
              {
                opacity,
                transform: [{ translateY }, { translateX }, { scale }],
              },
            ]}
          >
            {particle.emoji}
          </Animated.Text>
        );
      })}
    </>
  );
}

// Quick feedback for small actions
interface QuickFeedbackProps {
  visible: boolean;
  message: string;
  icon?: string;
  onHide: () => void;
}

export function QuickFeedback({ visible, message, icon = '✓', onHide }: QuickFeedbackProps) {
  const { colors, isDark } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.quickFeedback,
        {
          backgroundColor: isDark ? colors.cardElevated : colors.card,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={styles.quickFeedbackIcon}>{icon}</Text>
      <Text style={[styles.quickFeedbackText, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Water Added Toast
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  progressBar: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropletEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  undoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Goal Reached Celebration
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  celebrationCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 200,
  },
  trophyContainer: {
    marginBottom: 16,
  },
  trophyEmoji: {
    fontSize: 64,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  celebrationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confettiParticle: {
    position: 'absolute',
    fontSize: 20,
    top: '30%',
  },

  // Quick Feedback
  quickFeedback: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  quickFeedbackIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickFeedbackText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default WaterAddedToast;
