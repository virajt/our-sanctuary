import React, { useState } from "react";
import { ImportantDate } from "../types";
import { Calendar, Bell, Plus, Trash2, Clock, Sparkles, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TiltCard from "./effects/TiltCard";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface DateRemindersViewProps {
  dates: ImportantDate[];
  onAddDate: (title: string, date: string, category: "Anniversary" | "Birthday" | "Special Date" | "Other", reminderDaysAhead: number, description?: string) => void;
  onDeleteDate: (id: string) => void;
}

export default function DateRemindersView({ dates, onAddDate, onDeleteDate }: DateRemindersViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [category, setCategory] = useState<"Anniversary" | "Birthday" | "Special Date" | "Other">("Anniversary");
  const [reminderDaysAhead, setReminderDaysAhead] = useState(7);
  const [description, setDescription] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate days remaining to the next occurrence of a MM-DD date
  const getDaysRemaining = (targetDateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parse current year target
      const [, month, day] = targetDateStr.split("-").map(Number);
      if (!Number.isFinite(month) || !Number.isFinite(day)) {
        // Malformed date string - without this guard, NaN would silently
        // propagate through the math below and the reminder would just
        // vanish from the "upcoming" list with no visible error.
        return Infinity;
      }
      const targetThisYear = new Date(today.getFullYear(), month - 1, day);
      
      if (targetThisYear.getTime() < today.getTime()) {
        // Already passed this year, look at next year
        const targetNextYear = new Date(today.getFullYear() + 1, month - 1, day);
        const diffTime = targetNextYear.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        const diffTime = targetThisYear.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    } catch (e) {
      return Infinity;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "Anniversary":
        return {
          bg: "bg-red-500/10 border-red-500/25 text-red-400",
          glow: "shadow-red-500/10",
          iconColor: "text-red-400",
        };
      case "Birthday":
        return {
          bg: "bg-purple-500/10 border-purple-500/25 text-purple-400",
          glow: "shadow-purple-500/10",
          iconColor: "text-purple-400",
        };
      case "Special Date":
        return {
          bg: "bg-amber-500/10 border-amber-500/25 text-amber-400",
          glow: "shadow-amber-500/10",
          iconColor: "text-amber-400",
        };
      default:
        return {
          bg: "bg-blue-500/10 border-blue-500/25 text-blue-400",
          glow: "shadow-blue-500/10",
          iconColor: "text-blue-400",
        };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStr) return;

    onAddDate(title, dateStr, category, Number(reminderDaysAhead), description);
    
    // Clear Form
    setTitle("");
    setDateStr("");
    setCategory("Anniversary");
    setReminderDaysAhead(7);
    setDescription("");
    setIsAdding(false);

    setSuccessMsg("Romantic Reminder Set Successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Build upcoming date notification alarms
  const activeNotifications = dates.filter((d) => {
    const daysLeft = getDaysRemaining(d.date);
    return daysLeft <= d.reminderDaysAhead;
  });

  return (
    <div className="space-y-8" id="date-reminders">
      {/* Upper Panel Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-rose-500" />
            Sacred Date Reminders
          </h2>
          <p className="text-sm text-neutral-400">
            Chronicle anniversaries, special dates, and intimate birthdays to verify you never miss a golden celebration.
          </p>
        </div>

        <MagneticButton
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-900/60 hover:bg-rose-800 text-white border border-rose-700/50 text-xs font-semibold rounded-2xl shadow-lg transition-all cursor-pointer glow-red"
        >
          <Plus className="w-4 h-4" />
          Add Important Date
        </MagneticButton>
      </div>

      {/* Timely Alerts / Notifications Banner (Task 1: Timely Notifications) */}
      <AnimatePresence>
        {activeNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-3xl space-y-4 glow-amber"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="font-serif text-lg font-medium text-amber-200 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Timely Sanctuary Reminders
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeNotifications.map((notif) => {
                const daysRemain = getDaysRemaining(notif.date);
                return (
                  <div
                    key={`notif_${notif.id}`}
                    className="bg-luxury-950/80 p-4 rounded-2xl border border-amber-500/15 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-neutral-100">{notif.title}</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Next event on {notif.date.substring(5)} (In {daysRemain} days)
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono rounded-lg">
                      {daysRemain === 0 ? "TODAY!" : `${daysRemain}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification Alert toast */}
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

      {/* Add Date Panel Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-luxury-900/80 border border-luxury-830 rounded-3xl p-6 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-serif text-xl font-medium text-white/95">Register an Important Date</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs text-neutral-400 font-medium">Occasion / Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Second Honeymoon Weekend"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-rose-500/50 transition-colors"
                  >
                    <option value="Anniversary">Anniversary</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Special Date">Special Date / Vacation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium font-mono">Date</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 font-medium">Timely Notification Alert (Days ahead)</label>
                  <select
                    value={reminderDaysAhead}
                    onChange={(e) => setReminderDaysAhead(Number(e.target.value))}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-rose-500/50 transition-colors"
                  >
                    <option value={1}>1 Day Ahead</option>
                    <option value={3}>3 Days Ahead</option>
                    <option value={5}>5 Days Ahead</option>
                    <option value={7}>1 Week Ahead (7 Days)</option>
                    <option value={14}>2 Weeks Ahead (14 Days)</option>
                    <option value={30}>1 Month Ahead (30 Days)</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-xs text-neutral-400 font-medium">Description or Gift Ideas / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Plan a surprise retreat, buy flowers, prepare wicked cards..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-luxury-800 text-neutral-400 hover:text-white rounded-2xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-950 to-rose-900 border border-rose-800/40 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-2xl shadow-lg transition glow-red"
                >
                  Set Romancing Alarm
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dates Timeline List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dates
          .sort((a, b) => getDaysRemaining(a.date) - getDaysRemaining(b.date))
          .map((dt, index) => {
            const daysLeft = getDaysRemaining(dt.date);
            const theme = getCategoryTheme(dt.category);

            return (
              <Reveal key={dt.id} delay={Math.min(index * 0.04, 0.4)}>
              <TiltCard maxTilt={4} glare>
              <motion.div
                layout
                className="bg-luxury-900/40 border border-luxury-800 hover:border-luxury-700 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
              >
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-tr from-transparent to-white/[0.015] pointer-events-none rounded-bl-full" />

                <div className="space-y-4">
                  {/* Category Pill and Alert bell */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border ${theme.bg}`}>
                      {dt.category}
                    </span>

                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <Bell className="w-3 h-3 text-rose-500/50" />
                      Alert {dt.reminderDaysAhead}d prior
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1.5 text-left">
                    <h3 className="font-serif text-lg font-medium tracking-wide text-neutral-100 line-clamp-1">{dt.title}</h3>
                    <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      Registered: {dt.date}
                    </p>
                    {dt.description && (
                      <p className="text-xs text-neutral-500 italic mt-2 border-l border-luxury-800 pl-2 leading-relaxed line-clamp-2">
                        "{dt.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Tracker Indicator */}
                <div className="mt-6 pt-4 border-t border-luxury-800/60 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Days Remaining</p>
                    <p className="text-lg font-bold text-neutral-100 font-mono mt-0.5 flex items-center gap-1.5">
                      {daysLeft}
                      <span className="text-xs font-normal text-rose-500">days</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {daysLeft <= dt.reminderDaysAhead && (
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] rounded-lg animate-pulse" title="Active Timely Alarm triggered!">
                        Alarm On
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Remove the reminder for "${dt.title}"?`)) {
                          onDeleteDate(dt.id);
                        }
                      }}
                      className="p-1.5 rounded-xl border border-luxury-800 hover:border-red-500/30 text-neutral-500 hover:text-red-400 transition"
                      title="Deactivate Reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
              </TiltCard>
              </Reveal>
            );
          })}

        {dates.length === 0 && (
          <div className="col-span-full border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
            <Calendar className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="text-sm">No recorded dates found. Click the button above to begin logging memories.</p>
          </div>
        )}
      </div>
    </div>
  );
}
