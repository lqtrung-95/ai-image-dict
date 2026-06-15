'use client';

import { useState } from 'react';
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
  { href: '/settings', icon: 'settings', label: 'Settings' },
] as const;

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
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
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
        <div className="px-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#76ffbb]">Snap Mandarin</h1>
            <p className="text-xs text-[#bacbbe] opacity-70 mt-0.5">AI Vocabulary</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-[#bacbbe]">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className="px-4 mb-6">
          <Link href="/capture" onClick={() => setOpen(false)}>
            <button className="w-full py-2.5 bg-[#76ffbb] text-[#003822] font-semibold rounded-lg flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_a_photo</span>
              New Capture
            </button>
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(({ href, icon, label }) => (
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
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
