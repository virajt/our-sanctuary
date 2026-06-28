import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Key, Eye } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { SanctuaryDB } from "../../../types";
import { apiFetch } from "../../../lib/apiFetch";

export default function DesireVault({ db, fetchDb }: { db: SanctuaryDB; fetchDb: () => void }) {
  const { user } = useAuth();
  const role = user?.role || "Him";
  
  const isHisKeyTurned = db.desireVaultHisKey || false;
  const isHerKeyTurned = db.desireVaultHerKey || false;
  const isUnlocked = db.desireVaultUnlocked || false;
  
  const myKeyTurned = role === "Him" ? isHisKeyTurned : isHerKeyTurned;
  
  const [secretInput, setSecretInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleKey = async () => {
    try {
      await apiFetch("/api/features/vault/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, isLocked: myKeyTurned })
      });
      fetchDb();
    } catch (e) {
      console.error(e);
    }
  };

  const saveSecret = async () => {
    setIsSaving(true);
    try {
      await apiFetch("/api/features/vault/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, secret: secretInput })
      });
      fetchDb();
      setSecretInput("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-3">
        <h3 className="font-serif text-2xl text-rose-400">The Desire Vault</h3>
        <p className="text-sm text-neutral-400 max-w-sm mx-auto">
          Both keys must be turned simultaneously to reveal the secrets locked inside.
        </p>
      </div>

      {/* Dual Key Mechanism */}
      <div className="flex justify-center gap-12 py-8">
        {/* His Key */}
        <div className="flex flex-col items-center gap-4">
          <motion.button
            onClick={() => role === "Him" && toggleKey()}
            animate={{ rotate: isHisKeyTurned ? 90 : 0 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
              isHisKeyTurned ? "border-rose-500 bg-rose-500/20 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]" : "border-neutral-800 bg-black/40 text-neutral-600"
            } ${role !== "Him" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Key className="w-8 h-8" />
          </motion.button>
          <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">His Key</span>
        </div>

        {/* Her Key */}
        <div className="flex flex-col items-center gap-4">
          <motion.button
            onClick={() => role === "Her" && toggleKey()}
            animate={{ rotate: isHerKeyTurned ? -90 : 0 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
              isHerKeyTurned ? "border-rose-500 bg-rose-500/20 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]" : "border-neutral-800 bg-black/40 text-neutral-600"
            } ${role !== "Her" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Key className="w-8 h-8" />
          </motion.button>
          <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">Her Key</span>
        </div>
      </div>

      {/* Secret Input Area (Only visible when locked) */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <textarea
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Whisper a secret fantasy here before turning your key..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white/80 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500/50 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={saveSecret}
                disabled={!secretInput.trim() || isSaving}
                className="px-6 py-2 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-900/60 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Locking..." : "Lock Secret"}
              </button>
            </div>
            
            {(db.desireVaultHisSecret || db.desireVaultHerSecret) && (
              <div className="text-center text-xs text-rose-500/60 font-mono tracking-wide">
                Secrets are waiting inside the vault.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vault Contents (Only visible when unlocked) */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-black/40 shadow-[0_0_50px_rgba(244,63,94,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
            
            <div className="flex items-center justify-center gap-3 mb-8 text-rose-400">
              <Unlock className="w-5 h-5" />
              <h4 className="font-serif text-xl tracking-wide">The Vault is Open</h4>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">His Fantasy</span>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-rose-200/90 italic leading-relaxed">
                  {db.desireVaultHisSecret ? `"${db.desireVaultHisSecret}"` : "Nothing was locked inside..."}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono tracking-widest text-neutral-500 uppercase">Her Fantasy</span>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-rose-200/90 italic leading-relaxed">
                  {db.desireVaultHerSecret ? `"${db.desireVaultHerSecret}"` : "Nothing was locked inside..."}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
