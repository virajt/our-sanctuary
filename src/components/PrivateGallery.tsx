import React, { useState, useRef } from "react";
import { VaultPhoto, PhotoCameraPrompt } from "../types";
import { Unlock, Sparkles, Image, Check, Plus, Upload, Trash, Camera, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TiltCard from "./effects/TiltCard";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface PrivateGalleryProps {
  photos: VaultPhoto[];
  onGeneratePrompt: (target: "Command Him" | "Command Her" | "Together") => Promise<PhotoCameraPrompt>;
  onUploadPhoto: (imageUrl: string, promptText: string, target: "Command Him" | "Command Her" | "Together") => Promise<VaultPhoto>;
  onDeletePhoto: (id: string) => void;
  isLoading: boolean;
}

export default function PrivateGallery({ photos, onGeneratePrompt, onUploadPhoto, onDeletePhoto, isLoading }: PrivateGalleryProps) {
  // Dynamic Prompt states
  const [target, setTarget] = useState<"Command Him" | "Command Her" | "Together">("Together");
  const [currentPrompt, setCurrentPrompt] = useState<PhotoCameraPrompt | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFetchPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const resp = await onGeneratePrompt(target);
      setCurrentPrompt(resp);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Convert uploaded image to Base64
  const processFile = (file: File) => {
    if (!file) return;
    if (!currentPrompt) {
      alert("Please generate a camera prompt direction first so the AI can describe the memory fittingly!");
      return;
    }
    
    // Check file size limit (keep it safe for local container memory, e.g. < 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB for storage security.");
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string;
      try {
        await onUploadPhoto(base64Url, currentPrompt.description, target);
        alert("Memory successfully locked in our Sanctuary gallery! Gemini has crafted an aesthetic caption.");
        setCurrentPrompt(null); // Clear prompt after complete
      } catch (err) {
        console.error(err);
        alert("Upload parsing failed. Verify connection.");
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div id="private-gallery-module" className="space-y-8">

      {/* Camera Prompt and Private Photo Log view.
          (Access to this whole tab is already gated by the Gallery lock in
          App.tsx, which sits on top of the real security boundary - the
          Google Sign-In session checked server-side on every API call. An
          additional hardcoded passphrase here would be redundant and, since
          this is open-source, visible to anyone reading the code anyway.) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
            {/* Header */}
            <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
                  <Unlock className="w-8 h-8 text-red-400 animate-pulse" />
                  Private Gallery Vault
                </h2>
                <p className="text-sm text-neutral-400">
                  Generate romantic camera configurations, take the photo, and let AI analyze the memory.
                </p>
              </div>
            </div>

            {/* Prompt Generator and Image Upload zone */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left setting options selector (Col span 5) */}
              <div className="lg:col-span-5 bg-gradient-to-b from-luxury-900/80 to-luxury-950/60 border border-luxury-800 p-8 rounded-3xl flex flex-col justify-between space-y-6">
                
                <div className="space-y-5">
                  <div className="border-b border-luxury-800 pb-3">
                    <h3 className="font-serif text-lg font-medium text-white/90">Photo Director</h3>
                    <p className="text-xs text-neutral-500">Formulate 1,000,000+ elegant creative setups.</p>
                  </div>

                  {/* Target configuration */}
                  <div className="space-y-3">
                    <label className="text-xs text-neutral-400 font-medium block uppercase tracking-wider">Photo Muse/Subject</label>
                    <div className="grid grid-cols-3 gap-2 bg-luxury-950/80 p-1 rounded-2xl border border-luxury-800">
                      {(["Command Him", "Command Her", "Together"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTarget(t)}
                          className={`py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider transition cursor-pointer border ${
                            target === t
                              ? "bg-red-950/45 border-red-800/60 text-red-400 font-bold glow-red"
                              : "text-neutral-400 hover:text-neutral-200 border-transparent"
                          }`}
                        >
                          {t === "Command Him" ? "Him" : t === "Command Her" ? "Her" : "Both"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <MagneticButton
                  onClick={handleFetchPrompt}
                  disabled={isGeneratingPrompt}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 text-red-400 border border-red-805/40 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 glow-red animate-pulse"
                >
                  {isGeneratingPrompt ? (
                    <>
                      <div className="w-4 h-4 border-2 border-luxury-950 border-t-transparent rounded-full animate-spin" />
                      <span>Composing Camera Setup...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 stroke-[2.5]" />
                      <span>Retrieve Photo Prompt</span>
                    </>
                  )}
                </MagneticButton>
              </div>

              {/* Right column prompt reveal & upload zone (Col span 7) */}
              <div className="lg:col-span-7 bg-luxury-950/40 border border-luxury-800 rounded-3xl p-8 relative flex flex-col justify-between min-h-[350px]">
                
                <AnimatePresence mode="wait">
                  {currentPrompt ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-6 h-full flex flex-col justify-between"
                      key="active-prompt"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-luxury-800 pb-3">
                          <span className="text-[10px] font-mono uppercase font-bold text-red-450 tracking-widest bg-red-955/20 border border-red-900/30 px-2.5 py-1 rounded-md">
                            Prompt Concept: {currentPrompt.theme}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-neutral-500 tracking-widest font-mono block">DIRECTIONS & SETUP</span>
                          <p className="font-serif text-lg text-neutral-200 leading-relaxed italic">
                            "{currentPrompt.description}"
                          </p>
                        </div>

                        <div className="bg-luxury-900/60 p-4 rounded-2xl border border-luxury-800 flex items-start gap-3">
                          <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 block">Aesthetic Lighting/Focal Guideline</span>
                            <p className="text-[11px] text-neutral-300 font-light">{currentPrompt.aestheticTip}</p>
                          </div>
                        </div>
                      </div>

                      {/* Upload block */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                          isDragOver 
                            ? "border-red-500 bg-red-950/20 text-red-400 glow-red"
                            : "border-luxury-800 hover:border-luxury-700 bg-luxury-900/20 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                          disabled={uploadLoading}
                        />

                        {uploadLoading ? (
                          <>
                            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mb-1" />
                            <p className="text-xs text-red-300 font-serif">Analyzing Image & Writing Poetic Caption...</p>
                            <p className="text-[9px] text-neutral-500 italic block">Conversing with Gemini model server-side...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-neutral-500 animate-bounce mb-1" />
                            <p className="text-xs text-neutral-300 font-medium">Drag & Drop private photograph here, or click to browse</p>
                            <p className="text-[10px] text-neutral-500 italic">Safe local upload. Conversion to secure locked Base64 memory.</p>
                          </>
                        )}
                      </div>

                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4" key="fallback">
                      <div className="w-20 h-20 rounded-full border border-dashed border-luxury-800 flex items-center justify-center text-neutral-600">
                        <Image className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-lg text-neutral-300">Generate a Scene</p>
                        <p className="text-xs text-neutral-500 max-w-xs font-light">Set your camera criteria on the left and invoke prompt direction to generate coordinates and upload memory photos.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>

              </div>

            </div>

            {/* Gallery Memory Grid display */}
            <div className="space-y-4 pt-4">
              <div className="border-b border-luxury-800 pb-3">
                <h3 className="font-serif text-xl font-normal text-white">Private Sanctuary Memories ({photos.length})</h3>
                <p className="text-xs text-neutral-400 font-light">Your private local picture roll. Completely secret, only accessible inside this authenticated vault session.</p>
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {photos.map((item, index) => (
                    <Reveal key={item.id} delay={Math.min(index * 0.04, 0.4)}>
                    <TiltCard maxTilt={3}>
                    <motion.div
                      layout
                      className="bg-luxury-900/60 border border-luxury-800 rounded-3xl overflow-hidden group shadow-lg flex flex-col justify-between"
                    >
                      {/* Secure Image Container */}
                      <div className="relative aspect-[4/3] bg-luxury-950 overflow-hidden border-b border-luxury-800">
                        <img
                          src={item.imageUrl}
                          alt="Sanctuary memory"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-transparent to-transparent opacity-60 pointer-events-none" />
                        <div className="absolute top-4 right-4 flex gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono tracking-widest uppercase bg-luxury-950/90 text-red-400 border border-luxury-800/80">
                            {item.target === "Together" ? "Both" : item.target}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("Delete this intimacy memory from our security vault forever?")) {
                                onDeletePhoto(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-luxury-950/90 text-neutral-400 hover:text-red-400 hover:border-red-500/20 border border-luxury-800 transition"
                            title="Delete memory"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Details & Captions */}
                      <div className="p-5 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {item.captionGeneratedByAI && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-red-500/10 text-red-400 rounded font-mono uppercase tracking-widest border border-red-800/20 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                Gemini Caption
                              </span>
                            )}
                          </div>
                          
                          {/* Poetic description from AI */}
                          <p className="font-serif text-sm text-neutral-100 italic leading-relaxed leading-snug">
                            "{item.description}"
                          </p>
                        </div>

                        {/* Associated photography pose prompt for context */}
                        <div className="bg-luxury-950/60 p-3 rounded-xl border border-luxury-850">
                          <span className="text-[9px] font-mono text-neutral-500 block uppercase tracking-widest mb-0.5">Original Camera Direction:</span>
                          <p className="text-[10px] text-neutral-400 leading-normal font-light italic truncate">{item.promptText}</p>
                        </div>
                      </div>

                    </motion.div>
                    </TiltCard>
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
                  <Image className="w-12 h-12 text-neutral-700 mx-auto" />
                  <p className="text-sm">No photos securely added to your vault gallery memory roll yet.</p>
                </div>
              )}
            </div>

      </motion.div>

    </div>
  );
}
