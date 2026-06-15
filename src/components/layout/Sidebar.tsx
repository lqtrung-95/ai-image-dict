'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Camera,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Users,
  Puzzle,
  Settings,
  CameraIcon,
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/vocabulary', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/capture', icon: Camera, label: 'Capture' },
  { href: '/practice', icon: GraduationCap, label: 'Practice' },
  { href: '/stories', icon: BookOpen, label: 'Stories' },
  { href: '/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/courses', icon: Users, label: 'Community' },
  { href: '/games', icon: Puzzle, label: 'Games' },
];

const BOTTOM_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/vocabulary') return pathname === '/vocabulary' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#181c20] flex flex-col py-4 z-50 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 mb-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Snap Mandarin" width={36} height={36} className="rounded-xl flex-shrink-0" />
          <div>
            <h1 className="text-base font-bold text-[#76ffbb] tracking-tight leading-tight">Snap Mandarin</h1>
            <p className="text-[10px] text-[#bacbbe] opacity-70">AI Vocabulary</p>
          </div>
        </Link>
      </div>

      {/* Primary CTA */}
      <div className="px-4 mb-6">
        <Link href="/capture">
          <button className="w-full py-2.5 bg-[#76ffbb] text-[#003822] font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
            <CameraIcon size={18} />
            New Capture
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm transition-all duration-150 active:scale-[0.98]',
              isActive(href)
                ? 'text-[#76ffbb] font-semibold bg-[#76ffbb]/10 border-l-2 border-[#76ffbb]'
                : 'text-[#bacbbe] hover:bg-[#272a2e] hover:text-[#e0e2e8]'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 mt-4 pt-4 border-t border-white/5">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm transition-colors',
              isActive(href)
                ? 'text-[#76ffbb] font-semibold'
                : 'text-[#bacbbe] hover:text-[#76ffbb]'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
