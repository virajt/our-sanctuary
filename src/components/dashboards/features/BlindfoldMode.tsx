import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Headphones, EyeOff, Play, Pause, ChevronRight } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB, BlindfoldCommand } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function BlindfoldMode({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Him";
  
  const [isSaving, setIsSaving] = useState(false);
  const [newCommandText, setNewCommandText] = useState("");
  
  const commands = [...(db.blindfoldCommands || [])].sort((a, b) => a.order - b.order);
  const activeCommandIndex = commands.findIndex(c => !c.isSpoken);
  const activeCommand = activeCommandIndex !== -1 ? commands[activeCommandIndex] : null;

  // Audio synthesis for Her View
  useEffect(() => {
    if (role === "Her" && activeCommand && typeof window !== "undefined") {
      const utterance = new SpeechSynthesisUtterance(activeCommand.text);
      utterance.pitch = 0.8;
      utterance.rate = 0.85;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [activeCommand, role]);

  const handleAddCommand = async () => {
    if (!newCommandText.trim()) return;
    setIsSaving(true);
    
    const cmd: BlindfoldCommand = {
      id: Date.now().toString(),
      text: newCommandText,
      isSpoken: false,
      order: commands.length
    };

    try {
      await apiFetch("/api/features/blindfold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      fetchDb();
      setNewCommandText("");
    } catch (err) {} finally { setIsSaving(false); }
  };

  const handleNextCommand = async (id: string) => {
    setIsSaving(true);
    try {
      await apiFetch("/api/features/blindfold/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchDb();
    } catch (err) {} finally { setIsSaving(false); }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await apiFetch("/api/features/blindfold/reset", { method: "POST" });
      fetchDb();
    } catch (err) {} finally { setIsSaving(false); }
  };

  if (role === "Her") {
    // Her View: Pitch black, audio only
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <EyeOff className="w-16 h-16 text-neutral-800 animate-pulse mb-8" />
        <h2 className="text-3xl text-neutral-600 font-serif mb-4">Blindfold Mode</h2>
        <p className="text-neutral-500 text-sm tracking-widest uppercase">Do not look. Just listen.</p>
        
        {activeCommand && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Headphones className="w-64 h-64 text-white animate-ping" />
          </div>
        )}
      </div>
    );
  }

  // His View: The Guide
  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400 flex items-center justify-center gap-2">
          <Mic className="w-6 h-6" /> Audio Guide
        </h3>
        <p className="text-sm text-neutral-400">
          Dictate her reality. The AI will softly speak your commands to her.
        </p>
      </div>

      <div className="bg-black/40 rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="space-y-4">
          {commands.map((cmd, idx) => (
            <div key={cmd.id} className={`p-4 rounded-xl border flex justify-between items-center ${cmd.isSpoken ? 'bg-black/60 border-white/5 opacity-50' : 'bg-rose-950/20 border-rose-500/30'}`}>
              <div className="flex-1">
                <div className="text-xs text-neutral-500 mb-1">Command {idx + 1}</div>
                <div className={`text-sm ${cmd.isSpoken ? 'text-neutral-500' : 'text-rose-100'} italic`}>"{cmd.text}"</div>
              </div>
              {!cmd.isSpoken && activeCommandIndex === idx && (
                <button
                  onClick={() => handleNextCommand(cmd.id)}
                  disabled={isSaving}
                  className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                >
                  <Play className="w-5 h-5 ml-1" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10 space-y-4">
          <input
            type="text"
            value={newCommandText} onChange={e => setNewCommandText(e.target.value)}
            placeholder="e.g. Run an ice cube down my neck..."
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20"
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddCommand();
            }}
          />
          <button
            onClick={handleAddCommand}
            disabled={isSaving || !newCommandText.trim()}
            className="w-full py-3 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/50 hover:bg-rose-600 hover:text-white transition flex items-center justify-center text-sm uppercase tracking-widest"
          >
            Queue Command
          </button>
        </div>
      </div>

      {commands.length > 0 && (
        <button onClick={handleReset} disabled={isSaving} className="w-full text-center text-xs tracking-widest text-neutral-500 hover:text-rose-400">
          CLEAR SESSION
        </button>
      )}
    </div>
  );
}
