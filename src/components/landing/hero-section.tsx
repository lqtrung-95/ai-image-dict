'use client';

import Link from 'next/link';
import { Camera, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEMO_WORDS = [
  { zh: '咖啡', pinyin: 'kāfēi', en: 'coffee', emoji: '☕' },
  { zh: '猫', pinyin: 'māo', en: 'cat', emoji: '🐱' },
  { zh: '手机', pinyin: 'shǒujī', en: 'phone', emoji: '📱' },
  { zh: '书', pinyin: 'shū', en: 'book', emoji: '📚' },
  { zh: '苹果', pinyin: 'píngguǒ', en: 'apple', emoji: '🍎' },
  { zh: '电脑', pinyin: 'diànnǎo', en: 'computer', emoji: '💻' },
];

export function HeroSection({ activeWordIndex }: { activeWordIndex: number }) {
  const word = DEMO_WORDS[activeWordIndex % DEMO_WORDS.length];

  return (
    <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-10">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#76ffbb]/10 border border-[#76ffbb]/20 text-[#76ffbb] text-sm mb-8">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-powered Chinese learning</span>
            <span className="w-1.5 h-1.5 bg-[#76ffbb] rounded-full animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-[#e0e2e8] mb-6 leading-tight tracking-tight">
            Snap a photo.<br />
            <span className="text-[#76ffbb]">Learn Chinese.</span>
          </h1>

          <p className="text-lg text-[#bacbbe] mb-4 leading-relaxed">
            Point your camera at <span className="text-[#e0e2e8] font-medium">anything</span> — food, objects, signs, street scenes —
            and instantly get Chinese characters, pinyin, and meaning.
          </p>
          <p className="text-base text-[#849589] mb-10 leading-relaxed">
            Words you capture are automatically added to your personal library and reinforced
            with spaced-repetition flashcards so you actually remember them.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Link href="/try">
              <Button size="lg" className="bg-[#76ffbb] text-[#003822] font-semibold gap-2 h-12 px-8 hover:opacity-90 shadow-lg shadow-[#76ffbb]/20">
                <Camera className="w-5 h-5" />
                Try Free — No Sign-up
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-white/10 text-[#e0e2e8] hover:bg-[#272a2e] h-12 px-8">
                Create Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-[#849589]">3 free photo analyses per day · No credit card required</p>
        </div>

        {/* Right: animated word card */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-[#76ffbb]/10 rounded-3xl blur-2xl scale-110" />
            <div
              key={activeWordIndex}
              className="relative bg-[#181c20] border border-white/10 rounded-2xl p-10 text-center shadow-2xl w-72 animate-fadeIn"
            >
              <div className="text-7xl mb-5">{word.emoji}</div>
              <p className="text-6xl font-bold text-[#e0e2e8] mb-3">{word.zh}</p>
              <p className="text-xl text-[#76ffbb] mb-2 font-medium">{word.pinyin}</p>
              <p className="text-[#bacbbe] text-lg">{word.en}</p>
              <div className="mt-5 flex items-center justify-center gap-1">
                {DEMO_WORDS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${i === activeWordIndex % DEMO_WORDS.length ? 'w-6 bg-[#76ffbb]' : 'w-1.5 bg-white/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
