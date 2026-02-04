import { Audio } from 'expo-av';

// Sound feedback types
export type SoundType = 'success' | 'error' | 'complete' | 'click' | 'match';

// Preload sounds for better performance
const soundObjects: Record<string, Audio.Sound> = {};

// Initialize audio settings
export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.error('Failed to init audio:', error);
  }
}

// Play subtle system sound
export async function playSound(type: SoundType) {
  try {
    // Use system sounds for subtle feedback
    // These are built into iOS/Android and don't require asset files
    const soundMap: Record<SoundType, string> = {
      success: 'tweet_sent',
      error: 'tweet_send_failure',
      complete: 'complete',
      click: 'key_press_click',
      match: 'beep_beep',
    };

    // For now, use simple haptic feedback on web or if audio fails
    // On native, we could load short sound files from assets
    // This is a subtle approach using built-in feedback

    // Create and play a short beep sound programmatically
    const { sound } = await Audio.Sound.createAsync(
      getSoundSource(type),
      { shouldPlay: true, volume: 0.3 }
    );

    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    // Silently fail - sound is optional
    console.log('Sound play failed:', error);
  }
}

// Get sound source based on type
function getSoundSource(type: SoundType): any {
  // For subtle feedback, we'll use the system's built-in sounds
  // In a production app, you'd include your own sound files in assets
  // For now, return null to gracefully handle without custom assets
  return require('../assets/sounds/click.mp3');
}

// Play success sound for completing practice/game
export async function playSuccessSound() {
  await playSound('success');
}

// Play error sound for wrong answers
export async function playErrorSound() {
  await playSound('error');
}

// Play complete sound for finishing
export async function playCompleteSound() {
  await playSound('complete');
}

// Play subtle click sound
export async function playClickSound() {
  await playSound('click');
}

// Play match sound for matching games
export async function playMatchSound() {
  await playSound('match');
}
