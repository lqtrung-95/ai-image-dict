import type { Metadata, Viewport } from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';
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
        url: 'https://trungle-storage.s3.ap-southeast-2.amazonaws.com/og-image.png',
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
  themeColor: '#76ffbb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
<body className={`${manrope.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-manrope)] antialiased bg-[#101417] text-[#e0e2e8]`}>
        <OnlineStatusProvider>
          {children}
          <Toaster richColors position="top-center" />
          <ServiceWorkerRegistration />
        </OnlineStatusProvider>
      </body>
    </html>
  );
}
