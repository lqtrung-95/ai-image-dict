'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Camera, Zap, Brain, Heart } from 'lucide-react';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

export default function HomePage() {
  const { user, loading } = useAuth();

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900">
      
      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-20 max-w-3xl">
        <p className="text-purple-400 text-sm font-medium tracking-wide mb-4">
          BUILT WITH LANGUAGE PASSION
        </p>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
          See the world.
          <br />
          <span className="text-slate-400">Learn Chinese.</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-xl mb-8 leading-relaxed">
          Point your camera at anything around you. Our AI instantly tells you how to say it in Chinese—with characters, pinyin, and pronunciation.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Link href="/try">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 h-12 px-6">
              <Camera className="w-5 h-5 mr-2" />
              Try it now
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              size="lg" 
              variant="ghost" 
              className="text-slate-400 hover:text-white h-12"
            >
              Create free account →
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-slate-600">
          No signup required to try
        </p>
      </section>

      {/* Demo Preview */}
      <section className="container mx-auto px-4 pb-20 max-w-3xl">
        <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">
            Example result
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { zh: '咖啡', pinyin: 'kāfēi', en: 'coffee' },
              { zh: '杯子', pinyin: 'bēizi', en: 'cup' },
              { zh: '桌子', pinyin: 'zhuōzi', en: 'table' },
            ].map((word) => (
              <div key={word.en} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white mb-1">{word.zh}</p>
                <p className="text-purple-400 text-sm">{word.pinyin}</p>
                <p className="text-slate-500 text-xs">{word.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - minimal */}
      <section className="container mx-auto px-4 pb-20 max-w-3xl">
        <h2 className="text-sm text-slate-500 uppercase tracking-wide mb-8">
          How it works
        </h2>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              1
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Take a photo</h3>
              <p className="text-slate-500 text-sm">
                Capture anything—your desk, kitchen, street signs, restaurant menus.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              2
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">AI identifies objects</h3>
              <p className="text-slate-500 text-sm">
                Get instant Chinese translations with pinyin and audio pronunciation.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              3
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Build your vocabulary</h3>
              <p className="text-slate-500 text-sm">
                Save words, practice with flashcards, track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why this works */}
      <section className="container mx-auto px-4 pb-20 max-w-3xl">
        <h2 className="text-sm text-slate-500 uppercase tracking-wide mb-8">
          Why it works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <Zap className="w-5 h-5 text-yellow-500 mb-3" />
            <h3 className="text-white font-medium mb-2">Context matters</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              You remember words better when they&apos;re connected to real things you see and use.
            </p>
          </div>
          
          <div>
            <Brain className="w-5 h-5 text-blue-400 mb-3" />
            <h3 className="text-white font-medium mb-2">Visual memory</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Photos create mental anchors. Your brain recalls the image and the word together.
            </p>
          </div>
          
          <div>
            <Heart className="w-5 h-5 text-pink-400 mb-3" />
            <h3 className="text-white font-medium mb-2">Your world</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Learn vocabulary that&apos;s relevant to your life, not random textbook words.
            </p>
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="container mx-auto px-4 pb-20 max-w-3xl">
        <div className="flex justify-center gap-12 text-center text-slate-500 text-sm">
          <div>
            <p className="text-2xl font-bold text-white mb-1">10+</p>
            <p>Objects per photo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">Free</p>
            <p>Forever</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">AI</p>
            <p>Powered</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-20 max-w-xl text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Start learning from your surroundings
        </h2>
        <p className="text-slate-400 mb-6">
          Your camera is the best Chinese teacher you&apos;ve never tried.
        </p>
        <Link href="/try">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 h-12 px-8">
            Try it free
          </Button>
        </Link>
      </section>

      {/* Footer tagline */}
      <footer className="container mx-auto px-4 pb-12 text-center">
        <p className="text-slate-600 text-sm">
          Made for language learners, by language learners.
        </p>
      </footer>
    </div>
  );
}
