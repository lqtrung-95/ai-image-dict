import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HSK_LEVELS = [
  { level: 1, words: 150, desc: 'Basic greetings & numbers' },
  { level: 2, words: 300, desc: 'Everyday survival phrases' },
  { level: 3, words: 600, desc: 'Familiar topics & opinions' },
  { level: 4, words: 1200, desc: 'Fluent on most subjects' },
  { level: 5, words: 2500, desc: 'Complex academic topics' },
  { level: 6, words: 5000, desc: 'Near-native proficiency' },
];

export function HskLevelsSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2e8] mb-3">Your path from HSK 1 to HSK 6</h2>
        <p className="text-[#bacbbe] text-lg">Every word you capture is mapped to a level. Watch mastery grow.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {HSK_LEVELS.map((h) => (
          <div key={h.level} className="bg-[#181c20] border border-white/5 rounded-xl p-5 hover:border-[#76ffbb]/20 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-[#003822] bg-[#76ffbb] px-2 py-0.5 rounded-full">HSK {h.level}</span>
              <span className="text-sm text-[#849589]">{h.words} words</span>
            </div>
            <p className="text-sm text-[#bacbbe]">{h.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatsSection() {
  const stats = [
    { value: '5,000+', label: 'HSK vocabulary words covered' },
    { value: '3 sec', label: 'Average photo analysis time' },
    { value: 'SM-2', label: 'Proven spaced-repetition algorithm' },
    { value: 'Free', label: 'To start — no credit card needed' },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="bg-[#181c20] border border-white/5 rounded-2xl p-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-[#76ffbb] mb-2">{s.value}</p>
              <p className="text-sm text-[#bacbbe]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-20 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2e8] mb-4">
        Start building your Chinese vocabulary today
      </h2>
      <p className="text-[#bacbbe] text-lg mb-10 leading-relaxed">
        No textbooks. No boring word lists. Just snap photos of the world around you and let
        AI do the heavy lifting — then practice until the words stick for good.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/signup">
          <Button size="lg" className="bg-[#76ffbb] text-[#003822] font-semibold h-12 px-10 hover:opacity-90 shadow-lg shadow-[#76ffbb]/20">
            Create Free Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href="/try">
          <Button size="lg" variant="outline" className="border-white/10 text-[#e0e2e8] hover:bg-[#272a2e] h-12 px-8">
            Try Without Account
          </Button>
        </Link>
      </div>
      <p className="text-sm text-[#849589] mt-5">
        Available on Web · Android · iOS &nbsp;·&nbsp; Free tier: 3 analyses/day
      </p>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#849589]">
        <span className="font-semibold text-[#76ffbb]">Snap Mandarin</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-[#e0e2e8] transition-colors">Privacy Policy</Link>
          <Link href="/try" className="hover:text-[#e0e2e8] transition-colors">Try Free</Link>
          <Link href="/signup" className="hover:text-[#e0e2e8] transition-colors">Sign Up</Link>
          <Link href="/login" className="hover:text-[#e0e2e8] transition-colors">Sign In</Link>
        </div>
        <span>© {new Date().getFullYear()} Snap Mandarin</span>
      </div>
    </footer>
  );
}
