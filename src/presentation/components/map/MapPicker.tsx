'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  X,
  Navigation,
  MapPin,
  Loader2,
  Check,
  Layers,
  Globe,
  Building2,
  Home,
  Briefcase,
  Flag,
  ArrowLeft,
  Bookmark,
  MapPinned,
  ChevronDown,
  MapIcon,
} from 'lucide-react';
import { DirectionalIcon } from '@/presentation/components/ui/DirectionalIcon';
import type { NearbyLandmark } from '@/domain/entities/MoroccoLocation';
import {
  getAllRegions,
  getProvincesForRegionWithNames,
  getCommunesForProvinceWithNames,
  getNeighborhoodsForCity,
  matchCityToAdminDivision,
} from '@/lib/constants';

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

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: {
    lat: number;
    lng: number;
    addressString: string;
    details: any;
    saveAddress?: boolean;
    nearbyLandmark?: NearbyLandmark | null;
    adminDivisions?: AddressFields;
  }) => void;
  initialLocation?: { lat: number; lng: number };
}

type ResidenceType = 'apartment' | 'house' | 'office' | 'other';

/**
 * MapPicker Component
 *
 * Full-screen map interface for selecting delivery location.
 * Uses Leaflet with Google Map tiles and reverse geocoding.
 */
export function MapPicker({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
}: MapPickerProps) {
  const t = useTranslations('map');
  const locale = useLocale();
  const isArabic = locale === 'ar' || locale === 'ar-MA';

  // UI State
  const [step, setStep] = useState<'map' | 'landmarks' | 'details'>('map');
  const [residenceType, setResidenceType] = useState<ResidenceType>('apartment');
  const [saveAddress, setSaveAddress] = useState(true);

  // Landmarks State
  const [nearbyLandmarks, setNearbyLandmarks] = useState<NearbyLandmark[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<NearbyLandmark | null>(null);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(false);

  // Map State
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);

  const [address, setAddress] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  // Administrative Division State
  const [addressFields, setAddressFields] = useState<AddressFields>({
    region: null,
    province: null,
    commune: null,
    neighborhood: '',
  });

  // Dropdown visibility state
  const [openDropdown, setOpenDropdown] = useState<'region' | 'province' | 'commune' | 'neighborhood' | null>(null);

  // Form State
  const [detailsForm, setDetailsForm] = useState({
    buildingNumber: '',
    floor: '',
    apartmentNumber: '',
    companyName: '',
    instructions: '',
  });

  // Default to Casablanca
  const DEFAULT_CENTER = { lat: 33.5731, lng: -7.5898 };

  // Get available options based on selections
  const allRegions = useMemo(() => getAllRegions(), []);

  const availableProvinces = useMemo(() => {
    if (!addressFields.region) return [];
    return getProvincesForRegionWithNames(addressFields.region.key);
  }, [addressFields.region]);

  const availableCommunes = useMemo(() => {
    if (!addressFields.province) return [];
    return getCommunesForProvinceWithNames(addressFields.province.key);
  }, [addressFields.province]);

  const availableNeighborhoods = useMemo(() => {
    // Try to get neighborhoods for the commune/city
    if (addressFields.commune) {
      const hoods = getNeighborhoodsForCity(addressFields.commune.key);
      if (hoods.length > 0) return hoods;
    }
    if (addressFields.province) {
      const hoods = getNeighborhoodsForCity(addressFields.province.key);
      if (hoods.length > 0) return hoods;
    }
    return [];
  }, [addressFields.commune, addressFields.province]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('map');
      setSaveAddress(true);
      setResidenceType('apartment');
      setNearbyLandmarks([]);
      setSelectedLandmark(null);
      setAddressFields({
        region: null,
        province: null,
        commune: null,
        neighborhood: '',
      });
      setOpenDropdown(null);
      setDetailsForm({
        buildingNumber: '',
        floor: '',
        apartmentNumber: '',
        companyName: '',
        instructions: '',
      });
    }
  }, [isOpen]);

  // Initialize Map (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let L: any;
    const initMap = async () => {
      // Dynamic import of Leaflet
      L = (await import('leaflet')).default;

      // Load Leaflet CSS if not already loaded
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const startLat = initialLocation?.lat || DEFAULT_CENTER.lat;
      const startLng = initialLocation?.lng || DEFAULT_CENTER.lng;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 19,
        zoomControl: false,
        attributionControl: false,
      });

      const streetLayer = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        { maxZoom: 22, attribution: 'Google Maps' }
      );
      const satelliteLayer = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        { maxZoom: 22, attribution: 'Google Maps' }
      );

      streetLayerRef.current = streetLayer;
      satelliteLayerRef.current = satelliteLayer;

      if (mapType === 'standard') streetLayer.addTo(map);
      else satelliteLayer.addTo(map);

      mapInstanceRef.current = map;
      setCurrentCenter({ lat: startLat, lng: startLng });

      map.on('movestart', () => {
        setIsDragging(true);
      });

      map.on('moveend', () => {
        setIsDragging(false);
        const center = map.getCenter();
        setCurrentCenter({ lat: center.lat, lng: center.lng });
        fetchAddress(center.lat, center.lng);
      });

      fetchAddress(startLat, startLng);

      if (!initialLocation) {
        handleLocateMe();
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle Map Type Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !streetLayerRef.current || !satelliteLayerRef.current) return;

    if (mapType === 'standard') {
      map.removeLayer(satelliteLayerRef.current);
      streetLayerRef.current.addTo(map);
    } else {
      map.removeLayer(streetLayerRef.current);
      satelliteLayerRef.current.addTo(map);
    }
  }, [mapType]);

  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      if (data && data.address) {
        setRawDetails(data);
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.house_number || '';
        const area =
          addr.suburb ||
          addr.neighbourhood ||
          addr.city_district ||
          addr.city ||
          '';

        let display = '';
        if (street) display += `${street}`;
        if (street && area) display += `, ${area}`;
        if (!street && area) display = area;

        setAddress(display || '');

        // Try to auto-fill administrative divisions
        const cityName = addr.city || addr.town || addr.village || addr.county || addr.state;
        if (cityName) {
          const matched = matchCityToAdminDivision(cityName);
          if (matched) {
            setAddressFields(prev => ({
              ...prev,
              region: matched.region || null,
              province: matched.province || null,
              commune: matched.commune || null,
            }));
          }
        }
      } else {
        setAddress('');
      }
    } catch {
      setAddress('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 19, {
          animate: true,
          duration: 1.5,
        });
      },
      (err) => {
        console.warn('Location denied', err);
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleProceedToLandmarks = async () => {
    if (!currentCenter) return;

    setIsLoadingLandmarks(true);
    try {
      const res = await fetch(
        `/api/landmarks/nearby?lat=${currentCenter.lat}&lng=${currentCenter.lng}&radius=1000&limit=8`
      );
      const data = await res.json();
      setNearbyLandmarks(data.landmarks || []);
      setStep('landmarks');
    } catch (err) {
      // If landmarks fetch fails, skip to details
      console.warn('Failed to fetch landmarks:', err);
      setStep('details');
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  const handleLandmarkSelection = (landmark: NearbyLandmark | null) => {
    setSelectedLandmark(landmark);
    setStep('details');
  };

  // Handle region change - reset dependent fields
  const handleRegionChange = (region: AdminDivision) => {
    setAddressFields({
      region,
      province: null,
      commune: null,
      neighborhood: '',
    });
    setOpenDropdown(null);
  };

  // Handle province change - reset dependent fields
  const handleProvinceChange = (province: AdminDivision) => {
    setAddressFields(prev => ({
      ...prev,
      province,
      commune: null,
      neighborhood: '',
    }));
    setOpenDropdown(null);
  };

  // Handle commune change
  const handleCommuneChange = (commune: AdminDivision) => {
    setAddressFields(prev => ({
      ...prev,
      commune,
      neighborhood: '',
    }));
    setOpenDropdown(null);
  };

  // Handle neighborhood change
  const handleNeighborhoodChange = (neighborhood: string) => {
    setAddressFields(prev => ({
      ...prev,
      neighborhood,
    }));
    setOpenDropdown(null);
  };

  const handleFinalConfirm = () => {
    if (!currentCenter || !rawDetails) return;

    // Get address format translations
    const apt = t('addressFormat.apt');
    const floor = t('addressFormat.floor');
    const bld = t('addressFormat.bld');
    const villa = t('addressFormat.villa');
    const house = t('addressFormat.house');
    const office = t('addressFormat.office');
    const near = t('addressFormat.near');

    // Construct detailed address string with translations
    let detailedAddress = '';

    if (residenceType === 'apartment') {
      detailedAddress = `${apt} ${detailsForm.apartmentNumber}, ${floor} ${detailsForm.floor}, ${bld} ${detailsForm.buildingNumber}`;
    } else if (residenceType === 'house') {
      detailedAddress = `${villa}/${house} ${detailsForm.buildingNumber}`;
    } else if (residenceType === 'office') {
      detailedAddress = `${office}: ${detailsForm.companyName}, ${floor} ${detailsForm.floor}, ${bld} ${detailsForm.buildingNumber}`;
    }

    // Add landmark context if selected (with translated "near")
    const landmarkContext = selectedLandmark
      ? ` (${near} ${isArabic ? selectedLandmark.name_ar : selectedLandmark.name})`
      : '';

    // Build location string with admin divisions
    const locationParts: string[] = [];
    if (addressFields.neighborhood) locationParts.push(addressFields.neighborhood);
    if (addressFields.commune) {
      locationParts.push(isArabic ? addressFields.commune.name_ar : addressFields.commune.name_fr);
    }
    if (addressFields.province) {
      locationParts.push(isArabic ? addressFields.province.name_ar : addressFields.province.name_fr);
    }

    const locationString = locationParts.length > 0
      ? locationParts.join(', ')
      : address;

    const finalAddressString = detailedAddress
      ? `${detailedAddress} - ${locationString}${landmarkContext}`
      : `${locationString}${landmarkContext}`;

    const fullString = detailsForm.instructions
      ? `${finalAddressString} (${detailsForm.instructions})`
      : finalAddressString;

    onConfirm({
      lat: currentCenter.lat,
      lng: currentCenter.lng,
      addressString: fullString,
      details: {
        ...rawDetails,
        userExtras: {
          type: residenceType,
          ...detailsForm,
        },
      },
      saveAddress,
      nearbyLandmark: selectedLandmark,
      adminDivisions: addressFields,
    });
  };

  // Helper to get display name based on locale
  const getDisplayName = (item: AdminDivision | null) => {
    if (!item) return '';
    return isArabic ? item.name_ar : item.name_fr;
  };

  if (!isOpen) return null;

  const residenceTypes = [
    { id: 'apartment' as const, icon: Building2, labelKey: 'residenceType.apartment' },
    { id: 'house' as const, icon: Home, labelKey: 'residenceType.house' },
    { id: 'office' as const, icon: Briefcase, labelKey: 'residenceType.office' },
    { id: 'other' as const, icon: Flag, labelKey: 'residenceType.other' },
  ];

  // Custom dropdown component
  const AddressDropdown = ({
    label,
    value,
    placeholder,
    options,
    isOpen: dropdownOpen,
    onToggle,
    onSelect,
    disabled = false,
  }: {
    label: string;
    value: string;
    placeholder: string;
    options: { key: string; label: string }[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (key: string) => void;
    disabled?: boolean;
  }) => (
    <div className="relative">
      <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-start flex items-center justify-between transition-colors ${
          disabled
            ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
            : dropdownOpen
            ? 'border-emerald-500 text-white'
            : 'border-zinc-700 text-white hover:border-zinc-600'
        }`}
      >
        <span className={value ? 'text-white' : 'text-zinc-500'}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {dropdownOpen && options.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              className="w-full px-4 py-3 text-start text-white hover:bg-zinc-700 first:rounded-t-xl last:rounded-b-xl transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col">
      {/* Header Controls - Back/Close button fixed on LEFT side regardless of RTL */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 flex justify-end items-start pointer-events-none">
        {step === 'map' ? (
          <button
            onClick={onClose}
            className="pointer-events-auto absolute left-4 p-2 bg-white/90 backdrop-blur-md text-black rounded-full shadow-lg"
          >
            <X size={20} />
          </button>
        ) : step === 'landmarks' ? (
          <button
            onClick={() => setStep('map')}
            className="pointer-events-auto absolute left-4 p-2 bg-white/90 backdrop-blur-md text-black rounded-full shadow-lg"
          >
            <DirectionalIcon icon={ArrowLeft} size={20} />
          </button>
        ) : (
          <button
            onClick={() => setStep('landmarks')}
            className="pointer-events-auto absolute left-4 p-2 bg-white/90 backdrop-blur-md text-black rounded-full shadow-lg"
          >
            <DirectionalIcon icon={ArrowLeft} size={20} />
          </button>
        )}

        {step === 'map' && (
          <button
            onClick={() =>
              setMapType((prev) =>
                prev === 'standard' ? 'satellite' : 'standard'
              )
            }
            className="pointer-events-auto p-2 bg-white/90 backdrop-blur-md text-black rounded-full shadow-lg flex items-center gap-2 px-3"
          >
            {mapType === 'standard' ? <Globe size={20} /> : <Layers size={20} />}
            <span className="text-xs font-bold">
              {mapType === 'standard' ? t('satelliteView') : t('streetView')}
            </span>
          </button>
        )}
      </div>

      {/* Map Container */}
      <div
        className={`relative bg-zinc-800 transition-all duration-300 ${step === 'map' ? 'flex-1' : 'h-[25vh]'}`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {(step === 'details' || step === 'landmarks') && (
          <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />
        )}

        {/* Center Pin */}
        {step === 'map' && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center pb-8">
            <div className="relative">
              <div className="relative z-20 text-emerald-500 drop-shadow-2xl">
                <MapPin
                  size={48}
                  fill="currentColor"
                  className={`transition-transform duration-200 ${isDragging ? '-translate-y-4 scale-110' : 'translate-y-0 scale-100'}`}
                />
                <div
                  className={`absolute top-[14px] start-[14px] w-5 h-5 bg-black rounded-full transition-transform duration-200 ${isDragging ? '-translate-y-4' : 'translate-y-0'}`}
                />
              </div>
              <div
                className={`absolute bottom-[2px] left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/30 rounded-full blur-[1px] transition-all duration-200 ${isDragging ? 'scale-50 opacity-30' : 'scale-100 opacity-100'}`}
              />
            </div>
          </div>
        )}

        {/* Locate Me FAB */}
        {step === 'map' && (
          <div className="absolute bottom-6 end-4 z-20">
            <button
              onClick={handleLocateMe}
              className="p-3 bg-white text-black rounded-full shadow-xl active:scale-95 transition-transform"
            >
              <Navigation size={20} fill="black" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div
        className={`bg-zinc-900 border-t border-zinc-800 shadow-2xl z-20 flex flex-col ${step !== 'map' ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}
      >
        {/* STEP 1: CONFIRM LOCATION */}
        {step === 'map' && (
          <div className="p-6 pb-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  {t('deliveryLocation')}
                </p>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {isDragging ? t('refiningLocation') : (address || t('pinnedLocation'))}
                </h3>
                {isLoading && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <Loader2 size={10} className="animate-spin" /> {t('updatingAddress')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleProceedToLandmarks}
              disabled={isDragging || isLoading || isLoadingLandmarks || !currentCenter}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading || isLoadingLandmarks ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> {t('waitASec')}
                </>
              ) : (
                <>
                  <Check size={20} /> {t('confirm')}
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: NEARBY LANDMARKS */}
        {step === 'landmarks' && (
          <div className="p-6 pb-10 animate-slide-up">
            <div className="mb-6">
              <h3 className="text-white font-bold text-lg mb-1">{t('nearbyPlaces')}</h3>
              <p className="text-zinc-500 text-sm">{t('selectNearbyPlace')}</p>
            </div>

            {nearbyLandmarks.length > 0 ? (
              <div className="space-y-3 mb-6">
                {nearbyLandmarks.map((landmark) => (
                  <button
                    key={landmark.id}
                    onClick={() => handleLandmarkSelection(landmark)}
                    className="w-full p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-start flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <MapPinned size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                          {isArabic ? landmark.name_ar : landmark.name}
                        </div>
                        <div className="text-xs text-zinc-500">{landmark.type}</div>
                      </div>
                    </div>
                    <span className="text-sm text-zinc-400 font-medium">{landmark.distance}m</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-xl p-6 mb-6 text-center">
                <MapPinned size={32} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-zinc-500 text-sm">{t('noNearbyPlaces')}</p>
              </div>
            )}

            <button
              onClick={() => handleLandmarkSelection(null)}
              className="w-full p-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              {t('noneOfThese')}
            </button>
          </div>
        )}

        {/* STEP 3: ADDRESS DETAILS FORM */}
        {step === 'details' && (
          <div className="p-6 pb-10 animate-slide-up">
            <div className="mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-lg mb-1">{t('moreDetails')}</h3>
              <p className="text-zinc-500 text-sm truncate">{address || t('pinnedLocation')}</p>
            </div>

            {/* Administrative Divisions Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <MapIcon size={16} className="text-emerald-500" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {t('administrativeLocation')}
                </p>
              </div>

              <div className="space-y-3">
                {/* Region Dropdown */}
                <AddressDropdown
                  label={t('region')}
                  value={getDisplayName(addressFields.region)}
                  placeholder={t('selectRegion')}
                  options={allRegions.map(r => ({
                    key: r.key,
                    label: isArabic ? r.name_ar : r.name_fr,
                  }))}
                  isOpen={openDropdown === 'region'}
                  onToggle={() => setOpenDropdown(openDropdown === 'region' ? null : 'region')}
                  onSelect={(key) => {
                    const region = allRegions.find(r => r.key === key);
                    if (region) handleRegionChange(region);
                  }}
                />

                {/* Province Dropdown */}
                <AddressDropdown
                  label={t('province')}
                  value={getDisplayName(addressFields.province)}
                  placeholder={t('selectProvince')}
                  options={availableProvinces.map(p => ({
                    key: p.key,
                    label: isArabic ? p.name_ar : p.name_fr,
                  }))}
                  isOpen={openDropdown === 'province'}
                  onToggle={() => setOpenDropdown(openDropdown === 'province' ? null : 'province')}
                  onSelect={(key) => {
                    const province = availableProvinces.find(p => p.key === key);
                    if (province) handleProvinceChange(province);
                  }}
                  disabled={!addressFields.region}
                />

                {/* Commune Dropdown */}
                <AddressDropdown
                  label={t('commune')}
                  value={getDisplayName(addressFields.commune)}
                  placeholder={t('selectCommune')}
                  options={availableCommunes.map(c => ({
                    key: c.key,
                    label: isArabic ? c.name_ar : c.name_fr,
                  }))}
                  isOpen={openDropdown === 'commune'}
                  onToggle={() => setOpenDropdown(openDropdown === 'commune' ? null : 'commune')}
                  onSelect={(key) => {
                    const commune = availableCommunes.find(c => c.key === key);
                    if (commune) handleCommuneChange(commune);
                  }}
                  disabled={!addressFields.province}
                />

                {/* Neighborhood Dropdown (if available) */}
                {availableNeighborhoods.length > 0 && (
                  <AddressDropdown
                    label={t('neighborhood')}
                    value={addressFields.neighborhood}
                    placeholder={t('selectNeighborhood')}
                    options={availableNeighborhoods.map(n => ({
                      key: n,
                      label: n,
                    }))}
                    isOpen={openDropdown === 'neighborhood'}
                    onToggle={() => setOpenDropdown(openDropdown === 'neighborhood' ? null : 'neighborhood')}
                    onSelect={handleNeighborhoodChange}
                  />
                )}
              </div>
            </div>

            {/* Residence Type Selector */}
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
              {t('residenceType.title')}
            </p>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {residenceTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setResidenceType(type.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    residenceType === type.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <type.icon size={20} />
                  <span className="text-[10px] font-bold">{t(type.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-4 mb-8">
              {residenceType === 'office' && (
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                    {t('companyName')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('companyNameExample')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={detailsForm.companyName}
                    onChange={(e) =>
                      setDetailsForm({
                        ...detailsForm,
                        companyName: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {(residenceType === 'apartment' || residenceType === 'office') && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('buildingResidence')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('nameOrNumber')}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      value={detailsForm.buildingNumber}
                      onChange={(e) =>
                        setDetailsForm({
                          ...detailsForm,
                          buildingNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                      {t('floor')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('floorPlaceholder')}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      value={detailsForm.floor}
                      onChange={(e) =>
                        setDetailsForm({ ...detailsForm, floor: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {residenceType === 'apartment' && (
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                    {t('apartmentNumber')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('apartmentExample')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={detailsForm.apartmentNumber}
                    onChange={(e) =>
                      setDetailsForm({
                        ...detailsForm,
                        apartmentNumber: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {residenceType === 'house' && (
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                    {t('villaHouseNumber')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('houseNumberExample')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={detailsForm.buildingNumber}
                    onChange={(e) =>
                      setDetailsForm({
                        ...detailsForm,
                        buildingNumber: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase ms-1">
                  {t('instructions')}
                </label>
                <input
                  type="text"
                  placeholder={t('instructionsExample')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={detailsForm.instructions}
                  onChange={(e) =>
                    setDetailsForm({
                      ...detailsForm,
                      instructions: e.target.value,
                    })
                  }
                />
              </div>

              {/* Save Address Toggle */}
              <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${saveAddress ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}
                  >
                    <Bookmark size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{t('saveAddress')}</p>
                    <p className="text-[9px] text-zinc-500">
                      {t('rememberForNextTime')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSaveAddress(!saveAddress)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${saveAddress ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${saveAddress ? 'start-5' : 'start-1'}`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleFinalConfirm}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Check size={20} /> {t('saveAddress')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
