import { MapPin, Heart, Coffee, BookOpen, Search } from 'lucide-react';
import { useMap } from '../context/MapContext';
import { useAuth } from '../context/AuthContext';

export function NearbyList() {
  const {
    filteredVenues,
    selectedVenue,
    setSelectedVenue,
    setFlyTo,
    favorites,
    toggleFavorite,
    isLoading,
    error,
    hasSearched,
    showOnlyFavorites,
  } = useMap();
  const { user } = useAuth();

  return (
    <div className="h-full w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-violet-50/50 to-blue-50/50 dark:from-violet-900/20 dark:to-blue-900/20">
        <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 tracking-tight text-sm">
          <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          Nearby Third Places
          <span className="text-xs font-normal text-slate-500">
            {isLoading ? 'Scanning...' : error ? '⚠️ Error' : (hasSearched || showOnlyFavorites) ? `(${filteredVenues.length})` : ''}
          </span>
        </h3>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Not yet searched — show waiting state */}
        {!hasSearched && !showOnlyFavorites && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6 py-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 flex items-center justify-center">
              <Search className="h-5 w-5 text-violet-500 dark:text-violet-400" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Complete the chat to scout nearby third places
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-xs text-red-500 p-2">{error}</p>}

        {/* Results */}
        {(hasSearched || showOnlyFavorites) && !isLoading && (
          <div className="space-y-1.5">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => { setSelectedVenue(venue); setFlyTo([...venue.coords] as [number, number]); }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  selectedVenue?.id === venue.id
                    ? 'bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 border-violet-300 dark:border-violet-700 shadow-sm'
                    : 'bg-white/60 dark:bg-slate-700/60 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 flex items-center justify-center flex-shrink-0">
                    {/library/i.test(venue.reason)
                      ? <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      : <Coffee className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{venue.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 capitalize">{venue.reason.toLowerCase()}</span>
                      {venue.rating !== 'N/A' && (
                        <>
                          <span className="text-slate-400 text-[10px]">•</span>
                          <span className="text-[10px] text-yellow-600">⭐ {venue.rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id, user?.id, user?.is_guest); }}
                    className="flex-shrink-0 p-1"
                  >
                    <Heart className={`h-3.5 w-3.5 ${favorites.has(venue.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
