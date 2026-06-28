import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Heart, Sparkles, BookOpen } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB, AfterglowLogEntry } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function AfterglowLog({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Her";
  
  const [isSaving, setIsSaving] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [highlights, setHighlights] = useState("");
  
  const logs = [...(db.afterglowLogs || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleLog = async () => {
    if (!highlights.trim()) return;
    setIsSaving(true);
    
    const entry: AfterglowLogEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      intensity,
      highlights,
      loggedBy: role as "Him" | "Her"
    };

    try {
      await apiFetch("/api/features/afterglow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry })
      });
      fetchDb();
      setHighlights("");
      setIntensity(5);
    } catch (err) {} finally { setIsSaving(false); }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400 flex items-center justify-center gap-2">
          <Flame className="w-6 h-6" /> Afterglow Log
        </h3>
        <p className="text-sm text-neutral-400">
          {role === "Her" 
            ? "Log what felt best. Build your profile of desire."
            : "Study her history. Perfect your technique."}
        </p>
      </div>

      {role === "Her" && (
        <div className="bg-black/40 rounded-3xl p-6 border border-white/10 space-y-6 shadow-2xl">
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-4 text-center">Physical Intensity: {intensity}/10</label>
            <input 
              type="range" min="1" max="10" 
              value={intensity} onChange={e => setIntensity(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">What drove you crazy today?</label>
            <textarea
              value={highlights} onChange={e => setHighlights(e.target.value)}
              placeholder="e.g., When he held my waist..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:border-rose-500/50 outline-none resize-none h-24"
            />
          </div>

          <button
            onClick={handleLog}
            disabled={isSaving || !highlights.trim()}
            className="w-full py-4 rounded-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all"
          >
            Log Entry
          </button>
        </div>
      )}

      {/* History Log */}
      <div className="space-y-4">
        <h4 className="text-xs text-rose-500 uppercase tracking-widest text-center mb-4">Historical Desires</h4>
        {logs.length === 0 ? (
          <div className="text-center p-6 bg-black/30 rounded-2xl border border-white/5">
            <p className="text-neutral-500 text-sm">No entries logged yet.</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="p-5 bg-black/60 rounded-2xl border border-white/10 space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs text-neutral-500 font-mono">{new Date(log.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-1 text-rose-400">
                  <span className="text-sm font-bold">{log.intensity}</span>
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <p className="text-rose-100 text-sm italic leading-relaxed">"{log.highlights}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
