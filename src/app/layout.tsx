import type { Metadata, Viewport } from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { OnlineStatusProvider } from '@/components/online-status-provider';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-image-dictionary.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Snap Mandarin — Learn Chinese Through Photos',
    template: '%s | Snap Mandarin',
  },
  description:
    'Snap a photo and instantly learn Chinese vocabulary with AI. Get characters, pinyin, and English translations for everything you capture — then reinforce with spaced-repetition flashcards.',
  keywords: [
    'learn Chinese',
    'Mandarin vocabulary',
    'Chinese flashcards',
    'AI Chinese learning',
    'photo vocabulary',
    'pinyin',
    'HSK vocabulary',
    'spaced repetition',
    'language learning app',
    'visual Chinese dictionary',
  ],
  authors: [{ name: 'Snap Mandarin' }],
  creator: 'Snap Mandarin',
  publisher: 'Snap Mandarin',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Snap Mandarin',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
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
    siteName: 'Snap Mandarin',
    title: 'Snap Mandarin — Learn Chinese Through Photos',
    description:
      'Snap a photo and instantly learn Chinese vocabulary with AI. Characters, pinyin, translations — then practice with spaced-repetition flashcards.',
    images: [
      {
        url: 'https://trungle-storage.s3.ap-southeast-2.amazonaws.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Snap Mandarin — Learn Chinese Through Photos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snap Mandarin — Learn Chinese Through Photos',
    description:
      'Snap a photo and instantly learn Chinese vocabulary with AI. Characters, pinyin, and translations in seconds.',
    images: ['https://trungle-storage.s3.ap-southeast-2.amazonaws.com/og-image.png'],
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
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#76ffbb',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${manrope.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-manrope)] antialiased bg-[#101417] text-[#e0e2e8]`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <OnlineStatusProvider>
            {children}
            <Toaster richColors position="top-center" />
            <ServiceWorkerRegistration />
          </OnlineStatusProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
