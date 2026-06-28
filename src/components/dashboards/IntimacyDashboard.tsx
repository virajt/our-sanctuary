import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Sparkles } from "lucide-react";

import WickedChamber from "../WickedChamber";
import { FantasyApp } from "../../fantasy/FantasyApp";
import DesireVault from "./features/DesireVault";
import SensoryRoulette from "./features/SensoryRoulette";
import TemperatureSync from "./features/TemperatureSync";
import TouchMap from "./features/TouchMap";
import TeaseTimer from "./features/TeaseTimer";
import Whispers from "./features/Whispers";
import ScavengerHunt from "./features/ScavengerHunt";
import BlindfoldMode from "./features/BlindfoldMode";
import AfterglowLog from "./features/AfterglowLog";
import { SanctuaryDB } from "../../types";

export default function IntimacyDashboard({
  db,
  onGenerateWicked,
  isLoading,
  navigate,
}: {
  db: SanctuaryDB;
  onGenerateWicked: any;
  isLoading: boolean;
  navigate: (path: string) => void;
}) {
  const validTabs = ["wicked", "fantasy", "vault", "roulette", "temperature", "touchmap", "teasetimer", "whispers", "scavenger", "blindfold", "afterglow"];
  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "");
    if (validTabs.includes(hash)) return hash as any;
    return "wicked";
  };
  const [activeSubTab, setActiveSubTab] = useState<"wicked" | "fantasy" | "vault" | "roulette" | "temperature" | "touchmap" | "teasetimer" | "whispers" | "scavenger" | "blindfold" | "afterglow">(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => setActiveSubTab(getInitialTab());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tabId: string) => {
    window.location.hash = tabId;
  };

  const subTabs = [
    { id: "wicked", label: "Wicked", icon: <Flame className="w-4 h-4" /> },
    { id: "fantasy", label: "Fantasy", icon: <Sparkles className="w-4 h-4" /> },
    { id: "vault", label: "Vault" },
    { id: "roulette", label: "Roulette" },
    { id: "temperature", label: "Temp" },
    { id: "touchmap", label: "Map" },
    { id: "teasetimer", label: "Timer" },
    { id: "whispers", label: "Whispers" },
    { id: "scavenger", label: "Hunt" },
    { id: "blindfold", label: "Audio" },
    { id: "afterglow", label: "Log" },
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
              onClick={() => handleTabChange(tab.id)}
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

          {activeSubTab === "vault" && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <DesireVault db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "roulette" && (
            <motion.div
              key="roulette"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SensoryRoulette db={db} />
            </motion.div>
          )}

          {activeSubTab === "temperature" && (
            <motion.div
              key="temperature"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TemperatureSync db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "touchmap" && (
            <motion.div
              key="touchmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TouchMap db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "teasetimer" && (
            <motion.div
              key="teasetimer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TeaseTimer db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "whispers" && (
            <motion.div
              key="whispers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Whispers db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "scavenger" && (
            <motion.div
              key="scavenger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ScavengerHunt db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "blindfold" && (
            <motion.div
              key="blindfold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <BlindfoldMode db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}

          {activeSubTab === "afterglow" && (
            <motion.div
              key="afterglow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <AfterglowLog db={db} fetchDb={() => window.dispatchEvent(new Event("sanctuary:fetchDb"))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
