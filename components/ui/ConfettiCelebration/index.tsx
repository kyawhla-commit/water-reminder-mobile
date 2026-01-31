import { useAppTheme } from '@/hooks/useAppTheme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  type: 'square' | 'circle' | 'strip';
}

interface ConfettiCelebrationProps {
  trigger: boolean;
  duration?: number;
  pieceCount?: number;
  colors?: string[];
  onComplete?: () => void;
  showMessage?: boolean;
  message?: string;
  subMessage?: string;
}

const DEFAULT_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

export function ConfettiCelebration({
  trigger,
  duration = 3000,
  pieceCount = 50,
  colors = DEFAULT_COLORS,
  onComplete,
  showMessage = true,
  message = '🎉 Goal Reached!',
  subMessage = 'Great job staying hydrated!',
}: ConfettiCelebrationProps) {
  const { colors: themeColors } = useAppTheme();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [visible, setVisible] = useState(false);
  const messageScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  const generatePieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 360,
        type: ['square', 'circle', 'strip'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'strip',
      });
    }
    return newPieces;
  }, [pieceCount, colors]);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      setPieces(generatePieces());

      // Animate message
      Animated.sequence([
        Animated.parallel([
          Animated.spring(messageScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(messageOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(duration - 800),
        Animated.parallel([
          Animated.timing(messageScale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(messageOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const timer = setTimeout(() => {
        setVisible(false);
        setPieces([]);
        messageScale.setValue(0);
        messageOpacity.setValue(0);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} duration={duration} />
      ))}

      {showMessage && (
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: messageOpacity,
              transform: [{ scale: messageScale }],
            },
          ]}
        >
          <Text style={styles.messageText}>{message}</Text>
          <Text style={[styles.subMessageText, { color: themeColors.textSecondary }]}>{subMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function ConfettiPieceComponent({ piece, duration }: { piece: ConfettiPiece; duration: number }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fallDuration = duration * 0.8 + Math.random() * 500;
    const swayAmount = (Math.random() - 0.5) * 100;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 50,
        duration: fallDuration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: swayAmount,
          duration: fallDuration / 3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -swayAmount,
          duration: fallDuration / 3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: fallDuration / 3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotate, {
        toValue: 1,
        duration: fallDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: fallDuration,
        delay: fallDuration * 0.6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: [`${piece.rotation}deg`, `${piece.rotation + 720}deg`],
  });

  const getShape = () => {
    switch (piece.type) {
      case 'circle':
        return { borderRadius: piece.size / 2 };
      case 'strip':
        return { width: piece.size / 3, height: piece.size, borderRadius: 2 };
      default:
        return { borderRadius: 2 };
    }
  };

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate: rotateInterpolate }],
        },
        getShape(),
      ]}
    />
  );
}

// Water-specific celebration
interface WaterGoalCelebrationProps {
  trigger: boolean;
  goalAmount: number;
  onComplete?: () => void;
}

export function WaterGoalCelebration({ trigger, goalAmount, onComplete }: WaterGoalCelebrationProps) {
  const waterColors = ['#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5', '#0288D1', '#81D4FA', '#B3E5FC'];

  return (
    <ConfettiCelebration
      trigger={trigger}
      colors={waterColors}
      message="💧 Goal Reached!"
      subMessage={`You drank ${goalAmount}ml today!`}
      pieceCount={60}
      duration={3500}
      onComplete={onComplete}
    />
  );
}

// Star burst celebration for achievements
interface StarBurstProps {
  trigger: boolean;
  x?: number;
  y?: number;
  onComplete?: () => void;
}

export function StarBurst({ trigger, x = SCREEN_WIDTH / 2, y = SCREEN_HEIGHT / 2, onComplete }: StarBurstProps) {
  const [stars, setStars] = useState<Array<{ id: number; angle: number }>>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const newStars = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 30 * Math.PI) / 180,
      }));
      setStars(newStars);

      const timer = setTimeout(() => {
        setVisible(false);
        setStars([]);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <View style={[styles.starBurstContainer, { left: x, top: y }]} pointerEvents="none">
      {stars.map((star) => (
        <StarParticle key={star.id} angle={star.angle} />
      ))}
    </View>
  );
}

function StarParticle({ angle }: { angle: number }) {
  const distance = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(distance, {
        toValue: 80,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const translateX = distance.interpolate({
    inputRange: [0, 80],
    outputRange: [0, Math.cos(angle) * 80],
  });

  const translateY = distance.interpolate({
    inputRange: [0, 80],
    outputRange: [0, Math.sin(angle) * 80],
  });

  return (
    <Animated.Text
      style={[
        styles.star,
        {
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      ⭐
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  piece: {
    position: 'absolute',
  },
  messageContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subMessageText: {
    fontSize: 16,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starBurstContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 9999,
  },
  star: {
    position: 'absolute',
    fontSize: 20,
  },
});

export default ConfettiCelebration;
