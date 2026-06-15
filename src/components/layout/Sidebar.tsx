'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/vocabulary', icon: 'dashboard', label: 'Dashboard' },
  { href: '/capture', icon: 'photo_camera', label: 'Capture' },
  { href: '/practice', icon: 'school', label: 'Practice' },
  { href: '/stories', icon: 'auto_stories', label: 'Stories' },
  { href: '/progress', icon: 'query_stats', label: 'Progress' },
  { href: '/courses', icon: 'group', label: 'Community' },
  { href: '/games', icon: 'extension', label: 'Games' },
] as const;

const BOTTOM_ITEMS = [
  { href: '/settings', icon: 'settings', label: 'Settings' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/vocabulary') return pathname === '/vocabulary' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#181c20] flex flex-col py-4 z-50 border-r border-white/5">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link href="/">
          <h1 className="text-xl font-bold text-[#76ffbb] tracking-tight">Snap Mandarin</h1>
          <p className="text-xs text-[#bacbbe] opacity-70 mt-0.5">AI Vocabulary</p>
        </Link>
      </div>

      {/* Primary CTA */}
      <div className="px-4 mb-6">
        <Link href="/capture">
          <button className="w-full py-2.5 bg-[#76ffbb] text-[#003822] font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_a_photo</span>
            New Capture
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, icon, label }) => (
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 mt-4 pt-4 border-t border-white/5">
        {BOTTOM_ITEMS.map(({ href, icon, label }) => (
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
