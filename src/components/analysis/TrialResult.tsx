'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSpeech } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Volume2, Lock, Sparkles, Camera, UserPlus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetectedObject {
  id: string;
  label_en: string;
  label_zh: string;
  pinyin: string;
  category: string;
  confidence: number;
}

interface TrialResultProps {
  imageUrl: string;
  sceneDescription?: string;
  sceneDescriptionZh?: string;
  sceneDescriptionPinyin?: string;
  objects: DetectedObject[];
  exampleSentences?: Record<string, { zh: string; pinyin: string; en: string }>;
  onTryAgain: () => void;
}

// Number of words to show for free
const FREE_WORDS_LIMIT = 3;

export function TrialResult({
  imageUrl,
  sceneDescription,
  sceneDescriptionZh,
  sceneDescriptionPinyin,
  objects,
  exampleSentences = {},
  onTryAgain,
}: TrialResultProps) {
  const { speak } = useSpeech();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const freeWords = objects.slice(0, FREE_WORDS_LIMIT);
  const lockedWords = objects.slice(FREE_WORDS_LIMIT);
  const hasLockedWords = lockedWords.length > 0;

  const handleSpeak = async (wordZh: string, id: string) => {
    setPlayingId(id);
    await speak(wordZh);
    setTimeout(() => setPlayingId(null), 1000);
  };

  const handleSaveClick = () => {
    setShowSignupModal(true);
  };

  const getExampleSentence = (wordZh: string): string | undefined => {
    const example = exampleSentences[wordZh];
    if (!example) return undefined;
    return `${example.zh} - ${example.en}`;
  };

  const categoryColors: Record<string, string> = {
    object: 'bg-blue-500/20 text-blue-400',
    color: 'bg-pink-500/20 text-pink-400',
    action: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-[#76ffbb]/20 to-pink-600/20 border border-[#76ffbb]/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#76ffbb]" />
          </div>
          <div>
            <h2 className="text-white font-medium">Analysis Complete!</h2>
            <p className="text-sm text-[#76ffbb]/80">
              Found {objects.length} words • {freeWords.length} shown free
              {hasLockedWords && ` • ${lockedWords.length} more available`}
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative rounded-xl overflow-hidden bg-[#1c2024]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Analyzed photo"
          className="w-full max-h-[40vh] object-contain"
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

      {/* Free Words */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-green-400">✓</span>
          Free Preview ({freeWords.length} words)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freeWords.map((obj) => (
            <Card
              key={obj.id}
              className="p-4 bg-[#1c2024] border-white/10 hover:border-[#76ffbb]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-xs font-medium mb-2',
                      categoryColors[obj.category] || 'bg-slate-600 text-[#e0e2e8]'
                    )}
                  >
                    {obj.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{obj.label_zh}</h3>
                  <p className="text-lg text-[#76ffbb] mb-1">{obj.pinyin}</p>
                  <p className="text-[#bacbbe]">{obj.label_en}</p>
                  {getExampleSentence(obj.label_zh) && (
                    <p className="text-sm text-[#849589] mt-2 italic">
                      "{getExampleSentence(obj.label_zh)}"
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSpeak(obj.label_zh, obj.id)}
                    className={cn(
                      'h-8 w-8 rounded-full',
                      playingId === obj.id
                        ? 'text-[#76ffbb] bg-[#76ffbb]/10'
                        : 'text-[#bacbbe] hover:text-[#e0e2e8]'
                    )}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  {/* Save button - triggers signup modal */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveClick}
                    className="h-8 w-8 rounded-full text-[#bacbbe] hover:text-green-400 hover:bg-green-500/20"
                    aria-label="Save to vocabulary"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Locked Words */}
      {hasLockedWords && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#bacbbe]" />
            {lockedWords.length} More Words
          </h3>

          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#101417]/50 p-4 sm:min-h-[300px] sm:p-5">
            <div className="pointer-events-none absolute inset-0 select-none p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-25 blur-[4px]">
                {lockedWords.slice(0, 6).map((obj) => (
                  <Card
                    key={obj.id}
                    className="min-h-36 p-4 bg-[#1c2024]/70 border-white/10"
                  >
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 bg-slate-600 text-[#e0e2e8]">
                        {obj.category}
                      </span>
                      <h3 className="text-2xl font-bold text-white mb-1">{obj.label_zh}</h3>
                      <p className="text-lg text-[#76ffbb] mb-1">{obj.pinyin}</p>
                      <p className="text-[#bacbbe]">{obj.label_en}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="absolute inset-0 bg-slate-950/55" />

            <div className="relative z-10 w-full max-w-md rounded-lg border border-[#76ffbb]/40 bg-[#1c2024]/95 p-5 text-center shadow-2xl shadow-purple-950/20 sm:p-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#76ffbb]/10">
                <Lock className="w-6 h-6 text-[#76ffbb]/80" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">
                Unlock {lockedWords.length} More Words
              </h4>
              <p className="text-[#e0e2e8] text-sm leading-6 mb-5">
                Sign up free to see every detected word, save vocabulary, and practice with flashcards.
              </p>
              <Link href="/signup" className="block">
                <Button className="w-full bg-[#76ffbb] text-white hover:bg-[#76ffbb]/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login" className="mt-3 inline-block text-sm text-[#bacbbe] hover:text-[#e0e2e8]">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
        <Button
          onClick={onTryAgain}
          variant="outline"
          className="border-white/10 text-[#e0e2e8]"
        >
          <Camera className="w-4 h-4 mr-2" />
          Try Another Photo
        </Button>
        <Link href="/signup">
          <Button className="bg-[#76ffbb] text-white hover:bg-[#76ffbb]/90">
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up to Save Words
          </Button>
        </Link>
      </div>

      {/* Benefits reminder */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-[#76ffbb]/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          What you get with a free account:
        </h3>
        <ul className="grid md:grid-cols-2 gap-3 text-[#e0e2e8]">
          {[
            'Unlimited photo analyses',
            'Save words to vocabulary',
            'Practice with flashcards',
            'Track learning streak',
            'Organize with lists',
            'AI-generated example sentences',
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <Link href="/signup">
            <Button size="lg" className="bg-white text-purple-900 hover:bg-slate-100">
              Get Started Free
            </Button>
          </Link>
        </div>
      </Card>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="bg-gradient-to-b from-[#1c2024] to-[#101417] border-white/10 max-w-sm p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#76ffbb] to-pink-600 px-6 py-8 text-center">
            <div className="text-5xl mb-3">📚</div>
            <DialogTitle className="text-white text-xl font-bold">
              Save This Word?
            </DialogTitle>
            <p className="text-purple-100 text-sm mt-1">
              Join free to build your vocabulary
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Quick benefits */}
            <div className="space-y-2 mb-6">
              {[
                { icon: '💾', text: 'Save unlimited words' },
                { icon: '🎴', text: 'Practice with flashcards' },
                { icon: '🔥', text: 'Track your streak' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-[#e0e2e8]">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link href="/signup" className="block">
                <Button className="w-full bg-[#76ffbb] hover:opacity-90 h-11">
                  Sign Up Free
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full text-[#bacbbe] hover:text-[#e0e2e8]">
                  Already have an account? Sign in
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
