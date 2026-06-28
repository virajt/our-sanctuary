import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import cookieParser from "cookie-parser";
import {
  SensoryGift,
  SanctuaryDB,
  WickedChallenge,
  VaultPhoto,
  CycleLog,
  PeriodConfig,
  AdminSettings,
  ImportantDate,
  GiftPurchase,
  Gift,
  Teaser,
  CycleTrackerDB
} from "./src/types";
import {
  generateGeminiWicked,
  generateGeminiPhotoPrompt,
  generateProceduralWicked,
  generateProceduralPhotoPrompt
} from "./server/generators";
import {
  verifyGoogleIdToken,
  issueSessionCookie,
  clearSessionCookie,
  getSession,
  requireAuth
} from "./server/auth";
import {
  readDB,
  writeDB,
  readCycleDB,
  writeCycleDB,
  addVaultPhoto,
  deleteVaultPhoto,
  addGiftPurchase,
  deleteGiftPurchase,
  withSanctuaryTransaction,
  withCycleTransaction
} from "./server/firestoreDb";
import { sendReminderEmail } from "./server/email";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Enable JSON bodies with higher limits for base64 photo uploads
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

// --- Authentication routes (must be reachable BEFORE the auth gate below) ---

// Exchange a Google ID token (from Google Identity Services on the frontend)
// for a server-signed session cookie. Rejects anyone not on ALLOWED_EMAILS.
app.post("/api/auth/google", async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: "Missing idToken." });
    return;
  }
  try {
    const session = await verifyGoogleIdToken(idToken);
    issueSessionCookie(res, session);
    res.json({ email: session.email, name: session.name, picture: session.picture });
  } catch (err) {
    console.warn("[auth] Google sign-in rejected:", (err as Error).message);
    res.status(401).json({ error: "Sign-in not authorized for this account." });
  }
});

// Returns the current session, if any. Used by the frontend on load to
// decide whether to show the sign-in screen or the app itself.
app.get("/api/auth/me", (req: Request, res: Response) => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  res.json(session);
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// --- Scheduled reminder endpoint, called by Cloud Scheduler once a day ---
// Deliberately placed OUTSIDE /api and before the requireAuth gate below,
// since Cloud Scheduler has no Google account to sign in with. Secured
// instead by a shared secret header - anyone calling this without the
// correct header gets a 401, same outcome as a real auth failure, just a
// different mechanism since the caller here isn't a person.
const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET || "";

app.post("/internal/run-reminders", asyncRoute(async (req: Request, res: Response) => {
  const providedSecret = req.header("X-Scheduler-Secret");
  if (!SCHEDULER_SECRET || providedSecret !== SCHEDULER_SECRET) {
    res.status(401).json({ error: "Not authorized." });
    return;
  }

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const [yyyy, mm, dd] = todayStr.split("-").map(Number);
  const today = new Date(yyyy, mm - 1, dd);
  let datesNotified = 0;
  let teaserHintsNotified = 0;

  // 1. Important Dates - send once per date when reminderDaysAhead is hit,
  // and again on the day itself. lastNotifiedDate prevents sending the
  // same reminder twice if this job runs more than once on the same day.
  await withSanctuaryTransaction((db, setDb) => {
    const dates = [...db.importantDates];
    let changed = false;

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (d.lastNotifiedDate === todayStr) continue; // already sent today

      const [ty, tm, td] = d.date.split("-").map(Number);
      const targetThisYear = new Date(today.getFullYear(), tm - 1, td);
      let daysUntil = Math.ceil((targetThisYear.getTime() - today.getTime()) / 86400000);
      
      if (daysUntil < 0) {
        // Already passed this year for recurring categories (birthdays/anniversaries) - check next year's occurrence instead.
        const targetNextYear = new Date(today.getFullYear() + 1, tm - 1, td);
        daysUntil = Math.ceil((targetNextYear.getTime() - today.getTime()) / 86400000);
      }

      if (daysUntil === 0 || daysUntil === d.reminderDaysAhead) {
        const isToday = daysUntil === 0;
        const subject = isToday ? `Today: ${d.title}` : `Approaching in ${daysUntil} day(s): ${d.title}`;
        
        let fromName = "Our Sanctuary";
        let greeting = "My love,";
        let signoff = "Forever yours,";
        
        if (d.remindWho === "Her") {
          fromName = "Your Loving Husband";
          greeting = "My beautiful wife,";
          signoff = "With all my devotion,<br>Your Husband";
        } else if (d.remindWho === "Him") {
          fromName = "Your Devoted Wife";
          greeting = "My handsome husband,";
          signoff = "Waiting for you,<br>Your Wife";
        }

        const htmlBody = `
        <div style="background-color: #050505; color: #f5f5f7; font-family: sans-serif; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #111114; border: 1px solid #33001b; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(220, 20, 60, 0.1);">
            <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #ff8ba7; margin-bottom: 20px; text-align: center;">
              Sanctuary Memory Vault
            </div>
            <h2 style="color: #ffdde6; font-size: 24px; font-weight: 300; margin-bottom: 30px; text-align: center;">
              ${greeting}
            </h2>
            <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 20px;">
              ${isToday ? "Today is finally here." : `We are only ${daysUntil} days away.`} I have been thinking endlessly about our upcoming moment together: <strong>${d.title}</strong>.
            </p>
            ${d.description ? `
            <div style="background-color: #1a0810; border-left: 2px solid #ff4d6d; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <p style="font-size: 15px; font-style: italic; color: #ffb3c6; margin: 0; line-height: 1.6;">
                "${d.description}"
              </p>
            </div>
            ` : ""}
            <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 40px;">
              I want nothing more than to lose myself in you when this day arrives. Prepare yourself for me.
            </p>
            <div style="text-align: center; border-top: 1px solid #2a161d; padding-top: 30px;">
              <p style="font-size: 14px; color: #ff8ba7; margin: 0;">
                ${signoff}
              </p>
            </div>
          </div>
        </div>
        `;

        sendReminderEmail(d.remindWho, subject, htmlBody, true, fromName).catch((err) => console.error("[reminders] Failed to send date email:", err));
        dates[i] = { ...d, lastNotifiedDate: todayStr };
        changed = true;
        datesNotified++;
      }
    }

    if (changed) setDb({ importantDates: dates });
  });

  // 2. Teasers - send each hint exactly once, when today matches
  // (targetDate - hint.daysBefore).
  await withSanctuaryTransaction((db, setDb) => {
    const teasers = [...(db.teasers || [])];
    let changed = false;

    for (let i = 0; i < teasers.length; i++) {
      const t = teasers[i];
      const [ty, tm, td] = t.targetDate.split("-").map(Number);
      const target = new Date(ty, tm - 1, td);
      const daysUntilTarget = Math.ceil((target.getTime() - today.getTime()) / 86400000);
      const sentDays = t.sentHintDays || [];

      for (const hint of t.hints) {
        if (hint.daysBefore === daysUntilTarget && !sentDays.includes(hint.daysBefore)) {
          const isTonight = hint.daysBefore === 0;
          const subject = isTonight ? `Tonight: ${t.title}` : `${t.title} - Only ${hint.daysBefore} days left`;
          
          let fromName = "Our Sanctuary";
          let signoff = "Eagerly yours,";
          
          if (t.notifyWho === "Her") {
            fromName = "Your Husband";
            signoff = "Anticipating you,<br>Your Husband";
          } else if (t.notifyWho === "Him") {
            fromName = "Your Wife";
            signoff = "Craving you,<br>Your Wife";
          }

          const htmlBody = `
          <div style="background-color: #050505; color: #f5f5f7; font-family: sans-serif; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #111114; border: 1px solid #1a0033; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(138, 43, 226, 0.08);">
              <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b794f4; margin-bottom: 25px; text-align: center;">
                Sanctuary Teaser Sequence
              </div>
              <h2 style="color: #e9d8fd; font-size: 22px; font-weight: 300; margin-bottom: 30px; text-align: center;">
                ${isTonight ? "The wait is over." : "The anticipation builds..."}
              </h2>
              
              <div style="background: linear-gradient(145deg, #160f24, #0f0a1a); border: 1px solid #2d1b4e; padding: 30px 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
                <p style="font-size: 17px; font-style: italic; color: #d6bcfa; margin: 0; line-height: 1.7; letter-spacing: 0.5px;">
                  "${hint.message}"
                </p>
              </div>

              <p style="font-size: 15px; line-height: 1.8; color: #a0aec0; margin-bottom: 35px; text-align: center;">
                Keep this in your mind. Let it consume your thoughts until we are finally alone.
              </p>
              
              <div style="text-align: center; border-top: 1px solid #1a1025; padding-top: 25px;">
                <p style="font-size: 14px; color: #b794f4; margin: 0;">
                  ${signoff}
                </p>
              </div>
            </div>
          </div>
          `;

          sendReminderEmail(t.notifyWho, subject, htmlBody, true, fromName).catch((err) => console.error("[reminders] Failed to send teaser hint:", err));
          sentDays.push(hint.daysBefore);
          changed = true;
          teaserHintsNotified++;
        }
      }
      teasers[i] = { ...t, sentHintDays: sentDays };
    }

    if (changed) setDb({ teasers });
  });

  res.json({ success: true, datesNotified, teaserHintsNotified });
}));

// --- Everything below this line requires a valid, whitelisted session ---
app.use("/api", requireAuth);

app.post("/api/admin/test-email", asyncRoute(async (req: Request, res: Response) => {
  const { role } = req.body; // "Him" or "Her"
  if (role !== "Him" && role !== "Her") {
    res.status(400).json({ error: "Invalid role for test email." });
    return;
  }
  
  let fromName = "Our Sanctuary";
  let greeting = "My love,";
  let signoff = "Forever yours,";
  
  if (role === "Her") {
    fromName = "Your Loving Husband";
    greeting = "My beautiful wife,";
    signoff = "With all my devotion,<br>Your Husband";
  } else if (role === "Him") {
    fromName = "Your Devoted Wife";
    greeting = "My handsome husband,";
    signoff = "Waiting for you,<br>Your Wife";
  }

  const htmlBody = `
  <div style="background-color: #050505; color: #f5f5f7; font-family: sans-serif; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111114; border: 1px solid #33001b; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(220, 20, 60, 0.1);">
      <div style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #ff8ba7; margin-bottom: 20px; text-align: center;">
        Sanctuary Test Communication
      </div>
      <h2 style="color: #ffdde6; font-size: 24px; font-weight: 300; margin-bottom: 30px; text-align: center;">
        ${greeting}
      </h2>
      <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 20px;">
        This is a test message to ensure our private sanctuary's communication channel is perfectly attuned.
      </p>
      <div style="text-align: center; border-top: 1px solid #2a161d; padding-top: 30px;">
        <p style="font-size: 14px; color: #ff8ba7; margin: 0;">
          ${signoff}
        </p>
      </div>
    </div>
  </div>
  `;

  const result = await sendReminderEmail(role, "Sanctuary Connection Test", htmlBody, true, fromName);
  if (!result.success) {
    res.status(500).json({ error: result.error });
    return;
  }
  res.json({ success: true });
}));

app.post("/api/admin/send-guides", asyncRoute(async (req: Request, res: Response) => {
  const db = await readDB();
  const config = db.adminSettings.notificationConfig;
  
  if (!config?.herEmail || !config?.hisEmail) {
    res.status(400).json({ error: "Both 'His Email' and 'Her Email' must be configured in settings to send the initiation guides." });
    return;
  }

  const herHTML = `
  <div style="background-color: #050505; color: #f5f5f7; font-family: sans-serif; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111114; border: 1px solid #33001b; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(220, 20, 60, 0.1);">
      <h2 style="color: #ffdde6; font-size: 24px; font-weight: 300; margin-bottom: 30px; text-align: center;">
        My beautiful wife,
      </h2>
      <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 20px;">
        I have spent the last few weeks quietly building a private, encrypted vault entirely for you. It is a space that belongs exclusively to us, shielded from the rest of the world.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 20px;">
        I built this because I want to study you. I want to map out every detail of your biology, your cycle, and your deepest desires. I want to know exactly what drives you crazy, and I want to know exactly when you need me to take total control.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 20px;">
        When you log into our Sanctuary, I need you to leave every single one of your responsibilities at the door. Your only job in this space is to log your feelings, be completely honest about what you crave, and completely surrender to whatever I have planned for you.
      </p>
      <div style="background-color: #1a0810; border-left: 2px solid #ff4d6d; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="font-size: 15px; font-style: italic; color: #ffb3c6; margin: 0; line-height: 1.6;">
          "I am going to take very, very good care of you."
        </p>
      </div>
      <p style="font-size: 16px; line-height: 1.8; color: #c9c4c6; margin-bottom: 40px; text-align: center;">
        Click the link below when you are ready to begin.
      </p>
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="https://our-sanctuary.virajtrivedi.com" style="background-color: #ff4d6d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; letter-spacing: 1px;">Enter The Sanctuary</a>
      </div>
      <div style="text-align: center; border-top: 1px solid #2a161d; padding-top: 30px;">
        <p style="font-size: 14px; color: #ff8ba7; margin: 0;">
          With all my devotion,<br>Your Husband
        </p>
      </div>
    </div>
  </div>
  `;

  const hisHTML = `
  <div style="background-color: #050505; color: #f5f5f7; font-family: sans-serif; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #111114; border: 1px solid #1a0033; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(138, 43, 226, 0.08);">
      <h2 style="color: #e9d8fd; font-size: 24px; font-weight: 300; margin-bottom: 30px; text-align: center;">
        The Architect's Protocol
      </h2>
      <p style="font-size: 16px; line-height: 1.8; color: #a0aec0; margin-bottom: 20px;">
        Viraj, this is your domain. You are the Architect. From the second she logs in, you are in absolute control of the anticipation.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #a0aec0; margin-bottom: 20px;">
        Watch her cycle. Study the clues she leaves you. Use the tools in this vault to push her exactly to the edge. Never let her get comfortable, and never let her forget how deeply you desire her.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #a0aec0; margin-bottom: 40px;">
        Execute the protocols flawlessly. The Sanctuary is live.
      </p>
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="https://our-sanctuary.virajtrivedi.com" style="background-color: #8a2be2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; letter-spacing: 1px;">Access Master Control</a>
      </div>
    </div>
  </div>
  `;

  // Send to Her
  const herResult = await sendReminderEmail("Her", "Your Sanctuary.", herHTML, true, "Your Husband");
  if (!herResult.success) {
    res.status(500).json({ error: "Failed to send to Her: " + herResult.error });
    return;
  }

  // Send to Him
  const hisResult = await sendReminderEmail("Him", "The Master Key.", hisHTML, true, "Sanctuary System");
  if (!hisResult.success) {
    res.status(500).json({ error: "Failed to send to Him: " + hisResult.error });
    return;
  }

  res.json({ success: true });
}));

// Wraps an async route handler so a rejected promise (e.g. Firestore being
// briefly unreachable, a misconfigured credential, a transient network
// blip) becomes a clean JSON 500 response instead of an unhandled
// rejection that crashes the entire Node process. Without this, a single
// failed database call could take down every other in-flight request on
// this container, not just the one that failed - confirmed directly while
// testing this migration: a Firestore connection issue crashed the whole
// server instead of just failing one request.
function asyncRoute(
  handler: (req: Request, res: Response) => Promise<void>
) {
  return (req: Request, res: Response) => {
    handler(req, res).catch((err) => {
      console.error(`[error] ${req.method} ${req.path} failed:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Something went wrong on our end. Please try again." });
      }
    });
  };
}

// Last-resort safety nets. These should rarely fire if asyncRoute is used
// consistently below, but they exist so a truly unexpected error logs
// clearly instead of silently killing the process with no trace.
process.on("unhandledRejection", (reason) => {
  console.error("[fatal] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[fatal] Uncaught exception:", err);
});

// Initialize Gemini SDK with User-Agent required header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI loaded successfully server-side.");
  } catch (err) {
    console.error("Failed to load Gemini AI:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY detected. Running in elegant procedural-generation fallback mode.");
}

// --- Database access ---
// All read/write logic now lives in server/firestoreDb.ts, backed by
// Firestore instead of a JSON file on a GCS FUSE volume mount. The old
// approach had two real bugs: GCS FUSE provides no file-locking for
// concurrent writes ("last write wins, all previous writes are lost" -
// straight from Google's own docs), and its 60-second stat cache could
// serve stale reads shortly after a write, especially across the multiple
// Cloud Run instances this service can scale to. Firestore transactions
// (see withSanctuaryTransaction / withCycleTransaction below) are safe
// across instances, which the old in-process mutex never was.
//
// readDB/writeDB/readCycleDB/writeCycleDB are now async (they make network
// calls to Firestore instead of synchronous fs calls) - every call site
// below has been updated to await them.


// API Routes
// 1. Full Database Health & Pull
app.get("/api/database", asyncRoute(async (req: Request, res: Response) => {
  const db = await readDB();
  const cycleDb = await readCycleDB();
  res.json({
    ...db,
    periodConfig: cycleDb.periodConfig,
    cycleLogs: cycleDb.cycleLogs
  });
}));

// 2. Sensory Gifts Endpoints
app.post("/api/gifts", asyncRoute(async (req: Request, res: Response) => {
  const { title, description, category, receiver } = req.body;
  if (!title || !description || !category || !receiver) {
     res.status(400).json({ error: "Missing required fields" });
     return;
  }
  const newGift = await withSanctuaryTransaction((db, setDb) => {
    const gift: SensoryGift = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      description,
      category,
      receiver,
      status: "Available",
      custom: true
    };
    const gifts = [...db.gifts, gift];
    setDb({ gifts });
    return gift;
  });
  res.json(newGift);
}));

app.post("/api/gifts/:id/claim", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { claimedBy } = req.body; // "Him" | "Her"
  if (!claimedBy) {
     res.status(400).json({ error: "claimedBy is required" });
     return;
  }
  const result = await withSanctuaryTransaction((db, setDb) => {
    const giftIndex = db.gifts.findIndex(g => g.id === id);
    if (giftIndex === -1) return null;
    const gifts = [...db.gifts];
    gifts[giftIndex] = {
      ...gifts[giftIndex],
      status: "Claimed",
      claimedBy,
      claimedAt: new Date().toISOString()
    };
    setDb({ gifts });
    return gifts[giftIndex];
  });
  if (!result) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  res.json(result);
}));

app.post("/api/gifts/:id/redeem", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await withSanctuaryTransaction((db, setDb) => {
    const giftIndex = db.gifts.findIndex(g => g.id === id);
    if (giftIndex === -1) return null;
    const gifts = [...db.gifts];
    gifts[giftIndex] = {
      ...gifts[giftIndex],
      status: "Redeemed",
      redeemedAt: new Date().toISOString()
    };
    setDb({ gifts });
    return gifts[giftIndex];
  });
  if (!result) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  res.json(result);
}));

app.post("/api/gifts/:id/delete", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const found = await withSanctuaryTransaction((db, setDb) => {
    const filtered = db.gifts.filter(g => g.id !== id);
    if (filtered.length === db.gifts.length) return false;
    setDb({ gifts: filtered });
    return true;
  });
  if (!found) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  res.json({ success: true, message: "Gift removed successfully." });
}));

// 2b. Real Gifts (distinct from Vouchers above) - actual gifts one partner
// gives the other, e.g. jewelry, a trip, a handwritten letter. Mirrors the
// Vouchers routes structurally (create / give / receive / delete) but
// lives in its own realGifts array with its own admin-editable category
// list (AdminSettings.giftCategories), since these are conceptually
// different from sensory vouchers.
app.post("/api/real-gifts", asyncRoute(async (req: Request, res: Response) => {
  const { title, description, category, giver, receiver } = req.body;
  if (!title || !description || !category || !giver || !receiver) {
     res.status(400).json({ error: "Missing required fields" });
     return;
  }
  const newGift = await withSanctuaryTransaction((db, setDb) => {
    const gift: Gift = {
      id: `realgift_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      description,
      category,
      giver,
      receiver,
      status: "Planned",
      custom: true
    };
    const realGifts = [...(db.realGifts || []), gift];
    setDb({ realGifts });
    return gift;
  });
  res.json(newGift);
}));

app.post("/api/real-gifts/:id/give", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await withSanctuaryTransaction((db, setDb) => {
    const gifts = [...(db.realGifts || [])];
    const idx = gifts.findIndex(g => g.id === id);
    if (idx === -1) return null;
    gifts[idx] = { ...gifts[idx], status: "Given", givenAt: new Date().toISOString() };
    setDb({ realGifts: gifts });
    return gifts[idx];
  });
  if (!result) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  res.json(result);
}));

app.post("/api/real-gifts/:id/receive", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await withSanctuaryTransaction((db, setDb) => {
    const gifts = [...(db.realGifts || [])];
    const idx = gifts.findIndex(g => g.id === id);
    if (idx === -1) return null;
    gifts[idx] = { ...gifts[idx], status: "Received", receivedAt: new Date().toISOString() };
    setDb({ realGifts: gifts });
    return gifts[idx];
  });
  if (!result) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  res.json(result);
}));

app.post("/api/real-gifts/:id/delete", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const found = await withSanctuaryTransaction((db, setDb) => {
    const gifts = db.realGifts || [];
    const filtered = gifts.filter(g => g.id !== id);
    if (filtered.length === gifts.length) return false;
    setDb({ realGifts: filtered });
    return true;
  });
  if (!found) {
    res.status(404).json({ error: "Gift not found" });
    return;
  }
  res.json({ success: true, message: "Gift removed successfully." });
}));

// 3. Wicked Chamber Random Generation (with Gemini optimization)
app.post("/api/wicked/generate", asyncRoute(async (req: Request, res: Response) => {
  const { target, intensity } = req.body;
  if (!target) {
     res.status(400).json({ error: "target is required" });
     return;
  }

  const baseChallenge = await generateGeminiWicked(target, intensity);

  await withSanctuaryTransaction((db, setDb) => {
    const history = [baseChallenge, ...db.wickedChallengesHistory];
    if (history.length > 50) history.pop();
    setDb({ wickedChallengesHistory: history });
  });

  res.json(baseChallenge);
}));

// 4. Private Gallery Photo Prompt Generation
app.post("/api/gallery/prompt", asyncRoute(async (req: Request, res: Response) => {
  const { target } = req.body;
  if (!target) {
     res.status(400).json({ error: "target is required" });
     return;
  }

  const basePrompt = await generateGeminiPhotoPrompt(target);
  res.json(basePrompt);
}));

// 5. Private Gallery Upload & AI Captioning
app.post("/api/gallery/upload", asyncRoute(async (req: Request, res: Response) => {
  const { imageUrl, promptText, target } = req.body;
  if (!imageUrl || !promptText || !target) {
     res.status(400).json({ error: "imageUrl, promptText and target are required." });
     return;
  }

  let finalCaption = "A beautiful private sensory memory, locked safely in our sanctuary.";
  let capByAI = false;

  // Use Gemini to capture physical aesthetics if image is uploaded and Gemini is enabled
  if (ai && imageUrl.startsWith("data:image")) {
    try {
      // Decode image for Gemini
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];

        const imagePart = {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };

        const textPrompt = `Analyze this aesthetic couples-photography image. Write an extremely elegant, poetic, and passionately sensual description or caption (1-2 sentences maximum). 
        Focus on warm shadow gradients, silk outlines, soft highlights, shapes, and the emotional/physical presence shared under the concept of: "${promptText}". 
        Avoid any sterile descriptions, vulgar vocabulary, or robotic analysis. Write it as a diary entry or deep romantic dedication to each other.`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: { parts: [imagePart, { text: textPrompt }] },
          config: {
            temperature: 0.9
          }
        });

        if (response && response.text) {
          finalCaption = response.text.trim();
          capByAI = true;
        }
      }
    } catch (err) {
      console.error("Gemini failed to caption the photo, using comforting default. Error:", err);
    }
  }

  const newPhoto: VaultPhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    promptText,
    imageUrl,
    description: finalCaption,
    target,
    timestamp: new Date().toISOString(),
    captionGeneratedByAI: capByAI
  };

  await addVaultPhoto(newPhoto);

  res.json(newPhoto);
}));

app.post("/api/gallery/delete/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteVaultPhoto(id);
  res.json({ success: true });
}));

// 6. Period Tracker Configuration
app.post("/api/period/config", asyncRoute(async (req: Request, res: Response) => {
  const { lastPeriodDate, cycleLength, periodLength, pregnancyMode, pregnancyStartDate } = req.body;
  if (!lastPeriodDate || !cycleLength || !periodLength) {
     res.status(400).json({ error: "Missing config variables" });
     return;
  }
  const config = await withCycleTransaction((cycleDb, setCycleDb) => {
    const periodConfig: PeriodConfig = {
      lastPeriodDate,
      cycleLength: parseInt(cycleLength),
      periodLength: parseInt(periodLength),
      pregnancyMode: !!pregnancyMode,
      pregnancyStartDate: pregnancyStartDate || ""
    };
    setCycleDb({ periodConfig });
    return periodConfig;
  });
  res.json(config);
}));

// 7. Add Period Daily Symtoms Log
app.post("/api/period/log", asyncRoute(async (req: Request, res: Response) => {
  const { date, symptoms, moods, intimacyLevel, notes, flow, temperature, weight, waterIntake, sleepDuration, sex } = req.body;
  if (!date || !symptoms || !moods || !intimacyLevel) {
     res.status(400).json({ error: "Missing required daily credentials" });
     return;
  }
  const logItem = await withCycleTransaction((cycleDb, setCycleDb) => {
    // check if log for same date already exists, overwrite if yes
    const existingIndex = cycleDb.cycleLogs.findIndex(l => l.date === date);
    const item: CycleLog = {
      id: existingIndex !== -1 ? cycleDb.cycleLogs[existingIndex].id : `log_${Date.now()}`,
      date,
      symptoms,
      moods,
      intimacyLevel,
      notes,
      flow: flow || "None",
      temperature: temperature !== undefined && temperature !== null && temperature !== "" ? Number(temperature) : undefined,
      weight: weight !== undefined && weight !== null && weight !== "" ? Number(weight) : undefined,
      waterIntake: waterIntake !== undefined && waterIntake !== null && waterIntake !== "" ? Number(waterIntake) : undefined,
      sleepDuration: sleepDuration !== undefined && sleepDuration !== null && sleepDuration !== "" ? Number(sleepDuration) : undefined,
      sex: sex || "None"
    };

    const cycleLogs = [...cycleDb.cycleLogs];
    if (existingIndex !== -1) {
      cycleLogs[existingIndex] = item;
    } else {
      cycleLogs.unshift(item);
    }

    setCycleDb({ cycleLogs });
    return item;
  });
  res.json(logItem);
}));

// 8. Admin Settings Update
app.post("/api/admin/settings", asyncRoute(async (req: Request, res: Response) => {
  const { vibeIntensity, periodRemindersEnabled, wickedActions, wickedBodyParts, photoThemes, photoSetups, theme, voucherCategories, giftCategories, notificationConfig } = req.body;
  const settings = await withSanctuaryTransaction((db, setDb) => {
    const adminSettings: AdminSettings = {
      vibeIntensity: vibeIntensity || db.adminSettings.vibeIntensity,
      periodRemindersEnabled: periodRemindersEnabled !== undefined ? periodRemindersEnabled : db.adminSettings.periodRemindersEnabled,
      wickedActions: wickedActions || db.adminSettings.wickedActions,
      wickedBodyParts: wickedBodyParts || db.adminSettings.wickedBodyParts,
      photoThemes: photoThemes || db.adminSettings.photoThemes,
      photoSetups: photoSetups || db.adminSettings.photoSetups,
      theme: theme || db.adminSettings.theme || "Passionate Red",
      voucherCategories: voucherCategories || db.adminSettings.voucherCategories || ["Pampering", "Sensual", "Intimate", "Wicked"],
      giftCategories: giftCategories || db.adminSettings.giftCategories || ["Jewelry", "Experience", "Letter", "Trip", "Keepsake", "Other"],
      notificationConfig: notificationConfig !== undefined ? notificationConfig : db.adminSettings.notificationConfig
    };
    setDb({ adminSettings });
    return adminSettings;
  });
  res.json(settings);
}));


// 9. Important Dates System (Task 1)
app.post("/api/dates", asyncRoute(async (req: Request, res: Response) => {
  const { id, title, date, category, description, reminderDaysAhead, remindWho } = req.body;
  if (!title || !date || !category) {
     res.status(400).json({ error: "Missing required title, date, or category" });
     return;
  }
  const dateItem = await withSanctuaryTransaction((db, setDb) => {
    const dateId = id || `date_${Date.now()}`;
    const existingIndex = db.importantDates.findIndex(d => d.id === dateId);
    const item: ImportantDate = {
      id: dateId,
      title,
      date,
      category,
      description: description || "",
      reminderDaysAhead: Number(reminderDaysAhead) || 0,
      remindWho: remindWho || (existingIndex !== -1 ? db.importantDates[existingIndex].remindWho : "Both") || "Both"
    };

    const importantDates = [...db.importantDates];
    if (existingIndex !== -1) {
      importantDates[existingIndex] = item;
    } else {
      importantDates.push(item);
    }

    setDb({ importantDates });
    return item;
  });
  res.json(dateItem);
}));

app.delete("/api/dates/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ importantDates: db.importantDates.filter(d => d.id !== id) });
  });
  res.json({ success: true, message: "Date notification deleted" });
}));


// 9b. Teasers - escalating private hints toward a planned date/night
app.post("/api/teasers", asyncRoute(async (req: Request, res: Response) => {
  const { title, targetDate, createdBy, notifyWho, hints } = req.body;
  if (!title || !targetDate || !createdBy || !notifyWho || !Array.isArray(hints) || hints.length === 0) {
    res.status(400).json({ error: "Missing required fields - title, targetDate, createdBy, notifyWho, and at least one hint." });
    return;
  }
  const teaser = await withSanctuaryTransaction((db, setDb) => {
    const item: Teaser = {
      id: `teaser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      targetDate,
      createdBy,
      notifyWho,
      hints: [...hints].sort((a, b) => b.daysBefore - a.daysBefore),
      sentHintDays: [],
      createdAt: new Date().toISOString()
    };
    setDb({ teasers: [item, ...(db.teasers || [])] });
    return item;
  });
  res.json(teaser);
}));

app.delete("/api/teasers/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ teasers: (db.teasers || []).filter(t => t.id !== id) });
  });
  res.json({ success: true });
}));


// 10. Gift Purchases Log with Photo Support (Task 4)
// Each purchase is its own Firestore document (it can contain a base64
// photo), so this is a direct collection write, not to a transaction.
app.post("/api/gift-purchases", asyncRoute(async (req: Request, res: Response) => {
  const { title, description, category, photoUrl, buyer, price } = req.body;
  if (!title || !category || !buyer) {
     res.status(400).json({ error: "Missing required physical gift details" });
     return;
  }

  const purchase: GiftPurchase = {
    id: `purchase_${Date.now()}`,
    title,
    description: description || "",
    category,
    photoUrl: photoUrl || "",
    buyer,
    price: price || "",
    timestamp: new Date().toISOString()
  };
  await addGiftPurchase(purchase);
  res.json(purchase);
}));

app.delete("/api/gift-purchases/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteGiftPurchase(id);
  res.json({ success: true, message: "Purchase deleted successfully" });
}));


// 11. Period Tracker Bulk Import (Task 3)
app.post("/api/period/import", asyncRoute(async (req: Request, res: Response) => {
  const { logs, config } = req.body;
  if (!Array.isArray(logs)) {
     res.status(400).json({ error: "Logs payload must be an array of daily states list." });
     return;
  }

  const result = await withCycleTransaction((cycleDb, setCycleDb) => {
    let mergedCount = 0;
    const cycleLogs = [...cycleDb.cycleLogs];

    logs.forEach((importedLog) => {
      if (!importedLog.date) return;
      const existingIndex = cycleLogs.findIndex(l => l.date === importedLog.date);
      const logItem: CycleLog = {
        id: importedLog.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: importedLog.date,
        symptoms: Array.isArray(importedLog.symptoms) ? importedLog.symptoms : [],
        moods: Array.isArray(importedLog.moods) ? importedLog.moods : [],
        intimacyLevel: importedLog.intimacyLevel || "None",
        notes: importedLog.notes || "",
        flow: importedLog.flow || "None",
        temperature: importedLog.temperature !== undefined && importedLog.temperature !== null && importedLog.temperature !== "" ? Number(importedLog.temperature) : undefined,
        weight: importedLog.weight !== undefined && importedLog.weight !== null && importedLog.weight !== "" ? Number(importedLog.weight) : undefined,
        waterIntake: importedLog.waterIntake !== undefined && importedLog.waterIntake !== null && importedLog.waterIntake !== "" ? Number(importedLog.waterIntake) : undefined,
        sleepDuration: importedLog.sleepDuration !== undefined && importedLog.sleepDuration !== null && importedLog.sleepDuration !== "" ? Number(importedLog.sleepDuration) : undefined,
        sex: importedLog.sex || "None"
      };

      if (existingIndex !== -1) {
        cycleLogs[existingIndex] = logItem;
      } else {
        cycleLogs.push(logItem);
      }
      mergedCount++;
    });

    // Sort chronologically descending
    cycleLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const periodConfig: PeriodConfig = { ...cycleDb.periodConfig };
    if (config) {
      if (config.lastPeriodDate) periodConfig.lastPeriodDate = config.lastPeriodDate;
      if (config.cycleLength) periodConfig.cycleLength = Number(config.cycleLength);
      if (config.periodLength) periodConfig.periodLength = Number(config.periodLength);
      if (config.pregnancyMode !== undefined) periodConfig.pregnancyMode = !!config.pregnancyMode;
      if (config.pregnancyStartDate !== undefined) periodConfig.pregnancyStartDate = config.pregnancyStartDate;
    }

    setCycleDb({ cycleLogs, periodConfig });
    return { count: mergedCount, periodConfig, logsCount: cycleLogs.length };
  });

  res.json({ success: true, ...result });
}));


// 11b. Period Tracker PDF/Screenshot AI Import Supporting Route
app.post("/api/period/import-pdf", asyncRoute(async (req: Request, res: Response) => {
  const { pdfData } = req.body;
  if (!pdfData) {
    res.status(400).json({ error: "Missing pdfData payload (base64 string required)." });
    return;
  }

  let mimeType = "application/pdf";
  let base64String = pdfData;

  if (pdfData.startsWith("data:")) {
    const match = pdfData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64String = match[2];
    }
  }

  // If Gemini is loaded, do real parsing!
  if (ai) {
    try {
      const documentPart = {
        inlineData: {
          mimeType,
          data: base64String,
        }
      };

      const prompt = `You are an expert biological and cycle tracking medical assistant designed to parse period tracker export documents, PDFs, calendar export screenshots, or summaries.
      Analyze the attached document carefully. Extract:
      1. Average cycle length (default to 28 if not found) and average period/bleeding duration (default to 5 if not found).
      2. The most recent period start date in YYYY-MM-DD format (for periodConfig).
      3. A list of daily logs with identified dates (YYYY-MM-DD), symptoms, moods, intimacy levels, and optional notes. Also extract flow intensity (None, Spotting, Light, Medium, Heavy), temperature, weight, water intake, sleep duration, and sexual activity if available.
      
      Ensure you match:
      - Symptoms options exactly from: "Cramps", "Bloating", "Headache", "Tenderness", "Fatigue", "Insomnia", "Anxiety", "High Energy", "High Sex Drive".
      - Moods options exactly from: "Radiant", "Calm", "Tender", "Playful", "Sassy", "Vulnerable", "Exhausted", "Irritable", "Anxious".
      - IntimacyLevel option exactly from: "None", "Light Touch", "Sensual", "Intense".
      - Flow options exactly from: "None", "Spotting", "Light", "Medium", "Heavy".
      - Sex options exactly from: "None", "Protected", "Unprotected".
      
      Please return a single JSON object containing these keys.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [documentPart, { text: prompt }],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              periodConfig: {
                type: Type.OBJECT,
                properties: {
                  lastPeriodDate: { type: Type.STRING, description: "Latest period start date found in document (YYYY-MM-DD)." },
                  cycleLength: { type: Type.INTEGER, description: "Average cycle length (e.g., 28)." },
                  periodLength: { type: Type.INTEGER, description: "Average period bleeding duration (e.g., 5)." }
                },
                required: ["lastPeriodDate", "cycleLength", "periodLength"]
              },
              logs: {
                type: Type.ARRAY,
                description: "List of day-by-day logs parsed from the cycle document.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "Date in YYYY-MM-DD format." },
                    symptoms: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    moods: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    intimacyLevel: { type: Type.STRING, description: "Intimacy level options: None, Light Touch, Sensual, Intense" },
                    notes: { type: Type.STRING, description: "Short descriptive note about her condition on this day." },
                    flow: { type: Type.STRING, description: "Flow intensity: None, Spotting, Light, Medium, Heavy." },
                    temperature: { type: Type.NUMBER, description: "Basal Body Temperature if found." },
                    weight: { type: Type.NUMBER, description: "Weight if found." },
                    waterIntake: { type: Type.NUMBER, description: "Water intake in ml if found." },
                    sleepDuration: { type: Type.NUMBER, description: "Sleep duration in hours if found." },
                    sex: { type: Type.STRING, description: "Sexual activity: None, Protected, Unprotected." }
                  },
                  required: ["date", "symptoms", "moods", "intimacyLevel"]
                }
              }
            },
            required: ["periodConfig", "logs"]
          }
        }
      });

      if (response && response.text) {
        const parsedData = JSON.parse(response.text.trim());

        const result = await withCycleTransaction((cycleDb, setCycleDb) => {
          const logs = parsedData.logs || [];
          const config = parsedData.periodConfig;
          const cycleLogs = [...cycleDb.cycleLogs];

          let mergedCount = 0;
          logs.forEach((importedLog: any) => {
            if (!importedLog.date) return;
            const existingIndex = cycleLogs.findIndex(l => l.date === importedLog.date);
            const logItem: CycleLog = {
              id: importedLog.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              date: importedLog.date,
              symptoms: Array.isArray(importedLog.symptoms) ? importedLog.symptoms : [],
              moods: Array.isArray(importedLog.moods) ? importedLog.moods : [],
              intimacyLevel: importedLog.intimacyLevel || "None",
              notes: importedLog.notes || "",
              flow: importedLog.flow || "None",
              temperature: importedLog.temperature !== undefined ? Number(importedLog.temperature) : undefined,
              weight: importedLog.weight !== undefined ? Number(importedLog.weight) : undefined,
              waterIntake: importedLog.waterIntake !== undefined ? Number(importedLog.waterIntake) : undefined,
              sleepDuration: importedLog.sleepDuration !== undefined ? Number(importedLog.sleepDuration) : undefined,
              sex: importedLog.sex || "None"
            };

            if (existingIndex !== -1) {
              cycleLogs[existingIndex] = logItem;
            } else {
              cycleLogs.push(logItem);
            }
            mergedCount++;
          });

          // Sort chronologically descending
          cycleLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const periodConfig: PeriodConfig = { ...cycleDb.periodConfig };
          if (config) {
            if (config.lastPeriodDate) periodConfig.lastPeriodDate = config.lastPeriodDate;
            if (config.cycleLength) periodConfig.cycleLength = Number(config.cycleLength);
            if (config.periodLength) periodConfig.periodLength = Number(config.periodLength);
          }

          setCycleDb({ cycleLogs, periodConfig });

          return {
            count: mergedCount,
            periodConfig,
            logsCount: cycleLogs.length,
            extractedLogs: logs
          };
        });

        res.json({ success: true, ...result });
        return;
      }
    } catch (err: any) {
      console.error("AI Period PDF import failed:", err);
      res.status(500).json({ error: "Failed to parse cycle PDF document. " + err.message });
      return;
    }
  }

  // Robust, beautiful, realistic mock parser fallback when GEMINI_API_KEY is not assigned
  try {
    const today = new Date();

    // Create realistic parsed cycle items
    const generatedConfig = {
      lastPeriodDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      cycleLength: 28,
      periodLength: 5,
      pregnancyMode: false,
      pregnancyStartDate: ""
    };

    // Synthesize logs for past period started 14 days ago
    const generatedLogs: CycleLog[] = [];
    for (let i = 0; i < 5; i++) {
      const logDate = new Date(today.getTime() - (14 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      generatedLogs.push({
        id: `log_mock_${Date.now()}_${i}`,
        date: logDate,
        symptoms: i === 0 || i === 1 ? ["Cramps", "Fatigue"] : ["Tenderness"],
        moods: i === 0 ? ["Vulnerable"] : ["Calm"],
        intimacyLevel: i === 0 ? "None" : "Light Touch",
        notes: `Simulated period log day ${i + 1} extracted from PDF.`,
        flow: i === 0 ? "Heavy" : i === 1 ? "Medium" : "Light",
        temperature: 36.5 + i * 0.1,
        weight: 58.2,
        waterIntake: 1500 + i * 250,
        sleepDuration: 7 + (i % 2),
        sex: i === 3 ? "Protected" : "None"
      });
    }

    const result = await withCycleTransaction((cycleDb, setCycleDb) => {
      const cycleLogs = [...cycleDb.cycleLogs];
      generatedLogs.forEach((mockLog) => {
        const existingIndex = cycleLogs.findIndex(l => l.date === mockLog.date);
        if (existingIndex !== -1) {
          cycleLogs[existingIndex] = mockLog;
        } else {
          cycleLogs.push(mockLog);
        }
      });

      cycleLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setCycleDb({ cycleLogs, periodConfig: generatedConfig });

      return {
        periodConfig: generatedConfig,
        logsCount: cycleLogs.length
      };
    });

    res.json({
      success: true,
      count: generatedLogs.length,
      periodConfig: result.periodConfig,
      logsCount: result.logsCount,
      extractedLogs: generatedLogs,
      simulated: true
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed simulated data builder fallback: " + err.message });
  }
}));

// 11c. Period Tracker Export Route
app.get("/api/period/export", asyncRoute(async (req: Request, res: Response) => {
  const format = req.query.format as string;
  const cycleDb = await readCycleDB();

  if (format === "csv") {
    // Generate CSV
    const headers = ["ID", "Date", "Flow", "Symptoms", "Moods", "Intimacy Level", "Sex", "Temperature", "Weight", "Water Intake (ml)", "Sleep Duration (hrs)", "Notes"];
    const rows = cycleDb.cycleLogs.map(log => [
      log.id,
      log.date,
      log.flow || "None",
      (log.symptoms || []).join(";"),
      (log.moods || []).join(";"),
      log.intimacyLevel,
      log.sex || "None",
      log.temperature !== undefined ? log.temperature : "",
      log.weight !== undefined ? log.weight : "",
      log.waterIntake !== undefined ? log.waterIntake : "",
      log.sleepDuration !== undefined ? log.sleepDuration : "",
      (log.notes || "").replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=cycle_tracker_export.csv");
    res.send(csvContent);
  } else {
    // Default to JSON
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=cycle_tracker_export.json");
    res.send(JSON.stringify(cycleDb, null, 2));
  }
}));


// 12. Sensory Voucher Generation API
app.post("/api/gifts/generate", asyncRoute(async (req: Request, res: Response) => {
  const { category, receiver } = req.body;
  if (!category || !receiver) {
    res.status(400).json({ error: "category and receiver are required." });
    return;
  }

  const FALLBACKS: Record<string, Array<{title: string, description: string}>> = {
    "Pampering": [
      { title: "Warm Aroma Scalp Treatment", description: "Soft luxurious hair massage with hot lavender or coconut oil, followed by slow, comforting combing and absolute peace." },
      { title: "Sacred Foot Spa & Lavender Touch", description: "Feet bathed in warm botanical floral water, followed by a detailed soothing massage focusing on releasing domestic stress." }
    ],
    "Sensual": [
      { title: "Blind folded taste matching", description: "You are blindfolded, in warm candlelight. Feeding each other chilled sweet grapes, dark gourmet chocolates, and honey drops, guessing the zests." },
      { title: "Feather & Warm Candle-glow Trace", description: "Trace body silhouettes under very dim room lights using ultra-soft silk feathers and warm-air whispers." }
    ],
    "Intimate": [
      { title: "Candlelit Breath & Heart alignment", description: "Sit close, placing palms directly over each other's beating hearts. Synchronize deep breath patterns for 5 minutes in absolute present silence." },
      { title: "Divine Eye Gazing & Unlocking", description: "4 full minutes of continuous, silent eye contact, followed by sweet confessions and secrets you haven't spoken yet." }
    ],
    "Wicked": [
      { title: "The 15-Minute Sweet Submission", description: "One partner remains absolutely motionless and silent, giving entire tactile control to the other to tease, trace, and cuddle completely." },
      { title: "Teasing Silk & Ice Melt", description: "Tracing sensitive contours using silk ribbons, followed by sudden, slow outlines of melting cold ice cubes across warm skin creases." }
    ]
  };

  const pool = FALLBACKS[category] || FALLBACKS["Sensual"];
  const fallback = pool[Math.floor(Math.random() * pool.length)];

  if (ai) {
    try {
      const prompt = `Create a beautiful, creative couple's intimacy voucher code suggestion.
      Vibe Level: "${category}" (can be Pampering for relaxation, Sensual for slow tactile, Intimate for deep connection, Wicked for dirty / intense romance).
      Recipient: "${receiver}" (can be for Her, for Him, or Together).
      Please respond with exactly a JSON object having the fields:
      {
        "title": "A short elegant title (3-6 words)",
        "description": "Short passionate descriptive instructions detailing how to execute it (2-3 sentences max)."
      }
      Do not include any other text or markdown codeblocks besides raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.9,
        }
      });

      if (response && response.text) {
        const enriched = JSON.parse(response.text.trim());
        if (enriched.title && enriched.description) {
          res.json({ title: enriched.title, description: enriched.description });
          return;
        }
      }
    } catch (err) {
      console.warn("AI voucher generation failed, using procedural fallback. Error:", err);
    }
  }

  res.json(fallback);
}));

// 13. Kitchen & Vegetarian Recipes Generation API
app.post("/api/kitchen/generate", asyncRoute(async (req: Request, res: Response) => {
  const { phase, includeEggs, vibe } = req.body;
  if (!phase || !vibe) {
    res.status(400).json({ error: "phase and vibe are required." });
    return;
  }

  // Pre-coded Vegetarian (and egg-optional) Fallbacks
  const FALLBACKS: Record<string, Record<string, {title: string, description: string, ingredients: string[], instructions: string[]}>> = {
    "Menstrual": {
      "eggs": {
        title: "Spiced Saffron Egg & Spinach Scaffold",
        description: "A soft, nutrient-rich golden egg scramble cooked in high-quality grass butter, loaded with wilted iron-dense baby spinach, turmeric, and micro pepper. Syncs beautifully with menstrual iron requirements.",
        ingredients: ["4 Organic Eggs", "1.5 cups fresh Baby Spinach", "1 tbsp Ghee or butter", "0.5 tsp Turmeric", "Pinch of Saffron strands", "Flaky salt & black pepper to taste"],
        instructions: [
          "Whisk eggs with saffron, turmeric, salt, and black pepper.",
          "Melt butter/ghee in a small non-stick pan over medium-low heat.",
          "Add baby spinach and cook for 1 minute until wilted.",
          "Pour in the egg mixture and cook slowly, folding gently for fluffy curds.",
          "Serve piping hot to her in bed for cozy comfort."
        ]
      },
      "no_eggs": {
        title: "Golden Ginger Vegetable Lentil Stew",
        description: "A deeply restorative and warming curried soup composed of golden red lentils, heavy ginger zests, and sweet pumpkin cubes simmered in coconut milk, folded with fresh baby spinach.",
        ingredients: ["1 cup Red Lentils (washed)", "1.5 cups fresh Spinach", "1.5 tbsp fresh Ginger (grated)", "1 tsp Turmeric powder", "1 cup Coconut Milk", "1 cup Vegetable broth", "Lemon juice"],
        instructions: [
          "In a deep pot, combine washed lentils, vegetable broth, and coconut milk.",
          "Stir in freshly grated ginger and turmeric powder, simmer for 15 minutes.",
          "Add pumpkin cubes or sweet potato and simmer until soft.",
          "Turn off heat, stir in baby spinach until wilted, and finish with a squeeze of fresh lemon."
        ]
      }
    },
    "Follicular": {
      "eggs": {
        title: "Avocado Toast with Soft Poached Eggs",
        description: "Fresh, playful, and zesty. Creamy avocado mash loaded with lemon zest and black sesame, stacked high on toasted sourdough and finished with two gorgeous soft poached eggs.",
        ingredients: ["2 thick slices of Sourdough bread", "1 ripe Avocado", "2 Organic Eggs", "1 lemon (zested & juiced)", "1 tsp Black Sesame seeds", "1 tsp Chili flakes"],
        instructions: [
          "Toast sourdough until golden and crisp.",
          "Mash avocado with lemon juice, salt, pepper, and chili flakes.",
          "Bring water to a light simmer in a pan and gently poach the eggs for 3 minutes.",
          "Spread the avocado mash over toast, top with poached eggs, and garnish with lemon zest and black sesame."
        ]
      },
      "no_eggs": {
        title: "Sprouted Mung Salad with Avocado & Curd",
        description: "Lively and crunchy. Sprouted mung beans, diced cucumber, tomatoes, and pumpkin seeds tossed in a light olive oil dressing, accompanied by a serving of fresh curd.",
        ingredients: ["1.5 cups Sprouted Mung beans", "1 Avocado (cubed)", "0.5 cup Cucumber (diced)", "0.25 cup Pumpkin seeds", "1 cup fresh Curd / Yogurt", "Olive oil & lemon zest"],
        instructions: [
          "Toast pumpkin seeds in a dry pan for 2 minutes until fragrant.",
          "In a bowl, toss sprouted mung beans, avocado, cucumber, and toasted pumpkin seeds.",
          "Drizzle with clean cold olive oil and fresh lemon juice.",
          "Serve cool alongside fresh creamy curd to assist estrogen pathway building."
        ]
      }
    },
    "Ovulatory": {
      "eggs": {
        title: "Steamed Asparagus & Egg Frittata",
        description: "Vibrant and celebratory. A light fluffy egg frittata studded with crisp asparagus tips, fresh dill, and crumbling paneer cheese. Perfect peak energy booster.",
        ingredients: ["4 Organic Eggs", "6 Asparagus tips (trimmed)", "50g Paneer (crumbled)", "1 tbsp fresh Dill (chopped)", "1 tbsp Butter", "Black pepper"],
        instructions: [
          "Chop asparagus into 1-inch pieces.",
          "Whisk eggs with salt, pepper, and half the dill.",
          "Sauté asparagus in butter in a broiler-safe skillet for 3 minutes.",
          "Pour in eggs, scatter paneer on top, and cook until edges set.",
          "Briefly broil or cover with lid until golden and puffed. Garnish with remaining dill."
        ]
      },
      "no_eggs": {
        title: "Celebration Quinoa & Strawberry Walnut Bowl",
        description: "Nutritious and high-energy. Fluffy quinoa tossed with fresh sweet strawberries, dynamic walnuts, chopped mint, and a touch of organic honey drizzle.",
        ingredients: ["1 cup cooked Quinoa", "0.5 cup fresh Strawberries (sliced)", "0.25 cup walnuts (toasted)", "2 tbsp fresh Mint (chopped)", "1 tbsp Raw Honey", "Pinch of salt"],
        instructions: [
          "In a mixing bowl, combine fluffy cooked quinoa with fresh sliced strawberries and chopped mint.",
          "Gently fold in toasted walnut pieces.",
          "Drizzle organic raw honey on top, toss lightly, and share under soft acoustic music."
        ]
      }
    },
    "Luteal": {
      "eggs": {
        title: "Baked Sweet Potato & Egg Nest Hash",
        description: "Warming and deeply comforting. Roasted sweet potato slices with warm cinnamon, where we create small nests to bake organic eggs with melting vegetarian cheddar.",
        ingredients: ["2 Sweet Potatoes (cubed)", "3 Organic Eggs", "0.25 cup Cheddar cheese (grated)", "0.5 tsp Cinnamon", "1 tbsp Olive oil", "Fresh chives"],
        instructions: [
          "Preheat oven to 400°F (200°C).",
          "Toss sweet potato cubes in olive oil, cinnamon, salt, and bake for 20 minutes.",
          "Separate roasted potatoes into three little nests on the baking sheet.",
          "Crack an egg into each nest, sprinkle cheddar, and return to oven for 8 minutes.",
          "Top with scissor-cut fresh chives. Comfort bliss."
        ]
      },
      "no_eggs": {
        title: "Spiced Butternut Squash & Chickpea Stew",
        description: "Warm nesting comfort. Creamy roasted butternut squash pureed with warm vegetable broth, cinnamon, and nutmeg, holding whole protein-dense chickpeas.",
        ingredients: ["2 cups Butternut squash (cubed)", "1 can Chickpeas (drained)", "1 tsp Ground Cinnamon", "0.25 tsp Nutmeg", "1.5 cups Vegetable broth", "Olive oil"],
        instructions: [
          "Roast butternut squash cubes with olive oil until fully tender and golden.",
          "Blend the roasted squash with warm vegetable broth, cinnamon, and nutmeg until silky.",
          "Pour back into a pot, stir in whole drained chickpeas, and heat through.",
          "Serve in warm bowls alongside toasted pumpkin seed scatter."
        ]
      }
    }
  };

  const currentPhaseDict = FALLBACKS[phase] || FALLBACKS["Luteal"];
  const eggKey = includeEggs ? "eggs" : "no_eggs";
  const fallback = currentPhaseDict[eggKey] || FALLBACKS["Luteal"]["no_eggs"];

  if (ai) {
    try {
      const prompt = `You are a romantic culinary master chef specializing in gourmet lacto-ovo vegetarian cuisine. 
      Generate a luxurious chef-inspired recipe for two loving partners who are pure vegetarians (but can eat eggs).
      The recipe must align with the following health & mood settings:
      - Cycle Sync Phase: "${phase}" (Menstrual, Follicular, Ovulatory, Luteal or General)
      - Include Eggs?: ${includeEggs} (If true, you must incorporate organic eggs. If false, it must be 100% vegetarian without any egg element, using premium cheese like Paneer, legumes, or seeds).
      - Target Meal Vibe: "${vibe}" (e.g. Candlelit Dinner, Breakfast in Bed, etc.)
      
      Requirements:
      - The recipe must feel luxurious, intimate, and romantic.
      - Incorporate rich traditional ingredients like paneer, cardamom, saffron, fresh herbs, avocados, or sweet potato depending on the phase.
      
      Please respond with exactly a JSON object having the fields:
      {
        "title": "A gourmet creative title (e.g. 'Sacred Saffron Paneer Galette')",
        "description": "A 2-sentence description detailing why this meal is sexually/biochemically aligned and romantic for their ${phase} phase & ${vibe} theme.",
        "ingredients": ["string of ingredient with amount 1", "amount 2..."],
        "instructions": ["Step 1...", "Step 2..."]
      }
      Do not include any extra text or code blocks. Return raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.85,
        }
      });

      if (response && response.text) {
        const enriched = JSON.parse(response.text.trim());
        if (enriched.title && enriched.ingredients && enriched.instructions) {
          res.json({
            title: enriched.title,
            description: enriched.description || "A gorgeous dish prepared with love.",
            ingredients: enriched.ingredients,
            instructions: enriched.instructions
          });
          return;
        }
      }
    } catch (err) {
      console.warn("AI recipe generation failed, yielding high-quality pre-coded pure-veg fallback. Error:", err);
    }
  }

  // Fallback
  res.json(fallback);
}));

// 13b. Generate Kitchen Recipe via Gemini
app.post("/api/kitchen/generate", asyncRoute(async (req: Request, res: Response) => {
  const { phase, includeEggs, vibe } = req.body;
  if (!ai) {
    res.status(500).json({ error: "AI not configured for generation." });
    return;
  }
  
  const prompt = `You are a world-class gourmet chef specializing in hormonal alignment cuisine.
The user is a pure vegetarian. ${includeEggs ? "They DO eat eggs." : "They DO NOT eat eggs (strict lacto-vegetarian)."}
Create a deeply satisfying, incredibly delicious recipe that perfectly aligns with the ${phase} menstrual phase.
The culinary vibe should be: ${vibe || "Gourmet, comforting, and nutrient-dense"}.
Give a unique recipe found from world cuisine or top-tier web recipes (do not just give the same basic option, be highly creative).
Return the result strictly as a JSON object matching this TypeScript interface exactly, with NO markdown formatting, NO \`\`\`json wrappers, just the raw JSON object:
{
  "title": "string",
  "description": "string (1-2 sentences of why it fits the vibe and phase)",
  "ingredients": ["string", "string"],
  "instructions": ["string", "string"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    
    const text = response.text || "";
    const jsonStr = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    const recipe = JSON.parse(jsonStr);
    res.json(recipe);
  } catch (err) {
    console.error("Failed to parse AI kitchen output:", err);
    res.status(500).json({ error: "Failed to generate AI recipe." });
  }
}));

// 14. Save Selected Recipe to Ledger
app.post("/api/kitchen/save", asyncRoute(async (req: Request, res: Response) => {
  const { title, description, ingredients, instructions, phase, hasEggs, notes } = req.body;
  if (!title || !ingredients || !instructions) {
    res.status(400).json({ error: "Missing required recipe fields." });
    return;
  }

  const newDish = await withSanctuaryTransaction((db, setDb) => {
    const dish = {
      id: `dish_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      description,
      ingredients,
      instructions,
      phase,
      hasEggs,
      notes: notes || "",
      rating: 5, // Default maximum love rating
      timestamp: new Date().toISOString()
    };

    const kitchenDishes = [dish, ...(db.kitchenDishes || [])];
    setDb({ kitchenDishes });
    return dish;
  });

  res.json(newDish);
}));

// 15. Delete Recipe from Ledger
app.delete("/api/kitchen/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ kitchenDishes: (db.kitchenDishes || []).filter(d => d.id !== id) });
  });
  res.json({ success: true, message: "Dish removed successfully" });
}));

// 16. Update Cooking Memory Notes
app.post("/api/kitchen/notes/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const result = await withSanctuaryTransaction((db, setDb) => {
    const dishes = [...(db.kitchenDishes || [])];
    const index = dishes.findIndex(d => d.id === id);
    if (index === -1) return null;
    dishes[index] = { ...dishes[index], notes };
    setDb({ kitchenDishes: dishes });
    return dishes[index];
  });
  if (!result) {
    res.status(404).json({ error: "Dish not found" });
    return;
  }
  res.json(result);
}));

// 17. Update Cooking Memory Love Rating (Hearts)
app.post("/api/kitchen/rating/:id", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating } = req.body;
  const result = await withSanctuaryTransaction((db, setDb) => {
    const dishes = [...(db.kitchenDishes || [])];
    const index = dishes.findIndex(d => d.id === id);
    if (index === -1) return null;
    dishes[index] = { ...dishes[index], rating: Number(rating) };
    setDb({ kitchenDishes: dishes });
    return dishes[index];
  });
  if (!result) {
    res.status(404).json({ error: "Dish not found" });
    return;
  }
  res.json(result);
}));

// --- Connection Hub Features ---

app.post("/api/notify", asyncRoute(async (req: Request, res: Response) => {
  const { feature, subject, message, who } = req.body;
  const db = await readDB();
  const config = db.adminSettings.notificationConfig;
  
  if (!config) {
    res.status(400).json({ error: "Notifications not configured." });
    return;
  }

  // Check if this feature is enabled for notifications
  let shouldSend = false;
  if (feature === "heartbeat" && config.heartbeat) shouldSend = true;
  if (feature === "carePackages" && config.carePackages) shouldSend = true;
  if (feature === "timeCapsules" && config.timeCapsules) shouldSend = true;
  if (feature === "dailyPrompts" && config.dailyPrompts) shouldSend = true;
  if (feature === "test") shouldSend = true; // allow manual test

  if (!shouldSend) {
    res.json({ success: true, message: "Notification disabled in settings." });
    return;
  }

  try {
    const htmlBody = `<div style="font-family: sans-serif; padding: 20px; color: #333;"><h3>Our Sanctuary Alert</h3><p>${message}</p></div>`;
    await sendReminderEmail(who || "Both", subject, htmlBody, true);
    res.json({ success: true, message: "Notification sent." });
  } catch (err) {
    console.error("[notify] Error sending via Resend:", err);
    res.status(500).json({ error: "Failed to send notification." });
  }
}));

// State sync for Memory Map
app.post("/api/hub/memoryPins", asyncRoute(async (req: Request, res: Response) => {
  const pin = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ memoryPins: [...(db.memoryPins || []), pin] });
  });
  res.json({ success: true });
}));
app.delete("/api/hub/memoryPins/:id", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ memoryPins: (db.memoryPins || []).filter(p => p.id !== req.params.id) });
  });
  res.json({ success: true });
}));

// Care Packages
app.post("/api/hub/carePackages", asyncRoute(async (req: Request, res: Response) => {
  const pkg = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ carePackages: [...(db.carePackages || []), pkg] });
  });
  res.json({ success: true });
}));
app.post("/api/hub/carePackages/:id/unlock", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    const pkgs = [...(db.carePackages || [])];
    const idx = pkgs.findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      pkgs[idx] = { ...pkgs[idx], unlocked: true };
      setDb({ carePackages: pkgs });
    }
  });
  res.json({ success: true });
}));

// Bucket List
app.post("/api/hub/bucketList", asyncRoute(async (req: Request, res: Response) => {
  const item = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ bucketListItems: [...(db.bucketListItems || []), item] });
  });
  res.json({ success: true });
}));
app.post("/api/hub/bucketList/:id/toggle", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    const items = [...(db.bucketListItems || [])];
    const idx = items.findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], completed: !items[idx].completed, completedAt: new Date().toISOString() };
      setDb({ bucketListItems: items });
    }
  });
  res.json({ success: true });
}));

// Time Capsules
app.post("/api/hub/timeCapsules", asyncRoute(async (req: Request, res: Response) => {
  const cap = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ timeCapsules: [...(db.timeCapsules || []), cap] });
  });
  res.json({ success: true });
}));

// Countdowns
app.post("/api/hub/countdowns", asyncRoute(async (req: Request, res: Response) => {
  const event = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ countdowns: [...(db.countdowns || []), event] });
  });
  res.json({ success: true });
}));
app.delete("/api/hub/countdowns/:id", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ countdowns: (db.countdowns || []).filter(c => c.id !== req.params.id) });
  });
  res.json({ success: true });
}));

// Daily Prompts
app.post("/api/hub/dailyPrompts", asyncRoute(async (req: Request, res: Response) => {
  const prompt = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ dailyPrompts: [...(db.dailyPrompts || []), prompt] });
  });
  res.json({ success: true });
}));
app.post("/api/hub/dailyPrompts/:id/answer", asyncRoute(async (req: Request, res: Response) => {
  const { partner, answer } = req.body; // partner is "Him" or "Her"
  await withSanctuaryTransaction((db, setDb) => {
    const prompts = [...(db.dailyPrompts || [])];
    const idx = prompts.findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      if (partner === "Him") prompts[idx].hisAnswer = answer;
      if (partner === "Her") prompts[idx].herAnswer = answer;
      setDb({ dailyPrompts: prompts });
    }
  });
  res.json({ success: true });
}));

// Canvas Strokes (Batch save)
app.post("/api/hub/canvas", asyncRoute(async (req: Request, res: Response) => {
  const strokes = req.body.strokes;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ canvasStrokes: strokes });
  });
  res.json({ success: true });
}));

// --- 10 Intimate Features Endpoints ---

app.post("/api/features/temperature", asyncRoute(async (req: Request, res: Response) => {
  const { temperature } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ wifeTemperature: temperature });
  });
  res.json({ success: true });
}));

app.post("/api/features/vault/key", asyncRoute(async (req: Request, res: Response) => {
  const { role, isLocked } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    if (role === "Him") setDb({ desireVaultHisKey: !isLocked });
    if (role === "Her") setDb({ desireVaultHerKey: !isLocked });
    
    // Check if both are unlocked
    if ((role === "Him" && !isLocked && db.desireVaultHerKey) || 
        (role === "Her" && !isLocked && db.desireVaultHisKey)) {
      setDb({ desireVaultUnlocked: true });
    } else {
      setDb({ desireVaultUnlocked: false });
    }
  });
  res.json({ success: true });
}));

app.post("/api/features/vault/secret", asyncRoute(async (req: Request, res: Response) => {
  const { role, secret } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    if (role === "Him") setDb({ desireVaultHisSecret: secret });
    if (role === "Her") setDb({ desireVaultHerSecret: secret });
  });
  res.json({ success: true });
}));

app.post("/api/features/touchmap", asyncRoute(async (req: Request, res: Response) => {
  const { spot } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const spots = db.touchMapSpots || [];
    setDb({ touchMapSpots: [...spots, spot] });
  });
  res.json({ success: true });
}));

app.post("/api/features/touchmap/clear", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ touchMapSpots: [] });
  });
  res.json({ success: true });
}));

app.post("/api/features/teasetimer", asyncRoute(async (req: Request, res: Response) => {
  const { timer } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const timers = db.teaseTimers || [];
    setDb({ teaseTimers: [...timers.filter(t => t.targetRole !== timer.targetRole), timer] });
  });
  res.json({ success: true });
}));

app.post("/api/features/whispers", asyncRoute(async (req: Request, res: Response) => {
  const { whisper } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const whispers = db.whispers || [];
    setDb({ whispers: [...whispers, whisper] });
  });
  res.json({ success: true });
}));

app.post("/api/features/whispers/delete", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const whispers = db.whispers || [];
    setDb({ whispers: whispers.filter(w => w.id !== id) });
  });
  res.json({ success: true });
}));

app.post("/api/features/scavenger", asyncRoute(async (req: Request, res: Response) => {
  const { clue } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const clues = db.scavengerClues || [];
    setDb({ scavengerClues: [...clues, clue] });
  });
  res.json({ success: true });
}));

app.post("/api/features/scavenger/delete", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const clues = db.scavengerClues || [];
    setDb({ scavengerClues: clues.filter(c => c.id !== id) });
  });
  res.json({ success: true });
}));

app.post("/api/features/scavenger/solve", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const clues = db.scavengerClues || [];
    setDb({
      scavengerClues: clues.map(c => c.id === id ? { ...c, isSolved: true } : c)
    });
  });
  res.json({ success: true });
}));

app.post("/api/features/scavenger/reset", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ scavengerClues: [] });
  });
  res.json({ success: true });
}));

app.post("/api/features/afterglow", asyncRoute(async (req: Request, res: Response) => {
  const { entry } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const logs = db.afterglowLogs || [];
    setDb({ afterglowLogs: [...logs, entry] });
  });
  res.json({ success: true });
}));

app.post("/api/features/blindfold", asyncRoute(async (req: Request, res: Response) => {
  const { command } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const cmds = db.blindfoldCommands || [];
    setDb({ blindfoldCommands: [...cmds, command] });
  });
  res.json({ success: true });
}));

app.post("/api/features/blindfold/next", asyncRoute(async (req: Request, res: Response) => {
  const { id } = req.body;
  await withSanctuaryTransaction((db, setDb) => {
    const cmds = db.blindfoldCommands || [];
    setDb({
      blindfoldCommands: cmds.map(c => c.id === id ? { ...c, isSpoken: true } : c)
    });
  });
  res.json({ success: true });
}));

app.post("/api/features/blindfold/reset", asyncRoute(async (req: Request, res: Response) => {
  await withSanctuaryTransaction((db, setDb) => {
    setDb({ blindfoldCommands: [] });
  });
  res.json({ success: true });
}));
// Vite Dev Server / Production routing
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware added in Dev environment.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on: http://0.0.0.0:${PORT}`);
  });
}

initServer().catch(err => {
  console.error("Failure while launching Express + Vite server:", err);
});
