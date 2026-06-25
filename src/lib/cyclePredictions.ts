import { CycleLog, PeriodConfig } from "../types";

export interface DayPrediction {
  dateStr: string; // YYYY-MM-DD
  isPredictedPeriod: boolean;
  isOvulationDay: boolean;
  isFertileWindow: boolean;
  isPregnancyTestWindow: boolean;
  cycleDayNumber: number | null; // 1-indexed day within its cycle, if known
}

function toDateStr(d: Date): string {
  // Build the string from local date components (not toISOString, which is
  // UTC-based and can shift the date by a day depending on timezone offset)
  // so this matches parseDateStr's local-time interpretation exactly.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateStr(s: string): Date {
  // Parse as local midnight rather than UTC midnight, so day boundaries
  // line up with what the person actually sees on their own calendar.
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Finds the most recent actual period start date from logged flow data
 * (the first day of a run of consecutive Light/Medium/Heavy/Spotting days),
 * falling back to config.lastPeriodDate if no usable logs exist.
 *
 * This is the key fix for the "two apps disagree" bug: previously,
 * predictions only ever read config.lastPeriodDate, which could silently
 * drift out of sync with what was actually logged day-by-day. Deriving
 * from logs when they exist keeps everything in one source of truth.
 */
export function getMostRecentPeriodStart(config: PeriodConfig, logs: CycleLog[]): string {
  const flowLogs = logs
    .filter((l) => l.flow && l.flow !== "None")
    .map((l) => l.date)
    .sort(); // ascending YYYY-MM-DD sorts correctly as strings

  if (flowLogs.length === 0) {
    return config.lastPeriodDate;
  }

  // Walk backward from the most recent flow day, grouping consecutive days
  // (allowing 1-day gaps, since spotting can be non-contiguous) into the
  // most recent period, then take its earliest day as the start date.
  let mostRecentStart = flowLogs[flowLogs.length - 1];
  for (let i = flowLogs.length - 1; i > 0; i--) {
    const current = parseDateStr(flowLogs[i]);
    const previous = parseDateStr(flowLogs[i - 1]);
    const gapDays = Math.round((current.getTime() - previous.getTime()) / 86400000);
    if (gapDays <= 2) {
      mostRecentStart = flowLogs[i - 1];
    } else {
      break;
    }
  }
  return mostRecentStart;
}

/**
 * Builds a day-by-day prediction map for a given month, projecting forward
 * (or backward) from the most recent known period start using cycleLength.
 * Returns a Map keyed by YYYY-MM-DD for fast lookup when rendering a grid.
 */
export function buildMonthPredictions(
  year: number,
  monthIndex: number, // 0-indexed, matches JS Date
  config: PeriodConfig,
  logs: CycleLog[]
): Map<string, DayPrediction> {
  const result = new Map<string, DayPrediction>();
  const cycleLength = config.cycleLength > 0 ? config.cycleLength : 28;
  const periodLength = config.periodLength > 0 ? config.periodLength : 5;

  const anchorStart = parseDateStr(getMostRecentPeriodStart(config, logs));

  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  // Pad a little before/after so a cycle that started in the prior month
  // and runs into this one is still represented correctly.
  const rangeStart = addDays(firstOfMonth, -cycleLength);
  const rangeEnd = addDays(lastOfMonth, cycleLength);

  // Find the first cycle-start on or before rangeStart, by walking the
  // anchor date backward/forward in cycleLength-sized steps.
  let cursor = new Date(anchorStart);
  if (cursor.getTime() > rangeStart.getTime()) {
    while (cursor.getTime() > rangeStart.getTime()) {
      cursor = addDays(cursor, -cycleLength);
    }
  } else {
    while (addDays(cursor, cycleLength).getTime() <= rangeStart.getTime()) {
      cursor = addDays(cursor, cycleLength);
    }
  }

  // Walk forward in cycleLength-sized steps, marking each cycle's period
  // days, ovulation day, fertile window, and pregnancy-test window, until
  // we've covered the padded range.
  while (cursor.getTime() <= rangeEnd.getTime()) {
    const cycleStart = new Date(cursor);
    // Ovulation occurs ~14 days before THIS cycle's period starts (it's the
    // event that, ~14 days later, triggers the period marked at cycleStart -
    // not 14 days after cycleStart, which would put it in the wrong cycle
    // entirely).
    const ovulationDate = addDays(cycleStart, -14);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = ovulationDate;
    // A pregnancy test is meaningfully reliable from about the day the
    // period was/is expected.
    const testWindowStart = new Date(cycleStart);
    const testWindowEnd = addDays(cycleStart, 4);

    for (let i = 0; i < periodLength; i++) {
      const d = addDays(cycleStart, i);
      if (d.getMonth() === monthIndex && d.getFullYear() === year) {
        const key = toDateStr(d);
        result.set(key, {
          dateStr: key,
          isPredictedPeriod: true,
          isOvulationDay: false,
          isFertileWindow: false,
          isPregnancyTestWindow: false,
          cycleDayNumber: i + 1,
        });
      }
    }

    // Mark the fertile window and ovulation day (a fixed 6-day span ending
    // on the ovulation date, which sits before this cycle's period start).
    let fertileCursor = new Date(fertileStart);
    while (fertileCursor.getTime() <= fertileEnd.getTime()) {
      if (fertileCursor.getMonth() === monthIndex && fertileCursor.getFullYear() === year) {
        const key = toDateStr(fertileCursor);
        const existing = result.get(key);
        const isOvulation = fertileCursor.getTime() === ovulationDate.getTime();
        result.set(key, {
          dateStr: key,
          isPredictedPeriod: existing?.isPredictedPeriod || false,
          isOvulationDay: isOvulation,
          isFertileWindow: !isOvulation,
          isPregnancyTestWindow: existing?.isPregnancyTestWindow || false,
          cycleDayNumber: existing?.cycleDayNumber ?? null,
        });
      }
      fertileCursor = addDays(fertileCursor, 1);
    }

    // Mark the pregnancy-test window (a fixed 5-day span starting at the
    // expected period date).
    let testCursor = new Date(testWindowStart);
    while (testCursor.getTime() <= testWindowEnd.getTime()) {
      if (testCursor.getMonth() === monthIndex && testCursor.getFullYear() === year) {
        const key = toDateStr(testCursor);
        const existing = result.get(key);
        result.set(key, {
          dateStr: key,
          isPredictedPeriod: existing?.isPredictedPeriod || false,
          isOvulationDay: existing?.isOvulationDay || false,
          isFertileWindow: existing?.isFertileWindow || false,
          isPregnancyTestWindow: true,
          cycleDayNumber: existing?.cycleDayNumber ?? null,
        });
      }
      testCursor = addDays(testCursor, 1);
    }

    cursor = addDays(cursor, cycleLength);
  }

  return result;
}
