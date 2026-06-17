import React, { useState } from "react";
import { PeriodConfig, CycleLog, CyclePhase, PhaseProtocol } from "../types";
import { Calendar, Brain, Heart, Sparkles, HelpCircle, Utensils, Smile, Flame, Plus, Lock, Layout, Info, FileText, UploadCloud, AlertCircle, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PeriodTrackerProps {
  config: PeriodConfig;
  logs: CycleLog[];
  onUpdateConfig: (lastPeriodDate: string, cycleLength: number, periodLength: number) => void;
  onAddLog: (date: string, symptoms: string[], moods: string[], intimacyLevel: "None" | "Light Touch" | "Sensual" | "Intense", notes?: string) => void;
  onImportSuccess?: () => void;
}

// ---------------- PHASE BOUNDARY DEFINITIONS ----------------
const PROTOCOLS: Record<CyclePhase, PhaseProtocol> = {
  Menstrual: {
    phase: "Menstrual",
    days: "Days 1 - 5",
    description: "Hormones are at their lowest. The body is shedding uterine lining, which uses considerable stamina. Energy, attention, and pain tolerance are naturally reduced.",
    wifeSymptoms: ["Pelvic cramping", "Lower back ache", "Fatigue & brain fog", "Desire for physical comfort"],
    husbandToDos: [
      "Prepare a hot wheat pack or hot water bottle for her lower back/tummy.",
      "Bring her warm herbal teas (raspberry leaf, ginger or chamomile) and clear her chore duties.",
      "Actively listen without offering analytical solutions. Run her a warm soothing bath.",
      "Avoid initiating demanding activities; prioritize quiet restorative rest together."
    ],
    recommendedIntimacy: "Whisper soft praise, hold her closely for prolonged skin-to-skin oxytocin snuggle releases, full body slow hair brushing.",
    foodsToProvide: ["Iron-rich organic spinach & lentils", "Steamed cottage cheese (Paneer) or soft eggs", "Hot almond berry oatmeal", "Magnesium-rich dark chocolate (70%+)"]
  },
  Follicular: {
    phase: "Follicular",
    days: "Days 6 - 11",
    description: "Estrogen and follicle-stimulating hormones are rising. This triggers a surge of mental clarity, fresh physical stamina, and playfulness.",
    wifeSymptoms: ["Fresh energy burst", "Higher optimism", "High social curiosity", "Glowing brain clarity"],
    husbandToDos: [
      "Schedule a novel date night out. Pursue a spontaneous active adventure.",
      "Flirt heavily and tease her with surprise sensual text messages.",
      "Support her new creative projects or support intense workout routines.",
      "Compliment her intelligence and creative ideas."
    ],
    recommendedIntimacy: "Spontaneous, lighthearted, highly visual, fun outdoor teasing before locking the bedroom door.",
    foodsToProvide: ["Fermented foods (sauerkraut, curd)", "Avocados & pumpkin seeds", "Fresh crunchy citrus leaf salads", "Savory egg scrambles or light sesame tofu"]
  },
  Ovulatory: {
    phase: "Ovulatory",
    days: "Days 12 - 16",
    description: "Estrogen levels peak and LH spike releases the egg. Libido, skin luminescence, and verbal charm are at their maximum biological peak of the month.",
    wifeSymptoms: ["Peak libido/sex-drive", "High lubrication", "Symmetrical glowing features", "Excellent social empathy"],
    husbandToDos: [
      "Worship her form and describe exactly how physically captivating she is.",
      "Clear your evening calendar completely for physical connect sessions.",
      "Surprise her with fresh roses or fine dark chocolates in bed.",
      "Take the lead and be dominant in managing domestic flow."
    ],
    recommendedIntimacy: "Maximum physical intensity, passionate exploration, fully uninhibited play. Highly recommended to use the WICKED CHAMBER.",
    foodsToProvide: ["Fresh red raspberries or strawberries", "Quinoa salad and crisp walnuts", "Steamed asparagus & cheese galettes", "Cardamom milk sweets & dark berry juice"]
  },
  Luteal: {
    phase: "Luteal",
    days: "Days 17 - 28",
    description: "Progesterone dominates can cause nesting behaviors, followed by a sharp drop in estrogen. Potential PMS signs include water weight retention, breast tenderness, and anxiety.",
    wifeSymptoms: ["Breast tenderness", "Water bloating", "Nesting/cozy desires", "Anxiety or mild irritability"],
    husbandToDos: [
      "DO NOT take sudden mood swings or quietness personally. They are biochemical.",
      "Help with cleaning chores without prompting to lower her stress cortisol.",
      "Gently rub her calves, feet, or temples with lavender essential oils.",
      "Provide endless verbal reassurance of her safety and beauty."
    ],
    recommendedIntimacy: "Sensual and slow touches, comforting neck strokes, slow deep breathing syncs, non-demanding sweet physical adoration.",
    foodsToProvide: ["Complex carbs (roasted sweet potato, butternut squash)", "Warm spiced lentil & vegetable soups", "Bananas & natural roasted almonds", "Warm cinnamon, ginger & clove teas"]
  }
};

export default function PeriodTracker({ config, logs, onUpdateConfig, onAddLog, onImportSuccess }: PeriodTrackerProps) {
  // Input Config toggler/form
  const [showConfig, setShowConfig] = useState(false);
  const [editDate, setEditDate] = useState(config.lastPeriodDate);
  const [editCycle, setEditCycle] = useState(config.cycleLength);
  const [editPeriod, setEditPeriod] = useState(config.periodLength);

  // PDF & Screenshot AI analysis state
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) return;

      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        const res = await fetch("/api/period/import-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfData: base64Data })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to process cycle document");
        }

        const data = await res.json();
        setUploadSuccess(true);
        setExtractedCount(data.count || 0);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } catch (err: any) {
        setUploadError(err.message || "Failed to analyze document.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read local file.");
    };
    reader.readAsDataURL(file);
  };

  // New log form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [intimacy, setIntimacy] = useState<"None" | "Light Touch" | "Sensual" | "Intense">("Sensual");
  const [notes, setNotes] = useState("");

  // Options lists
  const SYMPTOMS_OPTIONS = ["Cramps", "Bloating", "Headache", "Tenderness", "Fatigue", "Insomnia", "Anxiety", "High Energy", "High Sex Drive"];
  const MOODS_OPTIONS = ["Radiant", "Calm", "Tender", "Playful", "Sassy", "Vulnerable", "Exhausted", "Irritable", "Anxious"];

  // ---------------- CYCLE METRICS CALCULATIONS ----------------
  const calculateCycleInfo = () => {
    const lastDate = new Date(config.lastPeriodDate);
    const today = new Date();
    
    // Day in current cycle
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // wrap around in case user is over 28 days
    const currentDayOfCycle = (diffDays % config.cycleLength) + 1;
    
    // Determine active phase
    let activePhase: CyclePhase = "Luteal";
    if (currentDayOfCycle <= config.periodLength) {
      activePhase = "Menstrual";
    } else if (currentDayOfCycle <= 11) {
      activePhase = "Follicular";
    } else if (currentDayOfCycle <= 16) {
      activePhase = "Ovulatory";
    } else {
      activePhase = "Luteal";
    }

    const daysUntilNextPeriod = config.cycleLength - currentDayOfCycle + 1;
    
    return {
      currentDayOfCycle,
      activePhase,
      daysUntilNextPeriod,
      percentage: (currentDayOfCycle / config.cycleLength) * 100
    };
  };

  const { currentDayOfCycle, activePhase, daysUntilNextPeriod, percentage } = calculateCycleInfo();
  const currentProtocol = PROTOCOLS[activePhase];

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(editDate, editCycle, editPeriod);
    setShowConfig(false);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog(logDate, selectedSymptoms, selectedMoods, intimacy, notes);
    // Reset Form
    setSelectedSymptoms([]);
    setSelectedMoods([]);
    setNotes("");
    setShowLogForm(false);
  };

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => 
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  return (
    <div id="period-tracker-module" className="space-y-8">
      
      {/* Module Title card header */}
      <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-red-500 animate-pulse" />
            Vesta Cycle Alignment
          </h2>
          <p className="text-sm text-neutral-400">Dynamic cycle logging for her. Essential empathy action protocols for him.</p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setShowPdfImport(!showPdfImport);
              setShowConfig(false);
              setShowLogForm(false);
            }}
            className={`px-4 py-2 border text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-1.5 ${
              showPdfImport 
                ? "bg-red-950/40 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                : "border-white/10 hover:bg-white/[0.05] text-neutral-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Import PDF / Image
          </button>

          <button
            onClick={() => {
              setShowConfig(!showConfig);
              setShowPdfImport(false);
              setShowLogForm(false);
            }}
            className={`px-4 py-2 border text-xs font-semibold rounded-2xl transition cursor-pointer ${
              showConfig 
                ? "bg-white/[0.07] border-white/20 text-white" 
                : "border-white/10 hover:bg-white/[0.05] text-neutral-300"
            }`}
          >
            Configure Bounds
          </button>
          
          <button
            onClick={() => {
              setShowLogForm(!showLogForm);
              setShowConfig(false);
              setShowPdfImport(false);
            }}
            className="px-4 py-2 bg-red-900/60 border border-red-700/50 hover:bg-red-800 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-red-950/15 transition flex items-center gap-1.5 cursor-pointer glow-red"
          >
            <Plus className="w-4 h-4" />
            Log Today's State
          </button>
        </div>
      </div>

      {/* PDF / Image Importer Accordion */}
      <AnimatePresence>
        {showPdfImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/80 border border-luxury-800 rounded-3xl p-6 shadow-xl space-y-6"
          >
            <div className="border-b border-luxury-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium text-white/90 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-red-400 animate-pulse" />
                  Vesta AI Cycle Importer
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Drag-and-drop her Flo or Clue PDF export, cycle health report, or screenshot logs to auto-configure dates and logs.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowPdfImport(false)}
                className="text-xs text-neutral-500 hover:text-white transition cursor-pointer font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition duration-300 flex flex-col items-center justify-center space-y-4 cursor-pointer relative ${
                isDragging 
                  ? "border-red-500 bg-red-950/10" 
                  : "border-luxury-800/85 hover:border-red-900/40 bg-luxury-950/40"
              }`}
            >
              <input
                type="file"
                id="pdf-file-picker"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {isUploading ? (
                <div className="space-y-3 py-4">
                  <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto" />
                  <p className="text-sm text-neutral-200 font-medium">Gemini AI is reading and translating her cycle reports...</p>
                  <p className="text-[10px] text-neutral-550 animate-pulse font-mono uppercase tracking-wider">Synchronizing cycle alignment benchmarks</p>
                </div>
              ) : uploadSuccess ? (
                <div className="space-y-3 py-2">
                  <div className="w-12 h-12 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">Alignment Successful!</p>
                  <p className="text-xs text-neutral-300 font-light max-w-sm mx-auto">
                    Extracted and synchronized <strong className="font-bold text-white">{extractedCount}</strong> daily cycle logs and updated active parameters.
                  </p>
                  <p className="text-[10px] text-neutral-550 font-mono uppercase tracking-widest mt-1">All history logs have been synchronized</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-950/20 border border-red-500/10 text-red-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <UploadCloud className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-200 font-medium">Select or drag & drop cycle file</p>
                    <p className="text-xs text-neutral-500">Supports PDF tracker exports, or phone screenshots of cycle calendars.</p>
                  </div>
                </>
              )}
            </div>

            {/* Error notifications */}
            {uploadError && (
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-300 space-y-1 text-left">
                  <p className="font-semibold text-red-400">Failed to analyze cycle document</p>
                  <p className="leading-relaxed">{uploadError}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cycle Bounds config form (Accordion toggle) */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/80 border border-luxury-800 rounded-3xl p-6 shadow-xl"
          >
            <form onSubmit={handleConfigSubmit} className="space-y-6">
              <h3 className="font-serif text-lg font-medium text-white/90">Set Menstrual Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Last Period Starting Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-800 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Cycle Length (Average Days)</label>
                  <input
                    type="number"
                    min="20"
                    max="45"
                    required
                    value={editCycle}
                    onChange={(e) => setEditCycle(parseInt(e.target.value))}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-800 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Bleeding Phase Length (Days)</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    required
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(parseInt(e.target.value))}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-800 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-white text-xs font-bold rounded-2xl shadow-lg transition glow-red"
                >
                  Recalculate Cycle
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily symptoms logging form */}
      <AnimatePresence>
        {showLogForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/80 border border-luxury-800 rounded-3xl p-6 shadow-xl"
          >
            <form onSubmit={handleLogSubmit} className="space-y-6">
              <div className="border-b border-luxury-800 pb-3">
                <h3 className="font-serif text-lg font-medium text-red-400 animate-pulse">Record Domestic Symptoms & Vibes</h3>
                <p className="text-xs text-neutral-500">Log today's symptoms, moods, and desires to align your connection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and intimacy level */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium block">Select Date</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-800 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium block">Intimacy Desire / Level</label>
                  <select
                    value={intimacy}
                    onChange={(e) => setIntimacy(e.target.value as any)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-800 transition"
                  >
                    <option value="None">Restorative Rest (No touch expected)</option>
                    <option value="Light Touch">Gentle Warm Touch (Cuddles, back rubs)</option>
                    <option value="Sensual">Sensual slow (Swirling caresses)</option>
                    <option value="Intense">Intense Passion (Deep touch desires)</option>
                  </select>
                </div>
              </div>

              {/* Symptoms chips */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">How is she physically feeling? (Select multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS_OPTIONS.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-red-500/10 border-red-500 text-red-400"
                            : "bg-luxury-950/40 border-luxury-850 text-neutral-400 hover:border-luxury-700"
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Moods selection */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">Active Mood Vibe (Select multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS_OPTIONS.map((mood) => {
                    const isSelected = selectedMoods.includes(mood);
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => toggleMood(mood)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-red-550/10 border-red-800 text-red-300"
                            : "bg-luxury-950/40 border-luxury-850 text-neutral-400 hover:border-luxury-700"
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">Additional Notes / Custom boundary requests</label>
                <textarea
                  placeholder="e.g. Incredibly busy workday, craving lower back oil strokes and total quiet at 9 PM."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-luxury-950 border border-luxury-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-800 transition resizing-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-white text-xs font-bold rounded-2xl shadow-lg transition glow-red"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Cycle Tracker Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Tracker Progress Circle Dial (Col span 5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-luxury-900/85 to-luxury-950/60 border border-luxury-800 rounded-3xl p-8 flex flex-col items-center justify-between space-y-6 relative overflow-hidden text-center">
          
          <div className="space-y-1">
            <span className="text-[10px] tracking-widest font-mono uppercase text-[#e11d48]">Current Phase Position</span>
            <h3 className="font-serif text-3xl font-medium tracking-wide text-white">{activePhase} Phase</h3>
            <p className="text-xs text-neutral-400 italic">Day {currentDayOfCycle} inside {config.cycleLength}-Day cycle.</p>
          </div>

          {/* Majestic graphic cycle circle ring */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Background SVG path container */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx={88}
                cy={88}
                r={72}
                className="stroke-luxury-950/80 fill-none"
                strokeWidth={14}
              />
              <circle
                cx={88}
                cy={88}
                r={72}
                className="stroke-red-700 fill-none transition-all duration-1000"
                strokeWidth={10}
                strokeDasharray={2 * Math.PI * 72}
                strokeDashoffset={2 * Math.PI * 72 * (1 - currentDayOfCycle / config.cycleLength)}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner text metric */}
            <div className="text-center space-y-0.5">
              <span className="font-mono text-3xl tracking-tight text-white font-extrabold">{daysUntilNextPeriod}</span>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block">Days Until</span>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block glow-red">Next Period</span>
            </div>
          </div>

          {/* Quick cycle info bounds stats helper */}
          <div className="w-full bg-luxury-950/60 rounded-2xl border border-luxury-850 p-4 text-xs flex justify-around text-neutral-400">
            <div>
              <span className="text-[9px] font-mono block uppercase">Last Started</span>
              <span className="text-neutral-200 font-bold">{new Date(config.lastPeriodDate).toLocaleDateString(undefined, {month: "short", day: "numeric"})}</span>
            </div>
            <div className="border-l border-luxury-800" />
            <div>
              <span className="text-[9px] font-mono block uppercase">Cycle length</span>
              <span className="text-neutral-200 font-bold">{config.cycleLength} Days</span>
            </div>
          </div>
        </div>

        {/* Right column: Husband's protocol guides & instructions (Col span 7) */}
        <div className="lg:col-span-7 bg-luxury-950/40 border border-luxury-800 rounded-3xl p-8 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Section Tag */}
            <div className="flex items-center justify-between border-b border-luxury-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-red-550/10 border border-red-900/30 text-red-400 text-[10px] font-bold tracking-widest uppercase">
                  Husband Alignment Guide
                </span>
                <span className="text-[11px] font-serif text-red-400 italic lowercase">Active stage protocol</span>
              </div>
              <span className="text-xs text-neutral-500 font-mono tracking-wider">{currentProtocol.days}</span>
            </div>

            {/* Description of active stage */}
            <div className="space-y-2">
              <h4 className="font-serif text-lg font-normal text-white italic">" {currentProtocol.description} "</h4>
            </div>

            {/* Action checklist list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* ToDos Panel */}
              <div className="space-y-3 bg-luxury-900/40 p-5 rounded-2xl border border-luxury-800/80">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Your Care Directives
                </span>
                <ul className="space-y-2.5 text-xs font-light text-neutral-300 leading-normal">
                  {currentProtocol.husbandToDos.map((item, id) => (
                    <li key={id} className="flex items-start gap-2">
                      <span className="text-red-500 select-none shrink-0 mt-0.5">✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Restorative food and Libido indicators block */}
              <div className="space-y-4">
                
                {/* Food block */}
                <div className="space-y-2 bg-luxury-900/40 p-4 rounded-2xl border border-luxury-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 flex items-center gap-1.5 font-bold">
                    <Utensils className="w-3.5 h-3.5" />
                    Kitchen Alignment / Foods
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProtocol.foodsToProvide.map((food, id) => (
                      <span key={id} className="px-2 py-1 rounded-lg bg-luxury-950 font-mono text-[9px] text-red-300 border border-luxury-80 border-transparent">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Intimacy style guide */}
                <div className="space-y-1.5 bg-luxury-900/40 p-4 rounded-2xl border border-luxury-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 flex items-center gap-1.5 font-bold">
                    <Heart className="w-3.5 h-3.5" />
                    Intimacy Alignment
                  </span>
                  <p className="text-[11px] text-neutral-300 font-light leading-relaxed leading-snug">
                    {currentProtocol.recommendedIntimacy}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Cycle Logs timeline list */}
      {logs.length > 0 && (
        <div className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-6">
          <div className="border-b border-luxury-800 pb-3 mb-6">
            <h3 className="font-serif text-lg font-medium text-white/90">Sanctuary Log Book History</h3>
            <p className="text-xs text-neutral-500">Your intimate notes of symptoms, moods, and desires calculated over time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="bg-luxury-950/50 rounded-2xl border border-luxury-800 p-5 space-y-4 hover:border-luxury-700 transition"
              >
                {/* log date and intimacy style title */}
                <div className="flex items-center justify-between border-b border-luxury-850 pb-2">
                  <span className="text-xs text-neutral-400 font-mono">{new Date(log.date).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</span>
                  <span className="px-2 py-0.5 rounded bg-luxury-900 border border-luxury-800 text-[9px] font-mono text-red-400 uppercase tracking-widest">
                    Touch: {log.intimacyLevel}
                  </span>
                </div>

                {/* symptoms bubble wrap */}
                {log.symptoms.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase tracking-widest">Symptoms:</span>
                    <div className="flex flex-wrap gap-1">
                      {log.symptoms.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-red-500/10 border border-red-800/20 text-red-300 text-[9px] rounded-md font-light">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* mood bubble wrap */}
                {log.moods.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase tracking-widest">Wife's Vibe:</span>
                    <div className="flex flex-wrap gap-1">
                      {log.moods.map(m => (
                        <span key={m} className="px-1.5 py-0.5 bg-red-500/10 border border-red-805/20 text-red-300 text-[9px] rounded-md font-light">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* notes */}
                {log.notes && (
                  <div className="space-y-1 bg-luxury-900/60 p-2.5 rounded-xl border border-luxury-850">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase tracking-widest">Notes:</span>
                    <p className="text-[10px] text-neutral-300 italic font-light leading-relaxed">"{log.notes}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
