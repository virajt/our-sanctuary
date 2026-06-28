import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dices } from "lucide-react";
import { SanctuaryDB } from "../../../types";

export default function SensoryRoulette({ db }: { db: SanctuaryDB }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Combine standard and custom gifts/vouchers for the roulette
  const availableOptions = db.gifts?.filter(g => g.status === "Available") || [];
  
  const spinRoulette = () => {
    if (availableOptions.length === 0) return;
    setIsSpinning(true);
    setResult(null);
    
    setTimeout(() => {
      const randomGift = availableOptions[Math.floor(Math.random() * availableOptions.length)];
      setResult(randomGift.title);
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400">Sensory Roulette</h3>
        <p className="text-sm text-neutral-400">
          Leave the night to fate. Spin the wheel to randomly select an available intimate voucher.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-12 py-8">
        <motion.button
          onClick={spinRoulette}
          disabled={isSpinning || availableOptions.length === 0}
          animate={{ rotate: isSpinning ? 1080 : 0 }}
          transition={{ duration: 3, ease: "circOut" }}
          className="w-32 h-32 rounded-full border-4 border-rose-900/50 bg-black/60 flex items-center justify-center relative shadow-[0_0_50px_rgba(244,63,94,0.15)] disabled:opacity-50"
        >
          <div className="absolute inset-2 border border-rose-500/30 rounded-full border-dashed" />
          <Dices className={`w-12 h-12 ${isSpinning ? "text-rose-500" : "text-neutral-500"}`} />
        </motion.button>

        <AnimatePresence mode="wait">
          {result && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 to-black/60 border border-rose-500/40 text-center w-full"
            >
              <div className="text-xs font-mono tracking-widest text-rose-400 uppercase mb-3">
                The Verdict
              </div>
              <div className="font-serif text-2xl text-white">
                "{result}"
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {availableOptions.length === 0 && (
          <div className="text-xs text-neutral-500 font-mono text-center">
            No available vouchers to spin for.
          </div>
        )}
      </div>
    </div>
  );
}
