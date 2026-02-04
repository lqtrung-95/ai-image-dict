import { useState, useCallback, useRef } from 'react';
import { AudioModule } from 'expo-audio';
import { apiClient } from '@/lib/api-client';
import * as FileSystem from 'expo-file-system';

export function useGoogleTTSWithAudioAPI() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const playerRef = useRef<any>(null);

  const speak = useCallback(async (text: string, lang = 'zh-CN') => {
    // Stop any current playback
    if (playerRef.current) {
      await playerRef.current.pause();
      playerRef.current = null;
    }

    setIsLoading(true);
    setIsPlaying(false);

    try {
      // Call backend TTS API
      const response = await apiClient.post('/api/tts', { text, lang });

      // Check if we got an audio response
      if (typeof response === 'object' && response.audioContent) {
        // Save base64 audio to temp file
        const tempFile = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(tempFile, response.audioContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Create audio player
        const { AudioPlayer } = await import('expo-audio');
        const player = new AudioPlayer(tempFile);
        playerRef.current = player;

        // Set up completion handler
        player.addListener('playBackStatus', (status: any) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            player.removeAllListeners();
            FileSystem.deleteAsync(tempFile, { idempotent: true });
          }
        });

        await player.play();
        setIsPlaying(true);
      } else {
        throw new Error('No audio content received');
      }
    } catch (err) {
      // Fallback to native speech
      const { Speech } = require('expo-speech');
      Speech.stop();
      Speech.speak(text, { language: lang, pitch: 1.0, rate: 0.8 });
      setIsPlaying(true);

      // Reset after estimated duration
      setTimeout(() => setIsPlaying(false), text.length * 150);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
      playerRef.current = null;
    }
    const { Speech } = require('expo-speech');
    Speech.stop();
    setIsPlaying(false);
  }, []);

  return { speak, stop, isPlaying, isLoading };
}
