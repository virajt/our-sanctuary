import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Eye, 
  BookOpen, 
  Compass, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Lock, 
  Clock, 
  Menu, 
  X,
  Heart
} from 'lucide-react';
import { ScreenType } from './types';
import { DashboardView } from './components/DashboardView';
import { VisualLibraryView } from './components/VisualLibraryView';
import { StoryEngineView } from './components/StoryEngineView';
import { ConversationHubView } from './components/ConversationHubView';
import { SecurityVaultView } from './components/SecurityVaultView';
import { SettingsAndPrivacyView } from './components/SettingsAndPrivacyView';

interface FantasyAppProps {
  onClose: () => void;
}

export const FantasyApp: React.FC<FantasyAppProps> = ({ onClose }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null);
  
  // Custom brand appearance states
  const [themeAccent, setThemeAccent] = useState<'merlot' | 'emerald' | 'obsidian' | 'ochre'>('merlot');
  const [time, setTime] = useState<string>('');
  
  // Exit and mobile menu toggles
  const [isExiting, setIsExiting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Digital clock running sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme configuration loader
  const getAccentConfig = (accent: typeof themeAccent) => {
    switch (accent) {
      case 'merlot':
        return {
          textColor: 'text-[#ac1c2c]',
          borderColor: 'border-[#ac1c2c]/40',
          activeBg: 'bg-[#ac1c2c]/10 text-stone-100 border-[#ac1c2c]/30',
          accentClass: 'bg-[#ac1c2c] hover:bg-[#8f1522] text-white',
          hoverText: 'hover:text-[#ac1c2c]'
        };
      case 'emerald':
        return {
          textColor: 'text-[#057a55]',
          borderColor: 'border-[#057a55]/40',
          activeBg: 'bg-[#057a55]/10 text-stone-100 border-[#057a55]/30',
          accentClass: 'bg-[#057a55] hover:bg-[#046243] text-white',
          hoverText: 'hover:text-[#057a55]'
        };
      case 'obsidian':
        return {
          textColor: 'text-stone-300',
          borderColor: 'border-stone-600',
          activeBg: 'bg-stone-800/60 text-stone-100 border-stone-600',
          accentClass: 'bg-stone-700 hover:bg-stone-600 text-stone-100',
          hoverText: 'hover:text-stone-200'
        };
      case 'ochre':
        return {
          textColor: 'text-[#ca8a04]',
          borderColor: 'border-[#ca8a04]/40',
          activeBg: 'bg-[#ca8a04]/10 text-stone-100 border-[#ca8a04]/30',
          accentClass: 'bg-[#ca8a04] hover:bg-[#a16207] text-stone-950',
          hoverText: 'hover:text-[#ca8a04]'
        };
    }
  };

  const accent = getAccentConfig(themeAccent);

  // Safe "Quick Exit" bordeaux blackout sequence
  const handleQuickExit = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const menuItems = [
    { id: 'dashboard' as ScreenType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'visual-library' as ScreenType, label: 'Visual Library', icon: Eye },
    { id: 'story-engine' as ScreenType, label: 'Story Engine', icon: BookOpen },
    { id: 'conversation-hub' as ScreenType, label: 'Conversation Hub', icon: Compass },
    { id: 'security-vault' as ScreenType, label: 'Security Vault', icon: ShieldAlert },
    { id: 'settings' as ScreenType, label: 'Settings & Privacy', icon: Settings }
  ];

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
    setIsMobileMenuOpen(false);
    if (screen !== 'visual-library-detail') {
      setSelectedPoseId(null);
    }
  };

  const handleNavigateToPose = (poseId: string | null) => {
    setSelectedPoseId(poseId);
    setCurrentScreen('visual-library');
  };

  return (
    <div className="absolute inset-0 bg-[#0d0c0b] text-[#f5f5f4] flex flex-col font-sans selection:bg-stone-800 selection:text-white overflow-hidden z-50">
      {/* Absolute Panic Blackout Element */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-[#ac1c2c] z-[9999] flex flex-col items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-3"
            >
              <h2 className="font-display text-2xl text-stone-100 tracking-tight">Closing private terminal...</h2>
              <p className="font-mono text-xs text-stone-400">Overwriting cache logs complete.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar (Desktop & Mobile) with premium editorial minimalism */}
      <header className="sticky top-0 z-40 bg-[#0d0c0b]/90 backdrop-blur-md border-b border-stone-900 px-6 py-4 flex items-center justify-between">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center space-x-2.5 text-left group"
          >
            <span className="font-display text-2xl font-light tracking-wide text-stone-100 group-hover:text-stone-300 transition-colors">
              Intimacy<span className={accent.textColor}>.</span>
            </span>
          </button>
          
          {/* Running Clock - Desktop only */}
          <div className="hidden md:flex items-center space-x-2 text-stone-500 font-mono text-xs border-l border-stone-950 pl-6">
            <Clock size={12} className="text-stone-600" />
            <span>{time}</span>
          </div>
        </div>

        {/* Right Side: Quick Exit and burger trigger */}
        <div className="flex items-center space-x-4">
          
          {/* Quick Exit trigger with Bordeaux/Merlot styling */}
          <button
            onClick={handleQuickExit}
            className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 hover:text-red-400 transition-all text-xs font-mono rounded-full flex items-center space-x-2 group shrink-0"
          >
            <span className="h-2 w-2 rounded-full bg-red-600 block animate-pulse"></span>
            <span className="tracking-widest uppercase text-[10px]">Quick Exit</span>
          </button>

          {/* Hamburger trigger for small screens */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-stone-400 hover:text-stone-200 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </header>

      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT COMPACT SIDEBAR - DESKTOP ONLY */}
        <aside className="hidden md:flex flex-col w-64 border-r border-stone-900/60 bg-[#0d0c0b] p-6 justify-between select-none shrink-0 h-full overflow-y-auto">
          
          {/* Navigation link stacks */}
          <div className="space-y-8">
            <div className="space-y-1.5">
              <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest block pl-3.5 mb-2">Sanctuary Modules</span>
              
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id || 
                  (item.id === 'visual-library' && selectedPoseId !== null);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-lg text-xs font-sans transition-all border ${
                      isActive 
                        ? accent.activeBg
                        : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-900/40 bg-transparent'
                    }`}
                  >
                    <Icon size={15} className={isActive ? accent.textColor : 'text-stone-500'} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom user profile card & micro security note */}
          <div className="space-y-4">
            <div className="py-2.5 px-3 bg-stone-950/60 border border-stone-900 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse block"></span>
                <span className="font-sans text-stone-300 text-xs font-light">Julian & Elena</span>
              </div>
              <span className="font-mono text-[9px] text-stone-500 uppercase tracking-wider">Synchronized</span>
            </div>

            <div className="flex items-center space-x-1.5 text-stone-600 font-mono text-[9px] uppercase pl-1">
              <Lock size={10} />
              <span>AES-256 E2EE Link</span>
            </div>
          </div>

        </aside>

        {/* MOBILE MENU PANEL */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden absolute top-[69px] left-0 w-full bg-[#0d0c0b] border-b border-stone-850 z-30 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center space-x-3.5 px-3.5 py-3.5 rounded-xl text-left text-sm font-sans transition-all ${
                        isActive 
                          ? accent.activeBg
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon size={16} className={isActive ? accent.textColor : 'text-stone-500'} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN WORKING CONTENT AREA */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-10 md:p-12 relative">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW ROUTER */}
            {currentScreen === 'dashboard' && (
              <DashboardView 
                key="dashboard-view"
                onNavigate={handleNavigate} 
                accentClass={accent.accentClass}
              />
            )}

            {currentScreen === 'visual-library' && (
              <VisualLibraryView 
                key="visual-library-view"
                onNavigate={handleNavigate}
                selectedPoseId={selectedPoseId}
                setSelectedPoseId={setSelectedPoseId}
                accentClass={accent.accentClass}
              />
            )}

            {currentScreen === 'story-engine' && (
              <StoryEngineView 
                key="story-engine-view"
                onNavigate={handleNavigate}
                accentClass={accent.accentClass}
              />
            )}

            {currentScreen === 'conversation-hub' && (
              <ConversationHubView 
                key="conversation-hub-view"
                onNavigate={handleNavigate}
                accentClass={accent.accentClass}
              />
            )}

            {currentScreen === 'security-vault' && (
              <SecurityVaultView 
                key="security-vault-view"
                onNavigate={handleNavigate}
                accentClass={accent.accentClass}
              />
            )}

            {currentScreen === 'settings' && (
              <SettingsAndPrivacyView 
                key="settings-view"
                onNavigate={handleNavigate}
                themeAccent={themeAccent}
                setThemeAccent={setThemeAccent}
                accentClass={accent.accentClass}
              />
            )}

          </AnimatePresence>

        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR BAR */}
      <footer className="md:hidden sticky bottom-0 z-40 bg-[#0d0c0b]/95 backdrop-blur-md border-t border-stone-900 py-3.5 px-4 flex items-center justify-around">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center space-y-1 text-center shrink-0 min-w-[54px] min-h-[44px] justify-center ${isActive ? accent.textColor : 'text-stone-500'}`}
            >
              <Icon size={18} />
              <span className="font-sans text-[9px] tracking-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
}
