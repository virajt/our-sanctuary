import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Music, Sparkles, SkipForward, Flame, Headphones, Link2, Info, Compass } from "lucide-react";
import { motion } from "motion/react";

interface AudioTrack {
  id: string;
  title: string;
  subtitle: string;
  vibe: string;
  frequency: number; // base frequency for synth
  tempo: number;     // pulsing speed
}

interface CuratedPlaylist {
  id: string;
  name: string;
  activity: string;
  timeOfDay: string;
  description: string;
  sampleUrl: string;
  tracks: { title: string; artist: string }[];
}

const SECTIONS_TRACKS: AudioTrack[] = [
  { id: "velvet", title: "Deep Velvet Swell", subtitle: "Low sensual minor drones & warm filter sweeps", vibe: "Passionate", frequency: 110, tempo: 0.15 },
  { id: "candle", title: "Golden Candlelight", subtitle: "High sparkling crystalline pulses & ocean currents", vibe: "Teasing", frequency: 220, tempo: 0.08 },
  { id: "breath", title: "Intimate Heartbeat", subtitle: "Low frequency heartbeat thumps & rhythmic deep breath", vibe: "Intense", frequency: 60, tempo: 0.3 }
];

const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  {
    id: "sunrise",
    name: "Morning Whispers",
    activity: "Gentle Awakening, Soft Stretching & Touch",
    timeOfDay: "Morning hours (06:00 - 10:00)",
    description: "Incredibly delicate acoustic resonance and slow ambient pads that expand as the morning sun filters through.",
    sampleUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    tracks: [
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Nuvole Bianche", artist: "Ludovico Einaudi" },
      { title: "An Ending (Ascent)", artist: "Brian Eno" }
    ]
  },
  {
    id: "glow",
    name: "Afternoon Oil Massage",
    activity: "Massage, Tactile Pampering & Calming Intimacy",
    timeOfDay: "Afternoon hours (12:00 - 17:00)",
    description: "Warm soulful down-beat jazz rhythms, golden acoustic drops, and slow lo-fi pulses to synchronize breathing and deep relaxation.",
    sampleUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    tracks: [
      { title: "Apocalypse", artist: "Cigarettes After Sex" },
      { title: "Teardrop", artist: "Massive Attack" },
      { title: "Cherry Blossom Girl", artist: "Air" }
    ]
  },
  {
    id: "midnight",
    name: "Midnight Chambers",
    activity: "Wicked Chamber, Boundless Touch & Passion",
    timeOfDay: "Late Night hours (22:00 - 04:00)",
    description: "Heavy moody basslines, seductive reverbed whispers, and underground trip-hop ideal for sensory blindfolds and candlelight games.",
    sampleUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    tracks: [
      { title: "Glory Box", artist: "Portishead" },
      { title: "Talk Is Cheap", artist: "Chet Faker" },
      { title: "Intro", artist: "The xx" }
    ]
  }
];

export default function MusicPlayer() {
  const [playerMode, setPlayerMode] = useState<"synth" | "curated" | "spotify">("synth");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Curated playlist states
  const [activeCuratedId, setActiveCuratedId] = useState<string>("sunrise");
  const [isCuratedPlaying, setIsCuratedPlaying] = useState(false);
  const curatedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Spotify setup
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DX4t8667S6K7e"); // Default: Silk Sheets playlist

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterVolumeRef = useRef<GainNode | null>(null);
  
  // Synthesizer Oscillators and LFOs
  const oscsRef = useRef<OscillatorNode[]>([]);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  const currentTrack = SECTIONS_TRACKS[currentTrackIndex];

  // Initialize Web Audio
  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.connect(ctx.destination);
    masterVolumeRef.current = gain;
  };

  const stopSynth = () => {
    oscsRef.current.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    oscsRef.current = [];
    filtersRef.current = [];
    if ((window as any).heartbeatTimer) {
      try { clearInterval((window as any).heartbeatTimer); } catch(e) {}
    }
  };

  const startSynth = () => {
    if (!audioCtxRef.current || !masterVolumeRef.current) return;
    stopSynth();

    const ctx = audioCtxRef.current;
    const gainNode = masterVolumeRef.current;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const { frequency, id } = currentTrack;

    if (id === "velvet") {
      const freqs = [frequency, frequency * 1.5, frequency * 0.75];
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 4;
      filter.connect(gainNode);
      filtersRef.current.push(filter);

      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscsRef.current.push(osc);
      });

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(400, ctx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      oscsRef.current.push(lfo);

      filter.frequency.setValueAtTime(600, ctx.currentTime);

    } else if (id === "candle") {
      const freqs = [frequency, frequency * 2, frequency * 3, frequency * 4];
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.connect(gainNode);
      filtersRef.current.push(filter);

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(idx === 0 ? 0.15 : 0.04, ctx.currentTime);

        const pulseLfo = ctx.createOscillator();
        pulseLfo.type = "sine";
        pulseLfo.frequency.setValueAtTime(0.05 + idx * 0.03, ctx.currentTime);
        const pulseGain = ctx.createGain();
        pulseGain.gain.setValueAtTime(0.03, ctx.currentTime);

        pulseLfo.connect(pulseGain);
        pulseGain.connect(oscGain.gain);

        osc.connect(oscGain);
        oscGain.connect(filter);
        
        osc.start();
        pulseLfo.start();
        oscsRef.current.push(osc, pulseLfo);
      });

    } else if (id === "breath") {
      const pulseFunc = () => {
        if (!audioCtxRef.current || isPlaying === false || currentTrackIndex !== 2) return;
        const now = audioCtxRef.current.currentTime;
        
        const boomp = audioCtxRef.current.createOscillator();
        boomp.type = "sine";
        boomp.frequency.setValueAtTime(55, now);
        boomp.frequency.exponentialRampToValueAtTime(0.01, now + 0.4);

        const boompGain = ctx.createGain();
        boompGain.gain.setValueAtTime(0.8, now);
        boompGain.gain.linearRampToValueAtTime(0.001, now + 0.35);

        boomp.connect(boompGain);
        boompGain.connect(gainNode);
        boomp.start();

        const secondNow = now + 0.18;
        const boomp2 = audioCtxRef.current.createOscillator();
        boomp2.type = "sine";
        boomp2.frequency.setValueAtTime(50, secondNow);
        boomp2.frequency.exponentialRampToValueAtTime(0.01, secondNow + 0.4);

        const boomp2Gain = ctx.createGain();
        boomp2Gain.gain.setValueAtTime(0.6, secondNow);
        boomp2Gain.gain.linearRampToValueAtTime(0.001, secondNow + 0.35);

        boomp2.connect(boomp2Gain);
        boomp2Gain.connect(gainNode);
        boomp2.start();
      };

      const beatInterval = setInterval(pulseFunc, 1400);
      (window as any).heartbeatTimer = beatInterval;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(100, ctx.currentTime);
      noiseFilter.connect(gainNode);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.005, ctx.currentTime);

      noise.connect(noiseGain);
      noiseGain.connect(noiseFilter);
      noise.start();
      oscsRef.current.push(noise);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(220, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(noiseFilter.frequency);
      lfo.start();
      oscsRef.current.push(lfo);
    }
  };

  // Sync volume state across both nodes
  useEffect(() => {
    if (masterVolumeRef.current && audioCtxRef.current) {
      masterVolumeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
    if (curatedAudioRef.current) {
      curatedAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle Playback toggling for Synth
  const handleTogglePlay = () => {
    initAudio();
    if (isPlaying) {
      stopSynth();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  // Restart synth whenever currentTrackIndex changes while playing
  useEffect(() => {
    if (isPlaying && playerMode === "synth") {
      startSynth();
    }
  }, [currentTrackIndex, isPlaying, playerMode]);

  // Handle Curated audio playing
  const handleToggleCurated = (playlist: CuratedPlaylist) => {
    // If different track is clicked or not created yet
    if (!curatedAudioRef.current) {
      curatedAudioRef.current = new Audio(playlist.sampleUrl);
      curatedAudioRef.current.loop = true;
    }

    if (activeCuratedId !== playlist.id) {
      curatedAudioRef.current.pause();
      curatedAudioRef.current = new Audio(playlist.sampleUrl);
      curatedAudioRef.current.loop = true;
      curatedAudioRef.current.volume = volume;
      setActiveCuratedId(playlist.id);
      
      // Stop another sound trigger
      stopSynth();
      setIsPlaying(false);

      curatedAudioRef.current.play()
        .then(() => setIsCuratedPlaying(true))
        .catch(err => console.log("Stream play blocked:", err));
    } else {
      if (isCuratedPlaying) {
        curatedAudioRef.current.pause();
        setIsCuratedPlaying(false);
      } else {
        stopSynth();
        setIsPlaying(false);
        curatedAudioRef.current.volume = volume;
        curatedAudioRef.current.play()
          .then(() => setIsCuratedPlaying(true))
          .catch(err => console.log("Stream play blocked:", err));
      }
    }
  };

  // Cleanup on unmount or mode switch
  useEffect(() => {
    if (playerMode !== "synth") {
      stopSynth();
      setIsPlaying(false);
    }
    if (playerMode !== "curated") {
      if (curatedAudioRef.current) {
        curatedAudioRef.current.pause();
        setIsCuratedPlaying(false);
      }
    }
  }, [playerMode]);

  useEffect(() => {
    return () => {
      stopSynth();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (curatedAudioRef.current) {
        curatedAudioRef.current.pause();
      }
    };
  }, []);

  // Spotify Parser
  const handleSpotifyConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyUrl.trim()) return;

    try {
      let embedUrlComp = "https://open.spotify.com/embed/playlist/37i9dQZF1DX4t8667S6K7e";
      
      // Parse track
      const matchTrack = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
      if (matchTrack && matchTrack[1]) {
        embedUrlComp = `https://open.spotify.com/embed/track/${matchTrack[1].split('?')[0]}`;
      } else {
        // Parse playlist
        const matchPlaylist = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (matchPlaylist && matchPlaylist[1]) {
          embedUrlComp = `https://open.spotify.com/embed/playlist/${matchPlaylist[1].split('?')[0]}`;
        } else {
          // Fallback direct
          embedUrlComp = spotifyUrl;
        }
      }
      setSpotifyEmbedUrl(embedUrlComp);
      setSpotifyUrl("");
    } catch(err) {
      console.error("Invalid Spotify URL: ", err);
    }
  };

  // Visualizer Animation for Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let progress = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const isSounding = isPlaying || isCuratedPlaying;
      progress += isSounding ? 0.15 : 0.01;

      ctx.beginPath();
      ctx.lineWidth = 2.5;

      // Draw custom beautiful crimson-gold fluid wave
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(225, 29, 72, 0.35)"); 
      gradient.addColorStop(0.5, "rgba(159, 18, 57, 0.85)"); 
      gradient.addColorStop(1, "rgba(244, 63, 94, 0.35)"); 
      
      ctx.strokeStyle = gradient;

      for (let x = 0; x < width; x++) {
        const waveScale = isSounding ? 1.0 : 0.15;
        const amp = 14 * waveScale * Math.sin(progress * 0.5 + x * 0.012);
        const y = height / 2 + amp * Math.sin(progress * 1.5 + x * 0.01) + (isSounding ? (Math.sin(progress * 3) * 3) : 0);
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, isCuratedPlaying]);

  return (
    <div id="integrated-music-player" className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Top Controller Segment Header - Tab selection */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Headphones className="w-6 h-6 text-rose-500" />
          <div>
            <h3 className="font-serif text-lg font-medium text-white tracking-wide">Our Intimate Audio Deck</h3>
            <p className="text-[11px] text-neutral-400">Pulsing sound waves designed to synchronize your breath and environment.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setPlayerMode("synth")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              playerMode === "synth"
                ? "bg-rose-950/60 text-rose-300 border border-rose-800/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Sensory Synth
          </button>
          <button
            onClick={() => setPlayerMode("curated")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              playerMode === "curated"
                ? "bg-rose-950/60 text-rose-300 border border-rose-800/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Curated Playlists
          </button>
          <button
            onClick={() => setPlayerMode("spotify")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              playerMode === "spotify"
                ? "bg-rose-950/60 text-rose-300 border border-rose-800/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Spotify Connect
          </button>
        </div>
      </div>

      {/* RENDER MODE: 1. SYNTH */}
      {playerMode === "synth" && (
        <div className="flex flex-col md:flex-row items-center gap-6 relative">
          {/* Album artwork */}
          <div className="relative group w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-950 via-rose-900 to-rose-850 flex items-center justify-center border border-rose-800/50 shadow-md flex-shrink-0">
            {isPlaying ? (
              <Flame className="w-8 h-8 text-rose-400 animate-pulse glow-red animate-spin-slow" />
            ) : (
              <Music className="w-8 h-8 text-white/40" />
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <span className="font-serif text-lg font-medium text-white/90 tracking-wide truncate">
                {currentTrack.title}
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-mono tracking-widest text-rose-400 bg-rose-950/40 rounded-full uppercase border border-rose-800/30">
                {currentTrack.vibe} Vibe
              </span>
            </div>
            <p className="text-xs text-white/50 truncate">{currentTrack.subtitle}</p>
          </div>

          {/* Interactive visualizer */}
          <div className="w-full md:w-36 h-12 flex-shrink-0 bg-black/40 rounded-xl px-2 border border-white/5 overflow-hidden">
            <canvas ref={canvasRef} width={180} height={48} className="w-full h-full block" />
          </div>

          {/* Deck Controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setCurrentTrackIndex((prev) => (prev + 1) % SECTIONS_TRACKS.length)}
              title="Next Synth Vibe"
              className="p-2.5 rounded-full text-white/40 hover:text-rose-400 hover:bg-white/5 transition border border-transparent hover:border-white/5 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`p-4 rounded-full transition-all duration-300 transform active:scale-95 shadow-xl flex items-center justify-center border cursor-pointer ${
                isPlaying 
                  ? "bg-rose-950/80 text-white/90 border-rose-800/40 hover:bg-rose-900/30 glow-red" 
                  : "bg-rose-900/60 text-white hover:bg-rose-800 border-rose-700/50 glow-red"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <div className="flex items-center gap-2.5 bg-black/30 px-3 py-2 rounded-2xl border border-white/5">
              <Volume2 className="w-4 h-4 text-white/40" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 accent-rose-600 bg-white/10 cursor-pointer h-1 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: 2. CURATED PLAYLISTS */}
      {playerMode === "curated" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CURATED_PLAYLISTS.map((pl) => {
              const isActive = activeCuratedId === pl.id;
              return (
                <div
                  key={pl.id}
                  className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                    isActive
                      ? "bg-rose-950/20 border-rose-500/30 shadow-lg"
                      : "bg-luxury-950/50 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase">{pl.timeOfDay}</span>
                      <Compass className={`w-4 h-4 ${isActive ? "text-rose-400" : "text-neutral-600"}`} />
                    </div>
                    <h4 className="font-serif text-base font-semibold text-neutral-100">{pl.name}</h4>
                    <p className="text-[10px] text-rose-400 font-medium font-mono">{pl.activity}</p>
                    <p className="text-xs text-neutral-400 leading-relaxed font-light">{pl.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    {/* Track tags list */}
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Included tracks</p>
                      <p className="text-[10px] text-neutral-300 truncate max-w-[130px] font-mono">
                        {pl.tracks.map(t => t.title).join(", ")}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleCurated(pl)}
                      className={`p-2.5 rounded-full transition active:scale-95 cursor-pointer ${
                        isActive && isCuratedPlaying
                          ? "bg-rose-950 border border-rose-500/40 text-rose-300"
                          : "bg-rose-900/40 border border-rose-700/30 text-rose-100 hover:bg-rose-800"
                      }`}
                      title={isActive && isCuratedPlaying ? "Pause Soundscape" : "Play Curated Vibe Sample"}
                    >
                      {isActive && isCuratedPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Volume sync slider */}
          <div className="flex items-center justify-between bg-black/25 px-4 py-3 rounded-2xl border border-white/5">
            <p className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-rose-400/80" />
              Listen to the sample soundscape or connect your full audio library. Change master volume:
            </p>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-white/40" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 accent-rose-600 bg-white/10 cursor-pointer h-1 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE: 3. SPOTIFY CONNECT */}
      {playerMode === "spotify" && (
        <div className="space-y-4 text-left">
          
          {/* Paste URL Input bar */}
          <form onSubmit={handleSpotifyConnect} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-rose-500" />
              <input
                type="text"
                placeholder="Insert Spotify Playlist or Track URL (e.g., https://open.spotify.com/playlist/...)"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                className="w-full bg-transparent text-xs text-white border-none outline-none placeholder-neutral-500"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 h-full bg-rose-900/60 hover:bg-rose-800 border border-rose-700/50 text-xs font-bold text-white rounded-2xl cursor-pointer transition whitespace-nowrap active:scale-95"
            >
              Sync Custom Playlist
            </button>
          </form>

          {/* Description message */}
          <div className="p-3 bg-rose-950/15 border border-rose-900/20 rounded-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              We pre-seeded dynamic Spotify embeds below. To completely personalize your vibe, enter your custom Spotify playlist URL. You may log into Spotfy within the player directly to listen to complete tracks.
            </p>
          </div>

          {/* Real Spotify Web Player Iframe Embed */}
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/60">
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height="280"
              frameBorder="0"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Curated Embed Playlist Player"
            />
          </div>
        </div>
      )}

    </div>
  );
}
