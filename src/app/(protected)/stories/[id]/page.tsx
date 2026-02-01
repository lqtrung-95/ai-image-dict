'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Trash2, ImageIcon, BookOpen, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

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

interface GeneratedContent {
  storyZh: string;
  storyPinyin: string;
  storyEn: string;
  usedWords: string[];
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

  const playAudio = async (text: string, id: string = 'story') => {
    if (playingAudio === id) {
      // Already playing, stop it
      window.speechSynthesis.cancel();
      setPlayingAudio(null);
      return;
    }

    setPlayingAudio(id);

    try {
      const response = await apiFetch('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text, lang: 'zh-CN' }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setPlayingAudio(null);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setPlayingAudio(null);
          URL.revokeObjectURL(audioUrl);
          // Fallback to browser TTS
          fallbackTTS(text);
        };

        await audio.play();
      } else if (response.status === 503) {
        // TTS not configured, use fallback
        fallbackTTS(text);
        setPlayingAudio(null);
      } else {
        throw new Error('TTS failed');
      }
    } catch {
      // Fallback to browser's native speech synthesis
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
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'action':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse mb-6" />
        <div className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/stories">
          <Button variant="ghost" className="-ml-2 text-slate-400">
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
          <p className="text-slate-400">{story.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            {story.photos.length} photos
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {story.vocabularyCount} unique words
          </span>
          <span className="text-slate-600">
            ({story.totalVocabularyItems} total items)
          </span>
        </div>
      </div>

      {/* Generated Story */}
      {story.generated_content?.storyZh ? (
        <Card className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 border-purple-500/30 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">AI-Generated Story</h2>
          </div>

          <div className="space-y-4">
            {/* Chinese */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-lg text-white leading-relaxed">{story.generated_content.storyZh}</p>
            </div>

            {/* Pinyin */}
            {story.generated_content.storyPinyin && (
              <div className="text-slate-400 text-sm italic">{story.generated_content.storyPinyin}</div>
            )}

            {/* English */}
            {story.generated_content.storyEn && (
              <div className="text-slate-300 text-sm border-t border-slate-700 pt-3">
                {story.generated_content.storyEn}
              </div>
            )}

            {/* Play Audio Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => playAudio(story.generated_content!.storyZh, 'story')}
              disabled={playingAudio === 'story'}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
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
        <Card className="bg-slate-800/50 border-slate-700 border-dashed p-6 mb-8">
          <div className="text-center">
            <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Generate a Story</h3>
            <p className="text-slate-400 text-sm mb-4">
              Let AI create a short story using the vocabulary from your photos
            </p>
            <Button
              onClick={handleGenerateStory}
              disabled={generating || story.vocabularyCount === 0}
              className="bg-purple-600 hover:bg-purple-700"
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
            className="bg-slate-800/50 border-slate-700 overflow-hidden"
          >
            <div className="aspect-video bg-slate-700">
              <img
                src={photo.image_url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {photo.caption && (
              <div className="p-4 border-b border-slate-700/50">
                <p className="text-slate-300">{photo.caption}</p>
              </div>
            )}
            {/* Vocabulary for this photo */}
            {photo.vocabulary && photo.vocabulary.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">
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
              <div className="p-4 text-sm text-slate-500">
                No words detected in this photo.
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
