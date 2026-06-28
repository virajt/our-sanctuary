import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HeartPulse, Film, BookOpen, Map, Package, CheckSquare, Clock, Edit3, Wind, CalendarDays, ArrowLeft } from "lucide-react";

import HeartbeatSync from "./features/HeartbeatSync";
import MediaSync from "./features/MediaSync";
import DailyPrompts from "./features/DailyPrompts";
import MemoryMap from "./features/MemoryMap";
import CarePackages from "./features/CarePackages";
import BucketList from "./features/BucketList";
import TimeCapsules from "./features/TimeCapsules";
import DigitalCanvas from "./features/DigitalCanvas";
import BreathingSync from "./features/BreathingSync";
import Countdowns from "./features/Countdowns";

import { SanctuaryDB } from "../types";

export default function ConnectionHubView({ db, onUpdate }: { db: SanctuaryDB, onUpdate: () => void }) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features = [
    { id: "heartbeat", title: "Heartbeat Sync", icon: <HeartPulse className="w-8 h-8 text-rose-500" />, desc: "Send an instant 'Thinking of You' pulse." },
    { id: "media", title: "Media Sync", icon: <Film className="w-8 h-8 text-indigo-400" />, desc: "Watch videos together." },
    { id: "prompts", title: "Daily Prompts", icon: <BookOpen className="w-8 h-8 text-amber-500" />, desc: "Blind-reveal daily questions." },
    { id: "map", title: "Memory Map", icon: <Map className="w-8 h-8 text-emerald-500" />, desc: "Pin your favorite spots worldwide." },
    { id: "care", title: "Care Packages", icon: <Package className="w-8 h-8 text-orange-400" />, desc: "Send digital surprises." },
    { id: "bucket", title: "Bucket List", icon: <CheckSquare className="w-8 h-8 text-cyan-400" />, desc: "Gamified shared goals." },
    { id: "capsule", title: "Time Capsules", icon: <Clock className="w-8 h-8 text-purple-500" />, desc: "Lock messages for the future." },
    { id: "canvas", title: "Shared Canvas", icon: <Edit3 className="w-8 h-8 text-pink-400" />, desc: "Draw together." },
    { id: "breathing", title: "Breathing Sync", icon: <Wind className="w-8 h-8 text-sky-400" />, desc: "Align your nervous systems." },
    { id: "countdowns", title: "Countdowns", icon: <CalendarDays className="w-8 h-8 text-fuchsia-400" />, desc: "Track upcoming milestones." },
  ];

  if (activeFeature) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full space-y-6"
      >
        <button
          onClick={() => setActiveFeature(null)}
          className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-white/50 hover:text-white transition group bg-white/5 px-4 py-2 rounded-full border border-white/10 w-max"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Hub
        </button>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
          {activeFeature === "heartbeat" && <HeartbeatSync />}
          {activeFeature === "media" && <MediaSync />}
          {activeFeature === "prompts" && <DailyPrompts prompts={db.dailyPrompts || []} onUpdate={onUpdate} />}
          {activeFeature === "map" && <MemoryMap pins={db.memoryPins || []} onUpdate={onUpdate} />}
          {activeFeature === "care" && <CarePackages packages={db.carePackages || []} onUpdate={onUpdate} />}
          {activeFeature === "bucket" && <BucketList items={db.bucketListItems || []} onUpdate={onUpdate} />}
          {activeFeature === "capsule" && <TimeCapsules capsules={db.timeCapsules || []} onUpdate={onUpdate} />}
          {activeFeature === "canvas" && <DigitalCanvas strokes={db.canvasStrokes || []} />}
          {activeFeature === "breathing" && <BreathingSync />}
          {activeFeature === "countdowns" && <Countdowns countdowns={db.countdowns || []} onUpdate={onUpdate} />}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-3xl font-light text-white tracking-wide">Connection Hub</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Ten powerful ways to bridge the distance and align your hearts, minds, and memories.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((f, idx) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setActiveFeature(f.id)}
            className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/20 rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                {f.icon}
              </div>
              <div>
                <h3 className="font-serif text-lg text-white group-hover:text-amber-200 transition-colors">{f.title}</h3>
                <p className="text-xs text-white/40 mt-1">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
