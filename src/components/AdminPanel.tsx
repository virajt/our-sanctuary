import React, { useState } from "react";
import { AdminSettings, SanctuaryDB, CycleLog, PeriodConfig } from "../types";
import { Shield, Settings, Sliders, Database, Eye, Check, Plus, RefreshCw, Trash, CircleHelp, CalendarHeart } from "lucide-react";
import { motion } from "motion/react";
import CycleCalendar from "./CycleCalendar";

interface AdminPanelProps {
  settings: AdminSettings;
  dbStats: SanctuaryDB;
  onUpdateSettings: (settings: Partial<AdminSettings>) => void;
  onClearHistory?: () => void;
  onImportPeriodData?: (logs: any[], config?: any) => Promise<boolean>;
  periodConfig: PeriodConfig;
  cycleLogs: CycleLog[];
  onUpdatePeriodConfig: (lastPeriodDate: string, cycleLength: number, periodLength: number, pregnancyMode?: boolean, pregnancyStartDate?: string) => void;
  onAddPeriodLog: (
    date: string,
    symptoms: string[],
    moods: string[],
    intimacyLevel: CycleLog["intimacyLevel"],
    notes?: string,
    flow?: CycleLog["flow"],
    temperature?: number,
    weight?: number,
    waterIntake?: number,
    sleepDuration?: number,
    sex?: CycleLog["sex"]
  ) => void;
}

export default function AdminPanel({
  settings,
  dbStats,
  onUpdateSettings,
  onClearHistory,
  onImportPeriodData,
  periodConfig,
  cycleLogs,
  onUpdatePeriodConfig,
  onAddPeriodLog,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "database" | "dictionaries" | "categories" | "import" | "calendar">("general");

  // Local state for dictionary configurations
  const [newAction, setNewAction] = useState("");
  const [newBodyPart, setNewBodyPart] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [newVoucherCategory, setNewVoucherCategory] = useState("");
  const [newGiftCategory, setNewGiftCategory] = useState("");

  // Unified Local Settings State
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Bulk Importer States
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json");
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ success: false, msg: "" });

  const handleLoadTemplate = () => {
    if (importFormat === "json") {
      const sample = [
        {
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          symptoms: ["Cramps", "Headache"],
          moods: ["Sensitive", "Cozy"],
          intimacyLevel: "Light Touch",
          notes: "Felt very close, cuddled in Bed with candles"
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          symptoms: ["Tiredness"],
          moods: ["Peaceful"],
          intimacyLevel: "Full Touch",
          notes: "Vesta Cycle update: mood is fully returning"
        }
      ];
      setImportText(JSON.stringify(sample, null, 2));
    } else {
      const headers = "Date,Symptoms,Moods,IntimacyLevel,Notes\n";
      const row1 = `${new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]},"Cramps, Headache","Sensitive, Cozy",Light Touch,"Felt very close, cuddled in Bed with candles"\n`;
      const row2 = `${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]},Tiredness,Peaceful,Full Touch,"Vesta Cycle update: mood is fully returning"\n`;
      setImportText(headers + row1 + row2);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      if (file.name.endsWith(".csv")) {
        setImportFormat("csv");
      } else {
        setImportFormat("json");
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must contain headers and at least one log row.");
    
    // Parse headers simple
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const dateIdx = headers.indexOf("date");
    const symptomsIdx = headers.indexOf("symptoms");
    const moodsIdx = headers.indexOf("moods");
    const intimacyIdx = headers.indexOf("intimacylevel");
    const notesIdx = headers.indexOf("notes");

    if (dateIdx === -1) throw new Error("CSV Headers must include a 'Date' column.");

    const parsedLogs: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].trim();
      if (!currentline) continue;

      // Split line by commas but respect quotes
      const cells: string[] = [];
      let currentCell = "";
      let inQuotes = false;
      for (let charIdx = 0; charIdx < currentline.length; charIdx++) {
        const char = currentline[charIdx];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cells.push(currentCell.trim());
          currentCell = "";
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());

      const dateVal = cells[dateIdx];
      if (!dateVal) continue;

      // Extract details
      const symptomsVal = symptomsIdx !== -1 && cells[symptomsIdx] 
        ? cells[symptomsIdx].replace(/"/g, "").split(/[;,]/).map(s => s.trim()).filter(Boolean)
        : [];
      const moodsVal = moodsIdx !== -1 && cells[moodsIdx]
        ? cells[moodsIdx].replace(/"/g, "").split(/[;,]/).map(m => m.trim()).filter(Boolean)
        : [];
      const intimacyVal = intimacyIdx !== -1 && cells[intimacyIdx] ? cells[intimacyIdx] : "None";
      const notesVal = notesIdx !== -1 && cells[notesIdx] ? cells[notesIdx].replace(/"/g, "") : "";

      parsedLogs.push({
        date: dateVal,
        symptoms: symptomsVal,
        moods: moodsVal,
        intimacyLevel: intimacyVal,
        notes: notesVal
      });
    }
    return parsedLogs;
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) {
      setImportStatus({ success: false, msg: "Please insert copy-pasted data logs or select an upload file first." });
      return;
    }

    setIsImporting(true);
    setImportStatus({ success: false, msg: "" });

    try {
      let finalLogs: any[] = [];
      if (importFormat === "json") {
        finalLogs = JSON.parse(importText);
        if (!Array.isArray(finalLogs)) {
          throw new Error("JSON payload must be a root list array of historical records.");
        }
      } else {
        finalLogs = parseCSV(importText);
      }

      if (finalLogs.length === 0) {
        throw new Error("No eligible menstrual tracking log rows were decoded.");
      }

      if (onImportPeriodData) {
        const ok = await onImportPeriodData(finalLogs);
        if (ok) {
          setImportStatus({ success: true, msg: `Successfully parsed and merged ${finalLogs.length} logs into Vesta Period Applet.` });
          setImportText("");
        } else {
          throw new Error("Local database sync returned code failure. Check server logs.");
        }
      } else {
        throw new Error("Import handler not mounted on component state root.");
      }
    } catch (err: any) {
      setImportStatus({ success: false, msg: `Import Error: ${err.message || err}` });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateVibe = (vibe: "Soft" | "Medium" | "High") => {
    onUpdateSettings({ vibeIntensity: vibe });
  };

  const handleToggleReminders = () => {
    onUpdateSettings({ periodRemindersEnabled: !settings.periodRemindersEnabled });
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;
    const updated = [...settings.wickedActions, newAction.trim()];
    onUpdateSettings({ wickedActions: updated });
    setNewAction("");
    alert(`"${newAction.trim()}" added to procedural generator action dictionary!`);
  };

  const handleAddBodyPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBodyPart.trim()) return;
    const updated = [...settings.wickedBodyParts, newBodyPart.trim()];
    onUpdateSettings({ wickedBodyParts: updated });
    setNewBodyPart("");
    alert(`"${newBodyPart.trim()}" added to procedural generator body parts dictionary!`);
  };

  const handleAddTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.trim()) return;
    const updated = [...settings.photoThemes, newTheme.trim()];
    onUpdateSettings({ photoThemes: updated });
    setNewTheme("");
    alert(`"${newTheme.trim()}" added to private gallery theme dictionary!`);
  };

  const handleAddVoucherCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCategory.trim()) return;
    const updated = [...(settings.voucherCategories || []), newVoucherCategory.trim()];
    onUpdateSettings({ voucherCategories: updated });
    setNewVoucherCategory("");
  };

  const handleAddGiftCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftCategory.trim()) return;
    const updated = [...(settings.giftCategories || []), newGiftCategory.trim()];
    onUpdateSettings({ giftCategories: updated });
    setNewGiftCategory("");
  };

  const handleRemoveDictItem = (dictKey: "wickedActions" | "wickedBodyParts" | "photoThemes" | "voucherCategories" | "giftCategories", value: string) => {
    const updated = (settings[dictKey] as string[]).filter(v => v !== value);
    onUpdateSettings({ [dictKey]: updated });
  };

  return (
    <div id="admin-panel-module" className="space-y-8">
      
      {/* Module Title Card Header */}
      <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500 animate-pulse" />
            Sanctuary Controls
          </h2>
          <p className="text-sm text-neutral-400">Configure central parameter bounds, customize procedural dictionaries, and monitor logs.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-luxury-950/80 p-1.5 rounded-2xl border border-white/5 gap-1.5 flex-wrap">
          {(["general", "notifications", "calendar", "dictionaries", "categories", "import", "database"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setImportStatus({ success: false, msg: "" });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-300 cursor-pointer border ${
                activeTab === tab
                  ? "bg-red-950/50 border-red-800/60 text-red-400 font-bold glow-red"
                  : "text-neutral-400 hover:text-white border-transparent"
              }`}
            >
              {tab === "import" ? "Period Sync Import" : tab === "calendar" ? "Cycle Calendar" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* TABS VIEW CONTROLLER */}
        {activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Vibe and General Tuning card */}
            <div className="bg-luxury-900/80 border border-luxury-800 rounded-3xl p-8 space-y-6">
              <div className="border-b border-luxury-800 pb-3">
                <h3 className="font-serif text-xl font-medium text-white/90 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-red-500 animate-pulse" />
                  Sensory Vibe Alignment
                </h3>
                <p className="text-xs text-neutral-500">Tune the boldness levels of generated activities.</p>
              </div>

              {/* Vibe slider */}
              <div className="space-y-4">
                <label className="text-xs text-neutral-400 font-medium block uppercase tracking-wider">Active intensity bias</label>
                <div className="grid grid-cols-3 gap-3 bg-luxury-950/60 p-1.5 rounded-2xl border border-luxury-850">
                  {["Soft", "Medium", "High"].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleUpdateVibe(level as any)}
                      className={`py-3 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        settings.vibeIntensity === level
                          ? "bg-red-950/50 border-red-805/60 text-red-400 font-extrabold glow-red"
                          : "text-neutral-400 hover:text-white border-transparent"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500 italic font-light leading-relaxed">
                  * Note: Setting to 'High' opens much bolder, deep-touch parameters for overall algorithmic assemblies, whilst 'Soft' keeps guides centered around simple romance and soothing touch.
                </p>
              </div>

              {/* Accent Palette Theme selection */}
              <div className="space-y-4 pt-4 border-t border-luxury-800/60">
                <label className="text-xs text-neutral-400 font-medium block uppercase tracking-wider">Accent Palette Theme</label>
                <div className="grid grid-cols-3 gap-3 bg-luxury-950/60 p-1.5 rounded-2xl border border-luxury-850">
                  {[
                    { name: "Passionate Red" as const, bg: "bg-red-950/40 border-red-800/40 text-red-400", hex: "#ef4444" },
                    { name: "Midnight Blue" as const, bg: "bg-blue-950/40 border-blue-800/40 text-blue-400", hex: "#3b82f6" },
                    { name: "Golden Hour" as const, bg: "bg-amber-950/40 border-amber-800/40 text-amber-500", hex: "#f59e0b" }
                  ].map((themeOption) => {
                    const isSelected = (settings.theme || "Passionate Red") === themeOption.name;
                    return (
                      <button
                        key={themeOption.name}
                        onClick={() => onUpdateSettings({ theme: themeOption.name })}
                        className={`py-3 rounded-xl text-xs font-semibold transition cursor-pointer border flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? `${themeOption.bg} font-extrabold shadow-sm`
                            : "text-neutral-400 hover:text-white border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeOption.hex }} />
                          {themeOption.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-500 italic font-light leading-relaxed">
                  * Dynamically shifts the entire application atmosphere, buttons, ambient glows, and visual states instantly to match either high physical pulse, calm relaxation, or romantic warmth.
                </p>
              </div>

              {/* Period tracker settings */}
              <div className="space-y-4 pt-4 border-t border-luxury-800/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm text-neutral-200 font-medium block">Intimate Sync Bulletins</label>
                    <span className="text-[11px] text-neutral-500 block leading-tight font-light">Send automatic support bulletins based on cycle phases.</span>
                  </div>
                  <button
                    onClick={handleToggleReminders}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer ${
                      settings.periodRemindersEnabled ? "bg-red-700 glow-red" : "bg-neutral-850"
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                      settings.periodRemindersEnabled ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Support Protocols Summary Panel */}
            <div className="bg-luxury-900/40 border border-luxury-850 rounded-3xl p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-serif text-lg text-neutral-300">Sanctuary Vibe Guidelines</h3>
                <ul className="space-y-3.5 text-xs text-neutral-400 leading-relaxed font-light">
                  <li className="flex gap-2">
                    <span className="text-gold-500 select-none font-bold">1.</span>
                    <span><strong>True Privacy:</strong> All data resides within your secure Cloud Run container and database file. Photography is encoded dynamically.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-500 select-none font-bold">2.</span>
                    <span><strong>Mutual respect:</strong> Claiming gifts implies mutual sensual consent, fostering deep communication.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-gold-500 select-none font-bold">3.</span>
                    <span><strong>Empathetic design:</strong> Aligning with domestic biology cycle timeline increases overall relationship health and limits stress levels.</span>
                  </li>
                </ul>
              </div>

              {onClearHistory && (
                <div className="pt-6 border-t border-luxury-800/60 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs text-neutral-300 font-medium block">Clear Challenges History</span>
                    <span className="text-[10px] text-gray-500 block">Erase all generated Wicked logs in the chamber stack.</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Permanently wipe Wicked Challenge generation history from database logs?")) {
                        onClearHistory();
                        alert("History successfully wiped.");
                      }
                    }}
                    className="px-4 py-2 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 text-xs font-semibold rounded-2xl transition cursor-pointer"
                  >
                    Wipe History
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="bg-luxury-900/80 border border-luxury-800 rounded-3xl p-8 space-y-6">
              <div className="border-b border-luxury-800 pb-3">
                <h3 className="font-serif text-xl font-medium text-white/90 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Email Configuration
                </h3>
                <p className="text-xs text-neutral-500">Configure email addresses for couple notifications.</p>
              </div>

              <div className="space-y-4">
                <label className="text-xs text-neutral-400 font-medium block uppercase tracking-wider">His Email</label>
                <input
                  type="email"
                  value={localSettings.notificationConfig?.hisEmail || ""}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notificationConfig: { ...(localSettings.notificationConfig as any), hisEmail: e.target.value }
                  })}
                  placeholder="e.g. him@example.com"
                  className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs text-neutral-400 font-medium block uppercase tracking-wider">Her Email</label>
                <input
                  type="email"
                  value={localSettings.notificationConfig?.herEmail || ""}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notificationConfig: { ...(localSettings.notificationConfig as any), herEmail: e.target.value }
                  })}
                  placeholder="e.g. her@example.com"
                  className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                />
              </div>
            </div>

            <div className="bg-luxury-900/80 border border-luxury-800 rounded-3xl p-8 space-y-6">
              <div className="border-b border-luxury-800 pb-3">
                <h3 className="font-serif text-xl font-medium text-white/90 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-500" />
                  Connection Hub Alerts
                </h3>
                <p className="text-xs text-neutral-500">Toggle which features send email notifications.</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: "heartbeat", label: "Heartbeat Sync Pulses" },
                  { key: "carePackages", label: "Care Package Unlocks" },
                  { key: "timeCapsules", label: "Time Capsule Unlocks" },
                  { key: "dailyPrompts", label: "Daily Prompts Reminders" },
                ].map((toggle) => {
                  const isActive = (localSettings.notificationConfig as any)?.[toggle.key] || false;
                  return (
                    <div key={toggle.key} className="flex items-center justify-between border-b border-luxury-800/40 pb-2">
                      <span className="text-sm text-neutral-300">{toggle.label}</span>
                      <button
                        onClick={() => setLocalSettings({
                          ...localSettings,
                          notificationConfig: {
                            ...(localSettings.notificationConfig as any),
                            [toggle.key]: !isActive
                          }
                        })}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 shrink-0 cursor-pointer ${
                          isActive ? "bg-red-700 glow-red" : "bg-neutral-850"
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-neutral-500 italic font-light leading-relaxed">
                Technical alerts (build approval, deployment) are hardcoded in GCP configuration.
              </p>
            </div>
            
            <div className="pt-6 border-t border-luxury-800/50 flex items-center justify-between">
              <span className="text-xs text-neutral-400">Settings must be saved to apply changes.</span>
              <button
                onClick={async () => {
                  setIsSavingSettings(true);
                  await onUpdateSettings(localSettings);
                  setIsSavingSettings(false);
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }}
                disabled={isSavingSettings}
                className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(220,38,38,0.15)] flex items-center gap-2"
              >
                {isSavingSettings ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {isSavingSettings ? "Saving..." : saveSuccess ? "Saved Successfully" : "Save Settings"}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 space-y-6"
          >
            <div className="flex items-center gap-2">
              <CalendarHeart className="w-5 h-5 text-red-400" />
              <h3 className="font-serif text-xl text-white">Cycle Calendar</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed -mt-2">
              Click any day to correct logged data or jump to a date directly. Future months show predicted period, fertile window, ovulation, and pregnancy-test windows based on the most recent logged data.
            </p>
            <CycleCalendar
              config={periodConfig}
              logs={cycleLogs}
              onUpdateConfig={onUpdatePeriodConfig}
              onAddLog={onAddPeriodLog}
            />
          </motion.div>
        )}

        {activeTab === "dictionaries" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Input Form Fields for custom dictionary items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Actions dictionary */}
              <form onSubmit={handleAddAction} className="bg-luxury-900/60 p-6 rounded-3xl border border-luxury-800 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-neutral-300">Sensual Action Verbs</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. softly trace circles"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="flex-1 bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                  />
                  <button type="submit" className="p-2 bg-red-950/60 border border-red-850 hover:bg-red-900/25 text-red-400 rounded-xl transition cursor-pointer glow-red">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>

                {/* Display active custom items */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-luxury-800/40">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">Custom added words ({settings.wickedActions.length}):</span>
                  {settings.wickedActions.map((act) => (
                    <div key={act} className="flex items-center justify-between p-1 px-2.5 bg-luxury-950 rounded bg-opacity-40 text-xs text-neutral-300 border border-luxury-850">
                      <span className="truncate">{act}</span>
                      <button type="button" onClick={() => handleRemoveDictItem("wickedActions", act)} className="text-neutral-500 hover:text-red-400 transition">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {settings.wickedActions.length === 0 && <span className="text-[10px] text-neutral-600 block italic">Procedural Defaults are fully active. Add custom elements to tune generators.</span>}
                </div>
              </form>

              {/* Body Parts dictionary */}
              <form onSubmit={handleAddBodyPart} className="bg-luxury-900/60 p-6 rounded-3xl border border-luxury-800 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-neutral-300">sensual Body Target Regions</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. inner thigh margins"
                    value={newBodyPart}
                    onChange={(e) => setNewBodyPart(e.target.value)}
                    className="flex-1 bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                  />
                  <button type="submit" className="p-2 bg-red-950/60 border border-red-850 hover:bg-red-900/25 text-red-400 rounded-xl transition cursor-pointer glow-red">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>

                {/* Display active custom items */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-luxury-800/40">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">Custom added regions ({settings.wickedBodyParts.length}):</span>
                  {settings.wickedBodyParts.map((bp) => (
                    <div key={bp} className="flex items-center justify-between p-1 px-2.5 bg-luxury-950 rounded bg-opacity-40 text-xs text-neutral-300 border border-luxury-850">
                      <span className="truncate">{bp}</span>
                      <button type="button" onClick={() => handleRemoveDictItem("wickedBodyParts", bp)} className="text-neutral-500 hover:text-red-400 transition">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {settings.wickedBodyParts.length === 0 && <span className="text-[10px] text-neutral-600 block italic">Procedural Defaults are fully active. Add custom elements to tune generators.</span>}
                </div>
              </form>

              {/* Gallery themes dictionary */}
              <form onSubmit={handleAddTheme} className="bg-luxury-900/60 p-6 rounded-3xl border border-luxury-800 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-neutral-300">Photo Themes</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. wet steam mirror glow"
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    className="flex-1 bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                  />
                  <button type="submit" className="p-2 bg-red-950/60 border border-red-850 hover:bg-red-900/25 text-red-400 rounded-xl transition cursor-pointer glow-red">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>

                {/* Display active custom items */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-luxury-800/40">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">Custom added themes ({settings.photoThemes.length}):</span>
                  {settings.photoThemes.map((theme) => (
                    <div key={theme} className="flex items-center justify-between p-1 px-2.5 bg-luxury-950 rounded bg-opacity-40 text-xs text-neutral-300 border border-luxury-850">
                      <span className="truncate">{theme}</span>
                      <button type="button" onClick={() => handleRemoveDictItem("photoThemes", theme)} className="text-neutral-500 hover:text-red-400 transition">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {settings.photoThemes.length === 0 && <span className="text-[10px] text-neutral-600 block italic">Procedural Defaults are fully active. Add custom elements to tune generators.</span>}
                </div>
              </form>

            </div>
          </motion.div>
        )}

        {activeTab === "categories" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Voucher Categories - fully admin-managed list, not just additions on top of a fixed default */}
              <form onSubmit={handleAddVoucherCategory} className="bg-luxury-900/60 p-6 rounded-3xl border border-luxury-800 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-neutral-300">Voucher Categories</h4>
                <p className="text-[10px] text-neutral-500">Shown in the Vouchers tab's filter and "Create Voucher" form.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adventurous"
                    value={newVoucherCategory}
                    onChange={(e) => setNewVoucherCategory(e.target.value)}
                    className="flex-1 bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                  />
                  <button type="submit" className="p-2 bg-red-950/60 border border-red-850 hover:bg-red-900/25 text-red-400 rounded-xl transition cursor-pointer glow-red">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-luxury-800/40">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">
                    Categories ({(settings.voucherCategories || []).length}):
                  </span>
                  {(settings.voucherCategories || []).map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-1 px-2.5 bg-luxury-950 rounded bg-opacity-40 text-xs text-neutral-300 border border-luxury-850">
                      <span className="truncate">{cat}</span>
                      <button type="button" onClick={() => handleRemoveDictItem("voucherCategories", cat)} className="text-neutral-500 hover:text-red-400 transition">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(settings.voucherCategories || []).length === 0 && <span className="text-[10px] text-neutral-600 block italic">No categories yet - add at least one above.</span>}
                </div>
              </form>

              {/* Gift Categories - the new "Gifts we give each other" feature, fully separate from Vouchers */}
              <form onSubmit={handleAddGiftCategory} className="bg-luxury-900/60 p-6 rounded-3xl border border-luxury-800 space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-neutral-300">Gift Categories</h4>
                <p className="text-[10px] text-neutral-500">Shown in the Gifts tab's filter and "Plan a Gift" form.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Handmade"
                    value={newGiftCategory}
                    onChange={(e) => setNewGiftCategory(e.target.value)}
                    className="flex-1 bg-luxury-950 border border-luxury-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-800"
                  />
                  <button type="submit" className="p-2 bg-red-950/60 border border-red-850 hover:bg-red-900/25 text-red-400 rounded-xl transition cursor-pointer glow-red">
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-luxury-800/40">
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">
                    Categories ({(settings.giftCategories || []).length}):
                  </span>
                  {(settings.giftCategories || []).map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-1 px-2.5 bg-luxury-950 rounded bg-opacity-40 text-xs text-neutral-300 border border-luxury-850">
                      <span className="truncate">{cat}</span>
                      <button type="button" onClick={() => handleRemoveDictItem("giftCategories", cat)} className="text-neutral-500 hover:text-red-400 transition">
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(settings.giftCategories || []).length === 0 && <span className="text-[10px] text-neutral-600 block italic">No categories yet - add at least one above.</span>}
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === "import" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-luxury-900/80 border border-luxury-800 rounded-3xl p-8 space-y-6 text-left animate-fade-in"
          >
            <div className="border-b border-luxury-800 pb-3">
              <h3 className="font-serif text-xl font-medium text-white/90 flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                Vesta Menstrual Log Importer
              </h3>
              <p className="text-xs text-neutral-500">
                Bulk import and synchronize period history databases from Clue, Flo, or custom backups. Supports both JSON formats and standard CSV arrays.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {/* Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2 bg-luxury-950/60 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setImportFormat("json")}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        importFormat === "json" ? "bg-red-955/80 text-rose-300 border border-red-800/20" : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      JSON Format
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportFormat("csv")}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        importFormat === "csv" ? "bg-red-955/80 text-rose-300 border border-red-800/20" : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      CSV (Spreadsheet)
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleLoadTemplate}
                      className="text-[11px] text-rose-450 hover:text-rose-400 flex items-center gap-1 border border-white/5 hover:border-white/10 px-2.5 py-1.5 rounded-lg bg-black/20"
                    >
                      Load Template Schema
                    </button>
                    
                    <label className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer border border-rose-800/30 px-3 py-1.5 bg-rose-955/20 rounded-lg">
                      Upload .json/.csv
                      <input
                        type="file"
                        accept=".json,.csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Input Text Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 block">Copy-Paste Logs or Drop File Contents below:</label>
                  <textarea
                    rows={10}
                    placeholder={`Paste your bulk list of daily cycles logs here...\nExample formatted in ${importFormat.toUpperCase()}`}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full bg-black/50 border border-luxury-800 rounded-2xl p-4 font-mono text-xs text-rose-105 placeholder-neutral-600 focus:outline-none focus:border-red-900 leading-relaxed resize-none text-white whitespace-pre"
                  />
                </div>

                {/* Status messages indicator */}
                {importStatus.msg && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    importStatus.success
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                      : "bg-red-950/20 border-red-500/35 text-red-100"
                  }`}>
                    {importStatus.msg}
                  </div>
                )}

                {/* Executed Button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportText("");
                      setImportStatus({ success: false, msg: "" });
                    }}
                    className="px-4 py-2 text-neutral-400 hover:text-white text-xs border border-white/5 hover:bg-black/20 rounded-xl cursor-pointer"
                  >
                    Clear Input
                  </button>
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleExecuteImport}
                    className="px-6 py-2 bg-gradient-to-r from-red-950 to-red-900 border border-red-805/50 text-red-400 hover:text-red-350 font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isImporting ? "Processing Sync..." : "Initialize Database Import"}
                  </button>
                </div>
              </div>

              {/* Instructions column */}
              <div className="bg-black/30 border border-white/5 p-6 rounded-3xl space-y-4">
                <h4 className="font-serif text-sm font-semibold text-neutral-200">Import Guidelines</h4>
                <ul className="space-y-4 text-xs text-neutral-400 leading-relaxed font-light">
                  <li className="space-y-1">
                    <span className="font-semibold text-neutral-200 font-mono block">Columns Needed (CSV):</span>
                    <span className="block leading-snug">
                      Required: <code className="text-rose-400 font-mono">Date</code> (Format: YYYY-MM-DD). Optional: <code className="text-neutral-300">Symptoms</code>, <code className="text-neutral-300">Moods</code>, <code className="text-neutral-300">IntimacyLevel</code>, <code className="text-neutral-300">Notes</code>. Customize and load template schema above.
                    </span>
                  </li>
                  <li className="space-y-1">
                    <span className="font-semibold text-neutral-200 font-mono block">Merging Behavior:</span>
                    <span className="block leading-snug">
                      Our sync merges logs according to the calendar date. If a log on a specific date already exists, it is safely overwritten with the imported details rather than causing redundant duplication.
                    </span>
                  </li>
                  <li className="space-y-1">
                    <span className="font-semibold text-neutral-200 font-mono block">Supported Intimacy levels:</span>
                    <span className="block italic text-rose-300 font-medium">"None", "Light Touch", "Full Touch"</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "database" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Database Stats Card Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="bg-luxury-905/80 border border-luxury-800 rounded-2xl p-5 text-center space-y-1">
                <Database className="w-6 h-6 text-red-400 mx-auto" />
                <span className="text-[28px] font-mono font-extrabold text-neutral-100 block">{dbStats.gifts.length}</span>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">Mutual Gifts</p>
              </div>

              <div className="bg-luxury-905/80 border border-luxury-800 rounded-2xl p-5 text-center space-y-1">
                <Settings className="w-6 h-6 text-rose-500 mx-auto" />
                <span className="text-[28px] font-mono font-extrabold text-neutral-100 block">{dbStats.cycleLogs.length}</span>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">Cycle Logs</p>
              </div>

              <div className="bg-luxury-905/80 border border-luxury-800 rounded-2xl p-5 text-center space-y-1">
                <Eye className="w-6 h-6 text-red-350 mx-auto" />
                <span className="text-[28px] font-mono font-extrabold text-neutral-100 block">{dbStats.vaultPhotos.length}</span>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">Vault Photos</p>
              </div>

              <div className="bg-luxury-905/80 border border-luxury-800 rounded-2xl p-5 text-center space-y-1">
                <RefreshCw className="w-6 h-6 text-red-550 mx-auto animate-spin-slow" />
                <span className="text-[28px] font-mono font-extrabold text-neutral-100 block">{dbStats.wickedChallengesHistory.length}</span>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">Generated Prompts</p>
              </div>

            </div>

            {/* Raw JSON Debug view */}
            <div className="bg-luxury-950 p-6 rounded-3xl border border-luxury-850 space-y-3">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Safe Local Container Database State</span>
              <pre className="text-[11px] text-red-400/80 font-mono overflow-x-auto max-h-56 p-4 rounded bg-luxury-blank/85 border border-luxury-900 leading-normal">
                {JSON.stringify(dbStats, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
