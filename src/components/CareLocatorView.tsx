import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Ambulance,
  Car,
  Crosshair,
  ExternalLink,
  FlaskConical,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import type { ServiceBookingType } from '../types/babyMemory';

const MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

type LocatorCategory = 'obgyn' | 'pediatrician' | 'lab' | 'emergency';

interface DiscoveredPlace {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number | null;
  businessStatus?: string;
}

const CATEGORY_QUERIES: Record<LocatorCategory, { label: string; query: string }> = {
  obgyn: { label: 'OB/GYN & Maternity', query: 'obstetrician gynecologist clinic' },
  pediatrician: { label: 'Pediatricians', query: 'pediatrician clinic' },
  lab: { label: 'Blood Sample & Labs', query: 'diagnostic medical laboratory blood test' },
  emergency: { label: 'Emergency Hospitals', query: 'hospital emergency room maternity' },
};

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

interface PlacesApiPlace {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  rating?: number | null;
  businessStatus?: string;
  location?: { lat: () => number; lng: () => number };
  fetchFields?: (opts: { fields: string[] }) => Promise<void>;
}

interface PlaceSelectEvent extends Event {
  placePrediction: {
    toPlace: () => PlacesApiPlace;
  };
}

const PlaceAutocompleteBox: React.FC<{
  onPlaceCoords: (coords: { lat: number; lng: number }, label: string) => void;
}> = ({ onPlaceCoords }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !placesLib || !containerRef.current) return;

    const autocomplete = new placesLib.PlaceAutocompleteElement();
    containerRef.current.appendChild(autocomplete);

    const handleSelect = (e: Event) => {
      const evt = e as PlaceSelectEvent;
      const place = evt.placePrediction.toPlace();
      void place
        .fetchFields?.({ fields: ['location', 'displayName', 'formattedAddress'] })
        .then(() => {
          if (place.location) {
            const coords = {
              lat: place.location.lat(),
              lng: place.location.lng(),
            };
            map.setCenter(coords);
            map.setZoom(13);
            onPlaceCoords(
              coords,
              place.displayName || place.formattedAddress || 'Selected Location'
            );
          }
        })
        .catch((err: unknown) => {
          const msg = String(err);
          if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT')) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
        });
    };

    autocomplete.addEventListener('gmp-select', handleSelect);
    return () => {
      autocomplete.removeEventListener('gmp-select', handleSelect);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [map, placesLib, onPlaceCoords]);

  return <div ref={containerRef} className="w-full" />;
};

const NearbySearchController: React.FC<{
  center: { lat: number; lng: number };
  category: LocatorCategory;
  onResults: (places: DiscoveredPlace[]) => void;
  onSearchState: (loading: boolean, error: string | null) => void;
}> = ({ center, category, onResults, onSearchState }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLib || !map) return;
    let cancelled = false;

    const runSearch = async () => {
      onSearchState(true, null);
      try {
        const request = {
          textQuery: CATEGORY_QUERIES[category].query,
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'businessStatus'],
          locationBias: center,
          maxResultCount: 8,
          language: 'en-US',
        };
        const { places } = (await placesLib.Place.searchByText(request)) as {
          places: PlacesApiPlace[];
        };
        if (cancelled) return;

        const mapped: DiscoveredPlace[] = places
          .filter((p) => Boolean(p.location))
          .map((p) => ({
            id: p.id || Math.random().toString(36).slice(2),
            name: p.displayName || 'Healthcare Facility',
            address: p.formattedAddress || 'Address available on map',
            location: {
              lat: p.location!.lat(),
              lng: p.location!.lng(),
            },
            rating: p.rating ?? null,
            businessStatus: p.businessStatus || undefined,
          }));

        onResults(mapped);
        onSearchState(false, null);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onSearchState(false, 'Unable to load nearby facilities for this region.');
      }
    };

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [placesLib, map, center, category, onResults, onSearchState]);

  return null;
};

export const CareLocatorView: React.FC = () => {
  const {
    t,
    serviceBookings,
    createServiceBooking,
    updateServiceBookingStatus,
    showToast,
  } = useBabyMemory();

  const bookingFormRef = useRef<HTMLFormElement>(null);

  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [locationLabel, setLocationLabel] = useState('Default City Center (Click Locate Me for GPS)');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'ready' | 'denied'>('idle');
  const [category, setCategory] = useState<LocatorCategory>('obgyn');
  const [places, setPlaces] = useState<DiscoveredPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<DiscoveredPlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Blood Sample / Health Service Booking State
  const [bookingType, setBookingType] = useState<ServiceBookingType>('blood_collection');
  const [bookingProvider, setBookingProvider] = useState('Home Phlebotomy — CBC & Ferritin Panel');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingSchedule, setBookingSchedule] = useState('Tomorrow · 08:00 AM');
  const [bookingNotes, setBookingNotes] = useState('');

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCenter(coords);
        setLocationLabel(`GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        setGeoStatus('ready');
        showToast('Live GPS coordinates updated', 'info');
      },
      () => {
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showToast]);

  const handleSearchState = useCallback((loading: boolean, err: string | null) => {
    setSearching(loading);
    setSearchError(err);
  }, []);

  const handlePlaceCoords = useCallback((coords: { lat: number; lng: number }, label: string) => {
    setUserCenter(coords);
    setLocationLabel(label);
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    await createServiceBooking({
      serviceType: bookingType,
      providerName: bookingProvider,
      address: bookingAddress || locationLabel,
      scheduledFor: bookingSchedule,
      notes: bookingNotes,
    });
    setBookingNotes('');
  };

  const handleDispatchEmergency = async (type: 'ambulance' | 'cab_ride', place?: DiscoveredPlace | null) => {
    const targetName = place?.name || 'Nearest Maternity & Emergency Center';
    const targetAddr = place?.address || locationLabel;
    await createServiceBooking({
      serviceType: type,
      providerName: type === 'ambulance' ? `Emergency Ambulance → ${targetName}` : `Medical Cab Ride → ${targetName}`,
      address: targetAddr,
      scheduledFor: 'Immediate Dispatch',
      notes: `User GPS: ${userCenter.lat.toFixed(5)}, ${userCenter.lng.toFixed(5)}`,
    });
  };

  const buildUberDeepLink = (place?: DiscoveredPlace | null) => {
    const destLat = place?.location.lat ?? userCenter.lat;
    const destLng = place?.location.lng ?? userCenter.lng;
    const destName = encodeURIComponent(place?.name || 'Medical Clinic');
    return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${destName}`;
  };

  const buildDirectionsLink = (place: DiscoveredPlace) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCenter.lat},${userCenter.lng}&destination=${place.location.lat},${place.location.lng}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {t.nearbyCliniciansTitle}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Locate nearby OB/GYN clinics, pediatricians, blood labs, emergency hospitals, and request ambulance or cab rides.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Crosshair className="w-4 h-4" />
          <span>{geoStatus === 'locating' ? 'Detecting GPS...' : 'Use My Live GPS'}</span>
        </button>
      </div>

      {/* Emergency SOS & Transport Strip */}
      <section className="bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-900 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-base font-semibold text-rose-950 dark:text-rose-100">
              Emergency Services, Ambulance &amp; Medical Cab Dispatch
            </h2>
            <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300 font-mono-tabular">
              Active Coordinates: {userCenter.lat.toFixed(5)}, {userCenter.lng.toFixed(5)} · {locationLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Emergency (911)</span>
          </a>
          <button
            type="button"
            onClick={() => void handleDispatchEmergency('ambulance', selectedPlace)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-900 dark:text-rose-100 bg-white dark:bg-stone-900 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg whitespace-nowrap"
          >
            <Ambulance className="w-3.5 h-3.5" />
            <span>{t.requestAmbulance}</span>
          </button>
          <a
            href={buildUberDeepLink(selectedPlace)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void handleDispatchEmergency('cab_ride', selectedPlace)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg whitespace-nowrap"
          >
            <Car className="w-3.5 h-3.5" />
            <span>{t.bookRide}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* Google Maps + Places Search Section */}
      {MAPS_API_KEY ? (
        <APIProvider apiKey={MAPS_API_KEY} libraries={['places', 'marker', 'core']}>
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                  {(Object.keys(CATEGORY_QUERIES) as LocatorCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setSelectedPlace(null);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        category === cat
                          ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {CATEGORY_QUERIES[cat].label}
                    </button>
                  ))}
                </div>
                <div className="w-full sm:w-64">
                  <PlaceAutocompleteBox onPlaceCoords={handlePlaceCoords} />
                </div>
              </div>

              <div className="h-[440px] w-full relative">
                <GoogleMap
                  defaultCenter={userCenter}
                  center={userCenter}
                  defaultZoom={13}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  gestureHandling="greedy"
                  onClick={() => setSelectedPlace(null)}
                >
                  <NearbySearchController
                    center={userCenter}
                    category={category}
                    onResults={setPlaces}
                    onSearchState={handleSearchState}
                  />

                  <AdvancedMarker position={userCenter} title="Your Location">
                    <Pin background="#2E5749" glyphColor="#FFFFFF" borderColor="#24453A" />
                  </AdvancedMarker>

                  {places.map((p) => (
                    <AdvancedMarker
                      key={p.id}
                      position={p.location}
                      title={p.name}
                      onClick={() => setSelectedPlace(p)}
                    />
                  ))}

                  {selectedPlace && (
                    <InfoWindow
                      position={selectedPlace.location}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div className="p-1 max-w-xs text-stone-900">
                        <p className="font-semibold text-sm">{selectedPlace.name}</p>
                        <p className="text-xs text-stone-600 mt-0.5">{selectedPlace.address}</p>
                        {selectedPlace.rating && (
                          <p className="text-xs font-mono mt-1">Rating: {selectedPlace.rating} / 5</p>
                        )}
                        <a
                          href={buildDirectionsLink(selectedPlace)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs font-semibold text-sage-700 underline"
                        >
                          Open Route in Google Maps
                        </a>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            </div>

            {/* Discovered Places List */}
            <div className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col max-h-[530px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {CATEGORY_QUERIES[category].label}
                </h2>
                <span className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400">
                  {searching ? 'Searching...' : `${places.length} found`}
                </span>
              </div>

              {searchError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">{searchError}</p>
              )}

              <div className="flex-1 overflow-y-auto divide-y divide-stone-200 dark:divide-stone-800">
                {!searching && places.length === 0 ? (
                  <p className="py-8 text-xs text-center text-stone-500 dark:text-stone-400">
                    Click &ldquo;Use My Live GPS&rdquo; or search a city above to inspect nearby clinics and labs.
                  </p>
                ) : (
                  places.map((p) => (
                    <div key={p.id} className="py-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlace(p)}
                        className="w-full text-left group"
                      >
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-sage-700 dark:group-hover:text-sage-400">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          {p.address}
                        </p>
                        {p.rating && (
                          <p className="mt-1 text-xs font-mono-tabular text-stone-600 dark:text-stone-300">
                            Rating {p.rating} / 5
                          </p>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBookingType(category === 'lab' ? 'blood_collection' : 'clinic_visit');
                            setBookingProvider(p.name);
                            setBookingAddress(p.address);
                            showToast(`Pre-filled booking form with ${p.name}`, 'info');
                            bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 whitespace-nowrap"
                        >
                          Select for Booking
                        </button>
                        <a
                          href={buildDirectionsLink(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-medium text-sage-700 dark:text-sage-400 hover:underline whitespace-nowrap"
                        >
                          Directions
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </APIProvider>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-sm text-stone-600 dark:text-stone-300 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-sage-700 dark:text-sage-400 shrink-0" />
          <span>
            Google Maps API key will initialize automatically once injected into the runtime environment (`VITE_GOOGLE_MAPS_API_KEY`). You can still manage blood sample collection &amp; emergency dispatch bookings below.
          </span>
        </div>
      )}

      {/* Blood Sample Collection & Health Services Booking */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          ref={bookingFormRef}
          onSubmit={handleCreateBooking}
          className="lg:col-span-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 scroll-mt-20"
        >
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-sage-700 dark:text-sage-400" />
            <span>{t.bookBloodTest} &amp; Health Services</span>
          </h2>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Service Type
            </label>
            <select
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value as ServiceBookingType)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            >
              <option value="blood_collection">Home Blood Sample Collection</option>
              <option value="clinic_visit">OB/GYN or Pediatric Clinic Visit</option>
              <option value="cab_ride">Medical Cab Ride Request</option>
              <option value="ambulance">Emergency Ambulance Request</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Lab / Clinic / Service Name
            </label>
            <input
              type="text"
              required
              maxLength={140}
              value={bookingProvider}
              onChange={(e) => setBookingProvider(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Pickup / Clinic Address
              </label>
              <input
                type="text"
                maxLength={240}
                value={bookingAddress}
                onChange={(e) => setBookingAddress(e.target.value)}
                placeholder="Home address or selected clinic"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Preferred Slot
              </label>
              <input
                type="text"
                maxLength={40}
                value={bookingSchedule}
                onChange={(e) => setBookingSchedule(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Panel / Instructions
            </label>
            <input
              type="text"
              maxLength={400}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="e.g., Fasting CBC, Ferritin, Glucose tolerance"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Submit Service Request</span>
          </button>
        </form>

        <div className="lg:col-span-7 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Scheduled Blood Collections, Clinic Visits &amp; Transport Requests
          </h2>
          {serviceBookings.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
              No health service bookings yet.
            </p>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {serviceBookings.map((bk) => (
                <div key={bk.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {bk.providerName}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                      {bk.serviceType.replace('_', ' ')} · {bk.scheduledFor} · {bk.address}
                    </p>
                    {bk.notes && (
                      <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">{bk.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono-tabular font-medium text-sage-700 dark:text-sage-400 capitalize">
                      {bk.status}
                    </span>
                    {bk.status === 'requested' && (
                      <button
                        type="button"
                        onClick={() => void updateServiceBookingStatus(bk.id, 'completed')}
                        className="px-2.5 py-1 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 whitespace-nowrap"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
