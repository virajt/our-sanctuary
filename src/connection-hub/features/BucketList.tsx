import React, { useState } from "react";
import { CheckSquare, Plus, Check } from "lucide-react";
import { BucketListItem } from "../../../types";
import { apiFetch } from "../../lib/apiFetch";

export default function BucketList({ items, onUpdate }: { items: BucketListItem[], onUpdate: () => void }) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await apiFetch("/api/hub/bucketList", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `bucket_${Date.now()}`,
        title: newItem,
        completed: false
      })
    });
    setNewItem("");
    onUpdate();
  };

  const handleToggle = async (id: string) => {
    await apiFetch(`/api/hub/bucketList/${id}/toggle`, { method: "POST" });
    onUpdate();
  };

  return (
    <div className="flex flex-col space-y-6 max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-950/40 flex items-center justify-center border border-cyan-500/30">
          <CheckSquare className="w-5 h-5 text-cyan-500" />
        </div>
        <h3 className="text-xl font-serif text-white">Collaborative Bucket List</h3>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Add a new goal or adventure..."
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
        />
        <button 
          onClick={handleAdd}
          className="bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/40 text-cyan-300 hover:text-white px-4 py-3 rounded-xl transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <p className="text-center text-white/30 text-sm py-8">Your list is empty. Dream big!</p>}
        {items.map(item => (
          <div 
            key={item.id} 
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${item.completed ? 'bg-cyan-950/20 border-cyan-900/30 opacity-70' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
            onClick={() => handleToggle(item.id)}
          >
            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'}`}>
              {item.completed && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className={`flex-1 text-sm ${item.completed ? 'text-white/50 line-through' : 'text-white/90'}`}>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
