import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, ArrowRight, Rss, Layers, CircleCheck, RefreshCw } from 'lucide-react';
import { ScreenType, ConversationPrompt } from '../types';
import { CONVERSATION_PROMPTS } from '../data';

interface ConversationHubViewProps {
  onNavigate: (screen: ScreenType) => void;
  accentClass: string;
}

export const ConversationHubView: React.FC<ConversationHubViewProps> = ({ onNavigate, accentClass }) => {
  const [activeCategory, setActiveCategory] = useState<'hopes' | 'boundaries' | 'fantasies' | 'gratitude'>('hopes');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [showSyncDetails, setShowSyncDetails] = useState<boolean>(false);

  // Filter prompts by category
  const filteredPrompts = CONVERSATION_PROMPTS.filter((p) => p.category === activeCategory);
  const activePrompt = filteredPrompts[currentIndex] || filteredPrompts[0];

  const handleNextPrompt = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredPrompts.length);
  };

  const handleShuffle = () => {
    // Elegant random pick that is different from current index
    if (filteredPrompts.length <= 1) return;
    let nextIndex = currentIndex;
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * filteredPrompts.length);
    }
    setCurrentIndex(nextIndex);
  };

  const handleCategoryChange = (cat: 'hopes' | 'boundaries' | 'fantasies' | 'gratitude') => {
    setActiveCategory(cat);
    setCurrentIndex(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-12 max-w-4xl mx-auto"
    >
      {/* Header and Sync info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <h1 className="font-display text-4xl text-stone-100 font-extralight tracking-tight">
            Conversation Hub
          </h1>
          <p className="font-sans text-stone-400 text-sm font-light max-w-xl leading-relaxed">
            Delve into carefully structured vulnerability prompts built in chronological depth loops, designed to uncover authentic desires and set durable boundaries.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSyncDetails(!showSyncDetails)}
            className="flex items-center space-x-2 bg-stone-950 border border-stone-850 py-2 px-4 rounded-full hover:border-stone-700 transition"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] text-stone-300 font-medium">Synced & Audited Status</span>
          </button>

          {showSyncDetails && (
            <div className="absolute right-0 top-12 w-64 bg-stone-900 border border-stone-850 p-4 rounded-xl shadow-2xl z-40 space-y-3">
              <h4 className="font-sans text-xs font-semibold text-stone-200">Device Handshake Active</h4>
              <p className="font-sans text-[11px] text-stone-500 leading-normal">
                Double-handshake socket verified between Julian (iOS) and Elena (macOS). Audio signals and prompt updates are replicated locally.
              </p>
              <div className="border-t border-stone-800 pt-2 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                <span className="flex items-center space-x-1">
                  <CircleCheck size={10} />
                  <span>Verified Secure</span>
                </span>
                <span>Room #4096</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories chips selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['hopes', 'boundaries', 'fantasies', 'gratitude'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`font-sans text-xs px-4 py-4 border rounded-xl transition-all duration-300 text-center uppercase tracking-wider ${
              activeCategory === cat
                ? 'bg-stone-50 text-stone-950 border-stone-50 font-semibold'
                : 'bg-stone-950 border-stone-900 text-stone-400 hover:text-stone-200 hover:border-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Active Slide Area */}
      <div className="relative min-h-[260px] flex items-center justify-center p-8 md:p-12 bg-[#141312] border border-stone-850 rounded-2xl overflow-hidden">
        {/* Subtle abstract background graphic */}
        <div className="absolute inset-0 bg-radial-gradient from-stone-900/10 to-stone-950 pointer-events-none" />

        <AnimatePresence mode="wait">
          {activePrompt && (
            <motion.div
              key={activePrompt.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-6 max-w-2xl relative z-10"
            >
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#3b82f6]">
                Category: {activeCategory}
              </span>
              <p className="font-display text-xl md:text-2xl text-stone-100 font-extralight leading-relaxed italic">
                "{activePrompt.question}"
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-stone-500 text-xs font-mono">
                <span>Prompt {currentIndex + 1} of {filteredPrompts.length}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleShuffle}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 font-mono text-xs text-stone-300 bg-stone-950 hover:bg-stone-900 border border-stone-850 px-6 py-3.5 rounded-xl transition-all"
        >
          <Shuffle size={14} />
          <span>Shuffle Card Pool</span>
        </button>

        <button
          onClick={handleNextPrompt}
          className={`w-full sm:w-auto flex items-center justify-center space-x-2 font-sans text-xs text-stone-950 hover:scale-105 font-medium px-8 py-3.5 rounded-xl transition-all ${accentClass}`}
        >
          <span>Next Prompt</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Instructions card */}
      <div className="p-6 bg-stone-950/40 border border-stone-900 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
        <div className="p-2 bg-stone-900 text-[#3b82f6] rounded-lg shrink-0">
          <Layers size={16} />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans text-stone-200 text-xs font-medium">Safe Space Guidelines</h4>
          <p className="font-sans text-stone-500 text-[11px] font-light leading-relaxed">
            There are no right answers in this sanctuary. If a prompt triggers resistance, select "Shuffle Card Pool" or take a 60-second breathing pause using the Somatic Sync tool in our Visual Library.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
