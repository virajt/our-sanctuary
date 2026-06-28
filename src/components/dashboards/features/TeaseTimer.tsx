import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Lock, Unlock } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB, TeaseTimer as TeaseTimerType } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function TeaseTimer({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Him";
  
  const [hours, setHours] = useState(1);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Active timers targeting the current user
  const incomingTimer = db.teaseTimers?.find(t => t.targetRole === role);
  // Timers created by the current user
  const outgoingTimer = db.teaseTimers?.find(t => t.targetRole !== role);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!incomingTimer) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = new Date(incomingTimer.unlockDate).getTime() - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingTimer]);

  const handleCreateTimer = async () => {
    if (!message.trim()) return;
    setIsSaving(true);
    const targetRole = role === "Him" ? "Her" : "Him";
    const unlockDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    
    try {
      await apiFetch("/api/features/teasetimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timer: { id: Date.now().toString(), unlockDate, message, targetRole } })
      });
      fetchDb();
      setMessage("");
    } catch (err) {} finally { setIsSaving(false); }
  };

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400">The Tease Timer</h3>
        <p className="text-sm text-neutral-400">Anticipation is a weapon.</p>
      </div>

      {incomingTimer && timeLeft !== null && (
        <div className="bg-black/60 p-8 rounded-3xl border border-rose-500/30 text-center relative overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.15)]">
          {timeLeft > 0 ? (
            <>
              <Lock className="w-8 h-8 text-rose-500/50 mx-auto mb-6 animate-pulse" />
              <div className="text-5xl font-mono tracking-widest text-white mb-2">{formatTime(timeLeft)}</div>
              <div className="text-xs tracking-widest text-rose-400 uppercase">Until Unlocked</div>
              
              <div className="mt-8 relative h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 blur-md rounded-xl" />
                <span className="text-white/20 italic select-none filter blur-sm">Message Hidden</span>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <Unlock className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-xl text-rose-300 font-serif">Unlocked</h4>
              <div className="p-6 bg-rose-950/30 rounded-2xl border border-rose-500/20 text-rose-100 text-lg italic">
                "{incomingTimer.message}"
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Creating a timer */}
      {!outgoingTimer && (
        <div className="bg-black/40 p-6 rounded-3xl border border-white/10 space-y-6">
          <h4 className="text-sm tracking-widest text-rose-400 uppercase text-center mb-4">Set a Timer for {role === "Him" ? "Her" : "Him"}</h4>
          
          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">Hours to wait</label>
            <input 
              type="range" min="1" max="24" 
              value={hours} onChange={e => setHours(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <div className="text-right text-sm text-rose-400 font-mono mt-1">{hours} hr{hours > 1 ? 's' : ''}</div>
          </div>

          <div>
            <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">Hidden Message / Tease</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none h-24"
              placeholder="What are you going to do to them?"
            />
          </div>

          <button
            onClick={handleCreateTimer}
            disabled={isSaving || !message.trim()}
            className="w-full py-4 rounded-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold tracking-widest uppercase text-sm shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all"
          >
            Start Countdown
          </button>
        </div>
      )}

      {outgoingTimer && (
        <div className="text-center p-6 bg-black/40 rounded-3xl border border-white/5">
          <Clock className="w-6 h-6 text-neutral-500 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">You have an active tease timer running.</p>
        </div>
      )}
    </div>
  );
}
