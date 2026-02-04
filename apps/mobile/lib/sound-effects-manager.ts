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

// Sound file mappings - using system sounds or placeholder URIs
// In production, add actual MP3 files to assets/sounds/
const SOUND_URIS: Record<SoundEffect, string> = {
  buttonClick: 'button_click.mp3',
  cardFlip: 'card_flip.mp3',
  correctAnswer: 'correct.mp3',
  wrongAnswer: 'wrong.mp3',
  success: 'success.mp3',
  complete: 'complete.mp3',
  match: 'match.mp3',
  streak: 'streak.mp3',
  levelUp: 'level_up.mp3',
  coin: 'coin.mp3',
  pop: 'pop.mp3',
  whoosh: 'whoosh.mp3',
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

  // Get sound source - tries to load from assets or falls back
  private getSoundSource(effect: SoundEffect): any {
    try {
      // Try to require the sound file from assets
      return require(`../assets/sounds/${SOUND_URIS[effect]}`);
    } catch {
      // If file doesn't exist, return a placeholder
      // The play method will handle this gracefully
      return null;
    }
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
