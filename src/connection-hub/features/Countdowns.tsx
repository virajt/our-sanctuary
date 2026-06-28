import React, { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { CountdownEvent } from "../../../types";
import { apiFetch } from "../../lib/apiFetch";

export default function Countdowns({ countdowns, onUpdate }: { countdowns: CountdownEvent[], onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  
  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch("/api/hub/countdowns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `cd_${Date.now()}`,
        title: fd.get("title"),
        targetDate: fd.get("date"),
        themeColor: fd.get("color")
      })
    });
    setAdding(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/hub/countdowns/${id}`, { method: "DELETE" });
    onUpdate();
  };

  return (
    <div className="flex flex-col space-y-8 max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fuchsia-950/40 flex items-center justify-center border border-fuchsia-500/30">
            <CalendarDays className="w-5 h-5 text-fuchsia-500" />
          </div>
          <h3 className="text-xl font-serif text-white">Countdowns</h3>
        </div>
        <button 
          onClick={() => setAdding(!adding)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition border cursor-pointer ${adding ? 'bg-fuchsia-950/60 border-fuchsia-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}
        >
          <Plus className={`w-5 h-5 transition-transform ${adding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-black/40 border border-white/10 p-6 rounded-2xl flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Event Name</label>
            <input name="title" required type="text" className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Date</label>
            <input name="date" required type="date" className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Color</label>
            <input name="color" type="color" defaultValue="#e879f9" className="w-12 h-10 rounded-xl border border-white/10 p-1 cursor-pointer" />
          </div>
          <button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold h-10 px-6 rounded-xl transition cursor-pointer">
            Add
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {countdowns.length === 0 && !adding && (
           <div className="col-span-full py-12 text-center text-white/30 text-sm font-light border border-dashed border-white/10 rounded-2xl">
             No upcoming events tracked. Add your next visit!
           </div>
        )}
        {countdowns.map(cd => {
          const target = new Date(cd.targetDate);
          const days = Math.ceil((target.getTime() - new Date().getTime()) / 86400000);
          
          return (
            <div key={cd.id} className="relative group overflow-hidden bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between aspect-video">
              <div 
                className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30"
                style={{ background: `linear-gradient(45deg, ${cd.themeColor}, transparent)` }}
              />
              <div className="flex justify-between items-start z-10">
                <h4 className="text-2xl font-serif text-white">{cd.title}</h4>
                <button 
                  onClick={() => handleDelete(cd.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="z-10 flex items-baseline gap-2">
                <span className="text-6xl font-light tracking-tighter" style={{ color: cd.themeColor }}>
                  {Math.max(0, days)}
                </span>
                <span className="text-white/50 text-sm uppercase tracking-widest font-mono">Days</span>
              </div>
              <p className="z-10 text-xs text-white/40 font-mono">{cd.targetDate}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
