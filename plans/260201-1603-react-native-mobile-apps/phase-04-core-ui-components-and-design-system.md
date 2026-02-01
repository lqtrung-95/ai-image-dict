---
title: "Phase 04: Core UI Components and Design System"
description: "Build reusable React Native UI components matching web app design"
---

# Phase 04: Core UI Components and Design System

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-03-supabase-authentication-and-navigation-guards.md](./phase-03-supabase-authentication-and-navigation-guards.md)
- Codebase Analysis: [scout/scout-codebase-analysis-report.md](./scout/scout-codebase-analysis-report.md)

## Overview
- **Priority:** P0
- **Status:** Pending
- **Description:** Build reusable React Native UI components that match the web app's shadcn/ui design system using NativeWind.
- **Estimated Effort:** 4-5 days

## Key Insights
- Use NativeWind for Tailwind CSS compatibility
- Build components to match shadcn/ui styling
- Support both light and dark modes
- Use React Native's built-in components as base
- Keep components under 200 lines

## Requirements

### Functional Requirements
- Button component with variants (primary, secondary, ghost, destructive)
- Card component for content containers
- Input and TextArea components
- Modal/Dialog component
- Loading skeletons
- Toast notifications
- Progress bars
- Avatar component

### Technical Requirements
- NativeWind styling
- TypeScript props
- Accessibility support
- Dark mode support
- Responsive design

## Architecture

### Component Structure
```
components/
├── ui/                       # Base UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── modal.tsx
│   ├── skeleton.tsx
│   ├── progress.tsx
│   ├── avatar.tsx
│   └── toast.tsx
├── layout/                   # Layout components
│   └── header.tsx
└── index.ts                  # Barrel export
```

## Related Code Files
- `src/components/ui/button.tsx` - Web button component
- `src/components/ui/card.tsx` - Web card component
- `src/components/ui/input.tsx` - Web input component
- `src/components/ui/dialog.tsx` - Web dialog component
- `src/components/ui/skeleton.tsx` - Web skeleton component

## Implementation Steps

### Step 1: Create Button Component
Create `components/ui/button.tsx`:
```tsx
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-lg px-4 py-3',
  {
    variants: {
      variant: {
        default: 'bg-purple-600 active:bg-purple-700',
        secondary: 'bg-gray-200 active:bg-gray-300',
        destructive: 'bg-red-600 active:bg-red-700',
        ghost: 'bg-transparent active:bg-gray-100',
        outline: 'border-2 border-purple-600 bg-transparent',
      },
      size: {
        default: 'h-12 px-4',
        sm: 'h-9 px-3',
        lg: 'h-14 px-6',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('font-semibold text-center', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-gray-900',
      destructive: 'text-white',
      ghost: 'text-gray-900',
      outline: 'text-purple-600',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  children,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? '#fff' : '#7c3aed'}
        />
      ) : (
        <Text className={cn(buttonTextVariants({ variant, size }))}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
```

### Step 2: Create Card Component
Create `components/ui/card.tsx`:
```tsx
import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends React.ComponentPropsWithoutRef<typeof View> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn('text-2xl font-semibold leading-none tracking-tight text-gray-900', className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardDescription({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('text-sm text-gray-500', className)} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}
```

### Step 3: Create Input Component
Create `components/ui/input.tsx`:
```tsx
import { TextInput, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  className,
  label,
  error,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        className={cn(
          'h-12 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900',
          'placeholder:text-gray-400',
          'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
```

### Step 4: Create TextArea Component
Create `components/ui/textarea.tsx`:
```tsx
import { TextInput, View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface TextAreaProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  error?: string;
  containerClassName?: string;
  numberOfLines?: number;
}

export function TextArea({
  className,
  label,
  error,
  containerClassName,
  numberOfLines = 4,
  ...props
}: TextAreaProps) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        className={cn(
          'min-h-[100px] rounded-lg border border-gray-300 bg-white p-4 text-base text-gray-900',
          'placeholder:text-gray-400',
          'focus:border-purple-500',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
```

### Step 5: Create Modal Component
Create `components/ui/modal.tsx`:
```tsx
import { Modal as RNModal, View, TouchableOpacity, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isVisible,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <RNModal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className={cn(
            'w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl',
            className
          )}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              {title && (
                <Text className="text-xl font-semibold text-gray-900">{title}</Text>
              )}
              {description && (
                <Text className="mt-1 text-sm text-gray-500">{description}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View className="mt-4">{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
```

### Step 6: Create Skeleton Component
Create `components/ui/skeleton.tsx`:
```tsx
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number;
}

export function Skeleton({ className, width = '100%', height = 20 }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[{ width, height }, animatedStyle]}
      className={cn('rounded-md bg-gray-200', className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
    </View>
  );
}
```

### Step 7: Create Progress Component
Create `components/ui/progress.tsx`:
```tsx
import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}>
      <View
        className={cn('h-full rounded-full bg-purple-600', barClassName)}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}
```

### Step 8: Create Avatar Component
Create `components/ui/avatar.tsx`:
```tsx
import { View, Image, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
};

export function Avatar({ src, fallback = '?', size = 'md', className }: AvatarProps) {
  const initials = fallback.slice(0, 2).toUpperCase();

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-purple-100',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image source={{ uri: src }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="font-semibold text-purple-600">{initials}</Text>
      )}
    </View>
  );
}
```

### Step 9: Create Toast Component
Create `components/ui/toast.tsx`:
```tsx
import { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const iconComponents = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: AlertCircle,
};

export function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  const fadeAnim = new Animated.Value(0);
  const Icon = iconComponents[type];

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={cn(
        'absolute left-4 right-4 top-12 z-50 flex-row items-center rounded-lg p-4 shadow-lg',
        toastStyles[type]
      )}
    >
      <Icon size={20} color="white" />
      <Text className="ml-3 flex-1 text-white font-medium">{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <X size={18} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}
```

### Step 10: Create Utility for Class Names
Create `lib/utils.ts` (if not already created):
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Step 11: Create Barrel Export
Create `components/ui/index.ts`:
```typescript
export { Button } from './button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export { Input } from './input';
export { TextArea } from './textarea';
export { Modal } from './modal';
export { Skeleton, SkeletonCard } from './skeleton';
export { Progress } from './progress';
export { Avatar } from './avatar';
export { Toast } from './toast';
```

## Todo List
- [ ] Install class-variance-authority and clsx/tailwind-merge
- [ ] Create Button component with variants
- [ ] Create Card component with subcomponents
- [ ] Create Input component
- [ ] Create TextArea component
- [ ] Create Modal component
- [ ] Create Skeleton component with animation
- [ ] Create Progress component
- [ ] Create Avatar component
- [ ] Create Toast component
- [ ] Create cn utility function
- [ ] Create barrel export file
- [ ] Test all components on iOS
- [ ] Test all components on Android
- [ ] Verify dark mode support

## Success Criteria
- [ ] All components render correctly
- [ ] Button variants work as expected
- [ ] Modal opens and closes properly
- [ ] Skeleton has shimmer animation
- [ ] Progress bar shows correct percentage
- [ ] Avatar shows image or fallback
- [ ] Toast auto-dismisses after duration
- [ ] All components are accessible

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| NativeWind configuration issues | Medium | High | Test styling early |
| Animation performance | Low | Medium | Use native driver |
| Dark mode inconsistencies | Medium | Low | Define color tokens |

## Security Considerations
- No sensitive data in component props
- Image sources validated
- Modal prevents interaction with background

## Next Steps
After completing this phase, proceed to [Phase 05: Photo Capture and AI Analysis](./phase-05-photo-capture-and-ai-analysis.md) to implement the core feature.
