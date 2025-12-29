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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-image-dictionary.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AI Image Dictionary - Learn Chinese Through Photos',
    template: '%s | AI词典',
  },
  description:
    'Capture photos and instantly learn Chinese vocabulary with AI-powered object detection. Get Chinese characters, pinyin pronunciation, and English translations for everything you photograph.',
  keywords: [
    'Chinese vocabulary',
    'learn Chinese',
    'Chinese language learning',
    'AI vocabulary',
    'image recognition',
    'Chinese flashcards',
    'pinyin',
    'Chinese characters',
    'language learning app',
    'vocabulary builder',
    'photo dictionary',
    'visual learning',
  ],
  authors: [{ name: 'AI Image Dictionary' }],
  creator: 'AI Image Dictionary',
  publisher: 'AI Image Dictionary',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI词典',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/icons/icon-192.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'AI Image Dictionary',
    title: 'AI Image Dictionary - Learn Chinese Through Photos',
    description:
      'Capture photos and instantly learn Chinese vocabulary. AI-powered object detection with Chinese characters, pinyin, and translations.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Image Dictionary - Learn Chinese Through Photos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Image Dictionary - Learn Chinese Through Photos',
    description:
      'Capture photos and instantly learn Chinese vocabulary with AI. Get characters, pinyin, and translations.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'education',
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
