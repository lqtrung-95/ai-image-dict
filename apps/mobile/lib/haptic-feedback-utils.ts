import * as Haptics from 'expo-haptics';

// Haptic feedback types
export type FeedbackType = 'success' | 'error' | 'complete' | 'light' | 'medium' | 'heavy' | 'match';

// Play haptic feedback
export async function playHaptic(type: FeedbackType) {
  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'complete':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'match':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Silently fail - haptics are optional
  }
}

// Convenience functions
export async function playSuccessFeedback() {
  await playHaptic('success');
}

export async function playErrorFeedback() {
  await playHaptic('error');
}

export async function playCompleteFeedback() {
  await playHaptic('complete');
}

export async function playLightFeedback() {
  await playHaptic('light');
}

export async function playMatchFeedback() {
  await playHaptic('match');
}
