'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Store,
  ShoppingBag,
  Play,
  MessageCircle,
  Instagram,
  Video,
  Smartphone,
  Zap,
  Globe,
  Shield,
  Clock,
  TrendingUp,
  Upload,
  Share2,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="space-y-2">
            <div className="flex justify-center">
              <img
                src="/logo.svg"
                alt="VibeCart"
                className="h-20 w-20"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              {t('app.name')}
            </h1>
            <p className="text-lg text-zinc-400">{t('app.tagline')}</p>
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-3 gap-4 py-8">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/20">
                <Play className="h-6 w-6 text-primary-500" />
              </div>
              <span className="text-xs text-zinc-400">
                {t('landing.features.video')}
              </span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <MessageCircle className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-xs text-zinc-400">
                {t('landing.features.whatsapp')}
              </span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20">
                <Instagram className="h-6 w-6 text-pink-500" />
              </div>
              <span className="text-xs text-zinc-400">
                {t('landing.features.instagram')}
              </span>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <a
              href="/ar-MA/seller/dashboard"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98]"
            >
              <Store className="h-6 w-6" />
              {t('landing.roles.seller')}
            </a>

            <a
              href="/ar-MA/shop/ayyuur-home"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-800 px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-zinc-700 active:scale-[0.98]"
            >
              <ShoppingBag className="h-6 w-6" />
              {t('landing.roles.buyer')}
            </a>
          </div>

          {/* Language Selector */}
          <div className="pt-8">
            <LanguageSelector />
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="bg-zinc-900/50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">
              {t('landing.features.title') || 'Everything You Need to Sell'}
            </h2>
            <p className="mt-4 text-zinc-400">
              {t('landing.features.subtitle') || 'Powerful tools designed for modern commerce'}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Video className="h-6 w-6" />}
              title="Video-First Catalog"
              description="Showcase your products with short, engaging videos that capture attention and drive sales."
            />
            <FeatureCard
              icon={<Smartphone className="h-6 w-6" />}
              title="WhatsApp Orders"
              description="Customers order directly via WhatsApp. No complex checkout, no abandoned carts."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Instant Setup"
              description="Create your shop in minutes. No technical skills or credit card required."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Multilingual"
              description="Support for Darija, Arabic, French, and English. Reach customers in their language."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Secure & Private"
              description="Your data and customer information are protected with enterprise-grade security."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Analytics"
              description="Track views, engagement, and conversion to optimize your sales strategy."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">
              {t('landing.howItWorks.title') || 'How It Works'}
            </h2>
            <p className="mt-4 text-zinc-400">
              {t('landing.howItWorks.subtitle') || 'Start selling in three simple steps'}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="01"
              icon={<Upload className="h-6 w-6" />}
              title="Upload Videos"
              description="Record short videos of your products and upload them to your catalog."
            />
            <StepCard
              number="02"
              icon={<Share2 className="h-6 w-6" />}
              title="Share Your Shop"
              description="Get a unique link to share on Instagram, WhatsApp, or anywhere else."
            />
            <StepCard
              number="03"
              icon={<MessageSquare className="h-6 w-6" />}
              title="Receive Orders"
              description="Customers browse and order directly via WhatsApp. You handle the rest."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-zinc-900/50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">
              {t('landing.testimonials.title') || 'Loved by Sellers'}
            </h2>
            <p className="mt-4 text-zinc-400">
              {t('landing.testimonials.subtitle') || 'See what our community is saying'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              quote="VibeCart transformed my Instagram following into paying customers. The WhatsApp integration is genius!"
              author="Sarah M."
              role="Fashion Seller, Casablanca"
            />
            <TestimonialCard
              quote="I set up my shop in 10 minutes. Now I get orders while I sleep. Best decision for my small business."
              author="Ahmed K."
              role="Handmade Crafts, Marrakech"
            />
            <TestimonialCard
              quote="My customers love watching product videos. It builds trust and reduces questions before purchase."
              author="Fatima L."
              role="Beauty Products, Rabat"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">
            {t('landing.cta.title') || 'Ready to Start Selling?'}
          </h2>
          <p className="mt-4 text-zinc-400">
            {t('landing.cta.subtitle') || 'Join thousands of sellers already growing their business with VibeCart.'}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/ar-MA/seller/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-8 py-4 font-semibold text-white transition-all hover:bg-primary-600"
            >
              <Store className="h-5 w-5" />
              Create Your Shop
            </a>
            <a
              href="/ar-MA/shop/ayyuur-home"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-8 py-4 font-semibold text-white transition-all hover:bg-zinc-700"
            >
              <ShoppingBag className="h-5 w-5" />
              Browse Shops
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="VibeCart" className="h-8 w-8" />
                <span className="text-lg font-bold text-white">VibeCart</span>
              </div>
              <p className="text-sm text-zinc-400">
                Video-native commerce platform connecting sellers with customers through WhatsApp.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="/ar-MA/seller/dashboard" className="hover:text-primary-500">
                    Seller Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/ar-MA/shop/ayyuur-home" className="hover:text-primary-500">
                    Browse Shops
                  </Link>
                </li>
                <li>
                  <span className="cursor-not-allowed">Pricing (Coming Soon)</span>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <span className="cursor-not-allowed">About Us (Coming Soon)</span>
                </li>
                <li>
                  <span className="cursor-not-allowed">Blog (Coming Soon)</span>
                </li>
                <li>
                  <span className="cursor-not-allowed">Contact (Coming Soon)</span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="/ar-MA/privacy" className="hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/ar-MA/terms" className="hover:text-primary-500">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/ar-MA/cookies" className="hover:text-primary-500">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 md:flex-row">
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} VibeCart. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-primary-500"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-green-500"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-800/50 p-6 transition-all hover:bg-zinc-800">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-500">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/25">
        {icon}
      </div>
      <span className="absolute -top-2 right-1/3 text-xs font-bold text-primary-500">
        {number}
      </span>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-800/50 p-6">
      <div className="mb-4 text-primary-500">
        <svg
          className="h-8 w-8"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-300">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-white">{author}</p>
          <p className="text-xs text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

function LanguageSelector() {
  const languages = [
    { code: 'ar-MA', name: 'الدارجة', flag: '🇲🇦' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {languages.map((lang) => (
        <a
          key={lang.code}
          href={`/${lang.code}`}
          className="flex items-center gap-1 rounded-full bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </a>
      ))}
    </div>
  );
}
