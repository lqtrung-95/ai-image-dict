'use client';

import { useState } from 'react';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Share2, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useIsMobile';

interface DetectedObject {
  id: string;
  label_en: string;
  label_zh: string;
  pinyin: string;
  category: string;
  confidence: number;
  hsk_level?: number | null;
}

interface ExampleSentence {
  zh: string;
  pinyin: string;
  en: string;
}

interface AnalysisResultProps {
  id: string;
  imageUrl: string;
  sceneDescription?: string;
  sceneDescriptionZh?: string;
  sceneDescriptionPinyin?: string;
  objects: DetectedObject[];
  exampleSentences?: Record<string, ExampleSentence>;
  hskLevels?: Record<string, number | null>;
  onSaveWord: (word: { wordZh: string; wordPinyin: string; wordEn: string; detectedObjectId: string; listId?: string; exampleSentence?: string; exampleSentencePinyin?: string; exampleSentenceEn?: string; hskLevel?: number | null }) => Promise<void>;
  onUploadAnother?: () => void;
}

export function AnalysisResult({
  imageUrl,
  sceneDescription,
  sceneDescriptionZh,
  sceneDescriptionPinyin,
  objects,
  exampleSentences = {},
  hskLevels = {},
  onSaveWord,
  onUploadAnother,
}: AnalysisResultProps) {
  const isMobile = useIsMobile();
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);

  const getExample = (wordZh: string) => exampleSentences[wordZh] ?? null;
  const getExampleSentence = (wordZh: string): string | undefined => {
    const ex = getExample(wordZh);
    return ex ? `${ex.zh} (${ex.pinyin}) - ${ex.en}` : undefined;
  };

  const getHskLevel = (wordZh: string, objectHskLevel?: number | null): number | null | undefined => {
    // Prefer object's HSK level, fall back to hskLevels map
    return objectHskLevel ?? hskLevels[wordZh] ?? undefined;
  };

  const handleSaveWord = async (obj: DetectedObject, listId?: string) => {
    if (savedWords.has(obj.id)) return;

    setSavingWord(obj.id);
    try {
      await onSaveWord({
        wordZh: obj.label_zh,
        wordPinyin: obj.pinyin,
        wordEn: obj.label_en,
        detectedObjectId: obj.id,
        listId,
        exampleSentence: getExample(obj.label_zh)?.zh,
        exampleSentencePinyin: getExample(obj.label_zh)?.pinyin,
        exampleSentenceEn: getExample(obj.label_zh)?.en,
        hskLevel: getHskLevel(obj.label_zh, obj.hsk_level),
      });
      setSavedWords((prev) => new Set([...prev, obj.id]));
    } catch (error) {
      console.error('Failed to save word:', error);
      toast.error('Failed to save word');
    } finally {
      setSavingWord(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Chinese Vocabulary Discovery',
          text: `I learned ${objects.length} new Chinese words!`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const groupedObjects = {
    objects: objects.filter((o) => o.category === 'object'),
    colors: objects.filter((o) => o.category === 'color'),
    actions: objects.filter((o) => o.category === 'action'),
  };

  return (
    <div className="space-y-6">
      {/* Image */}
      <div className="relative rounded-xl overflow-hidden bg-[#1c2024]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Analyzed photo"
          className="w-full max-h-[50vh] object-contain"
        />
      </div>

      {/* Scene description */}
      {sceneDescription && (
        <div className="p-4 rounded-lg bg-[#1c2024] border border-white/10 space-y-2">
          <h3 className="text-sm font-medium text-[#bacbbe]">Scene Description</h3>
          {sceneDescriptionZh && (
            <p className="text-xl text-white">{sceneDescriptionZh}</p>
          )}
          {sceneDescriptionPinyin && (
            <p className="text-[#76ffbb] text-sm">{sceneDescriptionPinyin}</p>
          )}
          <p className="text-[#e0e2e8]">{sceneDescription}</p>
        </div>
      )}

      {/* Vocabulary sections */}
      {groupedObjects.objects.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            Objects ({groupedObjects.objects.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedObjects.objects.map((obj) => (
              <VocabularyCard
                key={obj.id}
                wordZh={obj.label_zh}
                wordPinyin={obj.pinyin}
                wordEn={obj.label_en}
                exampleSentence={getExampleSentence(obj.label_zh)}
                category="object"
                isSaved={savedWords.has(obj.id)}
                onSave={
                  savingWord === obj.id ? undefined : (listId) => handleSaveWord(obj, listId)
                }
              />
            ))}
          </div>
        </section>
      )}

      {groupedObjects.colors.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500" />
            Colors ({groupedObjects.colors.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedObjects.colors.map((obj) => (
              <VocabularyCard
                key={obj.id}
                wordZh={obj.label_zh}
                wordPinyin={obj.pinyin}
                wordEn={obj.label_en}
                exampleSentence={getExampleSentence(obj.label_zh)}
                category="color"
                isSaved={savedWords.has(obj.id)}
                onSave={
                  savingWord === obj.id ? undefined : (listId) => handleSaveWord(obj, listId)
                }
              />
            ))}
          </div>
        </section>
      )}

      {groupedObjects.actions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Actions ({groupedObjects.actions.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedObjects.actions.map((obj) => (
              <VocabularyCard
                key={obj.id}
                wordZh={obj.label_zh}
                wordPinyin={obj.pinyin}
                wordEn={obj.label_en}
                exampleSentence={getExampleSentence(obj.label_zh)}
                category="action"
                isSaved={savedWords.has(obj.id)}
                onSave={
                  savingWord === obj.id ? undefined : (listId) => handleSaveWord(obj, listId)
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
        {isMobile ? (
          // Mobile: Single button
          <Button
            variant="outline"
            className="border-white/10 text-[#e0e2e8]"
            onClick={onUploadAnother}
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Add Another
          </Button>
        ) : (
          // Desktop: Two buttons
          <>
            <Link href="/capture">
              <Button variant="outline" className="border-white/10 text-[#e0e2e8]">
                <Camera className="w-4 h-4 mr-2" />
                Capture Another
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-white/10 text-[#e0e2e8]"
              onClick={onUploadAnother}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Another
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={handleShare}
          className="border-white/10 text-[#e0e2e8]"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}

