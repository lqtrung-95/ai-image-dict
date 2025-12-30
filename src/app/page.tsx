'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Camera, Zap, ArrowRight, Volume2 } from 'lucide-react';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { cn } from '@/lib/utils';

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
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  // Rotate through demo words
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % DEMO_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900">
        <div className="container mx-auto px-4 py-20">
          <div className="h-64 bg-slate-800/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (user) {
    return <DashboardHome />;
  }

  const activeWord = DEMO_WORDS[activeWordIndex];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-16 pb-12 text-center">
        {/* Floating emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute top-10 left-[10%] text-4xl animate-bounce delay-100">📸</span>
          <span className="absolute top-20 right-[15%] text-3xl animate-bounce delay-300">🇨🇳</span>
          <span className="absolute bottom-20 left-[20%] text-3xl animate-bounce delay-500">✨</span>
          <span className="absolute top-32 right-[25%] text-2xl animate-bounce delay-700">🎯</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm mb-8 backdrop-blur-sm">
          <Zap className="w-4 h-4" />
          <span>Powered by AI Vision</span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Snap a photo.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-gradient">
            Learn Chinese.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-4">
          Point your camera at <span className="text-white font-medium">anything</span> and instantly learn
          how to say it in Chinese.
        </p>
        
        <p className="text-lg text-slate-500 mb-10">
          It&apos;s like magic, but it&apos;s AI. 🪄
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link href="/try">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2 w-full sm:w-auto h-14 px-8 text-lg shadow-lg shadow-purple-500/25">
              <Camera className="w-5 h-5" />
              Try It Now
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-slate-500">
          No account needed · 3 free tries per day
        </p>
      </section>

      {/* Live Demo Section */}
      <section className="relative container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Mock phone/demo */}
          <div className="relative mx-auto max-w-sm">
            {/* Phone frame */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-3 border border-slate-700 shadow-2xl">
              {/* Screen */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden">
                {/* Mock camera view */}
                <div className="aspect-[3/4] relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  {/* Animated word card */}
                  <div 
                    key={activeWordIndex}
                    className="absolute inset-0 flex items-center justify-center animate-fadeIn"
                  >
                    <div className="text-center p-8">
                      <div className="text-8xl mb-4">{activeWord.emoji}</div>
                      <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                        <p className="text-5xl font-bold text-white mb-2">{activeWord.zh}</p>
                        <p className="text-xl text-purple-400 mb-1">{activeWord.pinyin}</p>
                        <p className="text-slate-400">{activeWord.en}</p>
                        <div className="mt-4 flex justify-center">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-purple-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scanning effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-purple-500/10 animate-scan pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Word pills around the demo */}
            <div className="absolute -left-20 top-1/4 hidden md:block">
              <WordPill word="杯子" pinyin="bēizi" delay={0} />
            </div>
            <div className="absolute -right-24 top-1/3 hidden md:block">
              <WordPill word="钢笔" pinyin="gāngbǐ" delay={200} />
            </div>
            <div className="absolute -left-16 bottom-1/4 hidden md:block">
              <WordPill word="钥匙" pinyin="yàoshi" delay={400} />
            </div>
          </div>
        </div>
      </section>

      {/* Features - Simple & Fun */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Learning Chinese has never been
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            this easy
          </span>
        </h2>
        <p className="text-slate-400 text-center mb-16 text-lg">
          Seriously. It takes 3 seconds.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            emoji="📷"
            title="Snap"
            description="Take a photo of literally anything around you"
            color="purple"
          />
          <FeatureCard
            emoji="🧠"
            title="AI Magic"
            description="Our AI instantly recognizes objects in your photo"
            color="pink"
          />
          <FeatureCard
            emoji="🎓"
            title="Learn"
            description="Get Chinese characters, pinyin, and pronunciation"
            color="blue"
          />
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-2xl">⭐</span>
            ))}
          </div>
          <p className="text-2xl text-white font-medium mb-4 italic">
            &ldquo;Finally, a fun way to learn Chinese vocabulary!&rdquo;
          </p>
          <p className="text-slate-500">
            — Every user who tried it
          </p>
        </div>
      </section>

      {/* Features List */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            Everything you need to learn
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '📸', text: 'Unlimited photo analysis' },
              { icon: '🔊', text: 'Native pronunciation' },
              { icon: '🎴', text: 'Flashcard practice' },
              { icon: '📁', text: 'Organize collections' },
              { icon: '🔥', text: 'Daily streak tracking' },
              { icon: '💡', text: 'Example sentences' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Try it free. No signup required.
          </p>
          <Link href="/try">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-14 px-10 text-lg shadow-lg shadow-purple-500/25">
              Start Learning
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-slate-600 text-sm mt-6">
            Join thousands learning Chinese the fun way
          </p>
        </div>
      </section>
    </div>
  );
}

// Feature card component
function FeatureCard({ 
  emoji, 
  title, 
  description, 
  color 
}: { 
  emoji: string; 
  title: string; 
  description: string;
  color: 'purple' | 'pink' | 'blue';
}) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  };

  return (
    <div className={cn(
      'p-6 rounded-2xl bg-gradient-to-b border text-center',
      colors[color]
    )}>
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

// Floating word pill component
function WordPill({ word, pinyin, delay }: { word: string; pinyin: string; delay: number }) {
  return (
    <div 
      className="px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-sm animate-float"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-white font-medium">{word}</span>
      <span className="text-slate-400 text-sm ml-2">{pinyin}</span>
    </div>
  );
}
