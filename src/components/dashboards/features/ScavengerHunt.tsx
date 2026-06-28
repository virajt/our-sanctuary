import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Map, CircleCheck, Lock, Plus, Trash, ArrowRight } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB, ScavengerClue } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function ScavengerHunt({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Him";
  const [isSaving, setIsSaving] = useState(false);

  const clues = [...(db.scavengerClues || [])].sort((a, b) => a.order - b.order);
  
  // Game Master State (Him)
  const [newClueText, setNewClueText] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Player State (Her)
  const [guess, setGuess] = useState("");
  const [showError, setShowError] = useState(false);

  const handleAddClue = async () => {
    if (!newClueText.trim() || !newAnswer.trim()) return;
    setIsSaving(true);
    
    const newClue: ScavengerClue = {
      id: Date.now().toString(),
      clueText: newClueText,
      answer: newAnswer.toLowerCase().trim(),
      isSolved: false,
      order: clues.length
    };

    try {
      await apiFetch("/api/features/scavenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clue: newClue })
      });
      fetchDb();
      setNewClueText("");
      setNewAnswer("");
    } catch (err) {} finally { setIsSaving(false); }
  };

  const handleRemoveClue = async (id: string) => {
    setIsSaving(true);
    try {
      await apiFetch("/api/features/scavenger/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchDb();
    } catch (err) {} finally { setIsSaving(false); }
  };

  const handleGuess = async (clueId: string, correctAnswer: string) => {
    if (guess.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
      setShowError(false);
      setIsSaving(true);
      try {
        await apiFetch("/api/features/scavenger/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: clueId })
        });
        fetchDb();
        setGuess("");
      } catch (err) {} finally { setIsSaving(false); }
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const resetGame = async () => {
    setIsSaving(true);
    try {
      await apiFetch("/api/features/scavenger/reset", { method: "POST" });
      fetchDb();
    } catch (err) {} finally { setIsSaving(false); }
  };

  const activeClueIndex = clues.findIndex(c => !c.isSolved);
  const isComplete = clues.length > 0 && activeClueIndex === -1;
  const activeClue = activeClueIndex !== -1 ? clues[activeClueIndex] : null;

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400 flex items-center justify-center gap-2">
          <Map className="w-6 h-6" /> The Hunt
        </h3>
        <p className="text-sm text-neutral-400">
          {role === "Him" 
            ? "You are the Game Master. Lay out the clues."
            : "Follow the breadcrumbs to your ultimate reward."}
        </p>
      </div>

      {isComplete && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-rose-950/40 rounded-3xl border border-rose-500/50 text-center shadow-[0_0_40px_rgba(225,29,72,0.2)]"
        >
          <CircleCheck className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h4 className="text-2xl text-rose-300 font-serif mb-2">Hunt Completed</h4>
          <p className="text-rose-200/70 text-sm">
            {role === "Him" 
              ? "She has solved every clue. It is time for her reward."
              : "You solved them all. Go collect your reward from him."}
          </p>
        </motion.div>
      )}

      {/* Game Master View */}
      {role === "Him" && (
        <div className="space-y-6">
          <div className="bg-black/40 rounded-3xl p-6 border border-white/10 space-y-4">
            <h4 className="text-xs text-rose-500 uppercase tracking-widest text-center mb-4">Master Control</h4>
            
            <div className="space-y-4">
              {clues.map((c, idx) => (
                <div key={c.id} className={`p-4 rounded-xl border ${c.isSolved ? 'bg-rose-950/20 border-rose-500/30' : 'bg-black/60 border-white/5'} flex justify-between items-center`}>
                  <div className="flex-1">
                    <div className="text-xs text-neutral-500 mb-1">Clue {idx + 1} {c.isSolved && <span className="text-rose-400 ml-2">(Solved)</span>}</div>
                    <div className="text-sm text-neutral-200 italic">"{c.clueText}"</div>
                    <div className="text-xs text-neutral-500 font-mono mt-2">Ans: {c.answer}</div>
                  </div>
                  <button onClick={() => handleRemoveClue(c.id)} className="p-2 hover:text-rose-500 text-neutral-600 transition">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <textarea
                value={newClueText} onChange={e => setNewClueText(e.target.value)}
                placeholder="Where should she look? Or what riddle must she solve?"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 h-20"
              />
              <input
                type="text"
                value={newAnswer} onChange={e => setNewAnswer(e.target.value)}
                placeholder="The exact answer (e.g. 'Bedroom')"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20"
              />
              <button
                onClick={handleAddClue}
                disabled={isSaving || !newClueText.trim() || !newAnswer.trim()}
                className="w-full py-3 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/50 hover:bg-rose-600 hover:text-white transition flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Add Next Clue
              </button>
            </div>
          </div>
          
          {clues.length > 0 && (
            <button onClick={resetGame} disabled={isSaving} className="w-full text-xs tracking-widest text-neutral-500 hover:text-rose-400">
              RESET ENTIRE HUNT
            </button>
          )}
        </div>
      )}

      {/* Player View */}
      {role === "Her" && activeClue && (
        <div className="bg-black/60 p-8 rounded-3xl border border-white/10 text-center relative shadow-2xl">
          <div className="absolute top-4 left-0 w-full text-center text-xs tracking-widest text-neutral-500">
            CLUE {activeClueIndex + 1} OF {clues.length}
          </div>
          
          <Lock className="w-8 h-8 text-neutral-600 mx-auto mt-6 mb-6" />
          
          <h4 className="text-xl text-rose-100 font-serif italic mb-8 leading-relaxed">
            "{activeClue.clueText}"
          </h4>

          <div className="relative">
            <input
              type="text"
              value={guess}
              onChange={e => {
                setGuess(e.target.value);
                setShowError(false);
              }}
              placeholder="Enter the answer..."
              className={`w-full bg-black/80 border ${showError ? 'border-red-500' : 'border-rose-500/30'} rounded-full py-4 px-6 text-center text-white placeholder-white/20 focus:outline-none focus:border-rose-500 transition-colors`}
              onKeyDown={e => {
                if (e.key === 'Enter') handleGuess(activeClue.id, activeClue.answer);
              }}
            />
            <button
              onClick={() => handleGuess(activeClue.id, activeClue.answer)}
              disabled={isSaving || !guess.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-rose-600 rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          {showError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-3 tracking-widest">
              INCORRECT. TRY AGAIN.
            </motion.p>
          )}
        </div>
      )}

      {role === "Her" && !activeClue && clues.length === 0 && (
        <div className="text-center p-8 bg-black/40 rounded-3xl border border-white/5">
          <p className="text-neutral-500 text-sm">The Game Master has not placed any clues yet. Be patient.</p>
        </div>
      )}
    </div>
  );
}
