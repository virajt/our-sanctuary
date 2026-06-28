import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Package, Utensils, Bell, Camera, Settings } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/intimacy", label: "Intimacy", icon: <Sparkles className="w-5 h-5" />, color: "text-red-500" },
  { path: "/hub", label: "Connection", icon: <Heart className="w-5 h-5" />, color: "text-rose-500" },
  { path: "/surprises", label: "Surprises", icon: <Package className="w-5 h-5" />, color: "text-amber-500" },
  { path: "/life", label: "Life", icon: <Utensils className="w-5 h-5" />, color: "text-emerald-500" },
  { path: "/timeline", label: "Timeline", icon: <Bell className="w-5 h-5" />, color: "text-cyan-500" },
  { path: "/gallery", label: "Memories", icon: <Camera className="w-5 h-5" />, color: "text-purple-500" },
  { path: "/admin", label: "Settings", icon: <Settings className="w-5 h-5" />, color: "text-neutral-400" },
];

export default function SideNav({ activePath, navigate }: { activePath: string, navigate: (path: string) => void }) {
  return (
    <motion.nav 
      initial={false}
      className="group fixed left-0 top-0 h-full z-50 flex flex-col bg-black/60 backdrop-blur-2xl border-r border-white/5 transition-[width] duration-300 ease-out w-[60px] hover:w-64 overflow-hidden shadow-2xl"
    >
      {/* Brand / Logo Area */}
      <div className="h-20 flex items-center px-3 border-b border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/10 border border-rose-500/20 flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-rose-400" />
        </div>
        <span className="ml-4 font-serif text-lg font-light tracking-widest text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          SANCTUARY
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 flex flex-col gap-2 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePath.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center h-12 w-full rounded-xl transition-colors cursor-pointer ${
                isActive 
                  ? "bg-white/10" 
                  : "hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidenav-active"
                  className="absolute left-0 w-1 h-6 bg-rose-500 rounded-r-full"
                />
              )}
              <div className={`shrink-0 w-11 flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="whitespace-nowrap text-sm font-medium tracking-wide text-white/70 group-hover:text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
