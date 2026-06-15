'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiFetch } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent<Profile>) => setProfile(e.detail);
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch {}
  };

  const displayName = profile?.display_name || user?.email || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#101417]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Top header */}
      <header className="fixed top-0 right-0 h-16 left-0 md:left-[260px] bg-[#101417] border-b border-white/5 flex items-center justify-between px-6 z-40">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 md:hidden">
          <MobileSidebar />
          <span className="font-bold text-[#76ffbb]">Snap Mandarin</span>
        </div>

        {/* Desktop: search */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bacbbe]" style={{ fontSize: 18 }}>search</span>
            <input
              className="w-full bg-[#1c2024] border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-[#e0e2e8] placeholder:text-[#bacbbe] focus:outline-none focus:ring-1 focus:ring-[#76ffbb]/50"
              placeholder="Search vocabulary, characters..."
              type="text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) router.push(`/vocabulary?q=${encodeURIComponent(val)}`);
                }
              }}
            />
          </div>
        </div>

        {/* Right: avatar dropdown */}
        <div className="flex items-center gap-4 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#76ffbb]/50">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                  <AvatarFallback className="bg-[#272a2e] text-[#76ffbb] text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#1c2024] border-white/10 text-[#e0e2e8]">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {profile?.display_name && (
                  <p className="text-xs text-[#bacbbe] truncate">{user?.email}</p>
                )}
              </div>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                className="cursor-pointer focus:bg-[#272a2e] focus:text-[#e0e2e8]"
                onClick={() => router.push('/settings')}
              >
                <span className="material-symbols-outlined mr-2" style={{ fontSize: 16 }}>settings</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                className="cursor-pointer text-red-400 focus:bg-red-900/20 focus:text-red-400"
                onClick={signOut}
              >
                <span className="material-symbols-outlined mr-2" style={{ fontSize: 16 }}>logout</span>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Page content */}
      <main className="pt-16 md:ml-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
