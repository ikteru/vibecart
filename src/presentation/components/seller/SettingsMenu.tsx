'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Instagram,
  MessageSquareText,
  Truck,
  Store,
  Users,
  MapPin,
  FileText,
  Globe,
  Share2,
  FileCheck,
  Shield,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { SellerResponseDTO } from '@/application/dtos/SellerDTO';

interface SettingsMenuProps {
  seller: SellerResponseDTO;
  locale: string;
  logoutAction: () => Promise<void>;
}

interface SettingsItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  status?: 'connected' | 'not_connected';
  onClick?: () => void;
  danger?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

export function SettingsMenu({ seller, locale, logoutAction }: SettingsMenuProps) {
  const t = useTranslations('sellerSettings');
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const instagramConnected = !!seller.shopConfig?.instagram?.isConnected;
  const whatsappConnected = !!seller.shopConfig?.whatsappBusiness?.isConnected;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    router.push(`/${locale}/auth/login`);
  };

  const groups: SettingsGroup[] = [
    {
      title: t('connections'),
      items: [
        {
          icon: <Instagram size={18} />,
          label: 'Instagram',
          href: `/${locale}/seller/settings?section=instagram`,
          status: instagramConnected ? 'connected' : 'not_connected',
        },
        {
          icon: <MessageSquareText size={18} />,
          label: 'WhatsApp Business',
          href: `/${locale}/seller/settings?section=whatsapp`,
          status: whatsappConnected ? 'connected' : 'not_connected',
        },
      ],
    },
    {
      title: t('fulfillment'),
      items: [
        {
          icon: <Truck size={18} />,
          label: t('shippingRates'),
          href: `/${locale}/seller/shipping`,
        },
        {
          icon: <Store size={18} />,
          label: t('pickupAtStore'),
          href: `/${locale}/seller/settings?section=pickup`,
        },
        {
          icon: <Users size={18} />,
          label: t('deliveryTeam'),
          href: `/${locale}/seller/settings?section=delivery`,
        },
      ],
    },
    {
      title: t('shopFeatures'),
      items: [
        {
          icon: <MapPin size={18} />,
          label: t('googleMaps'),
          href: `/${locale}/seller/settings?section=googlemaps`,
        },
        {
          icon: <FileText size={18} />,
          label: t('messageTemplates'),
          href: `/${locale}/seller/templates`,
        },
      ],
    },
    {
      title: t('appSettings'),
      items: [
        {
          icon: <Globe size={18} />,
          label: t('language'),
          href: `/${locale}/seller/settings?section=language`,
        },
        {
          icon: <Share2 size={18} />,
          label: t('shopLink'),
          href: `/${locale}/seller/settings?section=link`,
        },
        {
          icon: <FileCheck size={18} />,
          label: t('termsOfService'),
          href: `/${locale}/legal/terms`,
        },
        {
          icon: <Shield size={18} />,
          label: t('privacyPolicy'),
          href: `/${locale}/legal/privacy`,
        },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-white mb-6">{t('title')}</h1>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              {group.items.map((item, i) => {
                const content = (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <span className="text-zinc-400">{item.icon}</span>
                    <span className="flex-1 text-white text-sm font-medium">
                      {item.label}
                    </span>
                    {item.status && (
                      <span
                        className={`text-xs font-medium ${
                          item.status === 'connected'
                            ? 'text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {item.status === 'connected' ? t('connected') : t('notConnected')}
                      </span>
                    )}
                    {item.status === 'connected' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    <ChevronRight size={16} className="text-zinc-600" />
                  </div>
                );

                if (item.href) {
                  return (
                    <Link
                      key={i}
                      href={item.href}
                      className="block hover:bg-zinc-800/50 transition-colors"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className="w-full hover:bg-zinc-800/50 transition-colors"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
        >
          {isLoggingOut ? (
            <Loader2 size={18} className="text-red-400 animate-spin" />
          ) : (
            <LogOut size={18} className="text-red-400" />
          )}
          <span className="text-red-400 text-sm font-medium">{t('logOut')}</span>
        </button>
      </div>
    </div>
  );
}
