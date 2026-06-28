import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Image as ImageIcon } from "lucide-react";

import PrivateGallery from "../PrivateGallery";
import VisualLibraryView from "../VisualLibraryView";
import { VISUAL_LIBRARY } from "../../data/fantasyContent";
import { SanctuaryDB } from "../../types";

export default function MemoriesDashboard({
  db,
  onAddPhoto,
  onDeletePhoto,
  onAddLibraryItem,
  onDeleteLibraryItem,
}: {
  db: SanctuaryDB;
  onAddPhoto: (photo: any) => void;
  onDeletePhoto: (id: string) => void;
  onAddLibraryItem: (item: any) => void;
  onDeleteLibraryItem: (id: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"vault" | "library">("vault");

  const subTabs = [
    { id: "vault", label: "Private Vault", icon: <Camera className="w-4 h-4" /> },
    { id: "library", label: "Visual Library", icon: <ImageIcon className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-24">
      {/* Unified Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-3xl font-light text-white tracking-wide">Memories & Moodboards</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Your private encrypted photo vault and collaborative visual inspirations.
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
                  ? "text-purple-400"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeSubTab === tab.id && (
                <motion.div
                  layoutId="memoriesSubTabIndicator"
                  className="absolute inset-0 bg-purple-950/40 border border-purple-900/50 rounded-xl -z-10"
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
          {activeSubTab === "vault" && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PrivateGallery
                photos={db.vaultPhotos}
                themes={db.adminSettings.photoThemes || ["Romantic", "Spicy", "Everyday", "Vacation"]}
                onAddPhoto={onAddPhoto}
                onDeletePhoto={onDeletePhoto}
              />
            </motion.div>
          )}

          {activeSubTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <VisualLibraryView
                items={VISUAL_LIBRARY}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
