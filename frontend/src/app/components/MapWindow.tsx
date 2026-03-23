import { useState, useEffect, useRef } from 'react';
import { MapPin, Star, Clock, Navigation, Search, Filter, Heart, X, Coffee, BookOpen } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const API_BASE = 'http://127.0.0.1:3000';

interface Venue {
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

const venueIcon = new L.DivIcon({
  className: '',
  html: `<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(139,92,246,0.4);"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
});

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="width: 16px; height: 16px; background: #22d3ee; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 6px rgba(34,211,238,0.25);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapFlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14);
  }, [center, map]);
  return null;
}

export function MapWindow() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter] = useState<[number, number]>([47.615, -122.33]);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didFetch = useRef(false);

  const fetchVenues = async (lat: number, lon: number) => {
    setIsLoading(true);
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

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc: [number, number] = [coords.latitude, coords.longitude];
          setUserLocation(loc);
          setFlyTo(loc);
          fetchVenues(coords.latitude, coords.longitude);
        },
        () => fetchVenues(47.615, -122.33),
        { timeout: 8000 }
      );
    } else {
      fetchVenues(47.615, -122.33);
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
    const url = `https://www.google.com/maps/dir/${origin}/${lat},${lon}/`;
    window.open(url, '_blank');
  };

  const filteredVenues = venues.filter(v => {
    const matchSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFav = !showOnlyFavorites || favorites.has(v.id);
    return matchSearch && matchFav;
  });

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950" style={{ minHeight: '400px' }}>
      <MapContainer center={mapCenter} zoom={13} className="w-full h-full z-0" style={{ height: '100%', width: '100%', minHeight: '400px' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' maxZoom={20} />
        <MapFlyTo center={flyTo} />
        {userLocation && <Marker position={userLocation} icon={userIcon}><Popup>📍 You are here</Popup></Marker>}
        {filteredVenues.map((v) => (
          <Marker key={v.id} position={v.coords} icon={venueIcon} eventHandlers={{ click: () => setSelectedVenue(v) }}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-bold text-slate-800 mb-1">{v.name}</p>
                <p className="text-xs text-slate-500">{v.address || v.reason}</p>
                {v.rating !== 'N/A' && <p className="text-xs text-yellow-600 mt-1">⭐ {v.rating}</p>}
                <button onClick={() => routeToVenue(v)} className="mt-2 w-full text-xs py-1 px-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors">Navigate →</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedVenue && (
        <div className="absolute top-16 left-4 z-20 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">{selectedVenue.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedVenue.address || selectedVenue.reason}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleFavorite(selectedVenue.id)} className="p-1.5">
                  <Heart className={`h-4 w-4 ${favorites.has(selectedVenue.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                </button>
                <button onClick={() => setSelectedVenue(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedVenue.noise && selectedVenue.noise !== 'UNKNOWN' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">🔊 {selectedVenue.noise}</span>
              )}
              {selectedVenue.outlets && selectedVenue.outlets !== 'UNKNOWN' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">🔌 {selectedVenue.outlets}</span>
              )}
              {selectedVenue.rating !== 'N/A' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">⭐ {selectedVenue.rating}</span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">🕐 {selectedVenue.distance}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{selectedVenue.reason.toLowerCase()}</p>
            <button onClick={() => routeToVenue(selectedVenue)} className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-violet-600 hover:to-blue-600 transition-all hover:scale-[1.02]">
              <Navigation className="h-4 w-4" />Navigate
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Input placeholder="Search venues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-slate-200 dark:border-slate-700 shadow-xl" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <Filter className="h-4 w-4 mr-2" />Filter
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-slate-200 dark:border-slate-700">
            <DropdownMenuCheckboxItem checked={showOnlyFavorites} onCheckedChange={setShowOnlyFavorites}>
              <Heart className="h-4 w-4 mr-2" />Favorites only
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {userLocation && (
          <Button onClick={() => setFlyTo([...userLocation] as [number, number])} size="icon" className="bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <Navigation className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-60 overflow-hidden">
        <div className="p-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-violet-50/50 to-blue-50/50 dark:from-violet-900/20 dark:to-blue-900/20">
          <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 tracking-tight text-sm">
            <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Nearby Third Places
            <span className="text-xs font-normal text-slate-500">
              {isLoading ? 'Loading...' : error ? '⚠️ Error' : `(${filteredVenues.length})`}
            </span>
          </h3>
        </div>
        <div className="overflow-y-auto max-h-44 p-2">
          {error && <p className="text-xs text-red-500 p-2">{error}</p>}
          {isLoading && (
            <div className="flex items-center justify-center p-6">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            {filteredVenues.map((venue) => (
              <div key={venue.id} onClick={() => { setSelectedVenue(venue); setFlyTo([...venue.coords] as [number, number]); }} className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${selectedVenue?.id === venue.id ? 'bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 border-violet-300 dark:border-violet-700 shadow-sm' : 'bg-white/60 dark:bg-slate-700/60 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 flex items-center justify-center flex-shrink-0">
                    {/library/i.test(venue.reason) ? <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" /> : <Coffee className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{venue.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 capitalize">{venue.reason.toLowerCase()}</span>
                      {venue.rating !== 'N/A' && <><span className="text-slate-400 text-[10px]">•</span><span className="text-[10px] text-yellow-600">⭐ {venue.rating}</span></>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }} className="flex-shrink-0 p-1">
                    <Heart className={`h-3.5 w-3.5 ${favorites.has(venue.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}