'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Camera, Upload, BookOpen, History, LogOut, Menu, FolderOpen } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

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
            <Link href="/capture">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </Link>
            <Link href="/vocabulary">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <BookOpen className="w-4 h-4 mr-2" />
                Vocabulary
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Link href="/collections">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                <FolderOpen className="w-4 h-4 mr-2" />
                Collections
              </Button>
            </Link>
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
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {getInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                  <div className="px-2 py-1.5">
                    <p className="text-sm text-white font-medium truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
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
            <Link href="/capture" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </Link>
            <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </Link>
            <Link href="/vocabulary" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Vocabulary
              </Button>
            </Link>
            <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Link href="/collections" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-slate-300">
                <FolderOpen className="w-4 h-4 mr-2" />
                Collections
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

