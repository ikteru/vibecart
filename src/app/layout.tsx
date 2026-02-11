import type { Metadata, Viewport } from 'next';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: 'VibeCart | Video-Native Commerce',
    template: '%s | VibeCart',
  },
  description:
    'A friction-free, video-first commerce platform converting views directly into WhatsApp orders. Designed for Instagram sellers.',
  keywords: [
    'e-commerce',
    'video commerce',
    'WhatsApp shopping',
    'Instagram sellers',
    'Morocco',
    'artisan',
  ],
  authors: [{ name: 'VibeCart' }],
  creator: 'VibeCart',
  metadataBase: new URL(appUrl),
  openGraph: {
    type: 'website',
    locale: 'ar_MA',
    alternateLocale: ['ar', 'fr', 'en'],
    url: appUrl,
    siteName: 'VibeCart',
    title: 'VibeCart | Video-Native Commerce',
    description:
      'A friction-free, video-first commerce platform converting views directly into WhatsApp orders. Designed for Instagram sellers.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VibeCart - Video-Native Commerce Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vibecart',
    creator: '@vibecart',
    title: 'VibeCart | Video-Native Commerce',
    description:
      'A friction-free, video-first commerce platform converting views directly into WhatsApp orders. Designed for Instagram sellers.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
    languages: {
      'ar-MA': '/ar-MA',
      'ar': '/ar',
      'fr': '/fr',
      'en': '/en',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
