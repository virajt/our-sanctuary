import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Clock } from "lucide-react";

import DateRemindersView from "../DateRemindersView";
import TeasersView from "../TeasersView";
import { SanctuaryDB } from "../../types";

export default function TimelineDashboard({
  db,
  onAddDate,
  onDeleteDate,
  onAddTeaser,
  onDeleteTeaser,
}: {
  db: SanctuaryDB;
  onAddDate: (date: any) => void;
  onDeleteDate: (id: string) => void;
  onAddTeaser: (teaser: any) => void;
  onDeleteTeaser: (id: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"dates" | "teasers">("dates");

  const subTabs = [
    { id: "dates", label: "Important Dates", icon: <Bell className="w-4 h-4" /> },
    { id: "teasers", label: "Teasers", icon: <Clock className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-24">
      {/* Unified Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-3xl font-light text-white tracking-wide">Timeline & Anticipation</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Manage reminders for sacred dates and send automated teasers.
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
                  ? "text-cyan-400"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeSubTab === tab.id && (
                <motion.div
                  layoutId="timelineSubTabIndicator"
                  className="absolute inset-0 bg-cyan-950/40 border border-cyan-900/50 rounded-xl -z-10"
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
          {activeSubTab === "dates" && (
            <motion.div
              key="dates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <DateRemindersView
                dates={db.importantDates || []}
                onAddDate={onAddDate}
                onDeleteDate={onDeleteDate}
              />
            </motion.div>
          )}

          {activeSubTab === "teasers" && (
            <motion.div
              key="teasers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TeasersView
                teasers={db.teasers || []}
                onAddTeaser={onAddTeaser}
                onDeleteTeaser={onDeleteTeaser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
