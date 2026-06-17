'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash2, ImageIcon, BookOpen, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

// Session-scoped TTS URL cache shared across story page renders
const storyTtsCache = new Map<string, string>();

interface VocabularyItem {
  id: string;
  label_en: string;
  label_zh: string;
  pinyin: string;
  confidence: number;
  category: string;
}

interface StoryPhoto {
  story_photo_id: string;
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  vocabulary: VocabularyItem[];
}

interface CulturalNote {
  term: string;
  note: string;
}

interface GeneratedContent {
  storyZh: string;
  storyPinyin: string;
  storyEn: string;
  usedWords: string[];
  culturalNotes?: CulturalNote[];
}

interface Story {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  photos: StoryPhoto[];
  vocabularyCount: number;
  totalVocabularyItems: number;
  generated_content: GeneratedContent | null;
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const storyId = params.id as string;

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  const fetchStory = async () => {
    try {
      const response = await apiFetch(`/api/stories/${storyId}`);
      if (response.ok) {
        const data = await response.json();
        setStory(data.story);
      } else {
        toast.error('Story not found');
        router.push('/stories');
      }
    } catch (error) {
      toast.error('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    setGenerating(true);
    try {
      const response = await apiFetch(`/api/stories/${storyId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setStory(data.story);
        toast.success('Story generated!');
      } else {
        throw new Error('Failed to generate story');
      }
    } catch (error) {
      toast.error('Failed to generate story');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await apiFetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Story deleted');
        router.push('/stories');
      }
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  };

  const playAudio = async (text: string, id: string = 'story') => {
    if (playingAudio === id) {
      stopAudio();
      setPlayingAudio(null);
      return;
    }

    stopAudio();
    setPlayingAudio(id);

    try {
      // Check session cache first — avoids API call for already-fetched words
      let audioUrl: string | null = storyTtsCache.get(text) ?? null;

      if (!audioUrl) {
        const response = await apiFetch('/api/tts', {
          method: 'POST',
          body: JSON.stringify({ text, lang: 'zh-CN' }),
        });

        if (!response.ok) { fallbackTTS(text); setPlayingAudio(null); return; }

        const data = await response.json();
        if (data.fallback || !data.url) { fallbackTTS(text); setPlayingAudio(null); return; }

        audioUrl = data.url as string;
          storyTtsCache.set(text, audioUrl);
      }

      const audio = new Audio(audioUrl!);
      audioRef.current = audio;
      audio.onended = () => { audioRef.current = null; setPlayingAudio(null); };
      audio.onerror = () => { audioRef.current = null; setPlayingAudio(null); fallbackTTS(text); };
      await audio.play();
    } catch {
      fallbackTTS(text);
      setPlayingAudio(null);
    }
  };

  const fallbackTTS = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.onend = () => setPlayingAudio(null);
    window.speechSynthesis.speak(utterance);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'color':
        return 'bg-[#76ffbb]/10 text-[#76ffbb] border-[#76ffbb]/30';
      case 'action':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="h-8 w-48 bg-[#1c2024] rounded animate-pulse mb-6" />
        <div className="h-64 bg-[#1c2024] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/stories">
          <Button variant="ghost" className="-ml-2 text-[#bacbbe]">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Stories
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{story.title}</h1>
        {story.description && (
          <p className="text-[#bacbbe]">{story.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-[#849589]">
          <span className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            {story.photos.length} photos
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {story.vocabularyCount} unique words
          </span>
          <span className="text-[#849589]">
            ({story.totalVocabularyItems} total items)
          </span>
        </div>
      </div>

      {/* Generated Story */}
      {story.generated_content?.storyZh ? (
        <Card className="bg-[#181c20] border border-[#76ffbb]/20 p-6 mb-8 ghost-border">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#76ffbb]" />
            <h2 className="text-lg font-semibold text-white">AI-Generated Story</h2>
          </div>

          <div className="space-y-4">
            {/* Chinese */}
            <div className="bg-[#101417]/50 rounded-lg p-4">
              <p className="text-lg text-white leading-relaxed">{story.generated_content.storyZh}</p>
            </div>

            {/* Pinyin */}
            {story.generated_content.storyPinyin && (
              <div className="text-[#bacbbe] text-sm italic">{story.generated_content.storyPinyin}</div>
            )}

            {/* English */}
            {story.generated_content.storyEn && (
              <div className="text-[#e0e2e8] text-sm border-t border-white/10 pt-3">
                {story.generated_content.storyEn}
              </div>
            )}

            {/* Cultural Notes */}
            {(story.generated_content.culturalNotes ?? []).length > 0 && (
              <div className="border border-[#76ffbb]/15 rounded-lg p-4 bg-[#101417]/30">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#76ffbb]/60 mb-3">Cultural Notes</p>
                <div className="space-y-3">
                  {story.generated_content.culturalNotes!.map((n, i) => (
                    <div key={i}>
                      <span className="text-sm font-medium text-[#76ffbb]">{n.term}</span>
                      <p className="text-sm text-[#bacbbe] mt-0.5 leading-relaxed">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Play Audio Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => playAudio(story.generated_content!.storyZh, 'story')}
              disabled={playingAudio === 'story'}
              className="border-[#76ffbb]/30 text-[#76ffbb] hover:bg-[#76ffbb]/10"
            >
              {playingAudio === 'story' ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Listen
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#1c2024] border-white/10 border-dashed p-6 mb-8">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-[#849589] mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Generate a Story</h3>
            <p className="text-[#bacbbe] text-sm mb-4">
              Let AI create a short story using the vocabulary from your photos
            </p>
            <Button
              onClick={handleGenerateStory}
              disabled={generating || story.vocabularyCount === 0}
              className="bg-[#76ffbb] hover:opacity-90"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Story
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Photos */}
      <div className="space-y-6 mb-8">
        {story.photos.map((photo, index) => (
          <Card
            key={photo.id}
            className="bg-[#1c2024] border-white/10 overflow-hidden"
          >
            <div className="aspect-video bg-[#272a2e]">
              <img
                src={photo.image_url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {photo.caption && (
              <div className="p-4 border-b border-white/10/50">
                <p className="text-[#e0e2e8]">{photo.caption}</p>
              </div>
            )}
            {/* Vocabulary for this photo */}
            {photo.vocabulary && photo.vocabulary.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-[#bacbbe] mb-3">
                  Detected Words ({photo.vocabulary.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {photo.vocabulary.map((word) => (
                    <button
                      key={word.id}
                      onClick={() => playAudio(word.label_zh, word.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors hover:opacity-80 ${getCategoryColor(word.category)}`}
                    >
                      <span className="font-medium">{word.label_zh}</span>
                      <span className="text-xs opacity-80">{word.pinyin}</span>
                      <span className="text-xs opacity-60">· {word.label_en}</span>
                      {playingAudio === word.id ? (
                        <VolumeX className="w-3 h-3 ml-1" />
                      ) : (
                        <Volume2 className="w-3 h-3 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(!photo.vocabulary || photo.vocabulary.length === 0) && (
              <div className="p-4 text-sm text-[#849589]">
                No words detected in this photo.
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
