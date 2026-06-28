import React, { useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { DailyPrompt } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function DailyPrompts({ prompts, onUpdate }: { prompts: DailyPrompt[], onUpdate: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const todayPrompt = prompts.find(p => p.date === today) || { id: "p1", date: today, question: "What is a childhood memory you've never shared with me?" };
  
  const [partner, setPartner] = useState<"Him" | "Her">("Him");
  const [answer, setAnswer] = useState("");
  
  const hasHis = !!todayPrompt.hisAnswer;
  const hasHers = !!todayPrompt.herAnswer;
  const bothAnswered = hasHis && hasHers;

  const handleSubmit = async () => {
    await apiFetch(`/api/hub/dailyPrompts/${todayPrompt.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner, answer })
    });
    setAnswer("");
    onUpdate();
  };

  return (
    <div className="flex flex-col space-y-6 max-w-xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-950/40 flex items-center justify-center border border-amber-500/30">
          <BookOpen className="w-5 h-5 text-amber-500" />
        </div>
        <h3 className="text-xl font-serif text-white">Daily Blind Reveal</h3>
      </div>
      
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
        <p className="text-xs font-mono text-amber-400 uppercase tracking-widest">Question of the Day</p>
        <p className="text-lg text-white font-light">{todayPrompt.question}</p>
        
        {!bothAnswered && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setPartner("Him")} className={`px-4 py-1.5 text-xs font-mono rounded-full border transition ${partner === 'Him' ? 'border-amber-500 text-amber-300 bg-amber-950/40' : 'border-white/10 text-white/40'}`}>Him</button>
              <button onClick={() => setPartner("Her")} className={`px-4 py-1.5 text-xs font-mono rounded-full border transition ${partner === 'Her' ? 'border-amber-500 text-amber-300 bg-amber-950/40' : 'border-white/10 text-white/40'}`}>Her</button>
            </div>
            
            {(partner === "Him" && hasHis) || (partner === "Her" && hasHers) ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">
                <Check className="w-4 h-4" /> You've locked in your answer. Waiting for partner.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your honest answer..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500/50 min-h-[100px] resize-none"
                />
                <button 
                  onClick={handleSubmit}
                  className="self-end px-6 py-2 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/40 text-amber-300 hover:text-white rounded-xl text-xs font-bold font-mono tracking-widest uppercase transition cursor-pointer"
                >
                  Submit & Lock
                </button>
              </div>
            )}
          </div>
        )}
        
        {bothAnswered && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
              <p className="text-xs text-amber-500/70 font-mono mb-1">His Answer:</p>
              <p className="text-white/80">{todayPrompt.hisAnswer}</p>
            </div>
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
              <p className="text-xs text-amber-500/70 font-mono mb-1">Her Answer:</p>
              <p className="text-white/80">{todayPrompt.herAnswer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
