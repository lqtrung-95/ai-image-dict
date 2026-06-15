'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Camera, Zap, ArrowRight, Volume2 } from 'lucide-react';

// Sample words for the animated demo
const DEMO_WORDS = [
  { zh: '咖啡', pinyin: 'kāfēi', en: 'coffee', emoji: '☕' },
  { zh: '猫', pinyin: 'māo', en: 'cat', emoji: '🐱' },
  { zh: '手机', pinyin: 'shǒujī', en: 'phone', emoji: '📱' },
  { zh: '书', pinyin: 'shū', en: 'book', emoji: '📚' },
  { zh: '苹果', pinyin: 'píngguǒ', en: 'apple', emoji: '🍎' },
  { zh: '电脑', pinyin: 'diànnǎo', en: 'computer', emoji: '💻' },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/vocabulary');
    }
  }, [user, loading, router]);

  // Rotate through demo words
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % DEMO_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#101417] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#76ffbb]/30 border-t-[#76ffbb] animate-spin" />
      </div>
    );
  }

  const activeWord = DEMO_WORDS[activeWordIndex];

  return (
    <div className="min-h-screen bg-[#101417] overflow-hidden">
      {/* Minimal public header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5">
        <span className="text-lg font-bold text-[#76ffbb]">Snap Mandarin</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-[#bacbbe] hover:text-[#e0e2e8] hover:bg-[#272a2e]">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-32 left-1/4 w-96 h-96 bg-[#76ffbb]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-[#76ffbb]/3 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#76ffbb]/10 border border-[#76ffbb]/20 text-[#76ffbb] text-sm mb-10">
          <Zap className="w-3.5 h-3.5" />
          <span>Powered by AI Vision</span>
          <span className="w-1.5 h-1.5 bg-[#76ffbb] rounded-full animate-pulse" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-[#e0e2e8] mb-6 leading-tight tracking-tight">
          Snap a photo.
          <br />
          <span className="text-[#76ffbb]">Learn Chinese.</span>
        </h1>

        <p className="text-lg md:text-xl text-[#bacbbe] max-w-2xl mx-auto mb-12">
          Point your camera at <span className="text-[#e0e2e8] font-medium">anything</span> and instantly
          learn the Chinese vocabulary for what you see.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/try">
            <Button size="lg" className="bg-[#76ffbb] text-[#003822] font-semibold gap-2 h-12 px-8 hover:opacity-90 shadow-lg shadow-[#76ffbb]/20">
              <Camera className="w-5 h-5" />
              Try for Free
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="border-white/10 text-[#e0e2e8] hover:bg-[#272a2e] h-12 px-8">
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <p className="text-sm text-[#849589] mt-4">No account needed to try · 3 free analyses per day</p>
      </section>

      {/* Demo card */}
      <section className="max-w-sm mx-auto px-8 py-8">
        <div
          key={activeWordIndex}
          className="bg-[#1c2024] border border-white/5 rounded-2xl p-8 text-center animate-fadeIn shadow-xl"
        >
          <div className="text-6xl mb-4">{activeWord.emoji}</div>
          <p className="text-5xl font-bold text-[#e0e2e8] mb-2">{activeWord.zh}</p>
          <p className="text-lg text-[#76ffbb] mb-1">{activeWord.pinyin}</p>
          <p className="text-[#bacbbe]">{activeWord.en}</p>
          <button className="mt-5 w-10 h-10 rounded-full bg-[#76ffbb]/10 flex items-center justify-center mx-auto hover:bg-[#76ffbb]/20 transition-colors">
            <Volume2 className="w-4 h-4 text-[#76ffbb]" />
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold text-[#e0e2e8] text-center mb-3">
          Learn faster with AI
        </h2>
        <p className="text-[#bacbbe] text-center mb-12">Everything you need in one place</p>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '📷', title: 'Photo Analysis', desc: 'Snap anything and get instant vocabulary' },
            { icon: '🎴', title: 'SRS Practice', desc: 'Spaced repetition to lock in what you learn' },
            { icon: '📊', title: 'HSK Progress', desc: 'Track your path from HSK 1 to HSK 6' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-[#1c2024] border border-white/5 ghost-border jade-glow transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-[#e0e2e8] mb-1">{f.title}</h3>
              <p className="text-sm text-[#bacbbe]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-xl mx-auto px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-[#e0e2e8] mb-4">Ready to start?</h2>
        <p className="text-[#bacbbe] mb-8">Join learners building their Chinese vocabulary with AI.</p>
        <Link href="/signup">
          <Button size="lg" className="bg-[#76ffbb] text-[#003822] font-semibold h-12 px-10 hover:opacity-90">
            Start Learning Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
