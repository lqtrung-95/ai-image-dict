import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Camera, Upload, BookOpen, Sparkles } from 'lucide-react';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Dashboard for logged-in users */}
      <DashboardSection />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
          <Sparkles className="w-4 h-4" />
          AI-Powered Chinese Learning
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Learn Chinese Through
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Your Photos
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Point your camera at anything and instantly learn the Chinese vocabulary. 
          AI detects objects, provides translations, and helps you build your word bank.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/capture">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white gap-2 w-full sm:w-auto">
              <Camera className="w-5 h-5" />
              Start Capturing
            </Button>
          </Link>
          <Link href="/upload">
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800 gap-2 w-full sm:w-auto"
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Feature 1 */}
          <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Capture or Upload</h3>
            <p className="text-slate-400">
              Take a photo with your camera or upload an existing image from your device.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Analysis</h3>
            <p className="text-slate-400">
              Our AI instantly identifies objects, colors, and actions in your photo.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Learn & Save</h3>
            <p className="text-slate-400">
              See Chinese characters, pinyin, and translations. Save words to your vocabulary.
            </p>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
            Vocabulary at a Glance
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { zh: '苹果', pinyin: 'píngguǒ', en: 'apple' },
              { zh: '猫', pinyin: 'māo', en: 'cat' },
              { zh: '书', pinyin: 'shū', en: 'book' },
              { zh: '电脑', pinyin: 'diànnǎo', en: 'computer' },
            ].map((word) => (
              <div
                key={word.en}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors"
              >
                <p className="text-3xl font-bold text-white mb-1">{word.zh}</p>
                <p className="text-purple-400 text-sm mb-1">{word.pinyin}</p>
                <p className="text-slate-500 text-sm">{word.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-xl mx-auto text-center p-8 rounded-2xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-slate-400 mb-6">
            Create a free account and begin building your Chinese vocabulary today.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-purple-900 hover:bg-slate-100">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
