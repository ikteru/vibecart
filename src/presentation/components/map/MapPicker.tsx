'use client';

import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: {
    lat: number;
    lng: number;
    addressString: string;
    details: any;
    saveAddress?: boolean;
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
  // UI State
  const [step, setStep] = useState<'map' | 'details'>('map');
  const [residenceType, setResidenceType] = useState<ResidenceType>('apartment');
  const [saveAddress, setSaveAddress] = useState(true);

  // Map State
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const streetLayerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);

  const [address, setAddress] = useState<string>('Moving map...');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

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

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('map');
      setSaveAddress(true);
      setResidenceType('apartment');
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
        setAddress('Locating...');
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

        setAddress(display || 'Pinned Location');
      } else {
        setAddress('Unknown Location');
      }
    } catch {
      setAddress('Network Error');
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

  const handleProceedToDetails = () => {
    setStep('details');
  };

  const handleFinalConfirm = () => {
    if (!currentCenter || !rawDetails) return;

    // Construct detailed address string
    let detailedAddress = '';

    if (residenceType === 'apartment') {
      detailedAddress = `Apt ${detailsForm.apartmentNumber}, Floor ${detailsForm.floor}, Bld ${detailsForm.buildingNumber}`;
    } else if (residenceType === 'house') {
      detailedAddress = `Villa/House ${detailsForm.buildingNumber}`;
    } else if (residenceType === 'office') {
      detailedAddress = `Office: ${detailsForm.companyName}, Floor ${detailsForm.floor}, Bld ${detailsForm.buildingNumber}`;
    }

    const finalAddressString = detailedAddress
      ? `${detailedAddress} - ${address}`
      : address;

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
    });
  };

  if (!isOpen) return null;

  const residenceTypes = [
    { id: 'apartment' as const, icon: Building2, label: 'Apartment' },
    { id: 'house' as const, icon: Home, label: 'House' },
    { id: 'office' as const, icon: Briefcase, label: 'Office' },
    { id: 'other' as const, icon: Flag, label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
        {step === 'map' ? (
          <button
            onClick={onClose}
            className="pointer-events-auto p-2 bg-white/90 backdrop-blur-md text-black rounded-full shadow-lg"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={() => setStep('map')}
            className="pointer-events-auto p-2 bg-white/90 backdrop-blur-md text-black rounded-full shadow-lg"
          >
            <ArrowLeft size={20} />
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
              {mapType === 'standard' ? 'Satellite' : 'Map'}
            </span>
          </button>
        )}
      </div>

      {/* Map Container */}
      <div
        className={`relative bg-zinc-800 transition-all duration-300 ${step === 'map' ? 'flex-1' : 'h-[30vh]'}`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {step === 'details' && (
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
                  className={`absolute top-[14px] left-[14px] w-5 h-5 bg-black rounded-full transition-transform duration-200 ${isDragging ? '-translate-y-4' : 'translate-y-0'}`}
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
          <div className="absolute bottom-6 right-4 z-20">
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
        className={`bg-zinc-900 border-t border-zinc-800 shadow-2xl z-20 flex flex-col ${step === 'details' ? 'flex-1 overflow-y-auto no-scrollbar' : ''}`}
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
                  Delivery Location
                </p>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {isDragging ? 'Refining location...' : address}
                </h3>
                {isLoading && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <Loader2 size={10} className="animate-spin" /> Updating
                    address...
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleProceedToDetails}
              disabled={isDragging || isLoading || !currentCenter}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Wait a sec...'
              ) : (
                <>
                  <Check size={20} /> Confirm Location
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: ADDRESS DETAILS FORM */}
        {step === 'details' && (
          <div className="p-6 animate-slide-up">
            <div className="mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-lg mb-1">More Details</h3>
              <p className="text-zinc-500 text-sm truncate">{address}</p>
            </div>

            {/* Residence Type Selector */}
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">
              Residence Type
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
                  <span className="text-[10px] font-bold">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-4 mb-8">
              {residenceType === 'office' && (
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VibeCart HQ"
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
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">
                      Building/Residence
                    </label>
                    <input
                      type="text"
                      placeholder="Name or No."
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
                    <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">
                      Floor
                    </label>
                    <input
                      type="text"
                      placeholder="0"
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
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">
                    Apartment Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4B"
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
                  <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">
                    Villa / House Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12"
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
                <label className="text-[10px] text-zinc-500 font-bold uppercase ml-1">
                  Instructions for Rider (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call when near, doorbell broken..."
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
                    <p className="text-xs font-bold text-white">Save Address</p>
                    <p className="text-[9px] text-zinc-500">
                      Remember for next time
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSaveAddress(!saveAddress)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${saveAddress ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${saveAddress ? 'left-5' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={handleFinalConfirm}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Check size={20} /> Save Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
