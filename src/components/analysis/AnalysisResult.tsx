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
  onSaveWord: (word: { wordZh: string; wordPinyin: string; wordEn: string; detectedObjectId: string; collectionId?: string; exampleSentence?: string }) => Promise<void>;
}

export function AnalysisResult({
  imageUrl,
  sceneDescription,
  sceneDescriptionZh,
  sceneDescriptionPinyin,
  objects,
  exampleSentences = {},
  onSaveWord,
}: AnalysisResultProps) {
  const isMobile = useIsMobile();
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);

  const getExampleSentence = (wordZh: string): string | undefined => {
    const example = exampleSentences[wordZh];
    if (!example) return undefined;
    return `${example.zh} (${example.pinyin}) - ${example.en}`;
  };

  const handleSaveWord = async (obj: DetectedObject, collectionId?: string) => {
    if (savedWords.has(obj.id)) return;

    setSavingWord(obj.id);
    try {
      await onSaveWord({
        wordZh: obj.label_zh,
        wordPinyin: obj.pinyin,
        wordEn: obj.label_en,
        detectedObjectId: obj.id,
        collectionId,
        exampleSentence: getExampleSentence(obj.label_zh),
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
      <div className="relative rounded-xl overflow-hidden bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Analyzed photo"
          className="w-full max-h-[50vh] object-contain"
        />
      </div>

      {/* Scene description */}
      {sceneDescription && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2">
          <h3 className="text-sm font-medium text-slate-400">Scene Description</h3>
          {sceneDescriptionZh && (
            <p className="text-xl text-white">{sceneDescriptionZh}</p>
          )}
          {sceneDescriptionPinyin && (
            <p className="text-purple-400 text-sm">{sceneDescriptionPinyin}</p>
          )}
          <p className="text-slate-300">{sceneDescription}</p>
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
                  savingWord === obj.id ? undefined : (collectionId) => handleSaveWord(obj, collectionId)
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
                  savingWord === obj.id ? undefined : (collectionId) => handleSaveWord(obj, collectionId)
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
                  savingWord === obj.id ? undefined : (collectionId) => handleSaveWord(obj, collectionId)
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
        {isMobile ? (
          // Mobile: Single button - file input handles both camera and gallery
          <Link href="/upload">
            <Button variant="outline" className="border-slate-600 text-slate-200">
              <ImagePlus className="w-4 h-4 mr-2" />
              Add Another
            </Button>
          </Link>
        ) : (
          // Desktop: Two buttons
          <>
            <Link href="/capture">
              <Button variant="outline" className="border-slate-600 text-slate-200">
                <Camera className="w-4 h-4 mr-2" />
                Capture Another
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" className="border-slate-600 text-slate-200">
                <Upload className="w-4 h-4 mr-2" />
                Upload Another
              </Button>
            </Link>
          </>
        )}
        <Button
          variant="outline"
          onClick={handleShare}
          className="border-slate-600 text-slate-200"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}

