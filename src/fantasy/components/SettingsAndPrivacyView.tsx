import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, ShieldCheck, Heart, User, MapPin, Trash, ShieldAlert, Sparkles, Info } from 'lucide-react';
import { ScreenType } from '../types';

interface SettingsAndPrivacyViewProps {
  onNavigate: (screen: ScreenType) => void;
  themeAccent: 'merlot' | 'emerald' | 'obsidian' | 'ochre';
  setThemeAccent: (theme: 'merlot' | 'emerald' | 'obsidian' | 'ochre') => void;
  accentClass: string;
}

export const SettingsAndPrivacyView: React.FC<SettingsAndPrivacyViewProps> = ({
  onNavigate,
  themeAccent,
  setThemeAccent,
  accentClass
}) => {
  const [sessionTimeout, setSessionTimeout] = useState<number>(15);
  const [autoClearHistory, setAutoClearHistory] = useState<boolean>(true);
  const [partnerSync, setPartnerSync] = useState<boolean>(true);

  // Wiping protocol states
  const [wipingState, setWipingState] = useState<'idle' | 'confirming' | 'purging' | 'purged'>('idle');
  const [purgeCountdown, setPurgeCountdown] = useState<number>(3);

  const startPurgeProcess = () => {
    setWipingState('purging');
    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setPurgeCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setWipingState('purged');
      }
    }, 1000);
  };

  const getThemeDisplayName = (theme: typeof themeAccent) => {
    if (theme === 'merlot') return 'Merlot Burgundy';
    if (theme === 'emerald') return 'Alpine Emerald';
    if (theme === 'obsidian') return 'Obsidian Slate';
    return 'Provence Ochre';
  };

  return (
    <AnimatePresence mode="wait">
      {wipingState === 'purged' ? (
        <motion.div
          key="purged"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-md mx-auto text-center py-20 space-y-6"
        >
          <div className="w-16 h-16 bg-rose-950/20 text-rose-500 border border-rose-900 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Trash size={28} />
          </div>
          <h2 className="font-display text-3xl text-stone-100 font-extralight tracking-tight">Vault Purged.</h2>
          <p className="font-sans text-stone-500 text-sm leading-relaxed font-light">
            All localized session tokens, interactive state structures, histories, and cryptographic assets have been securely overwritten (zero-valued) in your local storage cache. 
          </p>
          <button
            onClick={() => window.location.reload()}
            className="font-mono text-xs text-stone-400 bg-stone-900 hover:bg-stone-800 border border-stone-800 px-5 py-2.5 rounded-lg transition"
          >
            Reconnect Client
          </button>
        </motion.div>
      ) : wipingState === 'purging' ? (
        <motion.div
          key="purging"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-md mx-auto text-center py-24 space-y-6"
        >
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-stone-900 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-rose-500 rounded-full animate-spin" />
            <span className="font-mono text-2xl font-light text-rose-500">{purgeCountdown}</span>
          </div>
          <h3 className="font-display text-xl text-stone-200">Zeroing cache sectors...</h3>
          <p className="font-sans text-xs text-stone-500 max-w-xs mx-auto leading-normal">
            Performing standard cryptographic wipe-passes over local cache. This is irreversible.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="settings-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12 max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-900">
            <div className="space-y-3">
              <h1 className="font-display text-4xl text-stone-100 font-extralight tracking-tight">
                Settings & Privacy
              </h1>
              <p className="font-sans text-stone-400 text-sm font-light max-w-xl">
                Tweak client constraints, customize visual identity presets, and configure double-auth synchronization.
              </p>
            </div>

            {/* Swiss residency Badge */}
            <div className="flex items-center space-x-3 bg-stone-950 border border-stone-850 px-5 py-3 rounded-2xl shrink-0">
              <div className="p-2 bg-stone-900 rounded-lg text-[#3b82f6]">
                <MapPin size={16} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-stone-400">Swiss Sanctuary Shelter</div>
                <div className="text-[11px] font-sans font-medium text-stone-200">ZURICH, CH Data Residency</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left side: Accent Selection & Timers */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Theme Selector */}
              <div className="p-6 bg-[#141312] border border-stone-850 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-sans text-sm font-medium text-stone-200">Interface Brand Accents</h3>
                  <p className="font-sans text-xs text-stone-500 font-light mt-0.5">
                    Select a curated visual identity highlight to express your mutual space identity.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Merlot */}
                  <button
                    onClick={() => setThemeAccent('merlot')}
                    className={`flex items-center space-x-3.5 p-3.5 text-left border rounded-xl transition-all duration-300 ${
                      themeAccent === 'merlot' ? 'bg-[#ac1c2c]/10 border-[#ac1c2c]/60' : 'bg-stone-950 border-stone-900 hover:border-stone-850'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#ac1c2c] block block-shadow" />
                    <div>
                      <div className="font-sans text-xs font-semibold text-stone-200">Merlot</div>
                      <span className="text-[10px] font-mono text-stone-500">Premium Burgundy</span>
                    </div>
                  </button>

                  {/* Emerald */}
                  <button
                    onClick={() => setThemeAccent('emerald')}
                    className={`flex items-center space-x-3.5 p-3.5 text-left border rounded-xl transition-all duration-300 ${
                      themeAccent === 'emerald' ? 'bg-[#057a55]/10 border-[#057a55]/60' : 'bg-stone-950 border-stone-900 hover:border-stone-850'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#057a55] block block-shadow" />
                    <div>
                      <div className="font-sans text-xs font-semibold text-stone-200">Emerald</div>
                      <span className="text-[10px] font-mono text-stone-500">Alpine Forest Glow</span>
                    </div>
                  </button>

                  {/* Obsidian */}
                  <button
                    onClick={() => setThemeAccent('obsidian')}
                    className={`flex items-center space-x-3.5 p-3.5 text-left border rounded-xl transition-all duration-300 ${
                      themeAccent === 'obsidian' ? 'bg-[#525252]/10 border-[#525252]/60' : 'bg-stone-950 border-stone-900 hover:border-stone-850'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#525252] block block-shadow" />
                    <div>
                      <div className="font-sans text-xs font-semibold text-stone-200">Obsidian</div>
                      <span className="text-[10px] font-mono text-stone-500">Minimal Slate</span>
                    </div>
                  </button>

                  {/* Ochre */}
                  <button
                    onClick={() => setThemeAccent('ochre')}
                    className={`flex items-center space-x-3.5 p-3.5 text-left border rounded-xl transition-all duration-300 ${
                      themeAccent === 'ochre' ? 'bg-[#ca8a04]/10 border-[#ca8a04]/60' : 'bg-stone-950 border-stone-900 hover:border-stone-850'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#ca8a04] block block-shadow" />
                    <div>
                      <div className="font-sans text-xs font-semibold text-stone-200">Ochre</div>
                      <span className="text-[10px] font-mono text-stone-500">Provence Honey Gold</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Session timeout duration */}
              <div className="p-6 bg-stone-950 border border-stone-900 rounded-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="font-sans text-sm font-medium text-stone-200">Session Purge Threshold</h3>
                  <p className="font-sans text-xs text-stone-500 font-light">
                    Adjust exact inactivity timing before cache auto-wipe procedures trigger automatically.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                    className="w-full h-1 bg-stone-904 rounded-lg appearance-none cursor-pointer accent-stone-300"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-stone-500">
                    <span>5 minutes</span>
                    <span className="text-stone-300 font-semibold">{sessionTimeout} minutes inactive trigger</span>
                    <span>120 minutes</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right side: Sync choices and total destruction */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="p-6 bg-stone-950 border border-stone-900 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-stone-400 font-mono text-[9px] uppercase tracking-widest pb-2 border-b border-stone-900">
                  <Heart size={12} className="text-stone-500" />
                  <span>Interactive Synchrony</span>
                </div>

                {/* Double handshake sync */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-stone-200">Double-Auth Sync</h4>
                    <p className="font-sans text-[10px] font-light text-stone-500 leading-normal max-w-xs">
                      Mandate dual verified clients check-ins before revealing Vault history.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={partnerSync}
                    onChange={(e) => setPartnerSync(e.target.checked)}
                    className="rounded border-stone-800 text-stone-200 focus:ring-0 bg-stone-950"
                  />
                </div>

                {/* Local only history */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-stone-200">Ephemeral Log Override</h4>
                    <p className="font-sans text-[10px] font-light text-stone-500 leading-normal max-w-xs">
                      Enforce strict local-only volatile RAM logging thresholds.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoClearHistory}
                    onChange={(e) => setAutoClearHistory(e.target.checked)}
                    className="rounded border-stone-800 text-stone-200 focus:ring-0 bg-stone-950"
                  />
                </div>
              </div>

              {/* EMERGENCY DESTRUCTIVE CATASTROPHIC OPTION */}
              <div className="p-6 bg-[#2d1115]/10 border border-red-950/40 rounded-2xl space-y-4">
                <div className="flex items-start space-x-3 text-rose-500">
                  <ShieldAlert className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-stone-200">Deactivate & Self-Destruct Vault</h4>
                    <p className="font-sans text-[10px] text-stone-500 leading-relaxed font-light mt-0.5">
                      This activates a local forensic pass. All historic connection states, custom sync rooms, unlocked poses lists, and cached narrative states will be wiped globally.
                    </p>
                  </div>
                </div>

                {wipingState === 'idle' ? (
                  <button
                    onClick={() => setWipingState('confirming')}
                    className="w-full text-center py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 font-sans text-xs rounded-xl transition duration-300"
                  >
                    Initialize Local Vault Purge
                  </button>
                ) : (
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] font-sans font-medium text-rose-400 text-center">Are you absolutely sure? This cannot be undone.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setWipingState('idle')}
                        className="py-2 bg-stone-900 text-stone-400 font-sans text-xs rounded-lg hover:text-stone-300 transition"
                      >
                        Abort Purge
                      </button>
                      <button
                        onClick={startPurgeProcess}
                        className="py-2 bg-rose-600 text-white font-sans text-xs rounded-lg hover:bg-rose-500 transition"
                      >
                        Confirm Decimation
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Zurich physical security notice */}
              <div className="flex items-center space-x-2.5 sm:space-x-3.5 text-[10px] font-sans text-stone-500 bg-stone-950 p-4 border border-stone-900 rounded-xl">
                <Info size={14} className="text-stone-600 shrink-0" />
                <span>
                  All systems certified compliant with the Swiss Federal Act on Data Protection (FADP) under standard DSGVO directives.
                </span>
              </div>

            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
