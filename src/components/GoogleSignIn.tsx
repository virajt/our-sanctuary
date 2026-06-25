import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Lock } from "lucide-react";

interface GoogleSignInProps {
  onCredential: (idToken: string) => Promise<void>;
  error: string;
}

export default function GoogleSignIn({ onCredential, error }: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    function tryInit() {
      if (initialized.current) return;
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      if (!__GOOGLE_CLIENT_ID__) return;

      window.google.accounts.id.initialize({
        client_id: __GOOGLE_CLIENT_ID__,
        callback: (response) => {
          onCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 280,
      });

      initialized.current = true;
    }

    tryInit();
    // The GIS script loads async; poll briefly in case it isn't ready yet.
    const interval = setInterval(tryInit, 200);
    const timeout = setTimeout(() => clearInterval(interval), 8000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onCredential]);

  const missingClientId = !__GOOGLE_CLIENT_ID__;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 relative overflow-hidden" id="sanctuary-signin">
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-red-900/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-amber-900/15 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-luxury-900/60 backdrop-blur-2xl border border-luxury-800/80 rounded-[2rem] p-10 text-center space-y-8 shadow-2xl"
      >
        <div className="mx-auto w-16 h-16 bg-red-950/30 border border-red-800/30 rounded-2xl flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-medium tracking-wide text-white">Our Sanctuary</h1>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
            A private space for the two of us. Sign in with the Google account
            we've trusted with the key.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {missingClientId ? (
            <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-3 text-left leading-relaxed">
              Google Sign-In isn't configured yet. Set <code className="font-mono">GOOGLE_CLIENT_ID</code> as an
              environment variable and rebuild. See <code className="font-mono">SETUP_GOOGLE_AUTH.md</code>.
            </div>
          ) : (
            <div ref={buttonRef} className="min-h-[44px] flex items-center justify-center" />
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-2.5 leading-normal">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 font-mono uppercase tracking-widest pt-2 border-t border-luxury-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
          Access limited to whitelisted accounts only
        </div>
      </motion.div>
    </div>
  );
}
