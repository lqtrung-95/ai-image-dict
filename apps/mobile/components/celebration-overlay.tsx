import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { haptics, springs } from '@/lib/animation-utils';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  size: number;
}

interface CelebrationOverlayProps {
  visible: boolean;
  onComplete?: () => void;
  type?: 'success' | 'streak' | 'achievement';
  message?: string;
}

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: height / 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 200,
    size: 8 + Math.random() * 12,
  }));
}

function ParticleView({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const destinationY = -200 - Math.random() * 300;
    const destinationX = (Math.random() - 0.5) * 300;

    translateY.value = withDelay(
      particle.delay,
      withTiming(destinationY, {
        duration: 1000 + Math.random() * 500,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      particle.delay,
      withTiming(destinationX, {
        duration: 1000 + Math.random() * 500,
        easing: Easing.out(Easing.quad),
      })
    );

    opacity.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(600, withTiming(0, { duration: 300 }))
      )
    );

    scale.value = withDelay(
      particle.delay,
      withSequence(
        withSpring(1, springs.bouncy),
        withTiming(0, { duration: 300 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function CelebrationOverlay({
  visible,
  onComplete,
  type = 'success',
  message,
}: CelebrationOverlayProps) {
  const particles = useRef<Particle[]>(createParticles(30)).current;
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  const triggerCelebration = useCallback(() => {
    'worklet';
    overlayOpacity.value = withTiming(1, { duration: 100 });

    iconScale.value = withSequence(
      withSpring(1.5, springs.bouncy),
      withDelay(500, withTiming(0, { duration: 200 }))
    );

    iconRotation.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    textOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1000, withTiming(0, { duration: 200 }))
      )
    );

    // Auto-hide after animation
    overlayOpacity.value = withDelay(
      2000,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );

    runOnJS(haptics.success)();
  }, [onComplete]);

  useEffect(() => {
    if (visible) {
      triggerCelebration();
    }
  }, [visible, triggerCelebration]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotateZ: `${iconRotation.value}deg` },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateY: interpolate(textOpacity.value, [0, 1], [20, 0]),
      },
    ],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  const iconName = type === 'streak' ? 'flame' : type === 'achievement' ? 'trophy' : 'checkmark-circle';
  const iconColor = type === 'streak' ? '#f59e0b' : type === 'achievement' ? '#f59e0b' : '#10b981';

  return (
    <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none">
      {/* Particles */}
      {particles.map((particle) => (
        <ParticleView key={particle.id} particle={particle} />
      ))}

      {/* Center Icon */}
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Ionicons name={iconName as any} size={80} color={iconColor} />
      </Animated.View>

      {/* Message */}
      {message && (
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Animated.Text style={styles.messageText}>{message}</Animated.Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
  },
  iconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    top: height / 2 + 60,
  },
  messageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
