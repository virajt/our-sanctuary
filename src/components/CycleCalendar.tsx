import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, Droplets, Sparkles, Heart, FlaskConical, CalendarDays, Save, Pencil } from "lucide-react";
import { CycleLog, PeriodConfig } from "../types";
import { buildMonthPredictions, DayPrediction } from "../lib/cyclePredictions";

const SYMPTOMS_OPTIONS = ["Cramps", "Bloating", "Headache", "Tenderness", "Fatigue", "Insomnia", "Anxiety", "High Energy", "High Sex Drive", "Backache", "Nausea", "Acne"];
const MOODS_OPTIONS = ["Radiant", "Calm", "Tender", "Playful", "Sassy", "Vulnerable", "Exhausted", "Irritable", "Anxious", "Sad", "Happy", "Emotional"];
const FLOW_OPTIONS: CycleLog["flow"][] = ["None", "Spotting", "Light", "Medium", "Heavy"];
const INTIMACY_OPTIONS: CycleLog["intimacyLevel"][] = ["None", "Light Touch", "Sensual", "Intense"];

interface CycleCalendarProps {
  config: PeriodConfig;
  logs: CycleLog[];
  onUpdateConfig: (lastPeriodDate: string, cycleLength: number, periodLength: number, pregnancyMode?: boolean, pregnancyStartDate?: string) => void;
  onAddLog: (
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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CycleCalendar({ config, logs, onUpdateConfig, onAddLog }: CycleCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showFullEditor, setShowFullEditor] = useState(false);

  const predictions = useMemo(
    () => buildMonthPredictions(viewYear, viewMonth, config, logs),
    [viewYear, viewMonth, config, logs]
  );

  const logsByDate = useMemo(() => {
    const map = new Map<string, CycleLog>();
    logs.forEach((l) => map.set(l.date, l));
    return map;
  }, [logs]);

  const goToMonth = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateStr(new Date(viewYear, viewMonth, day)));
  }

  const todayStr = toDateStr(today);
  const selectedLog = selectedDate ? logsByDate.get(selectedDate) : undefined;
  const selectedPrediction = selectedDate ? predictions.get(selectedDate) : undefined;

  return (
    <div className="space-y-6">
      {/* Month navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goToMonth(-1)}
          className="p-2 rounded-xl border border-luxury-800 hover:border-luxury-700 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-serif text-xl text-white tracking-wide">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={() => goToMonth(1)}
          className="p-2 rounded-xl border border-luxury-800 hover:border-luxury-700 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-wide text-neutral-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Period</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Fertile window</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-300" /> Ovulation</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pregnancy test window</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-white/40" /> Logged entry</span>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono uppercase tracking-widest text-neutral-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const pred = predictions.get(dateStr);
          const log = logsByDate.get(dateStr);
          const isToday = dateStr === todayStr;
          const dayNum = parseInt(dateStr.split("-")[2], 10);

          let bg = "bg-luxury-900/40 border-luxury-800 hover:border-luxury-700";
          if (pred?.isPredictedPeriod) bg = "bg-red-950/50 border-red-800/60 hover:border-red-600";
          else if (pred?.isOvulationDay) bg = "bg-emerald-900/40 border-emerald-400/50 hover:border-emerald-300";
          else if (pred?.isFertileWindow) bg = "bg-emerald-950/35 border-emerald-700/40 hover:border-emerald-500";
          else if (pred?.isPregnancyTestWindow) bg = "bg-amber-950/30 border-amber-700/40 hover:border-amber-500";

          return (
            <button
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setShowFullEditor(false);
              }}
              className={`relative aspect-square rounded-xl border text-xs flex flex-col items-center justify-center transition cursor-pointer ${bg} ${
                isToday ? "ring-2 ring-white/40" : ""
              }`}
            >
              <span className="text-neutral-200">{dayNum}</span>
              {log && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white/70" />}
            </button>
          );
        })}
      </div>

      {/* Day detail / quick-edit popover */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="bg-luxury-950/70 border border-luxury-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white font-medium">
                <CalendarDays className="w-4 h-4 text-red-400" />
                {selectedDate}
                {selectedPrediction?.cycleDayNumber && (
                  <span className="text-[10px] text-neutral-500 font-mono">cycle day {selectedPrediction.cycleDayNumber}</span>
                )}
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-neutral-500 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!showFullEditor ? (
              <QuickEditPanel
                dateStr={selectedDate}
                existingLog={selectedLog}
                onSetPeriodStart={() => {
                  onUpdateConfig(selectedDate, config.cycleLength, config.periodLength, config.pregnancyMode, config.pregnancyStartDate);
                }}
                onQuickSetFlow={(flow) => {
                  onAddLog(
                    selectedDate,
                    selectedLog?.symptoms || [],
                    selectedLog?.moods || [],
                    selectedLog?.intimacyLevel || "None",
                    selectedLog?.notes,
                    flow,
                    selectedLog?.temperature,
                    selectedLog?.weight,
                    selectedLog?.waterIntake,
                    selectedLog?.sleepDuration,
                    selectedLog?.sex
                  );
                }}
                onOpenFullEditor={() => setShowFullEditor(true)}
              />
            ) : (
              <FullLogEditor
                dateStr={selectedDate}
                existingLog={selectedLog}
                onSave={(payload) => {
                  onAddLog(
                    selectedDate,
                    payload.symptoms,
                    payload.moods,
                    payload.intimacyLevel,
                    payload.notes,
                    payload.flow,
                    payload.temperature,
                    payload.weight,
                    payload.waterIntake,
                    payload.sleepDuration,
                    payload.sex
                  );
                  setShowFullEditor(false);
                  setSelectedDate(null);
                }}
                onCancel={() => setShowFullEditor(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual baseline correction - directly editable cycle config */}
      <div className="bg-luxury-950/40 border border-luxury-800 rounded-2xl p-5 space-y-3">
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          Predictions above are derived from logged flow entries when available, falling back to this baseline otherwise. If neither app has the right
          history yet, correct the baseline here directly.
        </p>
        <BaselineEditor config={config} onUpdateConfig={onUpdateConfig} />
      </div>
    </div>
  );
}

function QuickEditPanel({
  dateStr,
  existingLog,
  onSetPeriodStart,
  onQuickSetFlow,
  onOpenFullEditor,
}: {
  dateStr: string;
  existingLog?: CycleLog;
  onSetPeriodStart: () => void;
  onQuickSetFlow: (flow: CycleLog["flow"]) => void;
  onOpenFullEditor: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FLOW_OPTIONS.map((flow) => (
          <button
            key={flow}
            onClick={() => onQuickSetFlow(flow)}
            className={`px-3 py-1.5 rounded-xl text-[11px] border transition cursor-pointer flex items-center gap-1.5 ${
              existingLog?.flow === flow
                ? "bg-red-900/50 border-red-700 text-white"
                : "bg-luxury-900/50 border-luxury-800 text-neutral-400 hover:border-luxury-700 hover:text-white"
            }`}
          >
            <Droplets className="w-3 h-3" />
            {flow}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onSetPeriodStart}
          className="px-3 py-1.5 rounded-xl text-[11px] border border-red-800/50 bg-red-950/30 text-red-300 hover:bg-red-900/30 transition cursor-pointer flex items-center gap-1.5"
        >
          <Heart className="w-3 h-3" />
          Mark as period start date
        </button>
        <button
          onClick={onOpenFullEditor}
          className="px-3 py-1.5 rounded-xl text-[11px] border border-luxury-800 text-neutral-300 hover:border-luxury-700 hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <Pencil className="w-3 h-3" />
          Full log editor
        </button>
      </div>
    </div>
  );
}

function FullLogEditor({
  dateStr,
  existingLog,
  onSave,
  onCancel,
}: {
  dateStr: string;
  existingLog?: CycleLog;
  onSave: (payload: {
    symptoms: string[];
    moods: string[];
    intimacyLevel: CycleLog["intimacyLevel"];
    notes?: string;
    flow?: CycleLog["flow"];
    temperature?: number;
    weight?: number;
    waterIntake?: number;
    sleepDuration?: number;
    sex?: CycleLog["sex"];
  }) => void;
  onCancel: () => void;
}) {
  const [symptoms, setSymptoms] = useState<string[]>(existingLog?.symptoms || []);
  const [moods, setMoods] = useState<string[]>(existingLog?.moods || []);
  const [flow, setFlow] = useState<CycleLog["flow"]>(existingLog?.flow || "None");
  const [intimacyLevel, setIntimacyLevel] = useState<CycleLog["intimacyLevel"]>(existingLog?.intimacyLevel || "None");
  const [notes, setNotes] = useState(existingLog?.notes || "");

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Flow</label>
        <div className="flex flex-wrap gap-2">
          {FLOW_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFlow(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border transition cursor-pointer ${
                flow === f ? "bg-red-900/50 border-red-700 text-white" : "bg-luxury-900/50 border-luxury-800 text-neutral-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Symptoms</label>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOMS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggle(symptoms, setSymptoms, s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] border transition cursor-pointer ${
                symptoms.includes(s) ? "bg-rose-900/50 border-rose-700 text-white" : "bg-luxury-900/50 border-luxury-800 text-neutral-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Mood</label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => toggle(moods, setMoods, m)}
              className={`px-2.5 py-1 rounded-lg text-[10px] border transition cursor-pointer ${
                moods.includes(m) ? "bg-purple-900/50 border-purple-700 text-white" : "bg-luxury-900/50 border-luxury-800 text-neutral-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Intimacy</label>
        <div className="flex flex-wrap gap-2">
          {INTIMACY_OPTIONS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setIntimacyLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border transition cursor-pointer ${
                intimacyLevel === lvl ? "bg-red-900/50 border-red-700 text-white" : "bg-luxury-900/50 border-luxury-800 text-neutral-400 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-luxury-900/60 border border-luxury-800 focus:border-red-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none transition resize-none"
          placeholder="Anything worth remembering about this day..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-xl text-xs transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({
              symptoms,
              moods,
              intimacyLevel,
              notes: notes || undefined,
              flow,
            })
          }
          className="px-4 py-2 bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          Save entry
        </button>
      </div>
    </div>
  );
}

function BaselineEditor({
  config,
  onUpdateConfig,
}: {
  config: PeriodConfig;
  onUpdateConfig: (lastPeriodDate: string, cycleLength: number, periodLength: number, pregnancyMode?: boolean, pregnancyStartDate?: string) => void;
}) {
  const [date, setDate] = useState(config.lastPeriodDate);
  const [cycleLength, setCycleLength] = useState(config.cycleLength);
  const [periodLength, setPeriodLength] = useState(config.periodLength);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Last period date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-luxury-900/60 border border-luxury-800 focus:border-red-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Cycle length</label>
        <input
          type="number"
          min={15}
          max={60}
          value={cycleLength}
          onChange={(e) => setCycleLength(Number(e.target.value))}
          className="w-20 bg-luxury-900/60 border border-luxury-800 focus:border-red-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Period length</label>
        <input
          type="number"
          min={1}
          max={14}
          value={periodLength}
          onChange={(e) => setPeriodLength(Number(e.target.value))}
          className="w-20 bg-luxury-900/60 border border-luxury-800 focus:border-red-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition"
        />
      </div>
      <button
        onClick={() => onUpdateConfig(date, cycleLength, periodLength, config.pregnancyMode, config.pregnancyStartDate)}
        className="px-4 py-2 bg-red-900/60 hover:bg-red-800 border border-red-700/50 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
      >
        Update baseline
      </button>
    </div>
  );
}
