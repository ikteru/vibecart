import type { Metadata, Viewport } from 'next';
import './globals.css';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'ar_MA',
    alternateLocale: ['ar', 'fr', 'en'],
    siteName: 'VibeCart',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
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
