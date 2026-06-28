import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hand, MapPin } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB, TouchMapSpot } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function TouchMap({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Him";
  
  const [selectedIntensity, setSelectedIntensity] = useState<"Soft" | "Firm" | "Teasing">("Soft");
  const [isSaving, setIsSaving] = useState(false);
  const spots = db.touchMapSpots || [];

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Both of you can now add intentions!
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newSpot: TouchMapSpot = {
      id: Date.now().toString(),
      x,
      y,
      intensity: selectedIntensity,
      addedBy: role
    };

    setIsSaving(true);
    try {
      await apiFetch("/api/features/touchmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spot: newSpot })
      });
      fetchDb();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await apiFetch("/api/features/touchmap/clear", { method: "POST" });
      fetchDb();
    } catch (err) {} finally { setIsSaving(false); }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400">The Touch Map</h3>
        <p className="text-sm text-neutral-400">
          Trace your intentions for each other.
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {(["Soft", "Firm", "Teasing"] as const).map(intensity => (
          <button
            key={intensity}
            onClick={() => setSelectedIntensity(intensity)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-widest border transition-all ${
              selectedIntensity === intensity
                ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-black/40 border-white/10 text-white/50"
            }`}
          >
            {intensity}
          </button>
        ))}
      </div>

      {/* Interactive Silhouette Area */}
      <div 
        className="relative w-full aspect-[1/2] bg-black/60 rounded-3xl border border-white/10 overflow-hidden shadow-2xl cursor-crosshair"
        onClick={handleMapClick}
      >
        {/* Abstract silhouette placeholder (In production, replace with actual SVG/Image) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-950/10 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-1/4 bottom-1/4 mx-auto w-1/2 bg-gradient-to-b from-rose-900/5 to-rose-900/10 blur-[40px] rounded-full pointer-events-none" />
        
        {/* Render Spots */}
        <AnimatePresence>
          {spots.map(spot => (
            <motion.div
              key={spot.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center pointer-events-none"
              style={{ left: \`\${spot.x}%\`, top: \`\${spot.y}%\` }}
            >
              <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${
                spot.intensity === "Soft" ? "bg-pink-400" :
                spot.intensity === "Firm" ? "bg-red-500" : "bg-purple-500"
              }`} />
              <MapPin className={`w-4 h-4 relative z-10 ${
                spot.intensity === "Soft" ? "text-pink-300" :
                spot.intensity === "Firm" ? "text-red-400" : "text-purple-300"
              }`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {spots.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleClear}
            disabled={isSaving}
            className="text-xs text-neutral-500 font-mono tracking-widest hover:text-rose-400 transition"
          >
            CLEAR INTENTIONS
          </button>
        </div>
      )}
    </div>
  );
}
