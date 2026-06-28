import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Sparkles } from "lucide-react";

import WickedChamber from "../WickedChamber";
import { FantasyApp } from "../../fantasy/FantasyApp";
import { SanctuaryDB } from "../../types";

export default function IntimacyDashboard({
  db,
  onGenerateWicked,
  isLoading,
  navigate,
}: {
  db: SanctuaryDB;
  onGenerateWicked: (target: any, intensity?: string) => Promise<any>;
  isLoading: boolean;
  navigate: (path: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"wicked" | "fantasy">("wicked");

  const subTabs = [
    { id: "wicked", label: "Wicked Generator", icon: <Flame className="w-4 h-4" /> },
    { id: "fantasy", label: "The Fantasy", icon: <Sparkles className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-24">
      {/* Unified Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-3xl font-light text-white tracking-wide">Intimacy & Fantasy</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Procedural wicked challenges and immersive fantasy realms.
        </p>
      </div>

      {/* Internal Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                activeSubTab === tab.id
                  ? "text-red-400"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeSubTab === tab.id && (
                <motion.div
                  layoutId="intimacySubTabIndicator"
                  className="absolute inset-0 bg-red-950/40 border border-red-900/50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      <div className="w-full relative">
        <AnimatePresence mode="wait">
          {activeSubTab === "wicked" && (
            <motion.div
              key="wicked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <WickedChamber
                challengesHistory={db.wickedChallengesHistory}
                onGenerate={onGenerateWicked}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeSubTab === "fantasy" && (
            <motion.div
              key="fantasy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <FantasyApp onClose={() => navigate("/surprises")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
