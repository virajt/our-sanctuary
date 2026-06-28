import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  role?: "Him" | "Her";
}

interface UseAuthResult {
  user: AuthUser | null;
  isCheckingSession: boolean;
  authError: string;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState("");

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    setAuthError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "This Google account is not authorized.");
      }
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setAuthError((err as Error).message || "Sign-in failed. Please try again.");
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
    }
  }, []);

  return { user, isCheckingSession, authError, signInWithGoogle, signOut };
}
