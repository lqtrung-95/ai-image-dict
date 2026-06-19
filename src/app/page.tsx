'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/locale-switcher-dropdown';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HskLevelsSection, StatsSection, CtaSection, LandingFooter } from '@/components/landing/stats-and-cta-section';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('landing');
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) router.replace('/vocabulary');
  }, [user, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => setActiveWordIndex((p) => p + 1), 2500);
    return () => clearInterval(interval);
  }, []);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#101417] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#76ffbb]/30 border-t-[#76ffbb] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101417] overflow-x-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-white/5 sticky top-0 bg-[#101417]/90 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Snap Mandarin" width={28} height={28} className="rounded-lg" />
          <span className="text-base font-bold text-[#76ffbb]">Snap Mandarin</span>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/login">
            <Button variant="ghost" className="text-[#bacbbe] hover:text-[#e0e2e8] hover:bg-[#272a2e]">
              {t('signIn')}
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#76ffbb] text-[#003822] font-semibold hover:opacity-90">
              {t('getStartedFree')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute top-32 left-1/4 w-96 h-96 bg-[#76ffbb]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-[#76ffbb]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <HeroSection activeWordIndex={activeWordIndex} />
        <HowItWorksSection />
        <FeaturesSection />
        <HskLevelsSection />
        <StatsSection />
        <CtaSection />
        <LandingFooter />
      </div>
    </div>
  );
}
