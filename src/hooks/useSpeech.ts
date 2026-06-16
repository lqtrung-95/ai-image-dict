'use client';

import { useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';

// Module-level cache: persists across component mounts in the same browser session.
// Key = "lang:text", value = CDN URL. Eliminates repeat API calls for the same word.
const ttsUrlCache = new Map<string, string>();

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCurrent(), [stopCurrent]);

  const playUrl = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        stopCurrent();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { audioRef.current = null; };
        audio.onerror = () => { audioRef.current = null; };
        await audio.play();
        return true;
      } catch {
        audioRef.current = null;
        return false;
      }
    },
    [stopCurrent]
  );

  const speakWithGoogle = useCallback(
    async (text: string, lang = 'zh-CN'): Promise<boolean> => {
      const cacheKey = `${lang}:${text}`;

      // In-memory cache hit — play directly from CDN, zero API calls.
      const cachedUrl = ttsUrlCache.get(cacheKey);
      if (cachedUrl) return playUrl(cachedUrl);

      try {
        const response = await apiFetch('/api/tts', {
          method: 'POST',
          body: JSON.stringify({ text, lang }),
        });

        if (!response.ok) return false;

        const data = await response.json();

        // Fallback signal: TTS not configured or provider failed
        if (data.fallback) return false;

        if (data.url) {
          ttsUrlCache.set(cacheKey, data.url);
          return playUrl(data.url);
        }

        return false;
      } catch {
        return false;
      }
    },
    [playUrl]
  );

  const speakWithWebSpeech = useCallback((text: string, lang = 'zh-CN') => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    const chineseVoice = speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn'));
    if (chineseVoice) utterance.voice = chineseVoice;
    speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (text: string, lang = 'zh-CN') => {
      const ok = await speakWithGoogle(text, lang);
      if (!ok) speakWithWebSpeech(text, lang);
    },
    [speakWithGoogle, speakWithWebSpeech]
  );

  const stop = useCallback(() => {
    stopCurrent();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }, [stopCurrent]);

  return { speak, stop };
}
