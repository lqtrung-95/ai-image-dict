import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Image Dictionary - Learn Chinese Through Photos',
  description:
    'Capture photos and learn Chinese vocabulary for everything you see. AI-powered object detection with Chinese translations and pinyin.',
  keywords: ['Chinese', 'vocabulary', 'learning', 'AI', 'image recognition', 'language learning'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI词典',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}>
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
