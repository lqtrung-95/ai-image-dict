import React from 'react';
import { PressableProps, GestureResponderEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressAnimation, springs } from '@/lib/animation-utils';

interface AnimatedPressableProps extends Omit<PressableProps, 'onPress'> {
  onPress?: () => void;
  children: React.ReactNode;
  scale?: number;
  springConfig?: typeof springs.gentle;
  style?: any;
}

export function AnimatedPressable({
  onPress,
  children,
  scale = 0.95,
  springConfig = springs.gentle,
  style,
  ...props
}: AnimatedPressableProps) {
  const { animatedStyle, handlers } = usePressAnimation(onPress, scale, springConfig);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Animated.Pressable
        onPressIn={handlers.onPressIn}
        onPressOut={handlers.onPressOut}
        onPress={handlers.onPress}
        {...props}
      >
        {children}
      </Animated.Pressable>
    </Animated.View>
  );
}
