import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Package, Utensils, Bell, Camera, Settings, Compass } from 'lucide-react';
import { NavPath } from './MacDock';

export interface RingItem {
  path: NavPath;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const RING_ITEMS: RingItem[] = [
  { path: "/fantasy", label: "Intimacy", icon: <Sparkles className="w-8 h-8" />, color: "text-red-500" },
  { path: "/hub", label: "Connection", icon: <Heart className="w-8 h-8" />, color: "text-rose-500" },
  { path: "/surprises", label: "Surprises", icon: <Package className="w-8 h-8" />, color: "text-amber-500" },
  { path: "/life", label: "Life", icon: <Utensils className="w-8 h-8" />, color: "text-emerald-500" },
  { path: "/timeline", label: "Timeline", icon: <Bell className="w-8 h-8" />, color: "text-cyan-500" },
  { path: "/gallery", label: "Memories", icon: <Camera className="w-8 h-8" />, color: "text-purple-500" },
  { path: "/admin", label: "Settings", icon: <Settings className="w-8 h-8" />, color: "text-neutral-400" },
];

export default function NavigationRing({ activePath, navigate }: { activePath: string, navigate: (path: NavPath) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const controls = useAnimation();
  
  const radius = 250;
  const itemCount = RING_ITEMS.length;
  const angleStep = 360 / itemCount;

  const handleDragEnd = (e: any, info: any) => {
    const swipeVelocity = info.velocity.x;
    const swipeThreshold = 50;
    
    if (swipeVelocity > swipeThreshold) {
      setRotation(prev => prev - angleStep);
    } else if (swipeVelocity < -swipeThreshold) {
      setRotation(prev => prev + angleStep);
    } else {
      // Snap to nearest
      const currentRot = rotation;
      const remainder = currentRot % angleStep;
      if (remainder > angleStep / 2) setRotation(currentRot + (angleStep - remainder));
      else if (remainder < -angleStep / 2) setRotation(currentRot - (angleStep + remainder));
      else setRotation(currentRot - remainder);
    }
  };

  useEffect(() => {
    controls.start({
      rotateY: rotation,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    });
  }, [rotation, controls]);

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center border transition-colors shadow-2xl ${
            isOpen ? "bg-rose-600 border-rose-400 text-white shadow-[0_0_40px_rgba(225,29,72,0.6)]" : "bg-black/60 border-white/20 text-white/70 backdrop-blur-md"
          }`}
        >
          <Compass className={`w-8 h-8 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>

      {/* 3D Immersive Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center overflow-hidden"
            style={{ perspective: "1000px" }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={controls}
                className="relative w-64 h-64 flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                {RING_ITEMS.map((item, index) => {
                  const angle = index * angleStep;
                  const isActive = activePath.startsWith(item.path);
                  
                  return (
                    <motion.div
                      key={item.path}
                      className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
                      style={{
                        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                        transformStyle: "preserve-3d"
                      }}
                    >
                      <button
                        onClick={() => {
                          navigate(item.path);
                          setIsOpen(false);
                        }}
                        className={`group relative flex flex-col items-center justify-center w-32 h-40 rounded-2xl border transition-all duration-300 ${
                          isActive 
                            ? "bg-white/10 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
                            : "bg-black/50 border-white/10 hover:bg-white/5 hover:border-white/30"
                        }`}
                        style={{
                          // Counter-rotate the card so it always faces the screen slightly
                          transform: `rotateY(${-angle - rotation}deg)`
                        }}
                      >
                        <div className={`p-4 rounded-full bg-black/40 border border-white/5 mb-3 group-hover:scale-110 transition-transform ${item.color}`}>
                          {item.icon}
                        </div>
                        <span className="text-white text-xs tracking-widest uppercase font-mono">{item.label}</span>
                        
                        {isActive && (
                          <div className="absolute inset-0 rounded-2xl border-2 border-rose-500/50 animate-pulse pointer-events-none" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
            
            {/* Ambient Lighting */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-rose-600/20 blur-[100px] pointer-events-none rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
