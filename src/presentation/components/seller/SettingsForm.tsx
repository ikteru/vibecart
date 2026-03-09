'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  UserCircle,
  Phone,
  Instagram,
  MapPin,
  Truck,
  Globe,
  Share2,
  Copy,
  FileText,
  Shield,
  LogOut,
  Loader2,
  RefreshCw,
  Plus,
  X,
  FileSpreadsheet,
  Rocket,
  CheckCircle,
  AlertCircle,
  MessageSquareText,
  ChevronRight,
} from 'lucide-react';
import { ComingSoonModal } from '@/presentation/components/ui/ComingSoonModal';
import { InstagramReconnectGuide } from '@/presentation/components/seller/InstagramReconnectGuide';
import type { SellerResponseDTO, UpdateSellerDTO } from '@/application/dtos/SellerDTO';
import type { ShippingRule } from '@/domain/entities/Seller';

const LANGUAGE_CODES = [
  { code: 'en', nameKey: 'english', flag: '🇬🇧' },
  { code: 'fr', nameKey: 'french', flag: '🇫🇷' },
  { code: 'ar', nameKey: 'arabic', flag: '🇸🇦' },
  { code: 'ar-MA', nameKey: 'darija', flag: '🇲🇦' },
];

interface SettingsFormProps {
  seller: SellerResponseDTO;
  locale: string;
  updateAction: (data: UpdateSellerDTO) => Promise<{ success: boolean; error?: string }>;
  logoutAction: () => Promise<void>;
}

/**
 * Settings Form Client Component
 *
 * Handles settings editing with real data.
 */
export function SettingsForm({ seller, locale, updateAction, logoutAction }: SettingsFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [isDisconnectingWhatsApp, setIsDisconnectingWhatsApp] = useState(false);
  const [isSyncingMaps, setIsSyncingMaps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newRate, setNewRate] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const [instagramMessage, setInstagramMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [instagramHealth, setInstagramHealth] = useState<{
    status: string;
    daysRemaining?: number;
    needsReconnect?: boolean;
  } | null>(null);

  // Handle Instagram OAuth callback messages
  useEffect(() => {
    const instagramSuccess = searchParams.get('instagram_success');
    const instagramErrorCode = searchParams.get('ig_err');
    const legacyError = searchParams.get('instagram_error');
    const instagramUsername = searchParams.get('instagram_username');

    if (instagramSuccess === 'true') {
      setInstagramMessage({
        type: 'success',
        text: instagramUsername
          ? t('seller.settings.instagram.connectedAs', { username: instagramUsername })
          : t('seller.settings.instagram.connectedSuccess'),
      });
      router.replace(pathname, { scroll: false });
    } else if (instagramErrorCode) {
      // Map error code to localized message
      const errorKey = `auth.instagramErrors.${instagramErrorCode}` as const;
      setInstagramMessage({
        type: 'error',
        text: t.has(errorKey) ? t(errorKey) : t('auth.instagramErrors.unexpected'),
      });
      router.replace(pathname, { scroll: false });
    } else if (legacyError) {
      // Legacy support for old param name
      setInstagramMessage({
        type: 'error',
        text: t('auth.instagramErrors.unexpected'),
      });
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router, t]);

  // Handle WhatsApp OAuth callback messages
  useEffect(() => {
    const whatsappSuccess = searchParams.get('whatsapp_success');
    const whatsappError = searchParams.get('whatsapp_error');
    const whatsappPhone = searchParams.get('whatsapp_phone');

    if (whatsappSuccess === 'true') {
      setWhatsappMessage({
        type: 'success',
        text: whatsappPhone
          ? t('seller.settings.whatsappBusiness.connectedAs', { phone: whatsappPhone })
          : t('seller.settings.whatsappBusiness.connectedSuccess'),
      });
      // Update local state
      setConfig((prev) => ({
        ...prev,
        whatsappBusiness: {
          ...prev.whatsappBusiness,
          isConnected: true,
          displayPhoneNumber: whatsappPhone || '',
        },
      }));
      router.replace(pathname, { scroll: false });
    } else if (whatsappError) {
      setWhatsappMessage({
        type: 'error',
        text: whatsappError,
      });
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router, t]);

  // Initialize config from seller data
  const [config, setConfig] = useState({
    whatsapp: {
      enabled: true,
      businessNumber: seller.whatsappDisplayNumber || '',
    },
    whatsappBusiness: {
      isConnected: seller.shopConfig.whatsappBusiness?.isConnected || false,
      displayPhoneNumber: seller.shopConfig.whatsappBusiness?.displayPhoneNumber || '',
      verifiedName: seller.shopConfig.whatsappBusiness?.verifiedName || '',
    },
    instagram: {
      isConnected: seller.shopConfig.instagram?.isConnected || false,
      handle: seller.shopConfig.instagram?.handle || '',
    },
    googleMaps: {
      enabled: seller.shopConfig.googleMaps?.enabled || false,
      placeName: seller.shopConfig.googleMaps?.placeName || '',
      rating: seller.shopConfig.googleMaps?.rating || 0,
      reviews: seller.shopConfig.googleMaps?.reviews || 0,
    },
    shipping: {
      defaultRate: seller.shopConfig.shipping?.defaultRate || 35,
      rules: seller.shopConfig.shipping?.rules || [],
    },
  });

  // Fetch Instagram health when connected
  useEffect(() => {
    if (config.instagram.isConnected) {
      fetch('/api/instagram/health')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setInstagramHealth(data); })
        .catch(() => {});
    }
  }, [config.instagram.isConnected]);

  const handleConnectInstagram = () => {
    setIsConnectingInstagram(true);
    // Redirect to Instagram OAuth flow
    window.location.href = '/api/auth/instagram';
  };

  const handleDisconnectInstagram = async () => {
    setIsDisconnectingInstagram(true);
    try {
      const response = await fetch('/api/instagram/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConfig((prev) => ({
          ...prev,
          instagram: { isConnected: false, handle: '' },
        }));
        setInstagramMessage({
          type: 'success',
          text: t('seller.settings.instagram.disconnectedSuccess'),
        });
      } else {
        const data = await response.json();
        setInstagramMessage({
          type: 'error',
          text: data.error || t('seller.settings.instagram.disconnectFailed'),
        });
      }
    } catch {
      setInstagramMessage({
        type: 'error',
        text: t('seller.settings.instagram.disconnectFailed'),
      });
    } finally {
      setIsDisconnectingInstagram(false);
    }
  };

  const handleConnectWhatsApp = () => {
    setIsConnectingWhatsApp(true);
    // Redirect to WhatsApp OAuth flow
    window.location.href = '/api/auth/whatsapp';
  };

  const handleDisconnectWhatsApp = async () => {
    setIsDisconnectingWhatsApp(true);
    try {
      const response = await fetch('/api/auth/whatsapp/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConfig((prev) => ({
          ...prev,
          whatsappBusiness: { isConnected: false, displayPhoneNumber: '', verifiedName: '' },
        }));
        setWhatsappMessage({
          type: 'success',
          text: t('seller.settings.whatsappBusiness.disconnectedSuccess'),
        });
      } else {
        const data = await response.json();
        setWhatsappMessage({
          type: 'error',
          text: data.error || t('seller.settings.whatsappBusiness.disconnectFailed'),
        });
      }
    } catch {
      setWhatsappMessage({
        type: 'error',
        text: t('seller.settings.whatsappBusiness.disconnectFailed'),
      });
    } finally {
      setIsDisconnectingWhatsApp(false);
    }
  };

  const handleSyncGoogleMaps = () => {
    setIsSyncingMaps(true);
    setTimeout(() => {
      setConfig((prev) => ({
        ...prev,
        googleMaps: { ...prev.googleMaps, rating: 4.9, reviews: prev.googleMaps.reviews + 14 },
      }));
      setIsSyncingMaps(false);
    }, 1500);
  };

  const handleAddShippingRule = () => {
    if (!newCity || !newRate) return;
    setConfig((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        rules: [...prev.shipping.rules, { city: newCity, rate: parseFloat(newRate) }],
      },
    }));
    setNewCity('');
    setNewRate('');
  };

  const handleRemoveShippingRule = (cityToRemove: string) => {
    setConfig((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        rules: prev.shipping.rules.filter((r: ShippingRule) => r.city !== cityToRemove),
      },
    }));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      const newRules: ShippingRule[] = [];

      lines.forEach((line) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const city = parts[0].trim();
          const rateString = parts[1].trim().replace(/[^0-9.]/g, '');
          const rate = parseFloat(rateString);

          if (city && !isNaN(rate)) {
            newRules.push({ city, rate });
          }
        }
      });

      if (newRules.length > 0) {
        setConfig((prev) => {
          const existingRulesMap = new Map(
            prev.shipping.rules.map((r: ShippingRule) => [r.city.toLowerCase(), r])
          );
          newRules.forEach((r) => {
            existingRulesMap.set(r.city.toLowerCase(), r);
          });
          return {
            ...prev,
            shipping: {
              ...prev.shipping,
              rules: Array.from(existingRulesMap.values()),
            },
          };
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);

    const updateData: UpdateSellerDTO = {
      shopConfig: {
        shipping: config.shipping,
        instagram: config.instagram,
        googleMaps: config.googleMaps,
      },
    };

    const result = await updateAction(updateData);
    setIsSaving(false);

    if (!result.success) {
      // Show error
      setComingSoonFeature(result.error || t('errors.saveFailed'));
      setShowComingSoon(true);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push(`/${locale}/auth/login`);
  };

  const showFeatureComingSoon = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoon(true);
  };

  const switchLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  const copyProfileLink = () => {
    const link = `vibecart.app/${seller.handle}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="animate-fade-in pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t('seller.settings.title')}</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1"
        >
          {isSaving && <Loader2 size={12} className="animate-spin" />}
          {t('seller.settings.saveChanges')}
        </button>
      </div>

      {/* Account Details */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <UserCircle size={20} className="text-zinc-400" />
          <h3 className="font-bold text-sm text-white">{t('seller.settings.accountDetails')}</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">{t('seller.profile.shopName')}</label>
            <input
              type="text"
              value={seller.shopName}
              readOnly
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
              {t('auth.phoneNumber')}
            </label>
            <input
              type="tel"
              value={seller.whatsappDisplayNumber || ''}
              readOnly
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Connections Group */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase px-1">{t('seller.settings.connections')}</h3>

        {/* WhatsApp Business API */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                <Phone size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{t('seller.settings.whatsappBusiness.title')}</h3>
                <p className="text-[10px] text-[#25D366] font-medium">{t('seller.settings.whatsappBusiness.autoNotify')}</p>
              </div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                config.whatsappBusiness.isConnected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </div>

          {/* Success/Error Message */}
          {whatsappMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                whatsappMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {whatsappMessage.type === 'success' ? (
                <CheckCircle size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              <span>{whatsappMessage.text}</span>
              <button
                onClick={() => setWhatsappMessage(null)}
                className="ms-auto hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {!config.whatsappBusiness.isConnected ? (
            <button
              onClick={handleConnectWhatsApp}
              disabled={isConnectingWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white text-xs font-bold py-3 rounded-lg hover:bg-[#22c55e] disabled:opacity-50 transition-colors"
            >
              {isConnectingWhatsApp ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Phone size={14} />
              )}
              {t('seller.settings.whatsappBusiness.connectWithWhatsApp')}
            </button>
          ) : (
            <>
              <div className="bg-zinc-900/50 rounded-lg p-3 flex items-center justify-between border border-[#25D366]/20">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white">{config.whatsappBusiness.displayPhoneNumber}</span>
                  {config.whatsappBusiness.verifiedName && (
                    <span className="text-[10px] text-zinc-500">({config.whatsappBusiness.verifiedName})</span>
                  )}
                </div>
                <button
                  onClick={handleDisconnectWhatsApp}
                  disabled={isDisconnectingWhatsApp}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
                >
                  {isDisconnectingWhatsApp && <Loader2 size={10} className="animate-spin" />}
                  {t('seller.settings.whatsappBusiness.disconnect')}
                </button>
              </div>

              {/* Message Templates Link */}
              <Link
                href={`/${locale}/seller/templates`}
                className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-[#25D366]/20 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquareText size={16} className="text-[#25D366]" />
                  <div>
                    <div className="text-xs font-medium text-white">{t('seller.settings.whatsappBusiness.messageTemplates')}</div>
                    <div className="text-[10px] text-zinc-500">{t('seller.settings.whatsappBusiness.customizeNotifications')}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-500" />
              </Link>
            </>
          )}
        </div>

        {/* Instagram Integration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Instagram size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{t('seller.settings.instagram.title')}</h3>
                <p className="text-[10px] text-zinc-500">{t('seller.settings.instagram.syncProducts')}</p>
              </div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                config.instagram.isConnected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </div>

          {/* Success/Error Message */}
          {instagramMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                instagramMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {instagramMessage.type === 'success' ? (
                <CheckCircle size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              <span>{instagramMessage.text}</span>
              <button
                onClick={() => setInstagramMessage(null)}
                className="ms-auto hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Token health warning */}
          {instagramHealth && instagramHealth.status !== 'healthy' && instagramHealth.status !== 'disconnected' && (
            <div className={`flex items-center gap-2 p-2 rounded-lg text-[11px] ${
              instagramHealth.status === 'expired' || instagramHealth.status === 'revoked'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <AlertCircle size={12} className="shrink-0" />
              <span>
                {instagramHealth.status === 'expired' && t('seller.settings.instagram.expired')}
                {instagramHealth.status === 'revoked' && t('seller.settings.instagram.revoked')}
                {instagramHealth.status === 'expiring' && t('seller.settings.instagram.expiresIn', { days: instagramHealth.daysRemaining ?? 0 })}
                {instagramHealth.status === 'refresh_failed' && t('seller.settings.instagram.refreshRecommended')}
              </span>
            </div>
          )}

          {!config.instagram.isConnected || instagramHealth?.needsReconnect ? (
            <>
              <button
                onClick={handleConnectInstagram}
                disabled={isConnectingInstagram}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 text-white text-xs font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isConnectingInstagram ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Instagram size={14} />
                )}
                {instagramHealth?.needsReconnect
                  ? t('seller.settings.instagram.reconnect')
                  : t('seller.settings.instagram.connectWithInstagram')
                }
              </button>
              {instagramHealth?.needsReconnect && <InstagramReconnectGuide />}
            </>
          ) : (
            <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-sm font-medium text-white">@{config.instagram.handle}</span>
              </div>
              <button
                onClick={handleDisconnectInstagram}
                disabled={isDisconnectingInstagram}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 disabled:opacity-50"
              >
                {isDisconnectingInstagram && <Loader2 size={10} className="animate-spin" />}
                {t('seller.settings.instagram.disconnect')}
              </button>
            </div>
          )}
        </div>

        {/* Google Maps Integration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4285F4]/10 rounded-lg flex items-center justify-center border border-[#4285F4]/20">
                <MapPin size={20} className="text-[#4285F4]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{t('seller.settings.googleMaps.title')}</h3>
                <p className="text-[10px] text-zinc-500">{t('seller.settings.googleMaps.description')}</p>
              </div>
            </div>
            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  googleMaps: { ...prev.googleMaps, enabled: !prev.googleMaps.enabled },
                }))
              }
              className={`w-10 h-6 rounded-full transition-colors relative ${
                config.googleMaps.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  config.googleMaps.enabled ? 'start-5' : 'start-1'
                }`}
              />
            </button>
          </div>

          {config.googleMaps.enabled && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t('seller.settings.googleMaps.placeId')}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                value={config.googleMaps.placeName}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    googleMaps: { ...prev.googleMaps, placeName: e.target.value },
                  }))
                }
              />
              <button
                onClick={handleSyncGoogleMaps}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                {isSyncingMaps ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {t('seller.settings.googleMaps.syncMetadata')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Rates */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Truck size={20} className="text-zinc-400" />
          <h3 className="font-bold text-sm text-white">{t('seller.settings.shipping.title')}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-black p-3 rounded-lg border border-zinc-800">
            <span className="text-xs text-zinc-400">{t('seller.settings.shipping.defaultRateEverywhere')}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={config.shipping.defaultRate}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    shipping: {
                      ...prev.shipping,
                      defaultRate: parseFloat(e.target.value) || 0,
                    },
                  }))
                }
                className="w-16 bg-zinc-900 text-center text-sm text-white font-bold rounded-md py-1 focus:outline-none"
              />
              <span className="text-xs text-zinc-500">{t('currency.MAD_symbol')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-zinc-500 font-bold uppercase ms-1">{t('seller.settings.shipping.cityRules')}</p>
              <label className="flex items-center gap-1 text-[10px] text-emerald-400 cursor-pointer hover:text-emerald-300">
                <FileSpreadsheet size={12} />
                <span>{t('seller.settings.shipping.importCsv')}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </label>
            </div>

            {config.shipping.rules.map((rule: ShippingRule) => (
              <div
                key={rule.city}
                className="flex items-center justify-between bg-black p-2 rounded-lg border border-zinc-800"
              >
                <span className="text-xs text-white font-bold px-2">{t(`cities.${rule.city}`, { defaultValue: rule.city })}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-bold">{rule.rate} {t('currency.MAD_symbol')}</span>
                  <button
                    onClick={() => handleRemoveShippingRule(rule.city)}
                    className="p-1 text-zinc-600 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder={t('seller.settings.shipping.cityPlaceholder')}
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <input
                type="number"
                placeholder={t('seller.settings.shipping.rate')}
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-20 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleAddShippingRule}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Aggregator Coming Soon */}
        <Link
          href={`/${locale}/seller/settings/shipping`}
          className="block mt-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Rocket size={20} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">{t('shipping.aggregatorSection')}</h4>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded-full">
                  {t('shipping.comingSoon')}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                {t('shipping.description')}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* App Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={20} className="text-zinc-400" />
          <h3 className="font-bold text-sm text-white">{t('seller.settings.language')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_CODES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                locale === lang.code
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{t(`language.name.${lang.nameKey}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Share2 size={20} className="text-zinc-400" />
          <h3 className="font-bold text-sm text-white">{t('seller.settings.publicProfileLink')}</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={`vibecart.app/${seller.handle}`}
            readOnly
            className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 focus:outline-none"
          />
          <button
            onClick={copyProfileLink}
            className="bg-white text-black px-3 rounded-lg flex items-center justify-center"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* System Links */}
      <div className="space-y-2 pt-4">
        <button
          onClick={() => showFeatureComingSoon(t('seller.settings.termsOfService'))}
          className="w-full flex items-center gap-3 p-3 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
        >
          <FileText size={18} />
          <span className="text-sm font-medium">{t('seller.settings.termsOfService')}</span>
        </button>
        <button
          onClick={() => showFeatureComingSoon(t('seller.settings.privacyPolicy'))}
          className="w-full flex items-center gap-3 p-3 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
        >
          <Shield size={18} />
          <span className="text-sm font-medium">{t('seller.settings.privacyPolicy')}</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-bold">{t('auth.logout')}</span>
        </button>
      </div>

      <div className="text-center text-[10px] text-zinc-600 pb-4">VibeCart Seller Pro v1.2.4</div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        featureName={comingSoonFeature}
      />
    </div>
  );
}
