import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Utensils } from "lucide-react";

import PeriodTracker from "../PeriodTracker";
import KitchenAlignment from "../KitchenAlignment";
import { SanctuaryDB, CycleLog, PeriodConfig } from "../../types";

export default function LifeDashboard({
  db,
  periodConfig,
  cycleLogs,
  onUpdatePeriodConfig,
  onAddPeriodLog,
  onUpdateKitchen,
}: {
  db: SanctuaryDB;
  periodConfig: PeriodConfig;
  cycleLogs: CycleLog[];
  onUpdatePeriodConfig: (lastPeriodDate: string, cycleLength: number, periodLength: number, pregnancyMode?: boolean, pregnancyStartDate?: string) => void;
  onAddPeriodLog: (
    date: string,
    symptoms: string[],
    moods: string[],
    intimacyLevel: CycleLog["intimacyLevel"],
    notes?: string,
    flow?: CycleLog["flow"],
    temperature?: number,
    weight?: number,
    waterIntake?: number,
    sleepDuration?: number,
    sex?: CycleLog["sex"]
  ) => void;
  onUpdateKitchen: () => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"cycle" | "kitchen">("cycle");

  const subTabs = [
    { id: "cycle", label: "Cycle & Biology", icon: <Calendar className="w-4 h-4" /> },
    { id: "kitchen", label: "Kitchen Alignment", icon: <Utensils className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-24">
      {/* Unified Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-3xl font-light text-white tracking-wide">Life & Biology</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Sync your daily life and nutrition with natural biochemical cycles.
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
                  ? "text-emerald-400"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeSubTab === tab.id && (
                <motion.div
                  layoutId="lifeSubTabIndicator"
                  className="absolute inset-0 bg-emerald-950/40 border border-emerald-900/50 rounded-xl -z-10"
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
          {activeSubTab === "cycle" && (
            <motion.div
              key="cycle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PeriodTracker
                config={periodConfig}
                logs={cycleLogs}
                onUpdateConfig={onUpdatePeriodConfig}
                onAddLog={onAddPeriodLog}
                onImportSuccess={onUpdateKitchen}
              />
            </motion.div>
          )}

          {activeSubTab === "kitchen" && (
            <motion.div
              key="kitchen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <KitchenAlignment
                periodConfig={periodConfig}
                kitchenDishes={db.kitchenDishes || []}
                onUpdateKitchen={onUpdateKitchen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
