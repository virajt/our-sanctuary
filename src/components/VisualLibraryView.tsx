import React, { useState } from "react";
import { VisualLibraryItem } from "../types";
import { Heart, Filter } from "lucide-react";
import TiltCard from "./effects/TiltCard";
import Reveal from "./effects/Reveal";

interface VisualLibraryViewProps {
  items: VisualLibraryItem[];
}

export default function VisualLibraryView({ items }: VisualLibraryViewProps) {
  const [filterCat, setFilterCat] = useState<string>("All");
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = filterCat === "All" ? items : items.filter((i) => i.category === filterCat);

  return (
    <div className="space-y-8" id="visual-library-module">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 animate-pulse" />
            Visual Library
          </h2>
          <p className="text-sm text-neutral-400">Ideas and moods to inspire connection - browse by category.</p>
        </div>
        <div className="flex items-center gap-2 bg-luxury-950/60 p-1.5 rounded-2xl border border-white/5">
          <Filter className="w-3.5 h-3.5 text-neutral-500 ml-2" />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-xs bg-transparent text-neutral-300 border-none outline-none px-2 py-1 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-luxury-950">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((item, index) => (
          <Reveal key={item.id} delay={Math.min(index * 0.04, 0.4)}>
          <TiltCard maxTilt={4} glare>
            <div className="bg-luxury-900/40 border border-luxury-800 hover:border-luxury-700 rounded-3xl p-6 space-y-3 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border text-red-400 border-red-500/20 bg-red-500/5">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">{item.mood}</span>
              </div>
              <h3 className="font-serif text-xl font-medium tracking-wide text-neutral-100">{item.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">{item.description}</p>
              <div className="pt-2 border-t border-luxury-800/60 flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Intimacy:</span>
                <span className="text-[10px] text-red-400 font-mono">{item.intimacyLevel}</span>
              </div>
            </div>
          </TiltCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
