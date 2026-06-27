import React from "react";
import { StoryProgress } from "../types";
import { BookOpen, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MagneticButton from "./effects/MagneticButton";

interface StoryStep {
  id: string;
  text: string;
  choices?: { label: string; nextId: string }[];
}

interface StoryEngineViewProps {
  steps: Record<string, StoryStep>;
  progress: StoryProgress;
  onAdvance: (stepId: string) => void;
  onReset: () => void;
}

export default function StoryEngineView({ steps, progress, onAdvance, onReset }: StoryEngineViewProps) {
  const currentStep = steps[progress.currentStepId] || steps["root"];

  return (
    <div className="space-y-8" id="story-engine-module">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-red-500 animate-pulse" />
            Story Engine
          </h2>
          <p className="text-sm text-neutral-400">A small story to read together. Choose your own path through it.</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-400 hover:text-white border border-luxury-800 hover:border-luxury-700 rounded-2xl transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start Over
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.4 }}
          className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-8 space-y-6 max-w-2xl mx-auto"
        >
          <p className="font-serif text-lg text-neutral-200 leading-relaxed whitespace-pre-line">{currentStep.text}</p>

          {currentStep.choices && currentStep.choices.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {currentStep.choices.map((choice) => (
                <MagneticButton
                  key={choice.nextId}
                  onClick={() => onAdvance(choice.nextId)}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 text-red-300 hover:text-white text-sm font-medium rounded-2xl shadow-lg transition glow-red cursor-pointer"
                >
                  {choice.label}
                </MagneticButton>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest pt-2 border-t border-luxury-800/60">
              The End - click "Start Over" to read a different path.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
