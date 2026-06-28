import React, { useState } from "react";
import { Film } from "lucide-react";

export default function MediaSync() {
  const [videoUrl, setVideoUrl] = useState("");
  
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
      <div className="w-16 h-16 rounded-full bg-indigo-950/40 flex items-center justify-center border border-indigo-500/30">
        <Film className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-xl font-serif text-white">Synchronized Theater</h3>
      <p className="text-sm text-white/50 max-w-sm">
        Video player synchronization allows you to paste a media URL and watch it together.
      </p>
      
      <div className="w-full max-w-md flex items-center gap-2">
        <input 
          type="text" 
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Paste video URL here..." 
          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
        />
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer">
          Sync
        </button>
      </div>
      
      {videoUrl && (
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-xl mt-4 flex items-center justify-center relative group">
           <p className="text-white/30 text-xs uppercase tracking-widest font-mono">Waiting for partner...</p>
        </div>
      )}
    </div>
  );
}
