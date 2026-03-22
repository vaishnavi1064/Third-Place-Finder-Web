import { useState, useRef, useEffect } from 'react';

export default function AudioMixer() {
  const musicRef = useRef(null);
  const rainRef = useRef(null);
  const chatterRef = useRef(null);
  const fireRef = useRef(null);
  const streetRef = useRef(null);
  
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [musicVol, setMusicVol] = useState(0.5);

  const handleAudioSlider = (e, audioRef) => {
    const vol = parseFloat(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.volume = vol;
    if (vol > 0 && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else if (vol === 0 && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  };

  const toggleMusic = () => {
    if (!musicRef.current) return;
    if (isPlayingMusic) {
      musicRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      musicRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = musicVol;
  }, [musicVol]);

  return (
    <>
      <header className="bg-retro-bg p-3 border-b-4 border-retro-border text-center">
        <h2 className="text-sm font-title text-[#a2e4b8] mt-1 tracking-widest">MUSIC BLENDER</h2>
      </header>
      
      {/* Lo-Fi Music Player */}
      <div className="p-4 border-b-4 border-retro-border bg-[#11111b]">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-12 h-12 bg-retro-accent border-2 border-retro-border flex items-center justify-center ${isPlayingMusic ? 'animate-pulse' : ''}`}>
            <span className="text-2xl">📻</span>
          </div>
          <div>
            <p className="font-title text-[0.6rem] text-retro-window leading-tight mb-1">NOW PLAYING</p>
            <p className="text-xl text-retro-text leading-tight truncate w-32">Chill Lofi Mix</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button 
            onClick={toggleMusic}
            className={`border-2 border-retro-border px-3 py-1 text-retro-border font-bold hover:bg-white retro-active ${isPlayingMusic ? 'bg-[#a2e4b8]' : 'bg-retro-btn'}`}
          >
            {isPlayingMusic ? 'PAUSE' : 'PLAY'}
          </button>
          <input 
            type="range" 
            className="pixel-range flex-1" 
            min="0" max="1" step="0.05" 
            value={musicVol}
            onChange={(e) => setMusicVol(parseFloat(e.target.value))}
          />
        </div>
        <audio ref={musicRef} loop>
          <source src="https://stream.zeno.fm/f3wvbbqmdg8uv" type="audio/mpeg" />
        </audio>
      </div>

      {/* Ambient Sliders */}
      <div className="p-4 flex-1 flex flex-col gap-5 overflow-y-auto bg-retro-panel">
        
        <div className="ambient-control">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xl text-[#ffb6c1]">🌧️ Rain</span>
          </div>
          <input type="range" className="pixel-range w-full" min="0" max="1" step="0.05" defaultValue="0" onChange={(e) => handleAudioSlider(e, rainRef)} />
          <audio ref={rainRef} loop><source src="https://actions.google.com/sounds/v1/water/rain_on_roof.ogg" type="audio/ogg" /></audio>
        </div>

        <div className="ambient-control">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xl text-[#f9e2af]">☕ Cafe Chatter</span>
          </div>
          <input type="range" className="pixel-range w-full" min="0" max="1" step="0.05" defaultValue="0" onChange={(e) => handleAudioSlider(e, chatterRef)} />
          <audio ref={chatterRef} loop><source src="https://actions.google.com/sounds/v1/crowds/restaurant_chatter.ogg" type="audio/ogg" /></audio>
        </div>

        <div className="ambient-control">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xl text-[#a2e4b8]">🔥 Fireplace</span>
          </div>
          <input type="range" className="pixel-range w-full" min="0" max="1" step="0.05" defaultValue="0" onChange={(e) => handleAudioSlider(e, fireRef)} />
          <audio ref={fireRef} loop><source src="https://actions.google.com/sounds/v1/foley/fireplace_crackling.ogg" type="audio/ogg" /></audio>
        </div>
        
        <div className="ambient-control pb-8">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xl text-[#cbaacb]">🌃 Street Ambience</span>
          </div>
          <input type="range" className="pixel-range w-full" min="0" max="1" step="0.05" defaultValue="0" onChange={(e) => handleAudioSlider(e, streetRef)} />
          <audio ref={streetRef} loop><source src="https://actions.google.com/sounds/v1/traffic/city_traffic_and_people.ogg" type="audio/ogg" /></audio>
        </div>
      </div>
    </>
  );
}
