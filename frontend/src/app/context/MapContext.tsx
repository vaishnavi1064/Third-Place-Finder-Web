import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

export interface Venue {
  id: string | number;
  name: string;
  coords: [number, number];
  noise: string;
  outlets: string;
  distance: string;
  reason: string;
  rating: string | number;
  address: string;
  why?: string;
}

interface MapContextType {
  venues: Venue[];
  filteredVenues: Venue[];
  selectedVenue: Venue | null;
  setSelectedVenue: (v: Venue | null) => void;
  favorites: Set<string | number>;
  toggleFavorite: (id: string | number) => void;
  flyTo: [number, number] | null;
  setFlyTo: (coords: [number, number] | null) => void;
  userLocation: [number, number] | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (v: boolean) => void;
  routeToVenue: (venue: Venue) => void;
  triggerFetch: (preferences: Record<string, string>) => void;
  hasSearched: boolean;
}

const MapContext = createContext<MapContextType | null>(null);

const API_BASE = 'http://127.0.0.1:3000';

export function MapProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const locationRef = useRef<[number, number] | null>(null);

  // Resolve user location on mount for map centering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc: [number, number] = [coords.latitude, coords.longitude];
          setUserLocation(loc);
          setFlyTo(loc);
          locationRef.current = loc;
        },
        () => { locationRef.current = [47.615, -122.33]; },
        { timeout: 8000 }
      );
    } else {
      locationRef.current = [47.615, -122.33];
    }
  }, []);

  // Called by ChatBox after onboarding with user preferences
  const triggerFetch = useCallback(async (preferences: Record<string, string>) => {
    const [lat, lon] = locationRef.current || [47.615, -122.33];
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, lat, lon }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.error || 'Unknown API error');
      }
      const data: Venue[] = await res.json();
      setVenues(data);
    } catch (err: any) {
      setError(`Backend Error: ${err.message || 'Could not connect'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavorite = (id: string | number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const routeToVenue = (venue: Venue) => {
    const [lat, lon] = venue.coords;
    const origin = userLocation ? `${userLocation[0]},${userLocation[1]}` : '';
    window.open(`https://www.google.com/maps/dir/${origin}/${lat},${lon}/`, '_blank');
  };

  const filteredVenues = venues.filter(v => {
    const matchSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFav = !showOnlyFavorites || favorites.has(v.id);
    return matchSearch && matchFav;
  });

  return (
    <MapContext.Provider value={{
      venues, filteredVenues, selectedVenue, setSelectedVenue,
      favorites, toggleFavorite, flyTo, setFlyTo, userLocation,
      isLoading, error, searchQuery, setSearchQuery,
      showOnlyFavorites, setShowOnlyFavorites, routeToVenue,
      triggerFetch, hasSearched,
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMap must be used within MapProvider');
  return ctx;
}
