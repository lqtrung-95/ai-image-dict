'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Camera, Upload, BookOpen, History, LogOut, Menu, GraduationCap, TrendingUp, Plus, Settings, List, Import, Users, Library, ChevronDown, BookMarked, Gamepad2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Listen for profile updates from settings page
  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent<Profile>) => {
      setProfile(e.detail);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = profile?.display_name || user?.email || 'User';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <span className="font-bold text-xl text-white hidden sm:inline">AI词典</span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {/* Add Photo - Primary Action */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white mr-2">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-slate-800 border-slate-700">
                <Link href="/capture">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>
                </Link>
                <Link href="/upload">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Main Nav Items */}
            <Link href="/vocabulary">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <BookOpen className="w-4 h-4 mr-2" />
                Vocabulary
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <GraduationCap className="w-4 h-4 mr-2" />
                Practice
              </Button>
            </Link>
            <Link href="/games">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Games
              </Button>
            </Link>
            <Link href="/progress">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <TrendingUp className="w-4 h-4 mr-2" />
                Progress
              </Button>
            </Link>

            {/* Library Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Library className="w-4 h-4 mr-2" />
                  Library
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
                <Link href="/stories">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <BookMarked className="w-4 h-4 mr-2" />
                    Stories
                  </DropdownMenuItem>
                </Link>
                <Link href="/lists">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <List className="w-4 h-4 mr-2" />
                    My Lists
                  </DropdownMenuItem>
                </Link>
                <Link href="/courses">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <Users className="w-4 h-4 mr-2" />
                    Courses
                  </DropdownMenuItem>
                </Link>
                <Link href="/history">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-slate-700" />
                <Link href="/import">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <Import className="w-4 h-4 mr-2" />
                    Import Words
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
          ) : user ? (
            <>
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                  <div className="px-2 py-1.5">
                    <p className="text-sm text-white font-medium truncate">{displayName}</p>
                    {profile?.display_name && (
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <Link href="/settings">
                    <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && mobileMenuOpen && (
        <nav className="md:hidden border-t border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-col gap-2">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Link href="/capture" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </Link>
              <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </Link>
            </div>

            <div className="border-t border-slate-700 my-2" />

            {/* Main Nav */}
            <Link href="/vocabulary" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Vocabulary
              </Button>
            </Link>
            <Link href="/practice" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <GraduationCap className="w-4 h-4 mr-2" />
                Practice
              </Button>
            </Link>
            <Link href="/progress" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <TrendingUp className="w-4 h-4 mr-2" />
                Progress
              </Button>
            </Link>

            <div className="border-t border-slate-700 my-2" />

            {/* Library Section */}
            <p className="text-xs text-slate-500 px-3 py-1 uppercase tracking-wider">Library</p>
            <Link href="/stories" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <BookMarked className="w-4 h-4 mr-2" />
                Stories
              </Button>
            </Link>
            <Link href="/lists" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <List className="w-4 h-4 mr-2" />
                My Lists
              </Button>
            </Link>
            <Link href="/courses" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Users className="w-4 h-4 mr-2" />
                Courses
              </Button>
            </Link>
            <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Link href="/import" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Import className="w-4 h-4 mr-2" />
                Import Words
              </Button>
            </Link>

            <div className="border-t border-slate-700 my-2" />

            <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

