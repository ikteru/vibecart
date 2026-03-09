'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
  AlertCircle,
  Store,
  ExternalLink,
  Clock,
  Tag,
} from 'lucide-react';
import { SwipeButton } from '../ui/SwipeButton';
import { MapPicker } from '../map/MapPicker';
import {
  MOROCCAN_CITIES,
  MOROCCAN_LOCATIONS,
  getAllRegions,
  getProvincesForRegionWithNames,
  getCommunesForProvinceWithNames,
  getNeighborhoodsForCity,
} from '@/lib/constants';
import type { NearbyLandmark } from '@/domain/entities/MoroccoLocation';
import type { Product } from '@/domain/entities/Product';

interface AdminDivision {
  key: string;
  name_fr: string;
  name_ar: string;
}

interface AddressFields {
  region: AdminDivision | null;
  province: AdminDivision | null;
  commune: AdminDivision | null;
  neighborhood: string;
}
import {
  fieldValidators,
  validateAndFormatPhone,
} from '@/presentation/validation/checkoutSchema';

interface ShopConfig {
  shipping?: {
    defaultRate: number;
    rules?: Array<{ city: string; rate: number }>;
  };
  pickup?: {
    enabled: boolean;
    storeName?: string;
    storeAddress?: string;
    storeCity?: string;
    storePhone?: string;
    requirePhoneConfirmation?: boolean;
    googleMapsUrl?: string;
    preparationTimeMinutes?: number;
    instructions?: string;
    discountPercent?: number;
    hours?: {
      alwaysOpen?: boolean;
      monday?: { open: string; close: string; closed?: boolean };
      tuesday?: { open: string; close: string; closed?: boolean };
      wednesday?: { open: string; close: string; closed?: boolean };
      thursday?: { open: string; close: string; closed?: boolean };
      friday?: { open: string; close: string; closed?: boolean };
      saturday?: { open: string; close: string; closed?: boolean };
      sunday?: { open: string; close: string; closed?: boolean };
    };
  };
}

interface OrderDetails {
  firstName: string;
  lastName: string;
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
  sellerId: string;
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
  sellerId,
  isOpen,
  onClose,
  shopConfig,
}: CheckoutDrawerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isArabic = locale === 'ar' || locale === 'ar-MA';
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fulfillment type
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupScheduledTime, setPickupScheduledTime] = useState<string>('');
  const [pickupNotes, setPickupNotes] = useState<string>('');
  const [createdPickupCode, setCreatedPickupCode] = useState<string | null>(null);

  // Map Picker State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);

  // Saved Address State
  const [savedAddress, setSavedAddress] = useState<any>(null);

  // Admin Divisions State (from MapPicker)
  const [adminDivisions, setAdminDivisions] = useState<AddressFields | null>(null);
  const [nearbyLandmark, setNearbyLandmark] = useState<NearbyLandmark | null>(null);
  const [openAdminDropdown, setOpenAdminDropdown] = useState<
    'region' | 'province' | 'commune' | 'neighborhood' | null
  >(null);

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
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    phone: '',
    quantity: 1,
    shippingCost: shopConfig.shipping?.defaultRate || 0,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = useCallback((field: keyof typeof fieldValidators, value: string) => {
    const validator = fieldValidators[field];
    if (!validator) return;

    const result = validator.safeParse(value);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: result.error.errors[0].message }));
    } else {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  // Handle field blur - mark as touched and validate
  const handleFieldBlur = useCallback((field: keyof typeof fieldValidators, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  }, [validateField]);

  // Phone input handler with validation
  const handlePhoneChange = useCallback((value: string) => {
    setOrder((prev) => ({ ...prev, phone: value }));
    if (touched.phone) {
      const result = validateAndFormatPhone(value);
      if (!result.valid) {
        setErrors((prev) => ({ ...prev, phone: result.error! }));
      } else {
        setErrors((prev) => {
          const { phone: _, ...rest } = prev;
          return rest;
        });
      }
    }
  }, [touched.phone]);

  // Load saved address on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibecart_saved_address');
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          setSavedAddress(parsedSaved);
          // Also set admin divisions and landmark from saved data so they display immediately
          if (parsedSaved.adminDivisions) {
            setAdminDivisions(parsedSaved.adminDivisions);
          }
          if (parsedSaved.nearbyLandmark) {
            setNearbyLandmark(parsedSaved.nearbyLandmark);
          }
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

  // Compute store open/closed status
  const isStoreOpen = useMemo(() => {
    const pickup = shopConfig.pickup;
    if (!pickup?.hours) return true;
    if (pickup.hours.alwaysOpen) return true;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const now = new Date();
    const dayKey = days[now.getDay()];
    const dayConfig = pickup.hours[dayKey];
    if (!dayConfig || dayConfig.closed) return false;
    const [openH, openM] = dayConfig.open.split(':').map(Number);
    const [closeH, closeM] = dayConfig.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }, [shopConfig.pickup]);

  // Admin Divisions Memoized Options
  const allRegions = useMemo(() => getAllRegions(), []);

  const availableProvinces = useMemo(() => {
    if (!adminDivisions?.region) return [];
    return getProvincesForRegionWithNames(adminDivisions.region.key);
  }, [adminDivisions?.region]);

  const availableCommunes = useMemo(() => {
    if (!adminDivisions?.province) return [];
    return getCommunesForProvinceWithNames(adminDivisions.province.key);
  }, [adminDivisions?.province]);

  // Smart neighborhood detection - check commune first, then province
  const adminNeighborhoods = useMemo(() => {
    if (adminDivisions?.commune) {
      const hoods = getNeighborhoodsForCity(adminDivisions.commune.key);
      if (hoods.length > 0) return hoods;
    }
    if (adminDivisions?.province) {
      return getNeighborhoodsForCity(adminDivisions.province.key);
    }
    return [];
  }, [adminDivisions?.commune, adminDivisions?.province]);

  // Admin Division Change Handlers
  const handleRegionChange = useCallback((region: AdminDivision) => {
    setAdminDivisions({ region, province: null, commune: null, neighborhood: '' });
    setOpenAdminDropdown(null);
    setOrder(prev => ({ ...prev, city: '' }));
    setCitySearch('');
  }, []);

  const handleProvinceChange = useCallback((province: AdminDivision) => {
    setAdminDivisions(prev => prev ? { ...prev, province, commune: null, neighborhood: '' } : null);
    setOpenAdminDropdown(null);
    const cityName = isArabic ? province.name_ar : province.name_fr;
    setOrder(prev => ({ ...prev, city: cityName }));
    setCitySearch(cityName);
  }, [isArabic]);

  const handleCommuneChange = useCallback((commune: AdminDivision) => {
    setAdminDivisions(prev => prev ? { ...prev, commune, neighborhood: '' } : null);
    setOpenAdminDropdown(null);
    const cityName = isArabic ? commune.name_ar : commune.name_fr;
    setOrder(prev => ({ ...prev, city: cityName }));
    setCitySearch(cityName);
    setNeighborhood('');
    setNeighborhoodSearch('');
  }, [isArabic]);

  const handleAdminNeighborhoodChange = useCallback((neighborhoodValue: string) => {
    setAdminDivisions(prev => prev ? { ...prev, neighborhood: neighborhoodValue } : null);
    setOpenAdminDropdown(null);
    setNeighborhood(neighborhoodValue);
    setNeighborhoodSearch(neighborhoodValue);
  }, []);

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
    nearbyLandmark?: NearbyLandmark | null;
    adminDivisions?: AddressFields;
  }) => {
    const { lat, lng, details, addressString, saveAddress: shouldSave, nearbyLandmark: landmark, adminDivisions: divisions } = data;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    setMapLocation({ lat, lng });
    setIsMapOpen(false);
    setOrder((prev) => ({ ...prev, locationUrl: mapsUrl }));

    // Always store admin divisions and landmark (even if null to clear previous state)
    setAdminDivisions(divisions || null);
    setNearbyLandmark(landmark || null);

    // Save if requested
    if (shouldSave && typeof window !== 'undefined') {
      const dataToSave = { lat, lng, addressString, details, saveAddress: true, adminDivisions: divisions, nearbyLandmark: landmark };
      localStorage.setItem('vibecart_saved_address', JSON.stringify(dataToSave));
      setSavedAddress(dataToSave);
    }

    // Use the formatted address string
    if (addressString) {
      setOrder((prev) => ({ ...prev, address: addressString }));
    }

    // If we have admin divisions, use them for city
    if (divisions?.commune || divisions?.province) {
      const cityName = divisions.commune
        ? (isArabic ? divisions.commune.name_ar : divisions.commune.name_fr)
        : (divisions.province ? (isArabic ? divisions.province.name_ar : divisions.province.name_fr) : '');

      setOrder((prev) => ({ ...prev, city: cityName }));
      setCitySearch(cityName);

      if (divisions.neighborhood) {
        setNeighborhood(divisions.neighborhood);
        setNeighborhoodSearch(divisions.neighborhood);
      }
    } else if (details && details.address) {
      // Fallback to parsing from geocoding details
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

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Format phone to 212XXXXXXXXX format
      const phoneResult = validateAndFormatPhone(order.phone);
      const formattedPhone = phoneResult.formatted || order.phone;

      const isPickup = fulfillmentType === 'pickup';

      let body: Record<string, unknown> = {
        sellerId,
        customerName: `${order.firstName} ${order.lastName}`.trim(),
        customerPhone: formattedPhone,
        fulfillmentType,
        items: [
          {
            productId: product.id,
            title: product.title,
            price: product.price.amount,
            quantity: order.quantity,
            selectedVariant: order.selectedVariant,
          },
        ],
        shippingCost: isPickup ? 0 : order.shippingCost,
      };

      if (isPickup) {
        if (pickupScheduledTime) body.pickupScheduledTime = pickupScheduledTime;
        if (pickupNotes) body.pickupNotes = pickupNotes;
      } else {
        // Parse location from URL if available
        let location: { lat: number; lng: number } | undefined;
        if (order.locationUrl) {
          const match = order.locationUrl.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
          if (match) {
            location = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
          }
        }
        body.shippingAddress = {
          city: order.city,
          neighborhood: neighborhood || undefined,
          street: order.address,
          location,
          locationUrl: order.locationUrl,
        };
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        if (result.order?.pickupCode) {
          setCreatedPickupCode(result.order.pickupCode);
        }
        setStep('success');
      } else {
        setOrderError(result.error || 'Failed to create order');
        setStep('error');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      setOrderError('Network error. Please try again.');
      setStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const isPickup = fulfillmentType === 'pickup';

    // Common required fields
    if (!order.firstName || !order.lastName || !order.phone) return false;

    // Delivery-specific requirements
    if (!isPickup) {
      if (!order.city || !order.address) return false;
      if (!order.locationUrl) return false;
    }

    // Variant requirement
    if (product.variants && product.variants.length > 0 && !order.selectedVariant) return false;

    // Check no validation errors
    if (Object.keys(errors).length > 0) return false;

    // Validate phone format
    const phoneValidation = validateAndFormatPhone(order.phone);
    if (!phoneValidation.valid) return false;

    return true;
  };

  const effectiveShippingCost = fulfillmentType === 'pickup' ? 0 : order.shippingCost;
  const total = product.price.amount * order.quantity + effectiveShippingCost;

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
                {step === 'form' ? t('checkout.secureOrder') : (fulfillmentType === 'pickup' ? t('checkout.pickup.pickupSuccessTitle') : t('checkout.verifyOrder'))}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                {step === 'form'
                  ? (fulfillmentType === 'pickup' ? t('checkout.pickup.free') : t('checkout.cashOnDelivery'))
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

              {/* Fulfillment Selector — shown only when pickup is enabled */}
              {shopConfig.pickup?.enabled && (
                <div className="mb-5 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                    {t('checkout.pickup.howDoYouWantIt')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Delivery option */}
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('delivery')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        fulfillmentType === 'delivery'
                          ? 'bg-zinc-800 border-zinc-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <Truck size={22} className={fulfillmentType === 'delivery' ? 'text-white' : 'text-zinc-500'} />
                      <span className="text-xs font-bold">{t('checkout.pickup.delivery')}</span>
                      <span className="text-[10px] text-zinc-500">
                        {t('checkout.pickup.shippingCostLabel', { amount: shopConfig.shipping?.defaultRate || 0 })}
                      </span>
                    </button>
                    {/* Pickup option */}
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('pickup')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all relative overflow-hidden ${
                        fulfillmentType === 'pickup'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <Store size={22} className={fulfillmentType === 'pickup' ? 'text-emerald-400' : 'text-zinc-500'} />
                      <span className="text-xs font-bold">{t('checkout.pickup.pickupAtStore')}</span>
                      <span className={`text-[10px] font-bold ${fulfillmentType === 'pickup' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {t('checkout.pickup.free')}
                      </span>
                      {(shopConfig.pickup?.discountPercent ?? 0) > 0 && (
                        <span className="absolute top-1.5 end-1.5 bg-emerald-500 text-black text-[8px] font-bold px-1 py-0.5 rounded-full flex items-center gap-0.5">
                          <Tag size={7} />
                          -{shopConfig.pickup?.discountPercent}%
                        </span>
                      )}
                    </button>
                  </div>
                  {/* Open/closed badge for pickup */}
                  {fulfillmentType === 'pickup' && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${
                      isStoreOpen
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {isStoreOpen ? t('checkout.pickup.currentlyOpen') : t('checkout.pickup.currentlyClosed')}
                    </div>
                  )}
                </div>
              )}

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

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('checkout.firstName')}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={t('checkout.firstNamePlaceholder')}
                      className={`w-full h-[52px] bg-zinc-900 border rounded-xl px-4 text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                        touched.firstName && errors.firstName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-zinc-800 focus:border-emerald-500/50'
                      }`}
                      value={order.firstName}
                      onChange={(e) =>
                        setOrder((p) => ({ ...p, firstName: e.target.value }))
                      }
                      onBlur={() => handleFieldBlur('firstName', order.firstName)}
                    />
                    {touched.firstName && errors.firstName && (
                      <p className="text-red-400 text-[10px] ms-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('checkout.lastName')}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder={t('checkout.lastNamePlaceholder')}
                      className={`w-full h-[52px] bg-zinc-900 border rounded-xl px-4 text-white placeholder-zinc-600 focus:outline-none transition-colors ${
                        touched.lastName && errors.lastName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-zinc-800 focus:border-emerald-500/50'
                      }`}
                      value={order.lastName}
                      onChange={(e) =>
                        setOrder((p) => ({ ...p, lastName: e.target.value }))
                      }
                      onBlur={() => handleFieldBlur('lastName', order.lastName)}
                    />
                    {touched.lastName && errors.lastName && (
                      <p className="text-red-400 text-[10px] ms-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* WhatsApp Phone with +212 prefix */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1 flex items-center gap-1.5">
                    <Smartphone size={10} className="text-emerald-500" />
                    {t('checkout.phoneWithCode')}
                  </label>
                  <div
                    dir="ltr"
                    className={`flex items-center h-[52px] bg-zinc-900 border rounded-xl overflow-hidden transition-colors ${
                    touched.phone && errors.phone
                      ? 'border-red-500'
                      : 'border-zinc-800 focus-within:border-emerald-500/50'
                  }`}>
                    {/* Country Code Badge */}
                    <div className="h-full px-4 bg-zinc-800/50 flex items-center gap-2 border-e border-zinc-700/50">
                      <span className="text-lg">🇲🇦</span>
                      <span className="text-white font-bold text-sm">+212</span>
                    </div>
                    {/* Phone Input */}
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      placeholder="6 12 34 56 78"
                      className="flex-1 h-full bg-transparent px-4 text-white text-lg font-medium tracking-wider placeholder-zinc-600 focus:outline-none"
                      value={order.phone}
                      onChange={(e) => {
                        // Only allow digits and format nicely
                        const digits = e.target.value.replace(/\D/g, '');
                        // Limit to 9 digits (Moroccan phone without country code)
                        const limited = digits.slice(0, 9);
                        // Format with spaces: 6 12 34 56 78
                        const formatted = limited.replace(/(\d{1})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/, (_, a, b, c, d, e) => {
                          return [a, b, c, d, e].filter(Boolean).join(' ');
                        });
                        handlePhoneChange(formatted);
                      }}
                      onBlur={() => handleFieldBlur('phone', order.phone)}
                    />
                  </div>
                  {touched.phone && errors.phone ? (
                    <p className="text-red-400 text-[10px] ms-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {errors.phone}
                    </p>
                  ) : (
                    <p className="text-zinc-600 text-[10px] ms-1">
                      {t('checkout.phonePlaceholder')}
                    </p>
                  )}
                </div>

                {/* Pickup Form — only for pickup */}
                {fulfillmentType === 'pickup' && (
                  <div className="space-y-3 pt-2">
                    {/* Store info card */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Store size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold text-white">
                          {shopConfig.pickup?.storeName || ''}
                        </span>
                      </div>
                      {shopConfig.pickup?.storeAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                          <span className="text-xs text-zinc-400">{shopConfig.pickup.storeAddress}</span>
                        </div>
                      )}
                      {shopConfig.pickup?.preparationTimeMinutes && (
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-zinc-500 shrink-0" />
                          <span className="text-xs text-zinc-400">
                            {t('checkout.pickup.preparationTime', {
                              time: shopConfig.pickup.preparationTimeMinutes >= 60
                                ? `${shopConfig.pickup.preparationTimeMinutes / 60}h`
                                : `${shopConfig.pickup.preparationTimeMinutes}min`
                            })}
                          </span>
                        </div>
                      )}
                      {shopConfig.pickup?.instructions && (
                        <p className="text-[11px] text-zinc-500 border-t border-emerald-500/10 pt-2">
                          {shopConfig.pickup.instructions}
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        {shopConfig.pickup?.googleMapsUrl && (
                          <a
                            href={shopConfig.pickup.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2 rounded-lg transition-colors"
                          >
                            <ExternalLink size={12} />
                            {t('checkout.pickup.getDirections')}
                          </a>
                        )}
                        {shopConfig.pickup?.storePhone && (
                          <a
                            href={`tel:${shopConfig.pickup.storePhone}`}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2 rounded-lg transition-colors"
                          >
                            <Smartphone size={12} />
                            {shopConfig.pickup.storePhone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Call confirmation notice */}
                    {shopConfig.pickup?.requirePhoneConfirmation && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        <Smartphone size={14} className="text-amber-400 shrink-0" />
                        <span className="text-xs text-amber-300">{t('checkout.pickup.callBeforeComing')}</span>
                      </div>
                    )}

                    {/* Pickup discount callout */}
                    {(shopConfig.pickup?.discountPercent ?? 0) > 0 && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <Tag size={14} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-400">
                          {t('checkout.pickup.pickupSavings', {
                            amount: Math.round(product.price.amount * order.quantity * (shopConfig.pickup!.discountPercent! / 100)),
                          })}
                        </span>
                      </div>
                    )}

                    {/* Preferred time */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                        {t('checkout.pickup.preferredPickupTime')}
                      </label>
                      <div className="flex gap-2">
                        {['morning', 'afternoon', 'evening', 'anyTime'].map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setPickupScheduledTime(slot === 'anyTime' ? '' : slot)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                              (slot === 'anyTime' ? !pickupScheduledTime : pickupScheduledTime === slot)
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            {t(`checkout.pickup.${slot}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pickup notes */}
                    <div className="space-y-1">
                      <textarea
                        placeholder={t('checkout.pickup.pickupNotes')}
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/30 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Location Section — only for delivery */}
                {fulfillmentType !== 'pickup' && (
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

                  {/* Admin Divisions Dropdowns (from MapPicker) or City/Neighborhood Selectors */}
                  {adminDivisions && (adminDivisions.region || adminDivisions.province || adminDivisions.commune) ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                      {/* Region Dropdown */}
                      <div className="space-y-1 relative">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                          {t('map.region')}
                        </label>
                        <button
                          type="button"
                          onClick={() => setOpenAdminDropdown(openAdminDropdown === 'region' ? null : 'region')}
                          className={`w-full h-[52px] bg-zinc-800/50 border rounded-xl px-4 text-start flex items-center justify-between transition-colors ${
                            openAdminDropdown === 'region'
                              ? 'border-emerald-500/50 text-white'
                              : 'border-zinc-700 text-white hover:border-zinc-600'
                          }`}
                        >
                          <span className={adminDivisions.region ? 'text-white' : 'text-zinc-600'}>
                            {adminDivisions.region
                              ? (isArabic ? adminDivisions.region.name_ar : adminDivisions.region.name_fr)
                              : t('map.selectRegion')}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-zinc-500 transition-transform ${openAdminDropdown === 'region' ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {openAdminDropdown === 'region' && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                            {allRegions.map((r) => (
                              <button
                                key={r.key}
                                type="button"
                                onClick={() => handleRegionChange(r)}
                                className="w-full px-4 py-3 text-start text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white first:rounded-t-xl last:rounded-b-xl transition-colors border-b border-zinc-800/50 last:border-0"
                              >
                                {isArabic ? r.name_ar : r.name_fr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Province Dropdown */}
                      <div className="space-y-1 relative">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                          {t('map.province')}
                        </label>
                        <button
                          type="button"
                          onClick={() => adminDivisions.region && setOpenAdminDropdown(openAdminDropdown === 'province' ? null : 'province')}
                          disabled={!adminDivisions.region}
                          className={`w-full h-[52px] bg-zinc-800/50 border rounded-xl px-4 text-start flex items-center justify-between transition-colors ${
                            !adminDivisions.region
                              ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : openAdminDropdown === 'province'
                              ? 'border-emerald-500/50 text-white'
                              : 'border-zinc-700 text-white hover:border-zinc-600'
                          }`}
                        >
                          <span className={adminDivisions.province ? 'text-white' : 'text-zinc-600'}>
                            {adminDivisions.province
                              ? (isArabic ? adminDivisions.province.name_ar : adminDivisions.province.name_fr)
                              : t('map.selectProvince')}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-zinc-500 transition-transform ${openAdminDropdown === 'province' ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {openAdminDropdown === 'province' && availableProvinces.length > 0 && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                            {availableProvinces.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => handleProvinceChange(p)}
                                className="w-full px-4 py-3 text-start text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white first:rounded-t-xl last:rounded-b-xl transition-colors border-b border-zinc-800/50 last:border-0"
                              >
                                {isArabic ? p.name_ar : p.name_fr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Commune Dropdown */}
                      <div className="space-y-1 relative">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                          {t('map.commune')}
                        </label>
                        <button
                          type="button"
                          onClick={() => adminDivisions.province && setOpenAdminDropdown(openAdminDropdown === 'commune' ? null : 'commune')}
                          disabled={!adminDivisions.province}
                          className={`w-full h-[52px] bg-zinc-800/50 border rounded-xl px-4 text-start flex items-center justify-between transition-colors ${
                            !adminDivisions.province
                              ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                              : openAdminDropdown === 'commune'
                              ? 'border-emerald-500/50 text-white'
                              : 'border-zinc-700 text-white hover:border-zinc-600'
                          }`}
                        >
                          <span className={adminDivisions.commune ? 'text-white' : 'text-zinc-600'}>
                            {adminDivisions.commune
                              ? (isArabic ? adminDivisions.commune.name_ar : adminDivisions.commune.name_fr)
                              : t('map.selectCommune')}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-zinc-500 transition-transform ${openAdminDropdown === 'commune' ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {openAdminDropdown === 'commune' && availableCommunes.length > 0 && (
                          <div className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                            {availableCommunes.map((c) => (
                              <button
                                key={c.key}
                                type="button"
                                onClick={() => handleCommuneChange(c)}
                                className="w-full px-4 py-3 text-start text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white first:rounded-t-xl last:rounded-b-xl transition-colors border-b border-zinc-800/50 last:border-0"
                              >
                                {isArabic ? c.name_ar : c.name_fr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Neighborhood Dropdown - Only show if neighborhoods exist */}
                      {adminNeighborhoods.length > 0 && (
                        <div className="space-y-1 relative">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                            {t('map.neighborhood')}
                          </label>
                          <button
                            type="button"
                            onClick={() => setOpenAdminDropdown(openAdminDropdown === 'neighborhood' ? null : 'neighborhood')}
                            className={`w-full h-[52px] bg-zinc-800/50 border rounded-xl px-4 text-start flex items-center justify-between transition-colors ${
                              openAdminDropdown === 'neighborhood'
                                ? 'border-emerald-500/50 text-white'
                                : 'border-zinc-700 text-white hover:border-zinc-600'
                            }`}
                          >
                            <span className={adminDivisions.neighborhood ? 'text-white' : 'text-zinc-600'}>
                              {adminDivisions.neighborhood || t('map.selectNeighborhood')}
                            </span>
                            <ChevronDown
                              size={14}
                              className={`text-zinc-500 transition-transform ${openAdminDropdown === 'neighborhood' ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {openAdminDropdown === 'neighborhood' && (
                            <div className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                              {adminNeighborhoods.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => handleAdminNeighborhoodChange(n)}
                                  className="w-full px-4 py-3 text-start text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white first:rounded-t-xl last:rounded-b-xl transition-colors border-b border-zinc-800/50 last:border-0"
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nearby Landmark - Keep as read-only display */}
                      {nearbyLandmark && (
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">{t('checkout.nearLandmark')}</span>
                          <span className="text-sm text-emerald-400 font-medium">
                            {isArabic ? nearbyLandmark.name_ar : nearbyLandmark.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
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
                                {city}
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
                  )}

                  {/* Street Address */}
                  <div className="space-y-1">
                    <input
                      required
                      type="text"
                      placeholder={t('checkout.streetAddressPlaceholder')}
                      className={`w-full h-[52px] bg-zinc-900 border rounded-xl px-4 text-white placeholder-zinc-600 focus:outline-none transition-all ${
                        touched.address && errors.address
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-zinc-800 focus:border-emerald-500/50'
                      }`}
                      value={order.address}
                      onChange={(e) =>
                        setOrder((p) => ({ ...p, address: e.target.value }))
                      }
                      onBlur={() => handleFieldBlur('address', order.address)}
                    />
                    {touched.address && errors.address && (
                      <p className="text-red-400 text-[10px] ms-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Delivery Instructions Templates */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('checkout.deliveryInstructions')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'callWhenArriving', emoji: '📞' },
                        { key: 'leaveAtDoor', emoji: '🚪' },
                        { key: 'ringBell', emoji: '🔔' },
                        { key: 'dontRing', emoji: '🤫' },
                      ].map(({ key, emoji }) => {
                        const template = t(`checkout.instructionTemplates.${key}`);
                        const isSelected = order.address.includes(template);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                // Remove template from address
                                setOrder((p) => ({
                                  ...p,
                                  address: p.address.replace(template, '').replace(/\s+/g, ' ').trim(),
                                }));
                              } else {
                                // Add template to address
                                setOrder((p) => ({
                                  ...p,
                                  address: p.address ? `${p.address} - ${template}` : template,
                                }));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                            }`}
                          >
                            {emoji} {template}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="mt-8 mb-4 border-t border-dashed border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{product.price.amount * order.quantity} {t('common.currency')}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    {fulfillmentType === 'pickup' ? <Store size={12} /> : <Truck size={12} />}
                    {' '}{t('checkout.shipping')}{' '}
                    {fulfillmentType !== 'pickup' && order.city ? t('checkout.shippingTo', { city: order.city }) : ''}
                  </span>
                  <span className={effectiveShippingCost === 0 ? 'text-emerald-400 font-bold' : ''}>
                    {effectiveShippingCost === 0
                      ? t('checkout.freeShipping')
                      : `${effectiveShippingCost} ${t('common.currency')}`}
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
                    {fulfillmentType === 'pickup'
                      ? t('checkout.validation.fillDetails')
                      : !order.locationUrl
                        ? t('checkout.validation.pinLocation')
                        : !order.city
                          ? t('checkout.validation.selectCity')
                          : t('checkout.validation.fillDetails')}
                  </p>
                )}
              </div>
            </>
          ) : fulfillmentType === 'pickup' ? (
            /* Pickup success screen */
            <div className="flex flex-col items-center justify-center py-6 space-y-5 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <Store size={36} className="text-emerald-500 relative z-10" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-white">{t('checkout.pickup.pickupSuccessTitle')}</h3>
                <p className="text-zinc-400 text-sm">{t('checkout.pickup.pickupSuccessMessage')}</p>
              </div>

              {/* Pickup code — big and prominent */}
              {createdPickupCode && (
                <div className="w-full bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-5 text-center">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                    {t('checkout.pickup.pickupCode')}
                  </p>
                  <p className="text-4xl font-black text-white tracking-widest font-mono">
                    {createdPickupCode}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    {t('checkout.pickup.storeInfo')}
                  </p>
                </div>
              )}

              {/* Store address */}
              {shopConfig.pickup?.storeAddress && (
                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">{shopConfig.pickup.storeName || ''}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{shopConfig.pickup.storeAddress}</p>
                    </div>
                  </div>
                  {shopConfig.pickup.googleMapsUrl && (
                    <a
                      href={shopConfig.pickup.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      <ExternalLink size={12} />
                      {t('checkout.pickup.openMaps')}
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="text-zinc-500 text-sm font-medium hover:text-white transition-colors"
              >
                {t('checkout.closeWindow')}
              </button>
            </div>
          ) : (
            /* Delivery success screen */
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
                  <span dir="ltr" className="text-white font-mono inline-block">
                    0{order.phone.replace(/\s/g, '').slice(0, 1)} ** ** ** {order.phone.replace(/\s/g, '').slice(-2)}
                  </span>
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
