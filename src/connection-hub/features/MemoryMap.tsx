import React, { useState } from "react";
import { Map, MapPin } from "lucide-react";
import { MemoryPin } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function MemoryMap({ pins, onUpdate }: { pins: MemoryPin[], onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  
  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto py-8 h-[600px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-950/40 flex items-center justify-center border border-emerald-500/30">
            <Map className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-xl font-serif text-white">Interactive Memory Map</h3>
        </div>
        <button 
          onClick={() => setAdding(!adding)}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-xl transition border cursor-pointer ${adding ? 'bg-emerald-950/60 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}
        >
          {adding ? "Cancel" : "Drop Pin"}
        </button>
      </div>

      <div className="flex-1 bg-[#1a1b1e] border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
        {/* Placeholder SVG Map Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 1000 500" className="w-[120%] h-auto fill-emerald-500/40 stroke-emerald-900/50">
            <path d="M100,100 Q150,50 200,100 T300,100 T400,150 T500,100 T600,150 T700,100 T800,150 T900,100 L900,400 L100,400 Z" />
            <path d="M50,200 Q100,150 150,200 T250,200 T350,250 T450,200 T550,250 T650,200 T750,250 T850,200 L850,300 L50,300 Z" />
          </svg>
        </div>

        {/* Map Click Handler Overlay */}
        <div 
          className={`absolute inset-0 z-10 ${adding ? 'cursor-crosshair' : ''}`}
          onClick={async (e) => {
            if (!adding) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            const title = prompt("Name this memory:");
            if (!title) return;
            
            await apiFetch("/api/hub/memoryPins", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: `pin_${Date.now()}`,
                lat: y,
                lng: x,
                title,
                description: "",
                date: new Date().toISOString()
              })
            });
            setAdding(false);
            onUpdate();
          }}
        >
          {pins.map(pin => (
            <div 
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group"
              style={{ top: `${pin.lat}%`, left: `${pin.lng}%` }}
            >
              <MapPin className="w-6 h-6 text-emerald-400 drop-shadow-md group-hover:scale-125 transition-transform" />
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap text-white transition-opacity pointer-events-none">
                {pin.title}
              </div>
            </div>
          ))}
        </div>
        
        {adding && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-950/80 backdrop-blur-xl border border-emerald-500/50 text-emerald-100 text-xs font-mono px-4 py-2 rounded-full shadow-lg z-20 pointer-events-none">
            Click anywhere on the map to drop a pin.
          </div>
        )}
      </div>
    </div>
  );
}
