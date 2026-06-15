'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard, Camera, GraduationCap, BookOpen,
  TrendingUp, Users, Puzzle, Settings, CameraIcon, X, Menu,
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
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/vocabulary') return pathname === '/vocabulary' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[#bacbbe] hover:text-[#e0e2e8] p-1"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-[260px] bg-[#181c20] z-50 flex flex-col py-4 transition-transform duration-200 border-r border-white/5',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="px-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Snap Mandarin" width={32} height={32} className="rounded-xl flex-shrink-0" />
            <div>
              <h1 className="text-base font-bold text-[#76ffbb] leading-tight">Snap Mandarin</h1>
              <p className="text-[10px] text-[#bacbbe] opacity-70">AI Vocabulary</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-[#bacbbe]">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 mb-6">
          <Link href="/capture" onClick={() => setOpen(false)}>
            <button className="w-full py-2.5 bg-[#76ffbb] text-[#003822] font-semibold rounded-lg flex items-center justify-center gap-2 text-sm">
              <CameraIcon size={18} />
              New Capture
            </button>
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm transition-all',
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
      </aside>
    </>
  );
}
