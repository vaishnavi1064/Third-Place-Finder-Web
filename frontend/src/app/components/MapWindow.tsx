import { useEffect } from 'react';
import { Navigation, Heart, X, Search, Filter } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useMap } from '../context/MapContext';

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
  const map = useLeafletMap();
  useEffect(() => {
    if (center) map.flyTo(center, 17);
  }, [center, map]);
  return null;
}

export function MapWindow() {
  const {
    filteredVenues,
    selectedVenue,
    setSelectedVenue,
    favorites,
    toggleFavorite,
    flyTo,
    setFlyTo,
    userLocation,
    searchQuery,
    setSearchQuery,
    showOnlyFavorites,
    setShowOnlyFavorites,
    routeToVenue,
  } = useMap();

  const mapCenter: [number, number] = [47.615, -122.33];

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
      <MapContainer center={mapCenter} zoom={13} zoomControl={false} className="w-full h-full z-0" style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' maxZoom={20} />
        <ZoomControl position="bottomright" />
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

      {/* Selected venue popup card */}
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

      {/* Search bar & filters overlay */}
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
    </div>
  );
}