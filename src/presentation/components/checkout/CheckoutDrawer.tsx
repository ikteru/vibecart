'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  ShoppingBag,
  CheckCircle,
  Smartphone,
  MapPin,
  Navigation,
  Send,
  Ruler,
  Truck,
  ChevronDown,
  Search,
  Map,
  Bookmark,
} from 'lucide-react';
import { SwipeButton } from '../ui/SwipeButton';
import { MapPicker } from '../map/MapPicker';
import { MOROCCAN_CITIES, MOROCCAN_LOCATIONS } from '@/lib/constants';
import type { Product } from '@/domain/entities/Product';

interface ShopConfig {
  shipping?: {
    defaultRate: number;
    rules?: Array<{ city: string; rate: number }>;
  };
}

interface OrderDetails {
  fullName: string;
  address: string;
  city: string;
  phone: string;
  quantity: number;
  shippingCost: number;
  selectedVariant?: string;
  locationUrl?: string;
}

interface CheckoutDrawerProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  shopConfig: ShopConfig;
}

/**
 * CheckoutDrawer Component
 *
 * Full-screen modal for order processing with map-based location selection.
 */
export function CheckoutDrawer({
  product,
  isOpen,
  onClose,
  shopConfig,
}: CheckoutDrawerProps) {
  const t = useTranslations();
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Map Picker State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);

  // Saved Address State
  const [savedAddress, setSavedAddress] = useState<any>(null);

  // City Selector State
  const [citySearch, setCitySearch] = useState('');
  const [isCityListOpen, setIsCityListOpen] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Neighborhood Selector State
  const [neighborhood, setNeighborhood] = useState('');
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const [isNeighborhoodListOpen, setIsNeighborhoodListOpen] = useState(false);
  const neighborhoodInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<OrderDetails>({
    fullName: '',
    address: '',
    city: '',
    phone: '',
    quantity: 1,
    shippingCost: shopConfig.shipping?.defaultRate || 0,
  });

  // Load saved address on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibecart_saved_address');
      if (saved) {
        try {
          setSavedAddress(JSON.parse(saved));
        } catch {
          console.error('Failed to parse saved address');
        }
      }
    }
  }, []);

  const handleUseSavedAddress = () => {
    if (!savedAddress) return;
    handleMapConfirm(savedAddress);
  };

  // Calculate Shipping Cost based on City
  useEffect(() => {
    const cityLower = order.city.toLowerCase().trim();
    const rules = shopConfig.shipping?.rules || [];
    const rule = rules.find((r) => r.city.toLowerCase() === cityLower);

    if (rule) {
      setOrder((prev) => ({ ...prev, shippingCost: rule.rate }));
    } else if (order.city) {
      setOrder((prev) => ({
        ...prev,
        shippingCost: shopConfig.shipping?.defaultRate || 0,
      }));
    }
  }, [order.city, shopConfig.shipping]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch) return MOROCCAN_CITIES;
    return MOROCCAN_CITIES.filter((city) =>
      city.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [citySearch]);

  // Filter Neighborhoods based on selected City
  const availableNeighborhoods = useMemo(() => {
    if (!order.city) return [];
    return MOROCCAN_LOCATIONS[order.city] || [];
  }, [order.city]);

  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoodSearch) return availableNeighborhoods;
    return availableNeighborhoods.filter((n) =>
      n.toLowerCase().includes(neighborhoodSearch.toLowerCase())
    );
  }, [neighborhoodSearch, availableNeighborhoods]);

  const handleCitySelect = (city: string) => {
    setOrder((prev) => ({ ...prev, city }));
    setCitySearch(city);
    setIsCityListOpen(false);
    setNeighborhood('');
    setNeighborhoodSearch('');
  };

  const handleNeighborhoodSelect = (n: string) => {
    setNeighborhood(n);
    setNeighborhoodSearch(n);
    setIsNeighborhoodListOpen(false);
  };

  const handleMapConfirm = (data: {
    lat: number;
    lng: number;
    addressString: string;
    details: any;
    saveAddress?: boolean;
  }) => {
    const { lat, lng, details, addressString, saveAddress: shouldSave } = data;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    setMapLocation({ lat, lng });
    setIsMapOpen(false);
    setOrder((prev) => ({ ...prev, locationUrl: mapsUrl }));

    // Save if requested
    if (shouldSave && typeof window !== 'undefined') {
      const dataToSave = { lat, lng, addressString, details, saveAddress: true };
      localStorage.setItem('vibecart_saved_address', JSON.stringify(dataToSave));
      setSavedAddress(dataToSave);
    }

    // Use the formatted address string
    if (addressString) {
      setOrder((prev) => ({ ...prev, address: addressString }));
    }

    // Parse City/Neighborhood
    if (details && details.address) {
      const addr = details.address;

      let detectedCity =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.state?.replace(' region', '') ||
        '';

      let detectedNeighborhood =
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        addr.city_district ||
        addr.residential ||
        addr.hamlet ||
        '';

      // Check if neighborhood is actually a city
      const potentialCityMatch = MOROCCAN_CITIES.find(
        (c) => c.toLowerCase() === detectedNeighborhood.toLowerCase()
      );
      if (potentialCityMatch) {
        detectedCity = potentialCityMatch;
        detectedNeighborhood = '';
      }

      // Normalize City
      const matchedCity =
        MOROCCAN_CITIES.find(
          (c) => c.toLowerCase() === detectedCity.toLowerCase()
        ) || detectedCity;

      setOrder((prev) => ({
        ...prev,
        city: matchedCity,
      }));

      if (matchedCity) setCitySearch(matchedCity);

      // Match Neighborhood
      if (matchedCity && detectedNeighborhood) {
        const knownNeighborhoods = MOROCCAN_LOCATIONS[matchedCity] || [];
        const matchedNbhd = knownNeighborhoods.find(
          (n) =>
            n.toLowerCase() === detectedNeighborhood.toLowerCase() ||
            detectedNeighborhood.toLowerCase().includes(n.toLowerCase()) ||
            n.toLowerCase().includes(detectedNeighborhood.toLowerCase())
        );

        const finalNbhd = matchedNbhd || detectedNeighborhood;
        setNeighborhood(finalNbhd);
        setNeighborhoodSearch(finalNbhd);
      }
    }
  };

  const handleConfirmOrder = () => {
    setTimeout(() => {
      setStep('success');
    }, 600);
  };

  const isFormValid = () => {
    if (!order.fullName || !order.phone || !order.city || !order.address)
      return false;
    if (!order.locationUrl) return false;
    if (
      product.variants &&
      product.variants.length > 0 &&
      !order.selectedVariant
    )
      return false;
    return true;
  };

  const total = product.price.amount * order.quantity + order.shippingCost;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Drawer */}
        <div className="relative w-full max-w-md bg-zinc-950 rounded-t-[2rem] p-6 shadow-2xl border-t border-zinc-800 animate-slide-up max-h-[95vh] overflow-y-auto no-scrollbar">
          <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {step === 'form' ? t('checkout.secureOrder') : t('checkout.verifyOrder')}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                {step === 'form'
                  ? t('checkout.cashOnDelivery')
                  : t('checkout.checkWhatsApp')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white border border-zinc-800"
            >
              <X size={20} />
            </button>
          </div>

          {step === 'form' ? (
            <>
              {/* Product Summary */}
              <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl mb-6 border border-zinc-800/50">
                <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-700/50">
                  <ShoppingBag size={24} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg leading-tight line-clamp-1">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-emerald-400 font-bold">
                      {product.price.amount} {t('common.currency')}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOrder((p) => ({
                            ...p,
                            quantity: Math.max(1, p.quantity - 1),
                          }))
                        }
                        className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="text-white text-sm font-bold w-4 text-center">
                        {order.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOrder((p) => ({
                            ...p,
                            quantity: Math.min(product.stock, p.quantity + 1),
                          }))
                        }
                        className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Variant Selector */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1 flex items-center gap-1">
                      <Ruler size={10} /> {t('checkout.selectOption')}
                    </label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {product.variants.map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setOrder((p) => ({ ...p, selectedVariant: v }))
                          }
                          className={`shrink-0 h-[42px] px-5 rounded-xl text-sm font-bold border transition-all ${
                            order.selectedVariant === v
                              ? 'bg-white text-black border-white shadow-lg'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('checkout.fullName')}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={t('checkout.yourNamePlaceholder')}
                      className="w-full h-[52px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={order.fullName}
                      onChange={(e) =>
                        setOrder((p) => ({ ...p, fullName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('checkout.whatsapp')}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder={t('checkout.phonePlaceholder')}
                      className="w-full h-[52px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={order.phone}
                      onChange={(e) =>
                        setOrder((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">
                      {t('checkout.deliveryLocation')}
                    </label>
                  </div>

                  {/* Use Saved Address Prompt */}
                  {savedAddress && !order.locationUrl && (
                    <button
                      onClick={handleUseSavedAddress}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500/50 transition-colors group mb-2"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                          <Bookmark size={14} className="text-purple-500" />
                        </div>
                        <div className="flex flex-col items-start truncate">
                          <span className="text-xs font-bold text-white">
                            {t('checkout.useSavedLocation')}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                            {savedAddress.addressString}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-purple-400 group-hover:underline">
                        {t('checkout.autofill')}
                      </div>
                    </button>
                  )}

                  {/* Map Picker Button */}
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className={`w-full h-[60px] rounded-xl flex items-center justify-between px-4 transition-all border group relative overflow-hidden ${
                      order.locationUrl
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {mapLocation ? (
                      <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="w-full h-full bg-gradient-to-r from-emerald-900 to-zinc-900" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
                    )}

                    <div className="flex items-center gap-3 relative z-10">
                      {order.locationUrl ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
                          <CheckCircle size={20} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                          <Map size={20} />
                        </div>
                      )}
                      <div className="text-start">
                        <span
                          className={`block text-xs font-bold ${order.locationUrl ? 'text-white' : 'text-zinc-300'}`}
                        >
                          {order.locationUrl
                            ? t('checkout.locationPinned')
                            : t('checkout.pinLocation')}
                        </span>
                        <span className="block text-[10px] text-zinc-500">
                          {order.locationUrl
                            ? t('checkout.tapToEditPin')
                            : t('checkout.preciseDeliverySpot')}
                        </span>
                      </div>
                    </div>
                    <Navigation
                      size={16}
                      className={`relative z-10 ${order.locationUrl ? 'text-emerald-500' : 'text-zinc-600'}`}
                    />
                  </button>

                  {/* City + Neighborhood */}
                  <div className="grid grid-cols-2 gap-3 relative">
                    {/* City Selector */}
                    <div className="space-y-1 relative">
                      <div className="relative">
                        <input
                          ref={cityInputRef}
                          type="text"
                          placeholder={t('checkout.city')}
                          className="w-full h-[52px] bg-zinc-900 border border-zinc-800 rounded-xl ps-4 pe-8 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                          value={citySearch}
                          onChange={(e) => {
                            setCitySearch(e.target.value);
                            setIsCityListOpen(true);
                            if (order.city && e.target.value !== order.city) {
                              setOrder((prev) => ({ ...prev, city: '' }));
                            }
                          }}
                          onFocus={() => setIsCityListOpen(true)}
                          onBlur={() =>
                            setTimeout(() => setIsCityListOpen(false), 200)
                          }
                        />
                        <ChevronDown
                          size={14}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                        />
                      </div>
                      {isCityListOpen && (
                        <div className="absolute top-[calc(100%+4px)] start-0 w-full max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 no-scrollbar">
                          {filteredCities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              className="w-full text-start px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800/50 last:border-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCitySelect(city);
                              }}
                            >
                              {t(`cities.${city}`, { defaultValue: city })}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Neighborhood Selector */}
                    <div className="space-y-1 relative">
                      <div className="relative">
                        <input
                          ref={neighborhoodInputRef}
                          type="text"
                          disabled={!order.city}
                          placeholder={!order.city ? t('checkout.cityFirst') : t('checkout.neighborhood')}
                          className="w-full h-[52px] bg-zinc-900 border border-zinc-800 rounded-xl ps-4 pe-8 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          value={neighborhoodSearch}
                          onChange={(e) => {
                            setNeighborhoodSearch(e.target.value);
                            setNeighborhood(e.target.value);
                            setIsNeighborhoodListOpen(true);
                          }}
                          onFocus={() => setIsNeighborhoodListOpen(true)}
                          onBlur={() =>
                            setTimeout(() => setIsNeighborhoodListOpen(false), 200)
                          }
                        />
                        {!neighborhoodSearch && (
                          <Search
                            size={14}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                          />
                        )}
                      </div>
                      {isNeighborhoodListOpen &&
                        availableNeighborhoods.length > 0 && (
                          <div className="absolute top-[calc(100%+4px)] start-0 w-full max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 no-scrollbar">
                            {filteredNeighborhoods.map((n) => (
                              <button
                                key={n}
                                type="button"
                                className="w-full text-start px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800/50 last:border-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleNeighborhoodSelect(n);
                                }}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="space-y-1">
                    <input
                      required
                      type="text"
                      placeholder={t('checkout.streetAddressPlaceholder')}
                      className="w-full h-[52px] bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                      value={order.address}
                      onChange={(e) =>
                        setOrder((p) => ({ ...p, address: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-8 mb-4 border-t border-dashed border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{product.price.amount * order.quantity} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Truck size={12} /> {t('checkout.shipping')}{' '}
                    {order.city ? t('checkout.shippingTo', { city: t(`cities.${order.city}`, { defaultValue: order.city }) }) : ''}
                  </span>
                  <span
                    className={
                      order.shippingCost === 0
                        ? 'text-emerald-400 font-bold'
                        : ''
                    }
                  >
                    {order.shippingCost === 0
                      ? t('checkout.freeShipping')
                      : `${order.shippingCost} ${t('common.currency')}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-2">
                  <span>{t('checkout.total')}</span>
                  <span>{total} {t('common.currency')}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-4">
                <SwipeButton
                  label={t('checkout.slideToOrder')}
                  successLabel={t('checkout.sent')}
                  disabled={!isFormValid()}
                  onConfirm={handleConfirmOrder}
                  icon={<Send size={20} className="text-white ms-0.5" />}
                />
                {!isFormValid() && (
                  <p className="text-center text-xs text-zinc-600 mt-2">
                    {!order.locationUrl
                      ? t('checkout.validation.pinLocation')
                      : !order.city
                        ? t('checkout.validation.selectCity')
                        : t('checkout.validation.fillDetails')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-fade-in">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <Smartphone size={40} className="text-emerald-500 relative z-10" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {t('checkout.confirmationSent')}
                </h3>
                <p className="text-zinc-400 text-sm max-w-[280px] mx-auto">
                  {t('checkout.verificationSentTo')}{' '}
                  <span className="text-white font-mono">{order.phone}</span>.
                </p>
              </div>

              <div className="w-full bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle size={16} className="text-white" />
                </div>
                <div className="text-start">
                  <p className="text-sm font-bold text-white">{t('checkout.oneLastStep')}</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {t('checkout.whatsappConfirmText')}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-zinc-500 text-sm font-medium hover:text-white transition-colors"
              >
                {t('checkout.closeWindow')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Map Picker */}
      <MapPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
        initialLocation={mapLocation}
      />
    </>
  );
}
