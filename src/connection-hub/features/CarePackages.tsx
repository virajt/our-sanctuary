import React, { useState } from "react";
import { Package, Lock, Unlock, ArrowRight } from "lucide-react";
import { CarePackage } from "../../../types";
import { apiFetch } from "../../lib/apiFetch";

export default function CarePackages({ packages, onUpdate }: { packages: CarePackage[], onUpdate: () => void }) {
  const [view, setView] = useState<"list" | "create">("list");
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  
  const handleUnlock = async (id: string) => {
    await apiFetch(`/api/hub/carePackages/${id}/unlock`, { method: "POST" });
    onUpdate();
  };

  const handleSend = async () => {
    if (!message.trim() || !unlockDate) return;
    await apiFetch("/api/hub/carePackages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `package_${Date.now()}`,
        sender: "Him", // Default fallback if needed, but the actual app might know who is logged in
        recipient: "Her", 
        unlockDate,
        message,
        unlocked: false
      })
    });
    setMessage("");
    setUnlockDate("");
    setView("list");
    onUpdate();
  };

  return (
    <div className="flex flex-col space-y-6 max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-950/40 flex items-center justify-center border border-orange-500/30">
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-serif text-white">Virtual Care Packages</h3>
        </div>
        <button 
          onClick={() => setView(view === "list" ? "create" : "list")}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xl text-xs font-mono uppercase tracking-widest transition cursor-pointer"
        >
          {view === "list" ? "+ Prepare Package" : "Cancel"}
        </button>
      </div>

      {view === "create" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <p className="text-xs text-orange-400 font-mono uppercase">Wrap a digital package</p>
          <div className="space-y-4">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="The secret message..." 
              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white min-h-[100px] resize-none" 
            />
            <div className="flex gap-4">
              <input 
                type="date" 
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white" 
              />
              <button 
                onClick={handleSend}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 rounded-xl transition cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packages.length === 0 && (
             <div className="col-span-full py-12 text-center text-white/30 text-sm font-light border border-dashed border-white/10 rounded-2xl">
               No care packages waiting. Send a surprise!
             </div>
          )}
          {packages.map(pkg => {
            const isUnlockable = new Date(pkg.unlockDate) <= new Date();
            return (
              <div key={pkg.id} className="relative group bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full blur-2xl" />
                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-mono text-orange-400/80 bg-orange-950/30 px-2 py-1 rounded">From {pkg.sender}</span>
                  {pkg.unlocked ? <Unlock className="w-4 h-4 text-white/40" /> : <Lock className="w-4 h-4 text-orange-500" />}
                </div>
                
                <div className="z-10">
                  {pkg.unlocked ? (
                    <p className="text-white text-sm font-light leading-relaxed">{pkg.message}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <p className="text-xs text-white/50">Unlocks on</p>
                      <p className="text-lg font-mono text-white">{pkg.unlockDate}</p>
                      {isUnlockable && (
                        <button 
                          onClick={() => handleUnlock(pkg.id)}
                          className="mt-2 px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500 border border-orange-500 text-orange-100 hover:text-white rounded-lg text-xs uppercase tracking-widest transition cursor-pointer flex items-center gap-2"
                        >
                          Open <ArrowRight className="w-3 h-3" />
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
