import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Eye, Trash } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB, Whisper } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function Whispers({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Him";
  
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [readingId, setReadingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const whispers = db.whispers || [];
  const incoming = whispers.filter(w => w.sender !== role);
  const outgoing = whispers.filter(w => w.sender === role);

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    try {
      await apiFetch("/api/features/whispers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whisper: { id: Date.now().toString(), sender: role, text, timestamp: new Date().toISOString() } })
      });
      fetchDb();
      setText("");
    } catch (err) {} finally { setIsSaving(false); }
  };

  const handleReveal = (id: string) => {
    setReadingId(id);
    setTimeLeft(10);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDestroy(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConceal = () => {
    if (readingId) handleDestroy(readingId);
  };

  const handleDestroy = async (id: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setReadingId(null);
    try {
      await apiFetch("/api/features/whispers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchDb();
    } catch (err) {}
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400">Whispers</h3>
        <p className="text-sm text-neutral-400">Hold to read. Released to the void forever.</p>
      </div>

      {/* Incoming Whispers */}
      {incoming.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs text-rose-500 uppercase tracking-widest px-2">Unheard Whispers</h4>
          {incoming.map(w => (
            <div key={w.id} className="relative">
              <AnimatePresence mode="wait">
                {readingId === w.id ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    className="p-6 bg-rose-950/40 rounded-3xl border border-rose-500/50 shadow-[0_0_30px_rgba(225,29,72,0.2)]"
                    onPointerUp={handleConceal}
                    onPointerLeave={handleConceal}
                  >
                    <div className="text-right text-rose-400 font-mono text-xs mb-4 animate-pulse">Destructing in {timeLeft}s...</div>
                    <p className="text-rose-100 text-lg italic text-center leading-relaxed">"{w.text}"</p>
                    <div className="mt-6 text-center text-xs text-neutral-500">Release to destroy immediately</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden"
                    className="p-6 bg-black/60 rounded-3xl border border-white/10 flex items-center justify-between cursor-pointer hover:border-rose-500/50 transition-colors group select-none"
                    onPointerDown={() => handleReveal(w.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Eye className="w-5 h-5 text-rose-400" />
                      </div>
                      <div className="text-sm text-neutral-300">New Whisper</div>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">Press & Hold</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Compose */}
      <div className="bg-black/40 p-6 rounded-3xl border border-white/10 space-y-4">
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none h-24"
          placeholder="Whisper something..."
        />
        <button
          onClick={handleSend}
          disabled={isSaving || !text.trim()}
          className="w-full py-4 rounded-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all"
        >
          <Send className="w-4 h-4" /> Send Whisper
        </button>
      </div>

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs text-neutral-500 uppercase tracking-widest px-2">Waiting to be heard</h4>
          {outgoing.map(w => (
            <div key={w.id} className="p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center justify-between">
              <span className="text-neutral-500 italic text-sm truncate pr-4">"{w.text}"</span>
              <button onClick={() => handleDestroy(w.id)} className="text-neutral-600 hover:text-rose-500 p-2">
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
