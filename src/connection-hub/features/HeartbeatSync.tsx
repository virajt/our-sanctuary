import React, { useState } from "react";
import { HeartPulse } from "lucide-react";
import { apiFetch } from "../../lib/apiFetch";
import { useAuth } from "../../hooks/useAuth";

export default function HeartbeatSync() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const { user } = useAuth();
  
  // If role isn't Him or Her, fallback to generic
  const isHusband = user?.role === "Him";
  const isWife = user?.role === "Her";

  const handlePulse = async () => {
    setStatus("sending");
    
    // Dynamic routing and messaging
    const who = isHusband ? "Her" : isWife ? "Him" : "Both";
    const senderTitle = isHusband ? "Your husband" : isWife ? "Your wife" : "Your partner";
    
    try {
      await apiFetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "heartbeat",
          subject: `${user?.name || senderTitle} sent you a Heartbeat`,
          message: `${senderTitle} just sent you a heartbeat pulse. They are thinking of you right now.`,
          who
        })
      });
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <button 
        onClick={handlePulse}
        disabled={status === "sending"}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${status === 'sent' ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.6)] scale-110' : 'bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30'}`}
      >
        <HeartPulse className={`w-16 h-16 ${status === 'sent' ? 'text-white' : 'text-rose-500'} ${status === 'sending' ? 'animate-pulse' : ''}`} />
      </button>
      <p className="text-sm font-mono tracking-widest text-white/50 uppercase">
        {status === 'idle' ? "Tap to send a pulse" : status === 'sending' ? "Connecting..." : "Pulse Delivered"}
      </p>
    </div>
  );
}
