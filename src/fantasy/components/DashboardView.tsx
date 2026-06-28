import React from 'react';
import { motion } from 'motion/react';
import { Eye, BookOpen, Compass, ChevronRight, Lock, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { ScreenType } from '../types';

interface DashboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  accentClass: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, accentClass }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-12"
    >
      {/* Editorial Header */}
      <div className="max-w-4xl space-y-4">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-stone-100 font-extralight tracking-tight leading-tight">
          Welcome back.
        </h1>
        <p className="font-sans text-stone-400 text-lg max-w-2xl font-light leading-relaxed">
          Your sanctuary remains private, encrypted, and personal. Rediscover each other in the quiet spaces between.
        </p>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-stone-800/80">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-full text-stone-500">
            <Heart size={18} className="text-stone-400" />
          </div>
          <div>
            <div className="text-stone-500 text-xs font-mono tracking-wider uppercase">Consistent rhythm</div>
            <div className="text-stone-200 text-sm font-medium font-sans">3 nights since last session</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-full text-stone-500">
            <BookOpen size={18} className="text-stone-400" />
          </div>
          <div>
            <div className="text-stone-500 text-xs font-mono tracking-wider uppercase">Narrative history</div>
            <div className="text-stone-200 text-sm font-medium font-sans">12 Stories unlocked & aligned</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-full text-stone-500">
            <ShieldCheck size={18} className="text-stone-400" />
          </div>
          <div>
            <div className="text-stone-500 text-xs font-mono tracking-wider uppercase">Active Guard</div>
            <div className="text-stone-200 text-sm font-medium font-sans">E2EE Double-Handshake verified</div>
          </div>
        </div>
      </div>

      {/* New for You Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-stone-900">
          <h2 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">New for You</h2>
          <span className="text-xs font-mono text-stone-400 bg-stone-900/60 py-1 px-3.5 border border-stone-800/60 rounded-full">Recent Updates</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: The Golden Hour */}
          <div 
            onClick={() => onNavigate('visual-library')}
            className="group relative bg-[#141312] border border-stone-800/80 rounded-xl overflow-hidden hover:border-stone-700/80 transition-all duration-500 cursor-pointer flex flex-col md:flex-row h-full"
          >
            <div className="md:w-5/12 h-48 md:h-full relative overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgLi6E0MUXjv9arHzbDLyeDBAPAPCkGekdEFtV1mle6Wi7AGqtdmrSEhLTSOrvntnMzN0BBMHdHYUeReTgCBypKH-uKmBZVqRwvCOZ-XP_yIDj7H0-f_fST4RIu2anwYwOVC6MtUAkt0kDiMhfA9lnUuzWmQm1xD5YiHMgA7asJx-08siNmVyGfjs9DvUrOcYDsqk3VgA7ufJxhnjm3Q9dEzQ__m942WBOnoprYEW5n4VNBJe_v-JsXJAWSrrb75-JJmk8rwwTQMLG"
                alt="The Golden Hour"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-stone-950/20" />
            </div>
            
            <div className="p-6 md:w-7/12 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase bg-amber-950/20 px-2 py-0.5 border border-amber-900/30 rounded">Featured Pose</span>
                <h3 className="font-display text-xl text-stone-100 group-hover:text-stone-300 transition-colors">The Golden Hour</h3>
                <p className="font-sans text-xs text-stone-400 font-light leading-relaxed">
                  A new interactive exploration of shared intimacy, focusing on synchronizing gaze and tactile proximity during late twilight.
                </p>
              </div>
              <div className="flex items-center text-xs font-mono text-stone-400 group-hover:text-stone-200 space-x-1.5 pt-4">
                <span>Engage connection</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2: Midnight Echoes */}
          <div 
            onClick={() => onNavigate('story-engine')}
            className="group relative bg-[#141312] border border-stone-800/80 rounded-xl overflow-hidden hover:border-stone-700/80 transition-all duration-500 cursor-pointer flex flex-col md:flex-row h-full"
          >
            <div className="md:w-5/12 h-48 md:h-full relative overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3tZ4Pg7ay_Ub8mJ-RRmUUdgbBQYb-Q4TUFubTedpw0RYPJ6bdf7jeZu5766tJIw_TT7VvTxr37X7rZAiJ5e16O-BKTgIA7rDoJ5S_EE8rFTnx-yHNsU4VYj7x7rM1WmGTTFH5Gc-EPTP6p1dNMfbXrvxaQm-Vrqohx1NvOSPpeNr5SRO8h_nO7cE4sQUubf9ugq3lfQcgaEyJeKcz4uNoPCkXg2jRUffHzpKjALgCqNvkVkg5BhTqlhjsmX_yP58TOktanPoCa6na"
                alt="Midnight Echoes"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-stone-950/20" />
            </div>
            
            <div className="p-6 md:w-7/12 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-[#a855f7] uppercase bg-purple-950/20 px-2 py-0.5 border border-purple-900/30 rounded">New Narrative</span>
                <h3 className="font-display text-xl text-stone-100 group-hover:text-stone-300 transition-colors">Midnight Echoes</h3>
                <p className="font-sans text-xs text-stone-400 font-light leading-relaxed">
                  A branching narrative set in a remote Parisian villa. Your choices decide the emotional vulnerability, depth, and ultimate climax of the evening.
                </p>
              </div>
              <div className="flex items-center text-xs font-mono text-stone-400 group-hover:text-stone-200 space-x-1.5 pt-4">
                <span>Begin story</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exploration Pillars Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-stone-900">
          <h2 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">The Pillars</h2>
          <span className="text-xs font-mono text-stone-500">Curated Experiential Channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Visual Library */}
          <div 
            onClick={() => onNavigate('visual-library')}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer border border-stone-900 hover:border-stone-800 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20 z-10" />
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEy9iSTkFCmzoNHA_seAVN_rEOUcP9ImWx8QTR4PmZ1tM3VP1C2E02Nd0DXBylR6IpP3ZVOmpjhlSaSDUmm6O4uaTPGvtQRJLYQQA4oGyrQ7ctzC62Q3xfOFdfKKB4bHXAH697gqSpj57_dMZ0AAW4iFj-5JdeDZBaadZlK8DAWikUW1vLCCh7syLHbcRC-OiKf39_al_XRlsULF7fvvs69zoOxY9LYU9-wx_E0zHH3q9KqWl3lTXxXHitdEsx4zF_yQsGFHRspun-"
              alt="Visual Library"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
            
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-300 ${accentClass}`}>
                  <Eye size={18} />
                </div>
                <span className="font-mono text-[10px] tracking-widest text-[#d4af37] uppercase">Visual Curation</span>
              </div>
              <h3 className="font-display text-2xl text-stone-100">Visual Library</h3>
              <p className="font-sans text-xs text-stone-300 font-light leading-relaxed">
                Artistic depictions of closeness. Discover poses designed to establish deep presence, sensory awareness, and exquisite proximity.
              </p>
              <div className="flex items-center space-x-1.5 text-xs font-mono text-stone-400 group-hover:text-stone-200 pt-2 transition-colors">
                <span>Enter library</span>
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 2: Story Engine */}
          <div 
            onClick={() => onNavigate('story-engine')}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer border border-stone-900 hover:border-stone-800 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20 z-10" />
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKFrkL4rJwv7VJRhU3ff3gTYdNWBPd5t3ktpZunI4vymU_3mV4L8x3yNs-MJmIrITFCXW1EWsIJs--HB4JHqorZbAg8WWFhhl3GTUpiA1W2COXUrzY1KxHtAzXLlSjf1ZzFb88h3jcfK9JIStyIhkyrddkw2tAwwa2s-JrnPHg2t1K9zoK0QC--19RrJ0CqOnnrTiB97aMzxa2bhHWPpRceGqld9B4OGcGi1z76eAbx4hswhYHEJ7B8xbFezpsgSx0TYDL91qFg2wZ"
              alt="Story Engine"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
            
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-300 ${accentClass}`}>
                  <BookOpen size={18} />
                </div>
                <span className="font-mono text-[10px] tracking-widest text-[#a855f7] uppercase">Interactive Play</span>
              </div>
              <h3 className="font-display text-2xl text-stone-100">Story Engine</h3>
              <p className="font-sans text-xs text-stone-300 font-light leading-relaxed">
                Co-authored emotional journeys. Immerse in interactive, elegant text architectures designed to provoke memory, desire, and laughter.
              </p>
              <div className="flex items-center space-x-1.5 text-xs font-mono text-stone-400 group-hover:text-stone-200 pt-2 transition-colors">
                <span>Launch engine</span>
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 3: Conversation Hub */}
          <div 
            onClick={() => onNavigate('conversation-hub')}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer border border-stone-900 hover:border-stone-800 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20 z-10" />
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZlv0CUqqyjAQSQcwPxWIbnFRswgpbbbqU2HaCuuckYVEW8fWXOjZdXLOJMokfbJXWDBJ4HUZYQmY3NP-c7DxAGyplmJwyyqldoqTF5Ut3o3DLV7SQ6HEtfzlyEEi8QHkJ5ec9HniLrER0m441W4i43p_2HWHXOc9VEu5h-TXroZXZQK_BaKAlcgEa7eZ0WQLPFxaevs_CzI-0yz0gA9jvaw9DcVf6o3Jvy1qHSDNycMvSO-HAeKiLKv8yTQhAdQI5oJ_d0NFiSjLr"
              alt="Conversation Hub"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
            />
            
            <div className="absolute inset-x-0 bottom-0 p-6 z-20 space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-300 ${accentClass}`}>
                  <Compass size={18} />
                </div>
                <span className="font-mono text-[10px] tracking-widest text-[#3b82f6] uppercase">Vulnerable Dialogues</span>
              </div>
              <h3 className="font-display text-2xl text-stone-100">Conversation Hub</h3>
              <p className="font-sans text-xs text-stone-300 font-light leading-relaxed">
                A place for genuine alignment. Prompts structured intentionally around hopes, soft boundaries, deep fantasies, and pure gratitude.
              </p>
              <div className="flex items-center space-x-1.5 text-xs font-mono text-stone-400 group-hover:text-stone-200 pt-2 transition-colors">
                <span>Open dialogue</span>
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Banner Footer */}
      <div className="p-6 bg-stone-950/50 border border-stone-900/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center space-x-4">
          <div className="p-3 bg-stone-900 text-emerald-500 rounded-lg shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="font-sans text-stone-200 text-sm font-medium">Encrypted & Ephemeral Session</h4>
            <p className="font-sans text-stone-500 text-xs font-light mt-0.5 leading-normal max-w-2xl">
              Closing this tab or inactivity for 15 minutes will immediately clear all local cache. Your connection is validated and protected by Swiss zero-knowledge protocol.
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('security-vault')}
          className="font-mono text-xs text-stone-400 bg-stone-900 hover:bg-stone-800/80 transition-all border border-stone-800 px-4 py-2.5 rounded-lg whitespace-nowrap"
        >
          Audit Security Log
        </button>
      </div>
    </motion.div>
  );
};
