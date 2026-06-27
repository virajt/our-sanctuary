import React, { useState } from "react";
import { SensoryGift } from "../types";
import { apiFetch } from "../lib/apiFetch";
import { Gift, Heart, Sparkles, CheckCircle2, ChevronRight, Flame, Plus, Trash2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TiltCard from "./effects/TiltCard";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface GiftsViewProps {
  gifts: SensoryGift[];
  categories: string[];
  onClaim: (id: string, claimedBy: "Him" | "Her") => void;
  onRedeem: (id: string) => void;
  onAddGift: (title: string, description: string, category: string, receiver: "Him" | "Her" | "Together") => void;
  onDeleteCustom: (id: string) => void;
}

export default function GiftsView({ gifts, categories, onClaim, onRedeem, onAddGift, onDeleteCustom }: GiftsViewProps) {
  const [filterCat, setFilterCat] = useState<string>("All");
  const [filterReceiver, setFilterReceiver] = useState<string>("All");
  
  // Custom Voucher Form Modal / Accordion toggle
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<string>(categories[0] || "Sensual");
  const [newReceiver, setNewReceiver] = useState<"Him" | "Her" | "Together">("Together");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const response = await apiFetch("/api/gifts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat, receiver: newReceiver }),
      });
      if (response.ok) {
        const data = await response.json();
        setNewTitle(data.title || "");
        setNewDesc(data.description || "");
      }
    } catch (err) {
      console.error("Failed to generate voucher:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter lists
  const filteredGifts = gifts.filter((gift) => {
    const matchCat = filterCat === "All" || gift.category === filterCat;
    const matchRec = filterReceiver === "All" || gift.receiver === filterReceiver;
    return matchCat && matchRec;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    onAddGift(newTitle, newDesc, newCat, newReceiver);
    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setIsAdding(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Pampering": return "text-[#60a5fa] border-[#60a5fa]/20 bg-[#60a5fa]/5";
      case "Sensual": return "text-emerald-450 border-emerald-500/20 bg-emerald-500/5";
      case "Intimate": return "text-purple-400 border-purple-500/20 bg-purple-500/5";
      case "Wicked": return "text-red-400 border-red-500/20 bg-red-500/5";
      default: return "text-neutral-400 border-neutral-800";
    }
  };

  return (
    <div className="space-y-8" id="gifts-module">
      
      {/* Header and Filter Operations */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-red-500 animate-pulse" />
            Vouchers we can redeem anytime
          </h2>
          <p className="text-sm text-neutral-400">Claim, redeem, and customize pampering vouchers and pleasure cards. Categories editable in Admin.</p>
        </div>

        {/* Filters and Add Trigger */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-luxury-950/60 p-1.5 rounded-2xl border border-white/5">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-xs bg-transparent text-neutral-300 border-none outline-none px-2 py-1 cursor-pointer"
            >
              <option value="All" className="bg-luxury-950">All Levels</option>
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
              <option value="All" className="bg-luxury-950">All Recipients</option>
              <option value="Her" className="bg-luxury-950">Vouchers for Her</option>
              <option value="Him" className="bg-luxury-950">Vouchers for Him</option>
              <option value="Together" className="bg-luxury-950">For Both of Us</option>
            </select>
          </div>

          <MagneticButton
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-800 text-white border border-red-700/50 text-xs font-semibold rounded-2xl shadow-lg hover:shadow-red-950/15 transition-all cursor-pointer glow-red"
          >
            <Plus className="w-4 h-4" />
            Create Sensual Voucher
          </MagneticButton>
        </div>
      </div>

      {/* Add Custom Gift Accordion Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/80 border border-luxury-800 rounded-3xl p-6 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-serif text-xl font-medium text-white/95">Design a Custom Couple's Gift</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-neutral-400 font-medium">Voucher Action/Title</label>
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-white transition font-mono border border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-950/45 px-2.5 py-0.5 rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className={`w-3 h-3 text-red-500 ${isGenerating ? "animate-spin" : "animate-pulse"}`} />
                      {isGenerating ? "Weaving Idea..." : "Generate Vibe"}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 Minutes of Unconditional Whispers"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Vibe Level</label>
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
                  <label className="text-xs text-neutral-400 font-medium">Who Claims/Receives It?</label>
                  <select
                    value={newReceiver}
                    onChange={(e) => setNewReceiver(e.target.value as any)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="Her">Her (Voucher given to wife)</option>
                    <option value="Him">Him (Voucher given to husband)</option>
                    <option value="Together">Mutual (For shared moments)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium">Detailed Intimate Description / Rules</label>
                <textarea
                  required
                  placeholder="Describe how to execute this gift beautifully. Include setting details, lighting suggestions, touch requirements, and dynamic boundaries."
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
                  Confirm & Save Voucher
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gifts Responsive Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {filteredGifts.map((gift, index) => {
          const catStyle = getCategoryColor(gift.category);
          
          return (
            <Reveal key={gift.id} delay={Math.min(index * 0.04, 0.4)}>
            <TiltCard maxTilt={4} glare>
            <motion.div
              layout
              className={`rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border ${
                gift.status === "Claimed"
                  ? "bg-luxury-950/60 border-luxury-700/80 shadow-md opacity-90 shadow-luxury-950/50"
                  : gift.status === "Redeemed"
                  ? "bg-luxury-950/25 border-luxury-900/40 opacity-50 shadow-inner"
                  : "bg-luxury-900/40 border-luxury-800 hover:border-luxury-700 hover:shadow-xl"
              }`}
            >
              {/* Abs decoration backdrop line */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-white/2 pointer-events-none rounded-bl-full" />

              <div className="space-y-4">
                
                {/* Status Indicator and Badge Header */}
                <div className="flex items-center justify-between">
                  {/* Category Pill */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border ${catStyle}`}>
                    {gift.category}
                  </span>

                  {/* Claims state */}
                  <span className="text-[10px] font-mono text-neutral-500 tracking-wide uppercase">
                    For: {gift.receiver === "Together" ? "Both" : gift.receiver}
                  </span>
                </div>

                {/* Gift Details */}
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-medium tracking-wide text-neutral-100 flex items-center justify-between">
                    {gift.title}
                    {gift.category === "Wicked" && <Flame className="w-5 h-5 text-red-500 shrink-0" />}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-light">
                    {gift.description}
                  </p>
                </div>
              </div>

              {/* Action and Operations Tray */}
              <div className="mt-6 border-t border-luxury-800/60 pt-4 flex items-center justify-between gap-4">
                
                {/* Left: display metadata state of the claimed gift */}
                <div className="text-[10px] text-neutral-500 font-light flex items-center gap-1.5">
                  {gift.status === "Available" ? (
                    <span className="text-red-400 font-mono">● Active / Available</span>
                  ) : gift.status === "Claimed" ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      Locked with {gift.claimedBy}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  
                  {/* Custom item Trash */}
                  {gift.custom && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this custom voucher permanently?")) {
                          onDeleteCustom(gift.id);
                        }
                      }}
                      className="p-1.5 rounded-xl border border-luxury-800 hover:border-red-500/40 text-neutral-500 hover:text-red-400 transition"
                      title="Delete Custom Voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {gift.status === "Available" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onClaim(gift.id, "Him")}
                        className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-red-800 hover:bg-red-950/45 text-[10px] font-bold text-neutral-300 transition active:scale-95 cursor-pointer"
                      >
                        Claim Him
                      </button>
                      <button
                        onClick={() => onClaim(gift.id, "Her")}
                        className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-red-800 hover:bg-red-950/45 text-[10px] font-bold text-neutral-300 transition active:scale-95 cursor-pointer"
                      >
                        Claim Her
                      </button>
                    </div>
                  )}

                  {gift.status === "Claimed" && (
                    <button
                      onClick={() => onRedeem(gift.id)}
                      className="px-4 py-1.5 rounded-xl bg-red-950 border border-red-800/60 text-red-400 text-[10px] font-bold hover:bg-red-900/20 shadow-md glow-red transition active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      Completed
                      <ChevronRight className="w-3 h-3 stroke-[3px]" />
                    </button>
                  )}

                  {gift.status === "Redeemed" && (
                    <span className="text-[10px] font-mono text-emerald-500 font-medium px-2 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      Claim Completed
                    </span>
                  )}

                </div>
              </div>

            </motion.div>
            </TiltCard>
            </Reveal>
          );
        })}

        {filteredGifts.length === 0 && (
          <div className="col-span-full border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
            <Gift className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="text-sm">No vouchers match your set filter parameters right now.</p>
          </div>
        )}
      </div>

    </div>
  );
}
