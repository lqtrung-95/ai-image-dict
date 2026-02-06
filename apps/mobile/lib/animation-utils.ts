import { useEffect, useCallback } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Spring configurations for different feels
export const springs = {
  gentle: {
    damping: 15,
    stiffness: 120,
    mass: 0.8,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.5,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.4,
  },
  soft: {
    damping: 25,
    stiffness: 80,
    mass: 1,
  },
};

// Haptic feedback utilities
export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

// Hook for press animation with scale effect
export function usePressAnimation(
  onPress?: () => void,
  scale = 0.95,
  springConfig = springs.gentle
) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = useCallback(() => {
    'worklet';
    scaleValue.value = withSpring(scale, springConfig);
  }, [scaleValue, scale, springConfig]);

  const handlePressOut = useCallback(() => {
    'worklet';
    scaleValue.value = withSpring(1, springConfig);
  }, [scaleValue, springConfig]);

  const handlePress = useCallback(() => {
    haptics.light();
    onPress?.();
  }, [onPress]);

  return {
    animatedStyle,
    handlers: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      onPress: handlePress,
    },
  };
}

// Hook for fade-in + slide-up animation
export function useFadeSlideAnimation(
  delay = 0,
  duration = 400,
  translateY = 30
) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
    translate.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.quad) })
    );
  }, [opacity, translate, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return animatedStyle;
}

// Hook for staggered list animations
export function useStaggeredListAnimation(
  itemCount: number,
  baseDelay = 50,
  duration = 300
) {
  const animatedItems = Array.from({ length: itemCount }, (_, i) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(0.95);

    useEffect(() => {
      const delay = i * baseDelay;
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration, easing: Easing.out(Easing.quad) })
      );
      translateY.value = withDelay(
        delay,
        withTiming(0, { duration, easing: Easing.out(Easing.quad) })
      );
      scale.value = withDelay(
        delay,
        withTiming(1, { duration, easing: Easing.out(Easing.back(1.5)) })
      );
    }, [opacity, translateY, scale, i, baseDelay, duration]);

    return useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));
  });

  return animatedItems;
}

// Hook for bounce animation (celebration)
export function useBounceAnimation() {
  const scale = useSharedValue(1);

  const triggerBounce = useCallback(() => {
    'worklet';
    scale.value = withSequence(
      withSpring(1.2, springs.bouncy),
      withSpring(1, springs.soft)
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, triggerBounce };
}

// Hook for pulse animation
export function usePulseAnimation(
  minScale = 0.95,
  maxScale = 1.05,
  duration = 1000
) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(maxScale, { duration: duration / 2 }),
      withTiming(minScale, { duration: duration / 2 })
    );
  }, [scale, minScale, maxScale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

// Hook for shake animation (error feedback)
export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    'worklet';
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    runOnJS(haptics.error)();
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { animatedStyle, triggerShake };
}

// Hook for card flip animation
export function useFlipAnimation() {
  const rotation = useSharedValue(0);

  const flip = useCallback(() => {
    'worklet';
    rotation.value = withSpring(
      rotation.value === 0 ? 180 : 0,
      springs.gentle
    );
    runOnJS(haptics.light)();
  }, [rotation]);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotation.value}deg` },
    ],
    opacity: interpolate(
      rotation.value,
      [0, 90, 180],
      [1, 0, 0],
      Extrapolation.CLAMP
    ),
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotation.value + 180}deg` },
    ],
    opacity: interpolate(
      rotation.value,
      [0, 90, 180],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return { frontAnimatedStyle, backAnimatedStyle, flip };
}

// Hook for floating animation (gentle up/down)
export function useFloatingAnimation(
  amplitude = 10,
  duration = 2000
) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSequence(
      withTiming(-amplitude, { duration }),
      withTiming(amplitude, { duration })
    );
  }, [translateY, amplitude, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

// Celebration animation with confetti effect simulation
export function useCelebrationAnimation() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const triggerCelebration = useCallback(() => {
    'worklet';
    scale.value = withSequence(
      withSpring(1.5, springs.bouncy),
      withTiming(1, { duration: 300 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(800, withTiming(0, { duration: 200 }))
    );
    rotation.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    runOnJS(haptics.success)();
  }, [scale, opacity, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return { animatedStyle, triggerCelebration };
}

// Animated number counter
export function useAnimatedNumber(
  targetValue: number,
  duration = 1000
) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, targetValue, duration]);

  return value;
}
