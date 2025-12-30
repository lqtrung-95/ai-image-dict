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
  objects: DetectedObject[];
  exampleSentences?: Record<string, { zh: string; pinyin: string; en: string }>;
  onTryAgain: () => void;
}

// Number of words to show for free
const FREE_WORDS_LIMIT = 3;

export function TrialResult({
  imageUrl,
  sceneDescription,
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
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-medium">Analysis Complete!</h2>
            <p className="text-sm text-purple-300">
              Found {objects.length} words • {freeWords.length} shown free
              {hasLockedWords && ` • ${lockedWords.length} more available`}
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative rounded-xl overflow-hidden bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Analyzed photo"
          className="w-full max-h-[40vh] object-contain"
        />
      </div>

      {/* Scene description */}
      {sceneDescription && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-1">Scene Description</h3>
          <p className="text-white">{sceneDescription}</p>
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
              className="p-4 bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-xs font-medium mb-2',
                      categoryColors[obj.category] || 'bg-slate-600 text-slate-300'
                    )}
                  >
                    {obj.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{obj.label_zh}</h3>
                  <p className="text-lg text-purple-400 mb-1">{obj.pinyin}</p>
                  <p className="text-slate-400">{obj.label_en}</p>
                  {getExampleSentence(obj.label_zh) && (
                    <p className="text-sm text-slate-500 mt-2 italic">
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
                        ? 'text-purple-400 bg-purple-500/20'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                  {/* Save button - triggers signup modal */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveClick}
                    className="h-8 w-8 rounded-full text-slate-400 hover:text-green-400 hover:bg-green-500/20"
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
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            {lockedWords.length} More Words
          </h3>
          
          {/* Locked content with overlay */}
          <div className="relative rounded-xl overflow-hidden">
            {/* Blurred cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 blur-[6px] opacity-60 pointer-events-none select-none p-1">
              {lockedWords.slice(0, 6).map((obj) => (
                <Card
                  key={obj.id}
                  className="p-4 bg-slate-800/50 border-slate-700"
                >
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 bg-slate-600 text-slate-300">
                      {obj.category}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-1">{obj.label_zh}</h3>
                    <p className="text-lg text-purple-400 mb-1">{obj.pinyin}</p>
                    <p className="text-slate-400">{obj.label_en}</p>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Centered unlock CTA */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
              <div className="bg-slate-800 border border-purple-500/50 rounded-xl p-6 max-w-sm mx-4 text-center shadow-2xl">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-purple-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Unlock {lockedWords.length} More Words
                </h4>
                <p className="text-slate-400 text-sm mb-5">
                  Sign up free to see all words, save vocabulary, and practice with flashcards.
                </p>
                <Link href="/signup">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 mb-3">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
        <Button
          onClick={onTryAgain}
          variant="outline"
          className="border-slate-600 text-slate-200"
        >
          <Camera className="w-4 h-4 mr-2" />
          Try Another Photo
        </Button>
        <Link href="/signup">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up to Save Words
          </Button>
        </Link>
      </div>

      {/* Benefits reminder */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          What you get with a free account:
        </h3>
        <ul className="grid md:grid-cols-2 gap-3 text-slate-300">
          {[
            'Unlimited photo analyses',
            'Save words to vocabulary',
            'Practice with flashcards',
            'Track learning streak',
            'Organize with collections',
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
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-center">Save to Vocabulary</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-slate-300 mb-6">
              Create a free account to save words to your vocabulary, practice with flashcards, 
              and track your learning progress.
            </p>
            <div className="space-y-3">
              <Link href="/signup">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                  Sign In
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full text-slate-500"
                onClick={() => setShowSignupModal(false)}
              >
                Continue browsing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
