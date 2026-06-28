import React, { useState, useEffect } from "react";
import { Wind } from "lucide-react";
import { motion } from "motion/react";

export default function BreathingSync() {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

  useEffect(() => {
    const cycle = () => {
      setPhase("inhale");
      setTimeout(() => {
        setPhase("hold");
        setTimeout(() => {
          setPhase("exhale");
        }, 2000);
      }, 4000);
    };
    cycle();
    const interval = setInterval(cycle, 10000); // 4s inhale, 2s hold, 4s exhale
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-20">
      <div className="text-center space-y-4 z-10">
        <div className="w-16 h-16 rounded-full bg-sky-950/40 flex items-center justify-center border border-sky-500/30 mx-auto mb-6">
          <Wind className="w-8 h-8 text-sky-400" />
        </div>
        <h3 className="text-xl font-serif text-white">Synchronized Breathing</h3>
        <p className="text-sm text-sky-200/50 font-mono tracking-widest uppercase">
          {phase === "inhale" ? "Breathe In" : phase === "hold" ? "Hold" : "Breathe Out"}
        </p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        <motion.div
          animate={{
            scale: phase === "inhale" ? 1.5 : phase === "hold" ? 1.5 : 0.8,
            opacity: phase === "inhale" ? 0.8 : phase === "hold" ? 0.6 : 0.2
          }}
          transition={{ duration: phase === "hold" ? 2 : 4, ease: "easeInOut" }}
          className="absolute w-40 h-40 rounded-full bg-sky-500/30 blur-2xl"
        />
        <motion.div
          animate={{
            scale: phase === "inhale" ? 1.2 : phase === "hold" ? 1.2 : 0.5,
            borderWidth: phase === "hold" ? "4px" : "1px"
          }}
          transition={{ duration: phase === "hold" ? 2 : 4, ease: "easeInOut" }}
          className="absolute w-48 h-48 rounded-full border border-sky-400/50 flex items-center justify-center"
        >
          <div className="w-32 h-32 rounded-full border border-sky-200/20" />
        </motion.div>
      </div>
    </div>
  );
}
