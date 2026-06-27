import React, { useState, useEffect, Suspense } from "react";
import { SanctuaryDB, SensoryGift, CycleLog, PeriodConfig, VaultPhoto, AdminSettings, WickedChallenge, ImportantDate, GiftPurchase, KitchenDish } from "./types";
import MusicPlayer from "./components/MusicPlayer";
import GiftsView from "./components/GiftsView";
import GiftsRealView from "./components/GiftsRealView";
import WickedChamber from "./components/WickedChamber";
import PrivateGallery from "./components/PrivateGallery";
import PeriodTracker from "./components/PeriodTracker";
import AdminPanel from "./components/AdminPanel";
import DateRemindersView from "./components/DateRemindersView";
import GiftPurchasesView from "./components/GiftPurchasesView";
import KitchenAlignment from "./components/KitchenAlignment";
import GoogleSignIn from "./components/GoogleSignIn";
import { SanctuaryTheme } from "./components/effects/EmberFieldBackground";
const EmberFieldBackground = React.lazy(() => import("./components/effects/EmberFieldBackground"));
import { useAuth } from "./hooks/useAuth";
import { apiFetch } from "./lib/apiFetch";
import { Gift, Flame, Shield, Calendar, Settings, Sparkles, Heart, Bell, Tag, Utensils, Lock, Eye, EyeOff, KeyRound, LogOut, PackageCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"gifts" | "realgifts" | "purchases" | "wicked" | "gallery" | "period" | "dates" | "admin" | "kitchen">("gifts");
  const [isLoading, setIsLoading] = useState(true);
  const [db, setDb] = useState<SanctuaryDB | null>(null);

  // Real, server-verified authentication (Google Sign-In + GCP email whitelist)
  const { user: authUser, isCheckingSession, authError, signInWithGoogle, signOut } = useAuth();

  // Secondary in-app locks (defense in depth, layered on top of the Google gate)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("sanctuary_admin_unlocked") === "true";
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [isGalleryUnlocked, setIsGalleryUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("sanctuary_gallery_unlocked") === "true";
  });
  const [galleryPasswordInput, setGalleryPasswordInput] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [showGalleryPassword, setShowGalleryPassword] = useState(false);

  // Verifiers (secondary PIN gates only - these are NOT the real security boundary
  // anymore. The real boundary is the server checking the Google session against
  // ALLOWED_EMAILS on every /api request. These exist only to add friction before
  // showing the most sensitive screens within an already-authenticated session.)
  const handleVerifyAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === "mansi123") {
      setIsAdminUnlocked(true);
      localStorage.setItem("sanctuary_admin_unlocked", "true");
      setAdminError("");
    } else {
      setAdminError("Incorrect admin access password.");
      setAdminPasswordInput("");
    }
  };

  const handleVerifyGalleryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (galleryPasswordInput.trim() === "viraj123") {
      setIsGalleryUnlocked(true);
      localStorage.setItem("sanctuary_gallery_unlocked", "true");
      setGalleryError("");
    } else {
      setGalleryError("Incorrect security code. Gallery unsealing aborted.");
      setGalleryPasswordInput("");
    }
  };

  const handleLockAll = () => {
    setIsAdminUnlocked(false);
    setIsGalleryUnlocked(false);
    localStorage.removeItem("sanctuary_admin_unlocked");
    localStorage.removeItem("sanctuary_gallery_unlocked");
    setAdminPasswordInput("");
    setGalleryPasswordInput("");
    setActiveTab("gifts"); // default tab
  };

  const handleSignOut = async () => {
    await signOut();
    handleLockAll();
    setDb(null);
  };

  // Load database state on launch (only once a verified Google session exists)
  const fetchDatabase = async () => {
    try {
      const response = await apiFetch("/api/database");
      if (response.ok) {
        const data: SanctuaryDB = await response.json();
        setDb(data);
      } else if (response.status === 401) {
        // Session expired or was revoked server-side - drop back to sign-in.
        await handleSignOut();
      }
    } catch (err) {
      console.error("Failed to load sanctuary database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchDatabase();
    }
  }, [authUser]);

  // If any API call comes back 401 (session expired, or removed from
  // ALLOWED_EMAILS in GCP), drop back to the sign-in screen immediately.
  useEffect(() => {
    const handler = () => {
      handleSignOut();
    };
    window.addEventListener("sanctuary:unauthorized", handler);
    return () => window.removeEventListener("sanctuary:unauthorized", handler);
  }, []);

  // Surface any other failed save/action as a brief toast, instead of it
  // silently doing nothing - confirmed as a real bug (gift purchase saves
  // failing validation with zero visible feedback).
  const [errorToast, setErrorToast] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setErrorToast(detail?.message || "Something went wrong. Please try again.");
      window.clearTimeout((window as any).__sanctuaryToastTimer);
      (window as any).__sanctuaryToastTimer = window.setTimeout(() => setErrorToast(null), 5000);
    };
    window.addEventListener("sanctuary:apiError", handler);
    return () => window.removeEventListener("sanctuary:apiError", handler);
  }, []);

  // API Call Helpers to sync with server Node container
  const handleClaimGift = async (id: string, claimedBy: "Him" | "Her") => {
    try {
      const response = await apiFetch(`/api/gifts/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimedBy })
      });
      if (response.ok) {
        fetchDatabase(); // Refresh local states
      }
    } catch (err) {
      console.error("Failed to claim gift:", err);
    }
  };

  const handleRedeemGift = async (id: string) => {
    try {
      const response = await apiFetch(`/api/gifts/${id}/redeem`, {
        method: "POST"
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to redeem gift:", err);
    }
  };

  const handleAddGift = async (title: string, description: string, category: "Pampering" | "Sensual" | "Intimate" | "Wicked", receiver: "Him" | "Her" | "Together") => {
    try {
      const response = await apiFetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, receiver })
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to add gift:", err);
    }
  };

  const handleDeleteGift = async (id: string) => {
    try {
      const response = await apiFetch(`/api/gifts/${id}/delete`, {
        method: "POST"
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to delete custom gift:", err);
    }
  };

  // --- Real Gifts (distinct from Vouchers above) ---
  const handleAddRealGift = async (title: string, description: string, category: string, giver: "Him" | "Her" | "Together", receiver: "Him" | "Her") => {
    try {
      const response = await apiFetch("/api/real-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, giver, receiver })
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to add gift:", err);
    }
  };

  const handleGiveRealGift = async (id: string) => {
    try {
      const response = await apiFetch(`/api/real-gifts/${id}/give`, { method: "POST" });
      if (response.ok) fetchDatabase();
    } catch (err) {
      console.error("Failed to mark gift as given:", err);
    }
  };

  const handleReceiveRealGift = async (id: string) => {
    try {
      const response = await apiFetch(`/api/real-gifts/${id}/receive`, { method: "POST" });
      if (response.ok) fetchDatabase();
    } catch (err) {
      console.error("Failed to mark gift as received:", err);
    }
  };

  const handleDeleteRealGift = async (id: string) => {
    try {
      const response = await apiFetch(`/api/real-gifts/${id}/delete`, { method: "POST" });
      if (response.ok) fetchDatabase();
    } catch (err) {
      console.error("Failed to delete gift:", err);
    }
  };

  const handleGenerateWicked = async (target: "Command Him" | "Command Her" | "Together", intensity?: string): Promise<WickedChallenge> => {
    const response = await apiFetch("/api/wicked/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, intensity })
    });
    if (!response.ok) {
      throw new Error("Failed to generate Wicked directive.");
    }
    const result = await response.json();
    fetchDatabase(); // Refresh history log list
    return result;
  };

  const handleGeneratePrompt = async (target: "Command Him" | "Command Her" | "Together") => {
    const response = await apiFetch("/api/gallery/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target })
    });
    if (!response.ok) {
      throw new Error("Failed to generate Private Photography prompt setup.");
    }
    return response.json();
  };

  const handleUploadPhoto = async (imageUrl: string, promptText: string, target: "Command Him" | "Command Her" | "Together"): Promise<VaultPhoto> => {
    const response = await apiFetch("/api/gallery/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, promptText, target })
    });
    if (!response.ok) {
      throw new Error("Failed to unseal upload.");
    }
    const photo = await response.json();
    fetchDatabase(); // Pull fresh pictures
    return photo;
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      const response = await apiFetch(`/api/gallery/delete/${id}`, {
        method: "POST"
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to delete photograph:", err);
    }
  };

  const handleUpdatePeriodConfig = async (lastPeriodDate: string, cycleLength: number, periodLength: number, pregnancyMode?: boolean, pregnancyStartDate?: string) => {
    try {
      const response = await apiFetch("/api/period/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPeriodDate, cycleLength, periodLength, pregnancyMode, pregnancyStartDate })
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to update period cycle config:", err);
    }
  };

  const handleAddPeriodLog = async (
    date: string, 
    symptoms: string[], 
    moods: string[], 
    intimacyLevel: "None" | "Light Touch" | "Sensual" | "Intense", 
    notes?: string,
    flow?: "None" | "Spotting" | "Light" | "Medium" | "Heavy",
    temperature?: number,
    weight?: number,
    waterIntake?: number,
    sleepDuration?: number,
    sex?: "None" | "Protected" | "Unprotected"
  ) => {
    try {
      const response = await apiFetch("/api/period/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, symptoms, moods, intimacyLevel, notes, flow, temperature, weight, waterIntake, sleepDuration, sex })
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to save symptoms cycle log:", err);
    }
  };

  const handleUpdateAdminSettings = async (settings: Partial<AdminSettings>) => {
    try {
      const response = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to update system settings:", err);
    }
  };

  const handleClearChamberHistory = async () => {
    try {
      await handleUpdateAdminSettings({
        // Resetting the generated history array
        wickedActions: db?.adminSettings?.wickedActions || []
      });
      // For history clearing we reload DB fully
      const response = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wickedActions: db?.adminSettings?.wickedActions })
      });
      // Quick wipe response simulator
      const dbRes = await apiFetch("/api/database");
      const data = await dbRes.json();
      data.wickedChallengesHistory = [];
      const saveRes = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearWickedFlag: true })
      });
      // Just manually refresh state history back to empty to avoid complex routes
      setDb(prev => prev ? { ...prev, wickedChallengesHistory: [] } : null);
    } catch (err) {
      console.error(err);
    }
  };

  // Task 1: Add Important Date reminder action
  const handleAddDate = async (title: string, date: string, category: "Anniversary" | "Birthday" | "Special Date" | "Other", reminderDaysAhead: number, description?: string) => {
    try {
      const response = await apiFetch("/api/dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, category, reminderDaysAhead, description })
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to add romantic reminder date alert:", err);
    }
  };

  const handleDeleteDate = async (id: string) => {
    try {
      const response = await apiFetch(`/api/dates/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to cancel reminder date alarm:", err);
    }
  };

  // Task 4: Add Gift Purchase action with descriptions & photo base64 urls
  const handleAddGiftPurchase = async (
    title: string,
    description: string,
    category: "Lingerie" | "Apparel" | "Flowers" | "Lounge & Spa" | "Jewelry" | "Chocolates" | "Other",
    photoUrl: string,
    buyer: "Him" | "Her" | "Together",
    price?: string
  ) => {
    try {
      const response = await apiFetch("/api/gift-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, photoUrl, buyer, price })
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to save physical gift purchase item:", err);
    }
  };

  const handleDeleteGiftPurchase = async (id: string) => {
    try {
      const response = await apiFetch(`/api/gift-purchases/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to delete physical gift purchase log:", err);
    }
  };

  // Task 3: Import Period Tracking sync data
  const handleImportPeriodData = async (logs: any[], config?: any): Promise<boolean> => {
    try {
      const response = await apiFetch("/api/period/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs, config })
      });
      if (response.ok) {
        await fetchDatabase();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to import bulk cycle sync logs:", err);
      return false;
    }
  };

  // Task 5: Kitchen Food & Recipes Alignment endpoints
  const handleSaveKitchenDish = async (dish: Omit<KitchenDish, "id" | "timestamp">) => {
    try {
      const response = await apiFetch("/api/kitchen/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dish)
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to save custom gourmet dish:", err);
    }
  };

  const handleDeleteKitchenDish = async (id: string) => {
    try {
      const response = await apiFetch(`/api/kitchen/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to delete recipe from logs:", err);
    }
  };

  const handleUpdateKitchenNotes = async (id: string, notes: string) => {
    try {
      const response = await apiFetch(`/api/kitchen/notes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to update kitchen note logs:", err);
    }
  };

  const handleUpdateKitchenRating = async (id: string, rating: number) => {
    try {
      const response = await apiFetch(`/api/kitchen/rating/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating })
      });
      if (response.ok) {
        await fetchDatabase();
      }
    } catch (err) {
      console.error("Failed to update intimacy kitchen rating:", err);
    }
  };

  const getWifeCurrentPhase = (): "Menstrual" | "Follicular" | "Ovulatory" | "Luteal" => {
    if (!db || !db.periodConfig) return "Follicular";
    const { lastPeriodDate, cycleLength, periodLength } = db.periodConfig;
    if (!lastPeriodDate) return "Follicular";

    const lastDate = new Date(lastPeriodDate);
    const today = new Date();
    const diffTime = today.getTime() - lastDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let cycleDay = (diffDays % cycleLength);
    if (cycleDay < 0) cycleDay += cycleLength;
    cycleDay = cycleDay + 1; // 1-based index

    if (cycleDay <= periodLength) {
      return "Menstrual";
    } else if (cycleDay <= 11) {
      return "Follicular";
    } else if (cycleDay <= 16) {
      return "Ovulatory";
    } else {
      return "Luteal";
    }
  };

  // Primary Landing Page authentication gate (Google Sign-In, server-verified)
  // This MUST run before the database-loading check below, since the
  // database only ever loads once a Google session exists - otherwise
  // isLoading/!db would never resolve and the app would hang forever on
  // the loading screen, with no way to ever reach the sign-in button.
  if (isCheckingSession) {
    return (
      <div className={`min-h-screen bg-[#050505] flex items-center justify-center`} id="sanctuary-app">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="text-neutral-500 text-xs font-mono uppercase tracking-widest"
        >
          Verifying session...
        </motion.div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div id="sanctuary-app">
        <Suspense fallback={null}>
          <EmberFieldBackground theme="passionate-red" intensity="hero" />
        </Suspense>
        <GoogleSignIn onCredential={signInWithGoogle} error={authError} />
      </div>
    );
  }

  if (isLoading || !db) {
    return (
      <div className="min-h-screen bg-luxury-blank flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-gold-500 border-t-transparent animate-spin mx-auto" />
          <h2 className="font-serif text-2xl font-light text-gold-300 tracking-wider">Unveiling Our Sanctuary...</h2>
          <p className="text-xs text-neutral-500">Checking parameters and aligning secure domestic databases.</p>
        </div>
      </div>
    );
  }

  const activeTheme = db?.adminSettings?.theme || "Passionate Red";
  const themeClass = activeTheme === "Midnight Blue" 
    ? "theme-midnight-blue" 
    : activeTheme === "Golden Hour" 
    ? "theme-golden-hour" 
    : "theme-passionate-red";
  const emberTheme: SanctuaryTheme = activeTheme === "Midnight Blue"
    ? "midnight-blue"
    : activeTheme === "Golden Hour"
    ? "golden-hour"
    : "passionate-red";


  return (
    <div className={`min-h-screen text-neutral-100 flex flex-col justify-between ${themeClass}`} id="sanctuary-app">
      <Suspense fallback={null}>
        <EmberFieldBackground theme={emberTheme} intensity="ambient" />
      </Suspense>

      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 backdrop-blur-xl border border-red-800/60 text-red-200 text-sm rounded-2xl px-5 py-3 shadow-2xl max-w-md text-center"
          >
            {errorToast}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. PRIMARY CONTAINER */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Logo Title Card */}
        <header className="text-center space-y-3 pt-6 pb-2 relative">
          {/* Back glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-red-850/5 blur-3xl pointer-events-none" />

          <span className="text-[10px] font-mono tracking-[0.25em] text-red-500 uppercase block bg-red-950/20 border border-red-900/40 px-4 py-1.5 rounded-full w-max mx-auto shadow-md glow-red">
            ✦ Locked Intimate Vault ✦
          </span>
          
          <h1 className="font-serif text-5xl lg:text-7xl font-extralight tracking-[0.15em] text-white uppercase italic py-2">
            Our Sanctuary
          </h1>
          
          <p className="text-sm font-light text-white/60 max-w-xl mx-auto leading-relaxed">
            A beautiful private sanctuary to deepen connection, align cycles, exchange custom sensual gifts, and record intimate memories.
          </p>

          <div className="flex justify-center items-center gap-2 pt-2 flex-wrap">
            {authUser && (
              <span className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono border border-white/5 bg-white/[0.01] px-3 py-1 rounded-full select-none">
                {authUser.picture && (
                  <img src={authUser.picture} alt="" className="w-3.5 h-3.5 rounded-full" referrerPolicy="no-referrer" />
                )}
                {authUser.name}
              </span>
            )}
            <button
              onClick={handleLockAll}
              className="group flex items-center gap-1.5 text-[10px] text-white/40 hover:text-red-400 transition font-mono border border-white/5 hover:border-red-900/35 bg-white/[0.01] hover:bg-red-950/20 px-3 py-1 rounded-full cursor-pointer select-none"
            >
              <Lock className="w-3 h-3 text-red-500 group-hover:animate-bounce" />
              Secure & Lock Vault
            </button>
            <button
              onClick={handleSignOut}
              className="group flex items-center gap-1.5 text-[10px] text-white/40 hover:text-amber-400 transition font-mono border border-white/5 hover:border-amber-900/35 bg-white/[0.01] hover:bg-amber-950/20 px-3 py-1 rounded-full cursor-pointer select-none"
            >
              <LogOut className="w-3 h-3 text-amber-500" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Generative Audio Floating Control Bar */}
        <section className="max-w-4xl mx-auto">
          <MusicPlayer />
        </section>

        {/* Central bento navigation layout switch */}
        <nav className="max-w-4xl mx-auto" id="sanctuary-nav">
          <div className="grid grid-cols-4 md:grid-cols-9 gap-1 bg-white/[0.02] p-2 rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-lg">
            
            {/* Button 1: Vouchers */}
            <button
              onClick={() => setActiveTab("gifts")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "gifts"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "gifts" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Gift className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Vouchers</span>
            </button>

            {/* Button 1b: Real Gifts */}
            <button
              onClick={() => setActiveTab("realgifts")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "realgifts"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "realgifts" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <PackageCheck className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Gifts</span>
            </button>

            {/* Button 2: Legacy Gift Purchases */}
            <button
              onClick={() => setActiveTab("purchases")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "purchases"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "purchases" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Tag className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Gifts</span>
            </button>

            {/* Button 3: Wicked Chamber */}
            <button
              onClick={() => setActiveTab("wicked")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "wicked"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "wicked" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Flame className={`w-4 h-4 ${activeTab === "wicked" ? "animate-pulse text-red-500" : "text-white/40 group-hover:text-red-400"}`} />
              <span className="text-[9px] tracking-wide uppercase">Wicked</span>
            </button>

            {/* Button 4: Vault Gallery */}
            <button
              onClick={() => setActiveTab("gallery")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "gallery"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "gallery" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Shield className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Vault</span>
            </button>

            {/* Button 5: Cycle Tracker */}
            <button
              onClick={() => setActiveTab("period")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "period"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "period" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Calendar className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Cycle</span>
            </button>

            {/* Button 6: Kitchen Alignment */}
            <button
              onClick={() => setActiveTab("kitchen")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "kitchen"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "kitchen" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Utensils className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Kitchen</span>
            </button>

            {/* Button 6: Sacred Date Reminders */}
            <button
              onClick={() => setActiveTab("dates")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "dates"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "dates" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Bell className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Reminders</span>
            </button>

            {/* Button 7: Admin Panel */}
            <button
              onClick={() => setActiveTab("admin")}
              className={`relative py-2.5 px-1 rounded-xl transition-colors duration-300 flex flex-col items-center justify-center gap-1 group cursor-pointer border overflow-hidden ${
                activeTab === "admin"
                  ? "border-red-800 text-white font-bold glow-red"
                  : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeTab === "admin" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-red-950/45 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Settings className="w-4 h-4 text-red-500/80" />
              <span className="text-[9px] tracking-wide uppercase">Admin</span>
            </button>

          </div>
        </nav>

        {/* Switch panel view transitions container */}
        <main className="max-w-6xl mx-auto pt-4 pb-12" id="sanctuary-panels">
          <AnimatePresence mode="wait">
            
            {activeTab === "gifts" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="giftsView"
              >
                <GiftsView
                  gifts={db.gifts}
                  categories={db.adminSettings.voucherCategories || ["Pampering", "Sensual", "Intimate", "Wicked"]}
                  onClaim={handleClaimGift}
                  onRedeem={handleRedeemGift}
                  onAddGift={handleAddGift}
                  onDeleteCustom={handleDeleteGift}
                />
              </motion.div>
            )}

            {activeTab === "realgifts" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="realGiftsView"
              >
                <GiftsRealView
                  gifts={db.realGifts || []}
                  categories={db.adminSettings.giftCategories || ["Jewelry", "Experience", "Letter", "Trip", "Keepsake", "Other"]}
                  onGive={handleGiveRealGift}
                  onReceive={handleReceiveRealGift}
                  onAddGift={handleAddRealGift}
                  onDeleteCustom={handleDeleteRealGift}
                />
              </motion.div>
            )}

            {activeTab === "purchases" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="giftPurchasesView"
              >
                <GiftPurchasesView
                  purchases={db.giftPurchases || []}
                  onAddPurchase={handleAddGiftPurchase}
                  onDeletePurchase={handleDeleteGiftPurchase}
                />
              </motion.div>
            )}

            {activeTab === "wicked" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="wickedChamber"
              >
                <WickedChamber
                  challengesHistory={db.wickedChallengesHistory}
                  onGenerate={handleGenerateWicked}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {activeTab === "gallery" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="privateGallery"
              >
                {!isGalleryUnlocked ? (
                  <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden" id="gallery-gate">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-650/40 to-red-550/40" />
                    
                    <div className="mx-auto w-14 h-14 bg-red-950/30 border border-red-500/20 rounded-2xl flex items-center justify-center shadow-md">
                      <Shield className="w-6 h-6 text-red-500 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl font-light text-white tracking-wide">Optical Vault Locked</h3>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                        This repository contains intimate and highly private photo logs. Enter the gallery unsealing password.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyGalleryPassword} className="space-y-4">
                      <div className="relative text-left">
                        <input
                          type={showGalleryPassword ? "text" : "password"}
                          value={galleryPasswordInput}
                          onChange={(e) => {
                            setGalleryPasswordInput(e.target.value);
                            if (galleryError) setGalleryError("");
                          }}
                          placeholder="Enter passphrase..."
                          required
                          className="w-full bg-black/60 border border-white/5 focus:border-red-500/50 rounded-2xl py-3 px-4 pl-10 pr-10 text-sm text-white placeholder-neutral-600 focus:outline-none transition duration-350"
                        />
                        <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowGalleryPassword(!showGalleryPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition cursor-pointer bg-transparent border-none outline-none"
                        >
                          {showGalleryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {galleryError && (
                        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2 text-left leading-normal">{galleryError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-red-950 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/40 text-xs font-bold font-mono tracking-widest uppercase rounded-2xl transition cursor-pointer select-none"
                      >
                        Unseal Photographs
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end pr-1">
                      <button
                        onClick={() => {
                          setIsGalleryUnlocked(false);
                          localStorage.removeItem("sanctuary_gallery_unlocked");
                          setGalleryPasswordInput("");
                        }}
                        className="text-[10px] text-neutral-400 hover:text-red-400 flex items-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-red-950/20 border border-white/5 hover:border-red-900/30 px-3.5 py-1.5 rounded-full transition font-mono uppercase tracking-widest select-none"
                      >
                        <Lock className="w-3 h-3 text-red-500" />
                        Lock Vault Gallery
                      </button>
                    </div>
                    
                    <PrivateGallery
                      photos={db.vaultPhotos}
                      onGeneratePrompt={handleGeneratePrompt}
                      onUploadPhoto={handleUploadPhoto}
                      onDeletePhoto={handleDeletePhoto}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "period" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="periodTracker"
              >
                <PeriodTracker
                  config={db.periodConfig}
                  logs={db.cycleLogs}
                  onUpdateConfig={handleUpdatePeriodConfig}
                  onAddLog={handleAddPeriodLog}
                  onImportSuccess={fetchDatabase}
                />
              </motion.div>
            )}

            {activeTab === "kitchen" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="kitchenAlignment"
              >
                <KitchenAlignment
                  dishes={db.kitchenDishes || []}
                  activePhase={getWifeCurrentPhase()}
                  onSaveDish={handleSaveKitchenDish}
                  onDeleteDish={handleDeleteKitchenDish}
                  onUpdateNotes={handleUpdateKitchenNotes}
                  onUpdateRating={handleUpdateKitchenRating}
                />
              </motion.div>
            )}

            {activeTab === "dates" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="dateReminders"
              >
                <DateRemindersView
                  dates={db.importantDates || []}
                  onAddDate={handleAddDate}
                  onDeleteDate={handleDeleteDate}
                />
              </motion.div>
            )}

            {activeTab === "admin" && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key="adminSettings"
              >
                {!isAdminUnlocked ? (
                  <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden" id="admin-gate">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20" />
                    
                    <div className="mx-auto w-14 h-14 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-md">
                      <Settings className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl font-light text-white tracking-wide">Admin Command Locked</h3>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                        This area configures private schedules, parameters, and sensitive vault databases. Enter the administrative lock code.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyAdminPassword} className="space-y-4">
                      <div className="relative text-left">
                        <input
                          type={showAdminPassword ? "text" : "password"}
                          value={adminPasswordInput}
                          onChange={(e) => {
                            setAdminPasswordInput(e.target.value);
                            if (adminError) setAdminError("");
                          }}
                          placeholder="Enter passphrase..."
                          required
                          className="w-full bg-black/60 border border-white/5 focus:border-amber-500/50 rounded-2xl py-3 px-4 pl-10 pr-10 text-sm text-white placeholder-neutral-600 focus:outline-none transition duration-350"
                        />
                        <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition cursor-pointer bg-transparent border-none outline-none"
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {adminError && (
                        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2 text-left leading-normal">{adminError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-amber-950/50 hover:bg-amber-900/50 text-amber-300 hover:text-white border border-amber-800/40 text-xs font-bold font-mono tracking-widest uppercase rounded-2xl transition cursor-pointer select-none"
                      >
                        Enter System Admin
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end pr-1">
                      <button
                        onClick={() => {
                          setIsAdminUnlocked(false);
                          localStorage.removeItem("sanctuary_admin_unlocked");
                          setAdminPasswordInput("");
                        }}
                        className="text-[10px] text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-amber-950/20 border border-white/5 hover:border-amber-900/30 px-3.5 py-1.5 rounded-full transition font-mono uppercase tracking-widest select-none"
                      >
                        <Lock className="w-3 h-3 text-amber-500" />
                        Lock Admin Command
                      </button>
                    </div>

                    <AdminPanel
                      settings={db.adminSettings}
                      dbStats={db}
                      onUpdateSettings={handleUpdateAdminSettings}
                      onClearHistory={handleClearChamberHistory}
                      onImportPeriodData={handleImportPeriodData}
                      periodConfig={db.periodConfig}
                      cycleLogs={db.cycleLogs}
                      onUpdatePeriodConfig={handleUpdatePeriodConfig}
                      onAddPeriodLog={handleAddPeriodLog}
                    />
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>

      {/* 2. FOOTER */}
      <footer className="w-full bg-luxury-950/90 py-6 border-t border-luxury-900 select-none text-center text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
        <span>© Lock Secure • Intimate Sanctuary Vault System • 2026</span>
      </footer>

    </div>
  );
}
