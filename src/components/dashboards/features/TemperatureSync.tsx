import React, { useState } from "react";
import { motion } from "motion/react";
import { ThermometerSun } from "lucide-react";
import { SanctuaryDB } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";
import { useAuth } from "../../../hooks/useAuth";

export default function TemperatureSync({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const temperatures = ["Warm", "Hot", "Melting"] as const;
  const currentTemp = db.wifeTemperature || "Warm";

  const updateTemperature = async (temp: string) => {
    setIsUpdating(true);
    try {
      await apiFetch("/api/features/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature: temp })
      });
      fetchDb();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (user?.role === "Him") {
    return (
      <div className="w-full p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <ThermometerSun className="w-5 h-5" />
          <h4 className="font-serif text-lg">Her Current State</h4>
        </div>
        <div className="text-3xl font-serif text-white tracking-widest uppercase">
          {currentTemp}
        </div>
        <p className="text-xs text-neutral-500 font-mono">
          The sanctuary's ambient light shifts to reflect her desires.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-2xl bg-black/40 border border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-rose-400">
          <ThermometerSun className="w-5 h-5" />
          <h4 className="font-serif text-lg">Set Your State</h4>
        </div>
        <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
          Syncs to his display
        </span>
      </div>

      <div className="flex gap-2">
        {temperatures.map((t) => (
          <button
            key={t}
            onClick={() => updateTemperature(t)}
            disabled={isUpdating}
            className={`flex-1 py-3 rounded-xl border transition-all duration-300 font-serif ${
              currentTemp === t
                ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                : "bg-black/40 border-white/10 text-white/50 hover:bg-white/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
