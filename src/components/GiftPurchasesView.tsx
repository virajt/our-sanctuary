import React, { useState, useRef } from "react";
import { GiftPurchase } from "../types";
import TiltCard from "./effects/TiltCard";
import MagneticButton from "./effects/MagneticButton";
import { DollarSign, Tag, Gift, Trash2, Camera, UploadCloud, Eye, Plus, Sparkles, Check, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GiftPurchasesViewProps {
  purchases: GiftPurchase[];
  onAddPurchase: (
    title: string,
    description: string,
    category: "Lingerie" | "Apparel" | "Flowers" | "Lounge & Spa" | "Jewelry" | "Chocolates" | "Other",
    photoUrl: string,
    buyer: "Him" | "Her" | "Together",
    price?: string
  ) => void;
  onDeletePurchase: (id: string) => void;
}

export default function GiftPurchasesView({ purchases, onAddPurchase, onDeletePurchase }: GiftPurchasesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Lingerie" | "Apparel" | "Flowers" | "Lounge & Spa" | "Jewelry" | "Chocolates" | "Other">("Lingerie");
  const [buyer, setBuyer] = useState<"Him" | "Her" | "Together">("Him");
  const [price, setPrice] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Filtering states
  const [selectedBuyer, setSelectedBuyer] = useState<"All" | "Him" | "Her" | "Together">("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_PHOTO_SIZE_MB = 8;

  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      alert(`Please upload an image smaller than ${MAX_PHOTO_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUrl(e.target?.result as string);
    };
    reader.onerror = () => {
      alert("Failed to read that image file. Please try another.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photoUrl) {
      alert("Please provide at least a Gift Title and manually upload a photo.");
      return;
    }

    onAddPurchase(title, description, category, photoUrl, buyer, price || undefined);

    // Reset Form states
    setTitle("");
    setDescription("");
    setCategory("Lingerie");
    setBuyer("Him");
    setPrice("");
    setPhotoUrl("");
    setIsAdding(false);

    setSuccessMsg("Sweet Purchase Logged & Displayed!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Run filters
  const filteredPurchases = purchases.filter((p) => {
    const buyerMatch = selectedBuyer === "All" || p.buyer === selectedBuyer;
    const catMatch = selectedCategory === "All" || p.category === selectedCategory;
    return buyerMatch && catMatch;
  });

  return (
    <div id="gift-purchases-section" className="space-y-8">
      
      {/* Page Header banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-rose-500 animate-bounce" />
            Vesta Intimate Gift Log
          </h2>
          <p className="text-sm text-neutral-400">
            Log, categorize, and archive sensual gifts, outfits, lingerie, and surprises purchased for one another. Keep custom photos and details locked safely here.
          </p>
        </div>

        <MagneticButton
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-900/60 hover:bg-rose-800 text-white border border-rose-700/50 text-xs font-semibold rounded-2xl shadow-lg transition-all cursor-pointer glow-red"
        >
          {isAdding ? "Close form" : "Log Purchased Gift"}
        </MagneticButton>
      </div>

      {/* Success notifier popup toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Purchase Form container */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/85 border border-luxury-830 rounded-3xl p-6 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <h3 className="font-serif text-xl font-medium text-white">Record a Surprising Purchase</h3>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Forms Inputs */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-medium">Gift Item Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Burgundy Silk Lace Bodysuit"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-medium font-mono">Approx. Value/Price (Optional)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="e.g. $75.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-luxury-950 border border-luxury-800 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-medium">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-xs text-neutral-300 focus:outline-none focus:border-rose-500/50 transition-colors"
                      >
                        <option value="Lingerie">Lingerie & Lace</option>
                        <option value="Apparel">Apparel & Silk</option>
                        <option value="Flowers">Flowers & Floral surprises</option>
                        <option value="Lounge & Spa">Lounge & Spa Indulgence</option>
                        <option value="Jewelry">Jewelry & Ornaments</option>
                        <option value="Chocolates">Chocolates & Delicacies</option>
                        <option value="Other">Other Surprises</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 font-medium">Surprise Buyer / Giver</label>
                      <div className="grid grid-cols-3 gap-2 bg-luxury-950/80 p-1 rounded-xl border border-luxury-800">
                        {(["Him", "Her", "Together"] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBuyer(b)}
                            className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                              buyer === b
                                ? "bg-rose-955/80 text-rose-300 border border-rose-800/20"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400 font-medium">Custom Description / Location of Store / Vibe Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Add details about where you purchased it, how you plan to gift it, or what reactions you look forward to..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500/50 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Image Drag Upload */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-xs text-neutral-400 font-medium">Manual Gift Photo Upload (Base64 Safe)</label>
                    
                    {photoUrl ? (
                      <div className="relative flex-1 min-h-[160px] rounded-2xl border border-luxury-800 overflow-hidden bg-black/60 group">
                        <img
                          src={photoUrl}
                          alt="Uploaded sample preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPhotoUrl("")}
                            className="bg-red-950/80 border border-red-500/40 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl text-[10px] uppercase font-mono shadow-md cursor-pointer"
                          >
                            Remove Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-black/60 border border-white/10 text-white hover:text-rose-300 px-3 py-1.5 rounded-xl text-[10px] uppercase font-mono shadow-md cursor-pointer"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 min-h-[160px] rounded-2xl border border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                          isDragging
                            ? "bg-rose-955/20 border-rose-500/80 text-rose-300"
                            : "bg-black/40 border-luxury-800 text-neutral-500 hover:border-luxury-700 hover:text-neutral-300"
                        }`}
                      >
                        <UploadCloud className="w-8 h-8 mb-2 text-rose-500 animate-pulse" />
                        <p className="text-xs font-semibold">Drag & Drop Gift Picture Here</p>
                        <p className="text-[10px] text-neutral-600 mt-1 font-light">or click our console zone to browse local drives</p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setPhotoUrl("");
                      }}
                      className="px-4 py-2 text-neutral-450 hover:text-white text-xs border border-white/5 hover:bg-black/25 rounded-2xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim() || !photoUrl}
                      className="px-6 py-2 bg-gradient-to-r from-rose-950 to-rose-900 border border-rose-800/40 text-rose-450 hover:text-rose-300 text-xs font-bold rounded-2xl shadow-lg transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer glow-red"
                    >
                      Save to Gallery Log
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Segment - Filter Deck and Summary stats */}
      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Stats indicator */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-rose-500" />
          <p className="text-xs text-neutral-400 font-light">
            Showing <strong className="text-neutral-200 font-semibold">{filteredPurchases.length}</strong> of{" "}
            <strong className="text-neutral-200 font-semibold">{purchases.length}</strong> loaded surprise items.
          </p>
        </div>

        {/* Filters pills group */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Buyer Pill Selection */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
            {(["All", "Him", "Her", "Together"] as const).map((b) => (
              <button
                key={`filter_buyer_${b}`}
                onClick={() => setSelectedBuyer(b)}
                className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedBuyer === b
                    ? "bg-rose-955/60 text-rose-300 border border-rose-800/10"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {b === "All" ? "All Buyers" : b}
              </button>
            ))}
          </div>

          {/* Category SELECT filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/50 border border-white/5 p-1.5 rounded-xl text-[11px] text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Lingerie">Lingerie & Lace</option>
            <option value="Apparel">Apparel & Silk</option>
            <option value="Flowers">Flowers</option>
            <option value="Lounge & Spa">Lounge & Spa</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Chocolates">Chocolates</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Grid List of recorded Gift Purchases */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPurchases.map((purchase) => (
            <TiltCard key={purchase.id} maxTilt={4} glare className="rounded-3xl">
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-luxury-900/40 border border-luxury-800 hover:border-luxury-700/80 rounded-3xl overflow-hidden group flex flex-col justify-between relative transition-all duration-300 shadow-lg"
            >
              {/* Photo Area with overlay elements */}
              <div className="relative h-48 w-full bg-black/80 overflow-hidden">
                <img
                  src={purchase.photoUrl}
                  alt={purchase.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Category & Price badge block */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-mono tracking-widest uppercase bg-rose-955/90 border border-rose-800/40 text-rose-350 shadow-md">
                    {purchase.category}
                  </span>
                  
                  {purchase.price && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/80 border border-white/10 text-neutral-200">
                      {purchase.price}
                    </span>
                  )}
                </div>

                {/* Buyer sticker */}
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-0.5 rounded bg-black/60 border border-white/5 text-[9px] font-light text-neutral-300">
                    Bought by: <strong className="text-rose-400 font-semibold">{purchase.buyer}</strong>
                  </span>
                </div>
              </div>

              {/* Card Meta details */}
              <div className="p-5 text-left flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-serif text-base font-semibold text-neutral-100 tracking-wide line-clamp-1">{purchase.title}</h4>
                  
                  <p className="text-xs text-neutral-400 leading-relaxed font-light min-h-[40px] line-clamp-3">
                    {purchase.description || "No custom secret description provided."}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {new Date(purchase.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>

                  <button
                    onClick={() => {
                      if (confirm(`Remove custom purchase log "${purchase.title}"? This cannot be undone.`)) {
                        onDeletePurchase(purchase.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-luxury-800 hover:border-red-500/30 text-neutral-500 hover:text-red-400 transition"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </motion.div>
            </TiltCard>
          ))}
        </AnimatePresence>

        {filteredPurchases.length === 0 && (
          <div className="col-span-full border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
            <Gift className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="text-sm">No recorded gift purchases found. Press the button above to start logging surprise gifts.</p>
          </div>
        )}
      </div>

    </div>
  );
}
