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

export default function TopNav({ activePath, navigate }: { activePath: string, navigate: (path: string) => void }) {
  return (
    <nav className="sticky top-4 z-50 w-full max-w-4xl mx-auto mt-6 mb-8 px-2">
      <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl p-2 rounded-2xl no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activePath.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isActive 
                  ? "bg-white/10 text-white" 
                  : "hover:bg-white/5 text-white/60 hover:text-white/90"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="topnav-active"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                />
              )}
              <div className={`${item.color}`}>
                {React.cloneElement(item.icon as any, { className: "w-4 h-4" })}
              </div>
              <span className="text-sm font-medium tracking-wide z-10">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
