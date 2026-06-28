import React, { useState } from "react";
import { Clock, Lock, Unlock, ArrowRight } from "lucide-react";
import { TimeCapsule } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function TimeCapsules({ capsules, onUpdate }: { capsules: TimeCapsule[], onUpdate: () => void }) {
  const [view, setView] = useState<"list" | "create">("list");
  
  const handleUnlock = async (id: string) => {
    // Re-use care package endpoint structure for unlocking
    await apiFetch(`/api/hub/carePackages/${id}/unlock`, { method: "POST" });
    onUpdate();
  };

  return (
    <div className="flex flex-col space-y-6 max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-950/40 flex items-center justify-center border border-purple-500/30">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-xl font-serif text-white">Time Capsules</h3>
        </div>
        <button 
          onClick={() => setView(view === "list" ? "create" : "list")}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xl text-xs font-mono uppercase tracking-widest transition cursor-pointer"
        >
          {view === "list" ? "+ Bury Capsule" : "Cancel"}
        </button>
      </div>

      {view === "create" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <p className="text-xs text-purple-400 font-mono uppercase">Seal a message for the future</p>
          <div className="space-y-4">
            <textarea placeholder="Write a message to your future selves..." className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white min-h-[120px] resize-none" />
            <div className="flex gap-4">
              <input type="date" className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white" />
              <button 
                onClick={() => setView("list")}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-xl transition cursor-pointer"
              >
                Seal
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {capsules.length === 0 && (
             <div className="col-span-full py-12 text-center text-white/30 text-sm font-light border border-dashed border-white/10 rounded-2xl">
               No time capsules sealed.
             </div>
          )}
          {capsules.map(cap => {
            const isUnlockable = new Date(cap.unlockDate) <= new Date();
            return (
              <div key={cap.id} className="relative group bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full blur-2xl" />
                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-mono text-purple-400/80 bg-purple-950/30 px-2 py-1 rounded">Sealed by {cap.creator}</span>
                  {cap.unlocked ? <Unlock className="w-4 h-4 text-white/40" /> : <Lock className="w-4 h-4 text-purple-500" />}
                </div>
                
                <div className="z-10">
                  {cap.unlocked ? (
                    <p className="text-white text-sm font-light leading-relaxed">{cap.content}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <p className="text-xs text-white/50">Unlocks on</p>
                      <p className="text-lg font-mono text-white">{cap.unlockDate}</p>
                      {isUnlockable && (
                        <button 
                          onClick={() => handleUnlock(cap.id)}
                          className="mt-2 px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500 border border-purple-500 text-purple-100 hover:text-white rounded-lg text-xs uppercase tracking-widest transition cursor-pointer flex items-center gap-2"
                        >
                          Unlock <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
