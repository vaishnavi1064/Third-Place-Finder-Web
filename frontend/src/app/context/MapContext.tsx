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
  triggerFetch: () => void; // called externally after onboarding
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

  // Resolve & cache user location on mount (for map centering), but don't fetch venues yet
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

  const fetchVenues = async (lat: number, lon: number) => {
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/cafes?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error('API error');
      const data: Venue[] = await res.json();
      setVenues(data);
    } catch {
      setError('Could not load venues. Is the backend running on port 3000?');
    } finally {
      setIsLoading(false);
    }
  };

  // Called by ChatBox after onboarding completes
  const triggerFetch = useCallback(() => {
    const loc = locationRef.current || [47.615, -122.33];
    fetchVenues(loc[0], loc[1]);
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
    const url = `https://www.google.com/maps/dir/${origin}/${lat},${lon}/`;
    window.open(url, '_blank');
  };

  const filteredVenues = venues.filter(v => {
    const matchSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFav = !showOnlyFavorites || favorites.has(v.id);
    return matchSearch && matchFav;
  });

  return (
    <MapContext.Provider value={{
      venues,
      filteredVenues,
      selectedVenue,
      setSelectedVenue,
      favorites,
      toggleFavorite,
      flyTo,
      setFlyTo,
      userLocation,
      isLoading,
      error,
      searchQuery,
      setSearchQuery,
      showOnlyFavorites,
      setShowOnlyFavorites,
      routeToVenue,
      triggerFetch,
      hasSearched,
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
