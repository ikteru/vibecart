import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Shield, Cookie, Trash2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface LegalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: {
    default: 'Legal',
    template: '%s | Legal | VibeCart',
  },
};

export default async function LegalLayout({ children, params }: LegalLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations('legal');

  const navItems = [
    {
      href: `/${locale}/legal/terms`,
      label: t('nav.terms'),
      icon: FileText,
      key: 'terms',
    },
    {
      href: `/${locale}/legal/privacy`,
      label: t('nav.privacy'),
      icon: Shield,
      key: 'privacy',
    },
    {
      href: `/${locale}/legal/cookies`,
      label: t('nav.cookies'),
      icon: Cookie,
      key: 'cookies',
    },
    {
      href: `/${locale}/legal/data-deletion`,
      label: t('nav.dataDeletion'),
      icon: Trash2,
      key: 'data-deletion',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Legal Navigation */}
        <nav className="mb-12">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-zinc-900/50 p-2 backdrop-blur-sm">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Page Content */}
        <article className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-12">
          {children}
        </article>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
