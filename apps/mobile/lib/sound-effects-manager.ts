import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound effect types for different interactions
export type SoundEffect =
  | 'buttonClick'
  | 'cardFlip'
  | 'correctAnswer'
  | 'wrongAnswer'
  | 'success'
  | 'complete'
  | 'match'
  | 'streak'
  | 'levelUp'
  | 'coin'
  | 'pop'
  | 'whoosh';

// Sound configuration
interface SoundConfig {
  uri: string;
  volume: number;
  shouldPreload: boolean;
}

// Default sound volumes (keep them subtle)
const SOUND_VOLUMES: Record<SoundEffect, number> = {
  buttonClick: 0.2,
  cardFlip: 0.25,
  correctAnswer: 0.3,
  wrongAnswer: 0.25,
  success: 0.35,
  complete: 0.4,
  match: 0.3,
  streak: 0.35,
  levelUp: 0.45,
  coin: 0.25,
  pop: 0.2,
  whoosh: 0.3,
};

// Sound file mappings - supports both .wav and .mp3
// Files are loaded from assets/sounds/
const SOUND_URIS: Record<SoundEffect, { file: string; extensions: string[] }> = {
  buttonClick: { file: 'button_click', extensions: ['.wav', '.mp3'] },
  cardFlip: { file: 'card_flip', extensions: ['.wav', '.mp3'] },
  correctAnswer: { file: 'correctAnswer', extensions: ['.wav', '.mp3'] },
  wrongAnswer: { file: 'wrongAnswer', extensions: ['.wav', '.mp3'] },
  success: { file: 'success', extensions: ['.wav', '.mp3'] },
  complete: { file: 'complete', extensions: ['.wav', '.mp3'] },
  match: { file: 'match', extensions: ['.wav', '.mp3'] },
  streak: { file: 'streak', extensions: ['.wav', '.mp3'] },
  levelUp: { file: 'level_up', extensions: ['.wav', '.mp3'] },
  coin: { file: 'coin', extensions: ['.wav', '.mp3'] },
  pop: { file: 'pop', extensions: ['.wav', '.mp3'] },
  whoosh: { file: 'whoosh', extensions: ['.wav', '.mp3'] },
};

class SoundEffectsManager {
  private sounds: Map<SoundEffect, Audio.Sound> = new Map();
  private enabled: boolean = true;
  private initialized: boolean = false;
  private useHapticsFallback: boolean = false;

  // Initialize the sound manager
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Preload commonly used sounds
      await this.preloadSounds(['buttonClick', 'correctAnswer', 'wrongAnswer', 'success']);

      this.initialized = true;
      console.log('[SoundEffects] Initialized successfully');
    } catch (error) {
      console.warn('[SoundEffects] Failed to initialize, using haptics fallback:', error);
      this.useHapticsFallback = true;
    }
  }

  // Preload specific sounds
  async preloadSounds(effects: SoundEffect[]): Promise<void> {
    for (const effect of effects) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          this.getSoundSource(effect),
          { volume: SOUND_VOLUMES[effect], shouldPlay: false }
        );
        this.sounds.set(effect, sound);
      } catch (error) {
        console.warn(`[SoundEffects] Failed to preload ${effect}:`, error);
      }
    }
  }

  // Static require map for Metro bundler compatibility
  private static requires: Record<string, any> = {
    'correctAnswer.wav': require('../assets/sounds/correctAnswer.wav'),
    'wrongAnswer.wav': require('../assets/sounds/wrongAnswer.wav'),
    'match.wav': require('../assets/sounds/match.wav'),
    'success.wav': require('../assets/sounds/success.wav'),
    'complete.wav': require('../assets/sounds/complete.wav'),
  };

  // Get sound source - uses static requires for Metro compatibility
  private getSoundSource(effect: SoundEffect): any {
    const config = SOUND_URIS[effect];

    // Try each extension in order
    for (const ext of config.extensions) {
      const key = `${config.file}${ext}`;
      if (SoundEffectsManager.requires[key]) {
        return SoundEffectsManager.requires[key];
      }
    }

    // If no file found, return null (graceful fallback)
    return null;
  }

  // Play a sound effect
  async play(effect: SoundEffect): Promise<void> {
    if (!this.enabled) return;

    try {
      // Check if sound is preloaded
      const sound = this.sounds.get(effect);

      if (sound) {
        // Replay preloaded sound
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } else {
        // Load and play on-demand
        const { sound: newSound } = await Audio.Sound.createAsync(
          this.getSoundSource(effect),
          { volume: SOUND_VOLUMES[effect], shouldPlay: true }
        );

        // Auto-unload after playing
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            newSound.unloadAsync();
          }
        });
      }
    } catch (error) {
      // Silently fail - sounds are optional
      console.log(`[SoundEffects] Could not play ${effect}:`, error);
    }
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Stop all sounds
  async stopAll(): Promise<void> {
    for (const [effect, sound] of this.sounds) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.warn(`[SoundEffects] Failed to stop ${effect}:`, error);
      }
    }
  }

  // Unload all sounds (cleanup)
  async unloadAll(): Promise<void> {
    for (const [effect, sound] of this.sounds) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn(`[SoundEffects] Failed to unload ${effect}:`, error);
      }
    }
    this.sounds.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const soundEffects = new SoundEffectsManager();

// Convenience functions
export const playButtonClick = () => soundEffects.play('buttonClick');
export const playCardFlip = () => soundEffects.play('cardFlip');
export const playCorrect = () => soundEffects.play('correctAnswer');
export const playWrong = () => soundEffects.play('wrongAnswer');
export const playSuccess = () => soundEffects.play('success');
export const playComplete = () => soundEffects.play('complete');
export const playMatch = () => soundEffects.play('match');
export const playStreak = () => soundEffects.play('streak');
export const playLevelUp = () => soundEffects.play('levelUp');
export const playCoin = () => soundEffects.play('coin');
export const playPop = () => soundEffects.play('pop');
export const playWhoosh = () => soundEffects.play('whoosh');
