'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup function to revoke object URL and reset audio
  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Primary: Google Text-to-Speech API
  const speakWithGoogle = useCallback(async (text: string): Promise<boolean> => {
    try {
      // Cleanup previous audio before creating new one
      cleanupAudio();

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: 'zh-CN' }),
      });

      if (!response.ok) return false;

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Cleanup after playback ends
      audio.onended = () => {
        cleanupAudio();
      };

      // Cleanup on error
      audio.onerror = () => {
        cleanupAudio();
      };

      await audio.play();
      return true;
    } catch (error) {
      console.warn('Google TTS failed, falling back to Web Speech:', error);
      cleanupAudio();
      return false;
    }
  }, [cleanupAudio]);

  // Fallback: Browser Web Speech API
  const speakWithWebSpeech = useCallback((text: string, lang: string = 'zh-CN') => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8; // Slower for learning

    // Try to find a Chinese voice
    const voices = speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn')
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    speechSynthesis.speak(utterance);
  }, []);

  // Main speak function: Try Google first, fallback to Web Speech
  const speak = useCallback(
    async (text: string, lang: string = 'zh-CN') => {
      const googleSuccess = await speakWithGoogle(text);
      if (!googleSuccess) {
        speakWithWebSpeech(text, lang);
      }
    },
    [speakWithGoogle, speakWithWebSpeech]
  );

  const stop = useCallback(() => {
    cleanupAudio();
    // Stop Web Speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, [cleanupAudio]);

  return { speak, stop };
}

