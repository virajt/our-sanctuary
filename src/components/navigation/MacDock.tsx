import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Sparkles, Heart, Package, Utensils, Bell, Camera, Settings } from "lucide-react";

export type NavPath = "/fantasy" | "/hub" | "/surprises" | "/life" | "/timeline" | "/gallery" | "/admin";

interface DockItem {
  path: NavPath;
  label: string;
  icon: React.ReactNode;
}

const dockItems: DockItem[] = [
  { path: "/fantasy", label: "Intimacy", icon: <Sparkles className="w-5 h-5 text-red-500" /> },
  { path: "/hub", label: "Connection", icon: <Heart className="w-5 h-5 text-rose-500" /> },
  { path: "/surprises", label: "Surprises", icon: <Package className="w-5 h-5 text-amber-500" /> },
  { path: "/life", label: "Life", icon: <Utensils className="w-5 h-5 text-emerald-500" /> },
  { path: "/timeline", label: "Timeline", icon: <Bell className="w-5 h-5 text-cyan-500" /> },
  { path: "/gallery", label: "Memories", icon: <Camera className="w-5 h-5 text-purple-500" /> },
  { path: "/admin", label: "Settings", icon: <Settings className="w-5 h-5 text-neutral-400" /> },
];

export default function MacDock({ activePath, navigate }: { activePath: string, navigate: (path: NavPath) => void }) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-2 bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-3 rounded-[2rem] shadow-2xl"
      >
        {dockItems.map((item) => (
          <DockIcon
            key={item.path}
            item={item}
            mouseX={mouseX}
            isActive={activePath === item.path || activePath.startsWith(item.path + '/')}
            onClick={() => navigate(item.path)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DockIcon({
  item,
  mouseX,
  isActive,
  onClick,
}: {
  item: DockItem;
  mouseX: any;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Calculate width/scale based on mouse distance (standard macOS dock math)
  const widthSync = useTransform(distance, [-100, 0, 100], [48, 80, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <div className="relative group flex flex-col items-center">
      {/* Tooltip */}
      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
        {item.label}
      </div>

      <motion.button
        ref={ref}
        style={{ width, height: width }}
        onClick={onClick}
        className={`relative flex items-center justify-center rounded-2xl border cursor-pointer overflow-hidden transition-colors ${
          isActive
            ? "bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            : "bg-white/5 border-white/10 hover:bg-white/10"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="dock-active"
            className="absolute -bottom-1 w-8 h-1 rounded-full bg-white/50 blur-[2px]"
          />
        )}
        {/* Scale up the icon slightly based on the container width */}
        <motion.div style={{ scale: useTransform(width, [48, 80], [1, 1.5]) }}>
          {item.icon}
        </motion.div>
      </motion.button>
    </div>
  );
}
