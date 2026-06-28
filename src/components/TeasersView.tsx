import React, { useState } from "react";
import { Teaser } from "../types";
import { Clock, Plus, Trash, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface TeasersViewProps {
  teasers: Teaser[];
  onAddTeaser: (title: string, targetDate: string, createdBy: "Him" | "Her", notifyWho: "Him" | "Her" | "Both", hints: { daysBefore: number; message: string }[]) => void;
  onDeleteTeaser: (id: string) => void;
}

export default function TeasersView({ teasers, onAddTeaser, onDeleteTeaser }: TeasersViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [createdBy, setCreatedBy] = useState<"Him" | "Her">("Him");
  const [notifyWho, setNotifyWho] = useState<"Him" | "Her" | "Both">("Her");
  const [hints, setHints] = useState<{ daysBefore: number; message: string }[]>([
    { daysBefore: 3, message: "" },
    { daysBefore: 1, message: "" },
    { daysBefore: 0, message: "" },
  ]);

  const updateHint = (index: number, field: "daysBefore" | "message", value: string) => {
    setHints((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: field === "daysBefore" ? Number(value) : value } : h)));
  };

  const addHintRow = () => setHints((prev) => [...prev, { daysBefore: 0, message: "" }]);
  const removeHintRow = (index: number) => setHints((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filledHints = hints.filter((h) => h.message.trim());
    if (!title.trim() || !targetDate || filledHints.length === 0) return;
    onAddTeaser(title, targetDate, createdBy, notifyWho, filledHints);
    setTitle("");
    setTargetDate("");
    setHints([{ daysBefore: 3, message: "" }, { daysBefore: 1, message: "" }, { daysBefore: 0, message: "" }]);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8" id="teasers-module">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-red-500 animate-pulse" />
            Teasers
          </h2>
          <p className="text-sm text-neutral-400">Plan something, then let escalating hints build anticipation by email as the day gets closer.</p>
        </div>
        <MagneticButton
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-800 text-white border border-red-700/50 text-xs font-semibold rounded-2xl shadow-lg transition-all cursor-pointer glow-red"
        >
          <Plus className="w-4 h-4" />
          Plan a Teaser
        </MagneticButton>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">What's being teased</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Friday night surprise"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Target date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Who's planning this</label>
                  <select
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value as any)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="Him">Him</option>
                    <option value="Her">Her</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Who receives the hints</label>
                  <select
                    value={notifyWho}
                    onChange={(e) => setNotifyWho(e.target.value as any)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="Her">Her</option>
                    <option value="Him">Him</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-400 font-medium">Escalating hints (set your own schedule)</label>
                  <button type="button" onClick={addHintRow} className="text-[11px] text-red-400 hover:text-red-300 font-mono uppercase">
                    + Add stage
                  </button>
                </div>
                {hints.map((hint, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={hint.daysBefore}
                        onChange={(e) => updateHint(index, "daysBefore", e.target.value)}
                        className="w-16 bg-luxury-950 border border-luxury-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-red-700"
                      />
                      <span className="text-[10px] text-neutral-500 font-mono whitespace-nowrap">days before</span>
                    </div>
                    <textarea
                      rows={1}
                      placeholder={hint.daysBefore === 0 ? "Day-of message..." : "Hint message..."}
                      value={hint.message}
                      onChange={(e) => updateHint(index, "message", e.target.value)}
                      className="flex-1 bg-luxury-950 border border-luxury-800 focus:border-red-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition resize-none"
                    />
                    {hints.length > 1 && (
                      <button type="button" onClick={() => removeHintRow(index)} className="text-neutral-600 hover:text-red-400 transition shrink-0 p-2">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-2xl shadow-lg transition glow-red">
                  Schedule Teaser
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teasers.map((teaser, index) => (
          <Reveal key={teaser.id} delay={Math.min(index * 0.04, 0.3)}>
            <div className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg text-neutral-100">{teaser.title}</h3>
                  <p className="text-[10px] text-neutral-500 font-mono">{teaser.targetDate} - hints go to {teaser.notifyWho}</p>
                </div>
                <button onClick={() => onDeleteTeaser(teaser.id)} className="text-neutral-600 hover:text-red-400 transition shrink-0">
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {teaser.hints.map((hint, i) => {
                  const sent = (teaser.sentHintDays || []).includes(hint.daysBefore);
                  return (
                    <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${sent ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400" : "border-luxury-800 bg-luxury-950/40 text-neutral-400"}`}>
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="font-mono text-[10px] uppercase shrink-0">{hint.daysBefore === 0 ? "Day-of" : `-${hint.daysBefore}d`}</span>
                      <span className="truncate">{hint.message}</span>
                      {sent && <span className="text-[9px] ml-auto shrink-0">sent</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        ))}
        {teasers.length === 0 && (
          <div className="col-span-full border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
            <Clock className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="text-sm">No teasers planned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
