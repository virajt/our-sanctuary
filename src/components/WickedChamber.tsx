import React, { useState } from "react";
import { WickedChallenge } from "../types";
import { Flame, Sparkles, Wand2, ShieldAlert, Heart, Calendar, Copy, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TiltCard from "./effects/TiltCard";
import MagneticButton from "./effects/MagneticButton";

interface WickedChamberProps {
  challengesHistory: WickedChallenge[];
  onGenerate: (target: "Command Him" | "Command Her" | "Together", intensity?: string) => Promise<WickedChallenge>;
  isLoading: boolean;
}

export default function WickedChamber({ challengesHistory, onGenerate, isLoading }: WickedChamberProps) {
  const [target, setTarget] = useState<"Command Him" | "Command Her" | "Together">("Together");
  const [intensity, setIntensity] = useState<string>("Sensual");
  const [currentChallenge, setCurrentChallenge] = useState<WickedChallenge | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Rating feedback map local state (saved temporarily)
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const handleGenerateClick = async () => {
    setIsRolling(true);
    // Simulate majestic lock roll animation for high-tension sensual feed
    setTimeout(async () => {
      try {
        const result = await onGenerate(target, intensity);
        setCurrentChallenge(result);
      } catch (err) {
        console.error("Error generating challenge:", err);
      } finally {
        setIsRolling(false);
      }
    }, 1200);
  };

  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = () => {
    if (!currentChallenge) return;
    navigator.clipboard.writeText(`${currentChallenge.description}\n${currentChallenge.howTo}`)
      .then(() => {
        setCopied(true);
        setCopyFailed(false);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 2500);
      });
  };

  const handleRate = (id: string, stars: number) => {
    setRatings(prev => ({
      ...prev,
      [id]: stars
    }));
  };

  return (
    <div id="wicked-chamber-module" className="space-y-8">
      
      {/* Dynamic Module Header */}
      <div className="bg-luxury-900/60 p-6 rounded-3xl border border-luxury-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Flame className="w-8 h-8 text-red-500 animate-pulse fill-red-500/20" />
            Wicked Chamber
          </h2>
          <p className="text-sm text-neutral-400">
            Generate 1,000,000+ intense, sensual, and intimate instructions on-demand.
          </p>
        </div>

        {/* Informative info bubble */}
        <div className="flex items-center gap-2 px-3 py-2 bg-luxury-950/80 rounded-2xl border border-luxury-800 text-xs text-neutral-400 max-w-sm">
          <Info className="w-4 h-4 text-red-400 shrink-0" />
          <span>Combinations automatically utilize server-level raw semantic synthesis.</span>
        </div>
      </div>

      {/* Primary Generator Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Directives Input Settings (Col span 5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-luxury-900/80 to-luxury-950/60 border border-luxury-800 p-8 rounded-3xl flex flex-col justify-between space-y-8">
          
          <div className="space-y-6">
            <div className="border-b border-luxury-800/80 pb-4">
              <h3 className="font-serif text-lg font-medium text-white/90">Summoning Settings</h3>
              <p className="text-xs text-neutral-500">Configure parameters for target and friction level.</p>
            </div>

            {/* Target Select */}
            <div className="space-y-3">
              <label className="text-xs text-neutral-400 font-medium block uppercase tracking-wider">Command Target</label>
              <div className="grid grid-cols-3 gap-3">
                {(["Command Him", "Command Her", "Together"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTarget(t)}
                    className={`px-3 py-3 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                      target === t
                        ? "bg-red-500/10 border-red-500 text-red-300 shadow-md shadow-red-500/5 font-extrabold"
                        : "bg-luxury-950/40 border-luxury-800 text-neutral-400 hover:border-luxury-700 hover:text-white"
                    }`}
                  >
                    {t === "Command Him" ? "Him" : t === "Command Her" ? "Her" : "Mutual"}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Select */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Intensity Level</label>
                <span className="text-xs text-red-400 font-serif lowercase italic">{intensity}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 bg-luxury-950/80 p-1 rounded-2xl border border-luxury-800">
                {["Teasing", "Sensual", "Intense", "Wicked"].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIntensity(i)}
                    className={`py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer border ${
                      intensity === i
                        ? "bg-red-950/50 border-red-800/60 text-red-400 font-bold glow-red"
                        : "text-neutral-400 hover:text-neutral-200 border-transparent"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Spark Activation Button */}
          <MagneticButton
            onClick={handleGenerateClick}
            disabled={isLoading || isRolling}
            strength={0.25}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-900 via-red-800 to-red-900 hover:from-red-800 hover:to-red-800 text-white font-serif text-lg font-medium tracking-wide shadow-xl shadow-red-950/40 hover:shadow-red-900/10 transition-all disabled:opacity-40 flex items-center justify-center gap-3 cursor-pointer border border-red-700/40 glow-red"
          >
            {isRolling ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Rolling combinations...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-red-400 animate-pulse" />
                <span>Initialize Command</span>
              </>
            )}
          </MagneticButton>
        </div>

        {/* Right Column: Display of Generated Command (Col span 7) */}
        <TiltCard maxTilt={3} className="lg:col-span-7">
        <div className="bg-luxury-950/40 border border-luxury-800 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          
          {/* Decorative glow background */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4"
                key="rolling"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-spin">
                  <Flame className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-xl tracking-wider text-neutral-200">Reconfiguring Nerve Ends</p>
                  <p className="text-xs text-neutral-500 italic max-w-xs mx-auto">Mixing over 1 million physical elements from sensual protocols...</p>
                </div>
              </motion.div>
            ) : currentChallenge ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col justify-between space-y-8"
                key="result"
              >
                {/* Result header */}
                <div className="flex items-center justify-between border-b border-luxury-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-bold uppercase tracking-widest">
                      {currentChallenge.target}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-red-500/10 border border-red-805/20 text-red-400 font-mono uppercase tracking-widest">
                      {currentChallenge.intensity} Intensity
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shadow-sm">
                    {copyFailed && (
                      <span className="text-[10px] text-red-400 font-mono">Copy failed</span>
                    )}
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-xl bg-luxury-900 border border-luxury-800 text-neutral-400 hover:text-white transition active:scale-95 cursor-pointer"
                      title="Copy sensual directive"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Primary Sense Directive */}
                <div className="space-y-6">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 block">DIRECTIVE:</span>
                  <blockquote className="font-serif text-2xl lg:text-3xl text-neutral-100 leading-snug tracking-wide italic font-light">
                    "{currentChallenge.description}"
                  </blockquote>

                  {/* Supporting Guidance rules */}
                  <div className="bg-luxury-900/60 p-5 rounded-2xl border border-luxury-800 flex items-start gap-4">
                    <Sparkles className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase block">Tactile Guide</span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-light">{currentChallenge.howTo}</p>
                    </div>
                  </div>
                </div>

                {/* Feedback rating selection */}
                <div className="flex items-center justify-between pt-4 border-t border-luxury-800/80">
                  <span className="text-[10px] text-neutral-500 tracking-wider font-light">Did you enjoy this touch combination?</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((heart) => (
                      <button
                        key={heart}
                        onClick={() => handleRate(currentChallenge.id, heart)}
                        className="p-1 hover:scale-110 transition active:scale-95 cursor-pointer"
                      >
                        <Heart 
                          className={`w-5 h-5 ${
                            heart <= (ratings[currentChallenge.id] || 0)
                              ? "text-red-500 fill-red-500" 
                              : "text-neutral-600 hover:text-red-400"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"
                key="empty"
              >
                <div className="w-20 h-20 rounded-full border border-dashed border-luxury-800 flex items-center justify-center text-neutral-600">
                  <Wand2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-lg text-neutral-300">Summon an Activity</p>
                  <p className="text-xs text-neutral-500 max-w-xs font-light">Select claiming targets and initiate to receive physical, sensual commands of over 1m different random styles.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </TiltCard>
      </div>

      {/* History Log Panel */}
      {challengesHistory.length > 0 && (
        <div className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-6">
          <div className="border-b border-luxury-800/80 pb-4 mb-6">
            <h3 className="font-serif text-lg font-medium text-white/90">Chamber Whispering History</h3>
            <p className="text-xs text-neutral-500">Your collection of recently generated directives.</p>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
            {challengesHistory.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-luxury-950/40 p-4 rounded-2xl border border-luxury-800/60 flex items-center justify-between gap-4 text-xs hover:border-luxury-800 transition"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400">
                      {item.target}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400">
                      {item.intensity}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-neutral-200 font-serif text-sm tracking-wide leading-relaxed">
                    "{item.description}"
                  </p>
                </div>

                {/* Rating display on log */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((heart) => (
                    <Heart 
                      key={heart} 
                      className={`w-3.5 h-3.5 ${
                        heart <= (ratings[item.id] || 0)
                          ? "text-red-500 fill-red-500" 
                          : "text-neutral-800"
                      }`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
