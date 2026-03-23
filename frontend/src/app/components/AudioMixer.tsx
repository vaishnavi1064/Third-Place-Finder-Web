import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Label } from './ui/label';

interface AudioTrack {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  color: string;
  file: string;
}

const TRACKS: AudioTrack[] = [
  { id: 'lofi',    name: 'Lo-Fi',   volume: 50, muted: false, color: 'from-violet-500 to-blue-500',  file: '/sounds/music.mp3' },
  { id: 'rain',    name: 'Rain',    volume: 40, muted: false, color: 'from-violet-500 to-blue-500',  file: '/sounds/rain.mp3' },
  { id: 'chatter', name: 'Chatter', volume: 20, muted: false, color: 'from-violet-500 to-blue-500',  file: '/sounds/chatter.mp3' },
  { id: 'fire',    name: 'Fire',    volume: 30, muted: false, color: 'from-violet-500 to-blue-500',  file: '/sounds/fire.mp3' },
];

export function AudioMixer() {
  const [tracks, setTracks] = useState<AudioTrack[]>(TRACKS);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    TRACKS.forEach(track => {
      const audio = new Audio(track.file);
      audio.loop = true;
      audio.volume = track.volume / 100;
      audio.addEventListener('canplaythrough', () => console.log(`Audio loaded: ${track.name}`));
      audio.addEventListener('error', (e) => console.error(`Audio error [${track.name}]:`, e));
      audioRefs.current[track.id] = audio;
    });
    return () => {
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = ''; });
    };
  }, []);

  useEffect(() => {
    tracks.forEach(track => {
      const audio = audioRefs.current[track.id];
      if (!audio) return;
      if (isPlaying && !track.muted && track.volume > 0) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });
  }, [isPlaying]);

  const handleVolumeChange = (id: string, value: number) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: value } : t));
    const audio = audioRefs.current[id];
    if (!audio) return;
    audio.volume = value / 100;
    if (isPlaying && value > 0 && !tracks.find(t => t.id === id)?.muted) {
      audio.play().catch(() => {});
    } else if (value === 0) {
      audio.pause();
    }
  };

  const toggleMute = (id: string) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, muted: !t.muted } : t));
    const audio = audioRefs.current[id];
    const track = tracks.find(t => t.id === id);
    if (!audio || !track) return;
    if (!track.muted) {
      audio.pause();
    } else if (isPlaying && track.volume > 0) {
      audio.play().catch(() => {});
    }
  };

  const togglePlayback = () => setIsPlaying(p => !p);

  return (
    <div className="relative border-b border-slate-200/50 dark:border-slate-700/50 p-5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100/40 via-blue-100/30 to-slate-100/40 dark:from-violet-900/20 dark:via-blue-900/10 dark:to-slate-900/20 backdrop-blur-xl" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />

      <div className="relative z-10">
        <div className="flex justify-center mb-4" style={{ perspective: '800px' }}>
          <div className="relative w-32 h-32 cursor-pointer" onClick={togglePlayback} style={{ transformStyle: 'preserve-3d', transform: 'rotateX(10deg)' }}>
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-black via-gray-900 to-black ${isPlaying ? 'animate-spin-vinyl' : ''}`} style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.4), inset 0 0 30px rgba(0,0,0,0.8)' }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute rounded-full border-gray-700/30" style={{ top: `${8 + i * 3.5}%`, left: `${8 + i * 3.5}%`, right: `${8 + i * 3.5}%`, bottom: `${8 + i * 3.5}%`, borderWidth: '0.5px' }} />
              ))}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 shadow-xl flex items-center justify-center border-2 border-black/30">
                <Music className="h-5 w-5 text-white drop-shadow-lg" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-black" />
              </div>
              <div className="absolute inset-0 rounded-full opacity-30 pointer-events-none" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 52%, transparent 100%)' }} />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 origin-right" style={{ transform: 'translateY(-50%) rotate(-20deg)' }}>
              <div className="flex items-center">
                <div className="w-14 h-1 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full shadow-md" />
                <div className="w-2 h-2 bg-gray-400 rounded-full -ml-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/60 dark:border-gray-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Ambient Sounds</h3>
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          </div>

          <div className="space-y-3">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3">
                <button onClick={() => toggleMute(track.id)} className="p-1.5 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition-all">
                  {track.muted ? <VolumeX className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" /> : <Volume2 className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />}
                </button>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-14">{track.name}</Label>
                <div className="flex-1 relative h-8 group">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-full shadow-inner" />
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r ${track.color} rounded-full transition-all duration-300`} style={{ width: `${track.muted ? 0 : track.volume}%`, boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)' }} />
                  <input type="range" min="0" max="100" value={track.muted ? 0 : track.volume} onChange={(e) => handleVolumeChange(track.id, parseInt(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-lg transition-all duration-300 pointer-events-none group-hover:scale-125 border border-purple-400" style={{ left: `calc(${track.muted ? 0 : track.volume}% - 8px)` }}>
                    <div className={`absolute inset-0.5 rounded-full bg-gradient-to-br ${track.color}`} />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 w-7 text-right tabular-nums">{track.muted ? 0 : track.volume}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin-vinyl { from { transform: rotateX(10deg) rotate(0deg); } to { transform: rotateX(10deg) rotate(360deg); } } .animate-spin-vinyl { animation: spin-vinyl 2s linear infinite; }`}</style>
    </div>
  );
}