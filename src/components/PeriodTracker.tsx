import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/apiFetch";
import { getMostRecentPeriodStart } from "../lib/cyclePredictions";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";
import { PeriodConfig, CycleLog, CyclePhase, PhaseProtocol } from "../types";
import { 
  Calendar, Brain, Heart, Sparkles, Utensils, Plus, Lock, 
  FileText, UploadCloud, CircleAlert, Loader2, Check, 
  Download, Moon, Droplets, Scale, Thermometer, Info, 
  ChevronRight, BarChart3, ShieldCheck, Activity, Eye, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PeriodTrackerProps {
  config: PeriodConfig;
  logs: CycleLog[];
  onUpdateConfig: (lastPeriodDate: string, cycleLength: number, periodLength: number, pregnancyMode?: boolean, pregnancyStartDate?: string) => void;
  onAddLog: (
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
  ) => void;
  onImportSuccess?: () => void;
}

// ---------------- PREGNANCY WEEKS BABY SIZE DATA ----------------
const PREGNANCY_WEEKS: Record<number, { size: string; desc: string }> = {
  1: { size: "Poppy Seed", desc: "The cycle begins. The body is preparing for an incredible journey." },
  2: { size: "Tiny Seed", desc: "Ovulation takes place. Fertilization might happen this week." },
  3: { size: "Microscopic Pinhead", desc: "The blastocyst is traveling down the fallopian tube to find its home." },
  4: { size: "Poppy Seed", desc: "Implantation in the uterine wall. Cells are dividing rapidly." },
  5: { size: "Apple Seed", desc: "The neural tube is developing, and the tiny heart starts to beat." },
  6: { size: "Sweet Pea", desc: "Facial features, tiny arm buds, and leg buds start to sprout." },
  7: { size: "Blueberry", desc: "Brain activity begins, and key internal organs are shaping." },
  8: { size: "Raspberry", desc: "Hands and feet are developing webbing, and the skeleton is forming." },
  9: { size: "Green Olive", desc: "Embryonic tail is gone. Tiny muscles begin to twitch." },
  10: { size: "Prune", desc: "Officially a fetus! All vital organs are formed and active." },
  11: { size: "Lime", desc: "Fingernails are developing and bones are gradually hardening." },
  12: { size: "Plum", desc: "Reflexes appear; fingers can flex. The brain is buzzing with development." },
  13: { size: "Lemon", desc: "Vocal cords form, and kidneys begin filtering fluids." },
  14: { size: "Nectarine", desc: "Lungs practice breathing motions. Neck is elongating." },
  15: { size: "Apple", desc: "Skeleton develops further. Eyes shift slightly under closed lids." },
  16: { size: "Avocado", desc: "The nervous system is fully functional. Baby can make sucking facial expressions." },
  17: { size: "Pomegranate", desc: "Fat deposits form under the skin to provide vital warmth." },
  18: { size: "Artichoke", desc: "Hearing is developing. Baby can hear her heartbeat." },
  19: { size: "Mango", desc: "A protective coating (vernix) covers the baby's delicate skin." },
  20: { size: "Banana", desc: "Halfway point! She may start to feel light butterfly flutters." },
  21: { size: "Carrot", desc: "Taste buds are functional; baby swallows amniotic fluid." },
  22: { size: "Spaghetti Squash", desc: "Eyes and lips are fully formed. Eyelashes are visible." },
  23: { size: "Grapefruit", desc: "Rapid eye movements begin, and inner ear balance develops." },
  24: { size: "Cantaloupe", desc: "Lungs form air sacs, preparing for life outside." },
  25: { size: "Cauliflower", desc: "Spinal structures strengthen. Baby responds to sounds." },
  26: { size: "Red Cabbage", desc: "Lungs produce surfactant, vital for air breathing." },
  27: { size: "Acorn Squash", desc: "Baby can open and blink eyes. Brain develops wrinkles." },
  28: { size: "Eggplant", desc: "Third trimester! Eyelashes are fully grown and blinking begins." },
  29: { size: "Butternut Squash", desc: "The head grows to accommodate rapid brain expansion." },
  30: { size: "Cabbage", desc: "Bone marrow takes charge of red blood cell production." },
  31: { size: "Pineapple", desc: "All sensory channels are active. Nervous system is mature." },
  32: { size: "Jicama", desc: "Lighter lanugo hair drops. Regular sleep cycles develop." },
  33: { size: "Celery Bunch", desc: "Baby's immune system gets protective antibodies from mother." },
  34: { size: "Butternut Squash", desc: "Nervous system and lungs mature further. Baby is plump." },
  35: { size: "Honeydew Melon", desc: "Hearing is fully functional; baby starts turning head." },
  36: { size: "Romaine Lettuce", desc: "Lungs are fully prepared. Fat is accumulating in limbs." },
  37: { size: "Swiss Chard", desc: "Full term! All systems are functional and ready." },
  38: { size: "Leek", desc: "Lungs produce more surfactant. Vocal cords are thick." },
  39: { size: "Watermelon", desc: "Placenta continues supplying antibodies. Baby is ready." },
  40: { size: "Pumpkin", desc: "Due date week! The beautiful sanctuary awaits their arrival." }
};

// ---------------- PHASE BOUNDARY DEFINITIONS ----------------
const PROTOCOLS: Record<CyclePhase | "Pregnancy", PhaseProtocol> = {
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
  },
  Pregnancy: {
    phase: "Pregnancy" as any,
    days: "Weeks 1 - 40+",
    description: "Growing a new life requires immense biochemical energy and structural alignment. Focus on nourishing nutrients, hydration, stress reduction, and deep physical comforting.",
    wifeSymptoms: ["Morning sickness", "Fatigue & exhaustion", "Back strain & pelvic pressure", "Intense emotional shifts"],
    husbandToDos: [
      "Ensure she is fully hydrated; keep a clean bottle of fresh lemon water within arms reach.",
      "Offer gentle lower back, shoulder, and foot rubs to relieve carrying strain.",
      "Handle all high-strain domestic cleaning chores, cooking prep, and household organization.",
      "Provide complete verbal security and remind her of how beautiful her carrying body is."
    ],
    recommendedIntimacy: "Comforting slow cradling snuggles, gentle foot reflexology massage, soft scalp strokes, peaceful silent present connection.",
    foodsToProvide: ["Folate-rich avocados & spinach", "Protein-dense Greek yogurt & fresh paneer", "Fibre-rich warm oats & chia seed pudding", "Warming organic vegetable broth or spiced lentil soup"]
  }
};

export default function PeriodTracker({ config, logs, onUpdateConfig, onAddLog, onImportSuccess }: PeriodTrackerProps) {
  // Input Config toggler/form
  const [showConfig, setShowConfig] = useState(false);
  const [editDate, setEditDate] = useState(config.lastPeriodDate);
  const [editCycle, setEditCycle] = useState(config.cycleLength);
  const [editPeriod, setEditPeriod] = useState(config.periodLength);
  const [pregnancyMode, setPregnancyMode] = useState(config.pregnancyMode || false);
  const [pregnancyStartDate, setPregnancyStartDate] = useState(config.pregnancyStartDate || config.lastPeriodDate);

  // Keep the edit form in sync with the server. Without this, if config
  // changes elsewhere (the other partner edits it, or a PDF import updates
  // it) while this component is mounted, the form would keep showing the
  // old values - and saving it would silently overwrite the newer data.
  useEffect(() => {
    setEditDate(config.lastPeriodDate);
    setEditCycle(config.cycleLength);
    setEditPeriod(config.periodLength);
    setPregnancyMode(config.pregnancyMode || false);
    setPregnancyStartDate(config.pregnancyStartDate || config.lastPeriodDate);
  }, [config.lastPeriodDate, config.cycleLength, config.periodLength, config.pregnancyMode, config.pregnancyStartDate]);

  // PDF & Screenshot AI analysis state
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);

  // New log form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [intimacy, setIntimacy] = useState<"None" | "Light Touch" | "Sensual" | "Intense">("Sensual");
  const [notes, setNotes] = useState("");
  
  // Flo-style extra logs
  const [flow, setFlow] = useState<"None" | "Spotting" | "Light" | "Medium" | "Heavy">("None");
  const [temp, setTemp] = useState("");
  const [weight, setWeight] = useState("");
  const [water, setWater] = useState("");
  const [sleep, setSleep] = useState("");
  const [sex, setSex] = useState<"None" | "Protected" | "Unprotected">("None");

  // Options lists
  const SYMPTOMS_OPTIONS = ["Cramps", "Bloating", "Headache", "Tenderness", "Fatigue", "Insomnia", "Anxiety", "High Energy", "High Sex Drive", "Backache", "Nausea", "Acne"];
  const MOODS_OPTIONS = ["Radiant", "Calm", "Tender", "Playful", "Sassy", "Vulnerable", "Exhausted", "Irritable", "Anxious", "Sad", "Happy", "Emotional"];

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

  const MAX_IMPORT_FILE_SIZE_MB = 15;

  const processFile = (file: File) => {
    const isAcceptedType = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!isAcceptedType) {
      setUploadError("Please upload a PDF or screenshot image (PNG/JPG).");
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`That file is too large (max ${MAX_IMPORT_FILE_SIZE_MB}MB). Try a smaller export or a cropped screenshot.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) return;

      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        const res = await apiFetch("/api/period/import-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfData: base64Data })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
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

  // ---------------- CYCLE METRICS & STATS CALCULATIONS ----------------
  const calculateCycleStats = () => {
    if (logs.length === 0) {
      return {
        avgCycle: config.cycleLength,
        avgPeriod: config.periodLength,
        variability: "Regular",
        periodsCount: 0
      };
    }

    // Sort ascending
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Period start days typically identified by Flow starting (Light, Medium, Heavy) 
    // after at least 14 days of no bleeding.
    const bleedingDates = sortedLogs
      .filter(l => l.flow && l.flow !== "None" && l.flow !== "Spotting")
      .map(l => l.date);
    
    const periods: string[][] = [];
    let currentPeriod: string[] = [];

    bleedingDates.forEach((dateStr) => {
      if (currentPeriod.length === 0) {
        currentPeriod.push(dateStr);
      } else {
        const lastDate = new Date(currentPeriod[currentPeriod.length - 1]);
        const currentDate = new Date(dateStr);
        const diffDays = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 4) { // consecutive or near-consecutive bleeding days
          currentPeriod.push(dateStr);
        } else {
          periods.push(currentPeriod);
          currentPeriod = [dateStr];
        }
      }
    });
    if (currentPeriod.length > 0) {
      periods.push(currentPeriod);
    }

    const cycleLengths: number[] = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const start1 = new Date(periods[i][0]);
      const start2 = new Date(periods[i+1][0]);
      const diffDays = (start2.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 15 && diffDays <= 45) {
        cycleLengths.push(diffDays);
      }
    }

    const periodLengths = periods.map(p => {
      if (p.length === 1) return 1;
      const start = new Date(p[0]);
      const end = new Date(p[p.length - 1]);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    });

    const avgCycle = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : config.cycleLength;
      
    const avgPeriod = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : config.periodLength;

    let variability = "Regular";
    if (cycleLengths.length >= 3) {
      const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
      const variance = cycleLengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / cycleLengths.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 4) {
        variability = "Irregular";
      }
    }

    return {
      avgCycle,
      avgPeriod,
      variability,
      periodsCount: periods.length
    };
  };

  const { avgCycle, avgPeriod, variability, periodsCount } = calculateCycleStats();

  const calculateCycleInfo = () => {
    // ---------------- PREGNANCY CALCULATIONS ----------------
    if (config.pregnancyMode) {
      const startDateStr = config.pregnancyStartDate || config.lastPeriodDate;
      const start = new Date(startDateStr);
      const today = new Date();
      const diffTime = today.getTime() - start.getTime();
      let diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      const weeks = Math.min(42, Math.floor(diffDays / 7));
      const days = Math.floor(diffDays % 7);
      const estDueDate = new Date(start.getTime() + 280 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      return {
        currentDayOfCycle: 0,
        activePhase: "Pregnancy" as CyclePhase,
        daysUntilNextPeriod: 0,
        percentage: (weeks / 40) * 100,
        pregnancyWeeks: weeks,
        pregnancyDays: days,
        dueDate: estDueDate
      };
    }

    // ---------------- STANDARD CYCLE CALCULATIONS ----------------
    // Prefer the period start date derived from actual logged flow data
    // over the raw config field - this is what keeps predictions correct
    // even if config.lastPeriodDate drifts out of sync with what's
    // actually been logged day-by-day (e.g. from an import that recorded
    // a slightly different date than the daily log entries).
    const effectiveLastPeriodDate = getMostRecentPeriodStart(config, logs);
    const lastDate = new Date(effectiveLastPeriodDate);
    const today = new Date();
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Guard against corrupt/zero cycle length (e.g. from a bad import) -
    // dividing or modulo-ing by 0 would otherwise produce NaN everywhere
    // downstream in the UI with no clear error.
    const safeCycleLength = config.cycleLength > 0 ? config.cycleLength : 28;
    
    // wrap around in case user is over cycle bounds
    // (use a proper positive modulo - JS's % can return negative results
    // when diffDays is negative, e.g. if lastPeriodDate is set in the
    // future by mistake, which would otherwise silently show a nonsensical
    // negative or zero cycle day)
    const positiveMod = (n: number, m: number) => ((n % m) + m) % m;
    const currentDayOfCycle = positiveMod(diffDays, safeCycleLength) + 1;
    
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

    const daysUntilNextPeriod = safeCycleLength - currentDayOfCycle + 1;
    
    // Fertile Window Calculations
    const ovulationDayOfCycle = safeCycleLength - 14;
    const fertileWindowStart = ovulationDayOfCycle - 5;
    const fertileWindowEnd = ovulationDayOfCycle;
    
    let fertilityChance = "Low";
    if (currentDayOfCycle === ovulationDayOfCycle) {
      fertilityChance = "Peak (Ovulation Day)";
    } else if (currentDayOfCycle >= fertileWindowStart && currentDayOfCycle <= fertileWindowEnd) {
      fertilityChance = "High (Fertile Window)";
    }

    return {
      currentDayOfCycle,
      activePhase,
      daysUntilNextPeriod,
      percentage: (currentDayOfCycle / safeCycleLength) * 100,
      pregnancyWeeks: 0,
      pregnancyDays: 0,
      dueDate: "",
      fertilityChance
    };
  };

  const { 
    currentDayOfCycle, 
    activePhase, 
    daysUntilNextPeriod, 
    percentage, 
    pregnancyWeeks, 
    pregnancyDays, 
    dueDate,
    fertilityChance 
  } = calculateCycleInfo();

  const currentProtocol = PROTOCOLS[activePhase];

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(editDate, editCycle, editPeriod, pregnancyMode, pregnancyStartDate);
    setShowConfig(false);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLog(
      logDate, 
      selectedSymptoms, 
      selectedMoods, 
      intimacy, 
      notes,
      flow,
      temp ? parseFloat(temp) : undefined,
      weight ? parseFloat(weight) : undefined,
      water ? parseInt(water) : undefined,
      sleep ? parseFloat(sleep) : undefined,
      sex
    );
    // Reset Form
    setSelectedSymptoms([]);
    setSelectedMoods([]);
    setNotes("");
    setFlow("None");
    setTemp("");
    setWeight("");
    setWater("");
    setSleep("");
    setSex("None");
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
          
          {/* Direct Data Exports */}
          <div className="flex items-center bg-luxury-950/80 rounded-2xl border border-white/15 p-1">
            <button
              onClick={() => window.location.href = "/api/period/export?format=json"}
              className="px-3 py-1.5 hover:bg-white/5 rounded-xl text-neutral-300 hover:text-white text-[10px] font-mono tracking-wider transition flex items-center gap-1 cursor-pointer"
              title="Download separate cycle DB in JSON"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
            <div className="w-[1px] h-3 bg-white/10 mx-1" />
            <button
              onClick={() => window.location.href = "/api/period/export?format=csv"}
              className="px-3 py-1.5 hover:bg-white/5 rounded-xl text-neutral-300 hover:text-white text-[10px] font-mono tracking-wider transition flex items-center gap-1 cursor-pointer"
              title="Export all logs as CSV spreadsheet"
            >
              <FileText className="w-3 h-3" />
              CSV
            </button>
          </div>

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
            <UploadCloud className="w-3.5 h-3.5" />
            Import PDF
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
            Configure Params
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
                <CircleAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
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
              <div className="flex items-center justify-between border-b border-luxury-800 pb-3">
                <h3 className="font-serif text-lg font-medium text-white/90">Set Cycle Configuration</h3>
                
                {/* Pregnancy Mode toggle switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400">Pregnancy Mode</span>
                  <button
                    type="button"
                    onClick={() => setPregnancyMode(!pregnancyMode)}
                    className={`p-1 rounded-full w-12 transition-colors cursor-pointer border ${
                      pregnancyMode 
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400" 
                        : "bg-luxury-950 border-luxury-850 text-neutral-600"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-current transition-transform ${pregnancyMode ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pregnancyMode ? (
                  <>
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-xs text-neutral-400 font-medium">Pregnancy Start Date (First day of last period - LMP)</label>
                      <input
                        type="date"
                        required
                        value={pregnancyStartDate}
                        onChange={(e) => setPregnancyStartDate(e.target.value)}
                        className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-800 transition-colors"
                      />
                      <p className="text-[10px] text-neutral-500">Medical standard calculates gestation starting from the first day of your last period.</p>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition"
                >
                  Cancel
                </button>
                <MagneticButton
                  type="submit"
                  className={`px-5 py-2 border text-white text-xs font-bold rounded-2xl shadow-lg transition ${
                    pregnancyMode 
                      ? "bg-emerald-900/60 hover:bg-emerald-800 border-emerald-700/50 glow-emerald" 
                      : "bg-red-900/60 hover:bg-red-800 border-red-700/50 glow-red"
                  }`}
                >
                  Recalculate Bounds
                </MagneticButton>
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
              <div className="border-b border-luxury-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-lg font-medium text-red-400">Record Daily Symptoms & Vitals</h3>
                  <p className="text-xs text-neutral-500">Log symptoms, moods, activity, and health metrics to sync with Flo.</p>
                </div>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-800 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Flow Intensity */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium block">Period Flow</label>
                  <div className="grid grid-cols-5 gap-1 bg-luxury-950 p-1 rounded-xl border border-luxury-850">
                    {(["None", "Spotting", "Light", "Medium", "Heavy"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFlow(opt)}
                        className={`py-2 rounded-lg text-[9px] font-bold font-mono transition cursor-pointer ${
                          flow === opt 
                            ? "bg-red-500/15 text-red-400 border border-red-500/30" 
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Intimacy Alignment */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium block">Intimacy Level Desire</label>
                  <select
                    value={intimacy}
                    onChange={(e) => setIntimacy(e.target.value as any)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-800 transition"
                  >
                    <option value="None">Restorative Rest (No touch)</option>
                    <option value="Light Touch">Gentle Warm Touch (Cuddles)</option>
                    <option value="Sensual">Sensual slow (Caresses)</option>
                    <option value="Intense">Intense Passion (Deep touch)</option>
                  </select>
                </div>

                {/* 3. Sex Activity */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium block">Sexual Activity</label>
                  <div className="grid grid-cols-3 gap-1 bg-luxury-950 p-1 rounded-xl border border-luxury-850">
                    {(["None", "Protected", "Unprotected"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSex(opt)}
                        className={`py-2 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                          sex === opt 
                            ? "bg-red-500/15 text-red-400 border border-red-500/30" 
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Physical Symptoms */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">Physical Symptoms (Select multiple)</label>
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

              {/* Moods */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">Mood Vibe (Select multiple)</label>
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

              {/* Vesta Health Vitals */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">Vesta Health Vitals</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Thermometer className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Temp (°C)"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-red-800"
                    />
                  </div>
                  <div className="relative">
                    <Scale className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Weight (kg)"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-red-800"
                    />
                  </div>
                  <div className="relative">
                    <Droplets className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      placeholder="Water (ml)"
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-red-800"
                    />
                  </div>
                  <div className="relative">
                    <Moon className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Sleep (hrs)"
                      value={sleep}
                      onChange={(e) => setSleep(e.target.value)}
                      className="w-full bg-luxury-950 border border-luxury-800 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 font-medium block">Intimate Notes & Requests</label>
                <textarea
                  placeholder="Notes about physical comfort, specific cravings, or connection alignment."
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
                <MagneticButton
                  type="submit"
                  className="px-5 py-2 bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-white text-xs font-bold rounded-2xl shadow-lg transition glow-red"
                >
                  Save Log Entry
                </MagneticButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Cycle Tracker Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Tracker Progress Circle Dial (Col span 5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-luxury-900/85 to-luxury-950/60 border border-luxury-800 rounded-3xl p-8 flex flex-col items-center justify-between space-y-6 relative overflow-hidden text-center">
          
          {config.pregnancyMode ? (
            <>
              {/* Pregnancy Mode Header */}
              <div className="space-y-1">
                <span className="text-[10px] tracking-widest font-mono uppercase text-emerald-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
                  Pregnancy Mode Active
                </span>
                <h3 className="font-serif text-3xl font-medium tracking-wide text-white">Gestation Stage</h3>
                <p className="text-xs text-neutral-400 italic">Week {pregnancyWeeks}, Day {pregnancyDays}</p>
              </div>

              {/* Pregnancy Circle progress ring */}
              <div className="relative w-44 h-44 flex items-center justify-center">
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
                    className="stroke-emerald-600 fill-none transition-all duration-1000"
                    strokeWidth={10}
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={2 * Math.PI * 72 * (1 - Math.min(40, pregnancyWeeks) / 40)}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="text-center space-y-0.5">
                  <span className="font-mono text-3xl tracking-tight text-white font-extrabold">{40 - pregnancyWeeks}</span>
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block">Weeks Left</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block glow-emerald">to Sanctuary</span>
                </div>
              </div>

              {/* Baby Size comparison badge */}
              <div className="w-full bg-luxury-950/60 rounded-2xl border border-luxury-850 p-4 space-y-2 text-center">
                <span className="text-[9px] font-mono block uppercase text-neutral-500 tracking-wider">Baby Size Standard</span>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400 text-xs font-serif font-bold">
                    {PREGNANCY_WEEKS[pregnancyWeeks]?.size ? PREGNANCY_WEEKS[pregnancyWeeks].size.charAt(0) : "S"}
                  </div>
                  <span className="text-neutral-200 font-serif font-bold text-base">
                    Size of a {PREGNANCY_WEEKS[pregnancyWeeks]?.size || "Poppy Seed"}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                  "{PREGNANCY_WEEKS[pregnancyWeeks]?.desc || "Preparing for growth."}"
                </p>
              </div>

              {/* Due Date Display */}
              <div className="text-xs text-neutral-400">
                <span className="font-mono text-[9px] uppercase block">Estimated Due Date (EDD)</span>
                <span className="text-neutral-200 font-bold font-mono">
                  {new Date(dueDate).toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Standard Cycle Mode Header */}
              <div className="space-y-1">
                <span className="text-[10px] tracking-widest font-mono uppercase text-[#e11d48]">Current Phase Position</span>
                <h3 className="font-serif text-3xl font-medium tracking-wide text-white">{activePhase} Phase</h3>
                <p className="text-xs text-neutral-400 italic">Day {currentDayOfCycle} inside {config.cycleLength}-Day cycle.</p>
              </div>

              {/* Standard SVG progress ring */}
              <div className="relative w-44 h-44 flex items-center justify-center">
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
                    strokeDashoffset={2 * Math.PI * 72 * (1 - percentage / 100)}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="text-center space-y-0.5">
                  <span className="font-mono text-3xl tracking-tight text-white font-extrabold">{daysUntilNextPeriod}</span>
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block">Days Until</span>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block glow-red">Next Period</span>
                </div>
              </div>

              {/* Fertility Chance Indicator */}
              <div className="w-full bg-luxury-950/60 rounded-2xl border border-luxury-850 p-3.5 text-center space-y-1">
                <span className="text-[9px] font-mono block uppercase text-neutral-500 tracking-wider">Flo Pregnancy Chance</span>
                {fertilityChance ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/25 text-red-400 text-xs font-bold glow-red">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    {fertilityChance}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold">
                    Low Chance of Pregnancy
                  </span>
                )}
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
            </>
          )}

        </div>

        {/* Right column: Husband's protocol guides & instructions (Col span 7) */}
        <div className="lg:col-span-7 bg-luxury-950/40 border border-luxury-800 rounded-3xl p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-6">
            
            {/* Section Tag */}
            <div className="flex items-center justify-between border-b border-luxury-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${
                  config.pregnancyMode 
                    ? "bg-emerald-555/10 border-emerald-900/30 text-emerald-400" 
                    : "bg-red-550/10 border-red-900/30 text-red-400"
                }`}>
                  Husband Alignment Guide
                </span>
                <span className={`text-[11px] font-serif italic lowercase ${config.pregnancyMode ? "text-emerald-400" : "text-red-400"}`}>
                  Active stage protocol
                </span>
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
                      <span key={id} className="px-2 py-1 rounded-lg bg-luxury-950 font-mono text-[9px] text-red-300 border border-transparent">
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
                  <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                    {currentProtocol.recommendedIntimacy}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Cycle Statistics Dashboard (Flo Analytics) */}
      <div className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1 p-2">
          <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider block">Average Cycle Length</span>
          <span className="text-2xl font-serif text-white font-bold">{avgCycle} Days</span>
          <p className="text-[10px] text-neutral-450">Calculated over logged cycles.</p>
        </div>
        <div className="space-y-1 p-2 border-l border-luxury-850">
          <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider block">Average Period Duration</span>
          <span className="text-2xl font-serif text-white font-bold">{avgPeriod} Days</span>
          <p className="text-[10px] text-neutral-450">Calculated from bleeding intervals.</p>
        </div>
        <div className="space-y-1 p-2 border-l border-luxury-850">
          <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider block">Cycle Regularity</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold mt-1 text-emerald-400 bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-900/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {variability}
          </span>
          <p className="text-[10px] text-neutral-450 mt-1">Variability within safe thresholds.</p>
        </div>
        <div className="space-y-1 p-2 border-l border-luxury-850">
          <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-wider block">Total Logged Entries</span>
          <span className="text-2xl font-serif text-white font-bold">{logs.length} Entries</span>
          <p className="text-[10px] text-neutral-450">Complete historical database depth.</p>
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
            {logs.map((log, index) => (
              <Reveal key={log.id} delay={Math.min(index * 0.03, 0.3)}>
              <div 
                className="bg-luxury-950/50 rounded-2xl border border-luxury-800 p-5 space-y-4 hover:border-luxury-700 transition"
              >
                {/* log date and intimacy style title */}
                <div className="flex items-center justify-between border-b border-luxury-850 pb-2">
                  <span className="text-xs text-neutral-400 font-mono font-semibold">{new Date(log.date).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}</span>
                  <div className="flex items-center gap-1.5">
                    {log.flow && log.flow !== "None" && (
                      <span className="px-1.5 py-0.5 rounded bg-red-950/30 border border-red-500/30 text-[9px] font-mono text-red-400 font-bold uppercase">
                        Flow: {log.flow}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-luxury-900 border border-luxury-800 text-[9px] font-mono text-red-400 uppercase tracking-widest">
                      Touch: {log.intimacyLevel}
                    </span>
                  </div>
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

                {/* extra vitals log */}
                {(log.temperature !== undefined || log.weight !== undefined || log.waterIntake !== undefined || log.sleepDuration !== undefined || (log.sex && log.sex !== "None")) && (
                  <div className="grid grid-cols-2 gap-2 bg-luxury-950 p-2.5 rounded-xl border border-luxury-850 text-[10px] text-neutral-450 font-mono">
                    {log.temperature !== undefined && (
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-red-400" />
                        <span>Temp: {log.temperature}°C</span>
                      </div>
                    )}
                    {log.weight !== undefined && (
                      <div className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-red-400" />
                        <span>Weight: {log.weight}kg</span>
                      </div>
                    )}
                    {log.waterIntake !== undefined && (
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-red-400" />
                        <span>Water: {log.waterIntake}ml</span>
                      </div>
                    )}
                    {log.sleepDuration !== undefined && (
                      <div className="flex items-center gap-1">
                        <Moon className="w-3 h-3 text-red-400" />
                        <span>Sleep: {log.sleepDuration}h</span>
                      </div>
                    )}
                    {log.sex && log.sex !== "None" && (
                      <div className="col-span-2 flex items-center gap-1 border-t border-white/5 pt-1 mt-1 text-red-300 font-bold">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span>Sex: {log.sex} Activity</span>
                      </div>
                    )}
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
              </Reveal>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
