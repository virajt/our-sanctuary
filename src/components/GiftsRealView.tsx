import React, { useState } from "react";
import { Gift as GiftType } from "../types";
import { Gift as GiftIcon, Sparkles, CircleCheck, ChevronRight, Plus, Trash, PackageCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TiltCard from "./effects/TiltCard";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface GiftsRealViewProps {
  gifts: GiftType[];
  categories: string[];
  onGive: (id: string) => void;
  onReceive: (id: string) => void;
  onAddGift: (title: string, description: string, category: string, giver: "Him" | "Her" | "Together", receiver: "Him" | "Her") => void;
  onDeleteCustom: (id: string) => void;
}

export default function GiftsRealView({ gifts, categories, onGive, onReceive, onAddGift, onDeleteCustom }: GiftsRealViewProps) {
  const [filterCat, setFilterCat] = useState<string>("All");
  const [filterReceiver, setFilterReceiver] = useState<string>("All");

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<string>(categories[0] || "Other");
  const [newGiver, setNewGiver] = useState<"Him" | "Her" | "Together">("Him");
  const [newReceiver, setNewReceiver] = useState<"Him" | "Her">("Her");

  const filteredGifts = gifts.filter((gift) => {
    const matchCat = filterCat === "All" || gift.category === filterCat;
    const matchRec = filterReceiver === "All" || gift.receiver === filterReceiver;
    return matchCat && matchRec;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    onAddGift(newTitle, newDesc, newCat, newGiver, newReceiver);
    setNewTitle("");
    setNewDesc("");
    setIsAdding(false);
  };

  return (
    <div className="space-y-8" id="real-gifts-module">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <GiftIcon className="w-8 h-8 text-red-500 animate-pulse" />
            Gifts we give each other
          </h2>
          <p className="text-sm text-neutral-400">Plan, give, and track real gifts - jewelry, trips, letters, keepsakes. Categories editable in Admin.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-luxury-950/60 p-1.5 rounded-2xl border border-white/5">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-xs bg-transparent text-neutral-300 border-none outline-none px-2 py-1 cursor-pointer"
            >
              <option value="All" className="bg-luxury-950">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-luxury-950">{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-luxury-950/60 p-1.5 rounded-2xl border border-white/5">
            <select
              value={filterReceiver}
              onChange={(e) => setFilterReceiver(e.target.value)}
              className="text-xs bg-transparent text-neutral-300 border-none outline-none px-2 py-1 cursor-pointer"
            >
              <option value="All" className="bg-luxury-950">For Anyone</option>
              <option value="Her" className="bg-luxury-950">For Her</option>
              <option value="Him" className="bg-luxury-950">For Him</option>
            </select>
          </div>

          <MagneticButton
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-800 text-white border border-red-700/50 text-xs font-semibold rounded-2xl shadow-lg hover:shadow-red-950/15 transition-all cursor-pointer glow-red"
          >
            <Plus className="w-4 h-4" />
            Plan a Gift
          </MagneticButton>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/80 border border-luxury-800 rounded-3xl p-6 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-serif text-xl font-medium text-white/95">Plan a Gift</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs text-neutral-400 font-medium">Gift Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The bracelet she mentioned in March"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Who's Giving / Receiving?</label>
                  <div className="flex gap-2">
                    <select
                      value={newGiver}
                      onChange={(e) => setNewGiver(e.target.value as any)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-2 py-3 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
                    >
                      <option value="Him">Him gives</option>
                      <option value="Her">Her gives</option>
                      <option value="Together">Mutual</option>
                    </select>
                    <select
                      value={newReceiver}
                      onChange={(e) => setNewReceiver(e.target.value as any)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-2 py-3 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
                    >
                      <option value="Her">to Her</option>
                      <option value="Him">to Him</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium">Notes / Details</label>
                <textarea
                  required
                  placeholder="Where to get it, why it matters, when you're planning to give it..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-luxury-950 border border-luxury-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-2xl shadow-lg transition glow-red"
                >
                  Save Gift Plan
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGifts.map((gift, index) => (
          <Reveal key={gift.id} delay={Math.min(index * 0.04, 0.4)}>
          <TiltCard maxTilt={4} glare>
          <motion.div
            layout
            className={`rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border ${
              gift.status === "Given"
                ? "bg-luxury-950/60 border-luxury-700/80 shadow-md opacity-90"
                : gift.status === "Received"
                ? "bg-luxury-950/25 border-luxury-900/40 opacity-50 shadow-inner"
                : "bg-luxury-900/40 border-luxury-800 hover:border-luxury-700 hover:shadow-xl"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border text-red-400 border-red-500/20 bg-red-500/5">
                  {gift.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 tracking-wide uppercase">
                  {gift.giver} -&gt; {gift.receiver}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-medium tracking-wide text-neutral-100">{gift.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">{gift.description}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-luxury-800/60 pt-4 flex items-center justify-between gap-4">
              <div className="text-[10px] text-neutral-500 font-light flex items-center gap-1.5">
                {gift.status === "Planned" ? (
                  <span className="text-red-400 font-mono">● Planned</span>
                ) : gift.status === "Given" ? (
                  <span className="flex items-center gap-1 text-red-400">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    Given, awaiting reaction
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-mono">
                    <CircleCheck className="w-3 h-3 shrink-0" />
                    Received with love
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {gift.custom && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this gift plan permanently?")) {
                        onDeleteCustom(gift.id);
                      }
                    }}
                    className="p-1.5 rounded-xl border border-luxury-800 hover:border-red-500/40 text-neutral-500 hover:text-red-400 transition"
                    title="Delete gift plan"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}

                {gift.status === "Planned" && (
                  <button
                    onClick={() => onGive(gift.id)}
                    className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-red-800 hover:bg-red-950/45 text-[10px] font-bold text-neutral-300 transition active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <PackageCheck className="w-3 h-3" />
                    Mark as Given
                  </button>
                )}

                {gift.status === "Given" && (
                  <button
                    onClick={() => onReceive(gift.id)}
                    className="px-4 py-1.5 rounded-xl bg-red-950 border border-red-800/60 text-red-400 text-[10px] font-bold hover:bg-red-900/20 shadow-md glow-red transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    Mark as Received
                    <ChevronRight className="w-3 h-3 stroke-[3px]" />
                  </button>
                )}

                {gift.status === "Received" && (
                  <span className="text-[10px] font-mono text-emerald-500 font-medium px-2 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                    Complete
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          </TiltCard>
          </Reveal>
        ))}

        {filteredGifts.length === 0 && (
          <div className="col-span-full border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
            <GiftIcon className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="text-sm">No gifts planned yet. Click "Plan a Gift" to add one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
