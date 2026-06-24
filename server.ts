import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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
  CycleTrackerDB
} from "./src/types";
import { 
  generateProceduralWicked, 
  generateProceduralPhotoPrompt 
} from "./server/generators";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Enable JSON bodies with higher limits for base64 photo uploads
app.use(express.json({ limit: "25mb" }));

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

// Ensure database directory exists
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "sanctuary_db.json");
const CYCLE_DB_FILE = path.join(DB_DIR, "cycle_tracker_db.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Default Cycle Tracker Database seeding config
const DEFAULT_CYCLE_DB: CycleTrackerDB = {
  periodConfig: {
    lastPeriodDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    cycleLength: 28,
    periodLength: 5,
    pregnancyMode: false,
    pregnancyStartDate: ""
  },
  cycleLogs: []
};

// Database Migration Helper
function migrateCycleData() {
  const mainDbExists = fs.existsSync(DB_FILE);
  const cycleDbExists = fs.existsSync(CYCLE_DB_FILE);

  if (!cycleDbExists) {
    let migratedConfig = DEFAULT_CYCLE_DB.periodConfig;
    let migratedLogs = DEFAULT_CYCLE_DB.cycleLogs;

    if (mainDbExists) {
      try {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        const mainData = JSON.parse(content);
        let updated = false;

        if (mainData.periodConfig) {
          migratedConfig = {
            ...DEFAULT_CYCLE_DB.periodConfig,
            ...mainData.periodConfig
          };
          delete mainData.periodConfig;
          updated = true;
        }
        if (mainData.cycleLogs) {
          migratedLogs = mainData.cycleLogs;
          delete mainData.cycleLogs;
          updated = true;
        }

        if (updated) {
          fs.writeFileSync(DB_FILE, JSON.stringify(mainData, null, 2), "utf-8");
          console.log("Successfully migrated cycle data out of sanctuary_db.json");
        }
      } catch (err: any) {
        console.error("Failed to parse or clean main db during migration:", err);
      }
    }

    const cycleDbData: CycleTrackerDB = {
      periodConfig: migratedConfig,
      cycleLogs: migratedLogs
    };
    try {
      fs.writeFileSync(CYCLE_DB_FILE, JSON.stringify(cycleDbData, null, 2), "utf-8");
      console.log("Successfully created cycle_tracker_db.json with migrated data");
    } catch (err: any) {
      console.error("Failed to write migrated cycle tracker db:", err);
    }
  } else {
    if (mainDbExists) {
      try {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        const mainData = JSON.parse(content);
        let updated = false;
        if (mainData.periodConfig) {
          delete mainData.periodConfig;
          updated = true;
        }
        if (mainData.cycleLogs) {
          delete mainData.cycleLogs;
          updated = true;
        }
        if (updated) {
          fs.writeFileSync(DB_FILE, JSON.stringify(mainData, null, 2), "utf-8");
          console.log("Cleaned leftover cycle fields from sanctuary_db.json");
        }
      } catch (err) {
        // ignore
      }
    }
  }
}

migrateCycleData();

// Seeding Default Database
const DEFAULT_GIFTS: SensoryGift[] = [
  {
    id: "gift_1",
    title: "Sensual Warm Oil Massage",
    description: "A 30-minute full body massage. Lights fully dimmed, sensual ambient music playing, and absolute focus on slow, comforting, or ticklesome touches.",
    category: "Sensual",
    receiver: "Her",
    status: "Available"
  },
  {
    id: "gift_2",
    title: "Sensory Silk & Ice Challenge",
    description: "One partner lays down, blindfolded. The other traces their body with silk feathers, followed by sudden, teasing dragging of a cold ice cube across warm skin creases.",
    category: "Wicked",
    receiver: "Together",
    status: "Available"
  },
  {
    id: "gift_3",
    title: "Candlelit Bath & Champagne",
    description: "A warm bubble bath prepared with rose petals, custom bath salts, candlelight, soft instrumental music, and two cold glasses of bubbly to feed each other.",
    category: "Intimate",
    receiver: "Her",
    status: "Available"
  },
  {
    id: "gift_4",
    title: "Breakfast in Bed with Gourmet Whispers",
    description: "Gourmet freshly-made waffles or croissants with strawberries and whipped cream eaten direct on-body, accompanied by whispering three secret fantasies details in each other's ears.",
    category: "Pampering",
    receiver: "Him",
    status: "Available"
  },
  {
    id: "gift_5",
    title: "The Silent Submission Command",
    description: "A playful command game. One partner must remain fully motionless and silent for 15 minutes, allowing the other to pamper, kiss, trace, and tease them entirely to their liking.",
    category: "Wicked",
    receiver: "Him",
    status: "Available"
  }
];

const DEFAULT_DB: SanctuaryDB = {
  gifts: DEFAULT_GIFTS,
  cycleLogs: [],
  periodConfig: {
    lastPeriodDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Seed: started 12 days ago (ovulation zone)
    cycleLength: 28,
    periodLength: 5
  },
  wickedChallengesHistory: [],
  vaultPhotos: [],
  adminSettings: {
    vibeIntensity: "Medium",
    wickedActions: [],
    wickedBodyParts: [],
    photoThemes: [],
    photoSetups: [],
    periodRemindersEnabled: true,
    theme: "Passionate Red"
  },
  importantDates: [
    {
      id: "date_1",
      title: "Our Sacred Union Anniversary",
      date: `${new Date().getFullYear()}-10-24`,
      category: "Anniversary",
      description: "Celebrating the beautiful day we became one Sanctuary.",
      reminderDaysAhead: 7
    },
    {
      id: "date_2",
      title: "My Wife's Divine Birthday",
      date: `${new Date().getFullYear()}-05-18`,
      category: "Birthday",
      description: "Celebrating my queen's special day. Pampering is non-negotiable.",
      reminderDaysAhead: 3
    }
  ],
  giftPurchases: [
    {
      id: "purchase_1",
      title: "Obsidian Sheer Lace Bodysuit",
      description: "A luxury dark lace bodysuit purchased to celebrate her silhouette. Incredible soft tactile feel.",
      category: "Lingerie",
      buyer: "Him",
      price: "$89.00",
      photoUrl: "", // blank, to trigger fallback layout beautifully
      timestamp: new Date().toISOString()
    }
  ],
  kitchenDishes: [
    {
      id: "dish_1",
      title: "Sacred Golden Saffron Egg Frittata",
      description: "A fluffy, beautiful organic egg frittata baked with fresh baby spinach, crumbled paneer cheese, a pinch of aromatic saffron strands, and cherry tomatoes. Served warm with clean toasted sourdough.",
      ingredients: ["4 Organic Eggs", "100g Paneer Cheese", "1 cup Baby Spinach", "6 Cherry Tomatoes", "Pinch of Saffron Strands", "1 tbsp Olive Oil", "Salt & fresh Black Pepper"],
      instructions: [
        "Preheat your small skillet with olive oil over medium-low heat.",
        "Whisk the organic eggs with saffron strands, salt, and pepper.",
        "Add spinach and halved cherry tomatoes to the skillet until slightly wilted.",
        "Pour over the egg mixture and scatter crumbled paneer on top.",
        "Cook slowly under a lid until fluffy and set, about 6-8 minutes. Worship and share in bed!"
      ],
      phase: "Luteal",
      notes: "Incredibly warming and rich. Melted her period anxiety right away!",
      rating: 5,
      hasEggs: true,
      timestamp: new Date().toISOString()
    },
    {
      id: "dish_2",
      title: "Iron-Rich Curried Lentil & Spinach Stew",
      description: "Cozy red lentils slowly simmered in ground turmeric, grated ginger, and rich coconut milk, topped with a generous fold of iron-dense spinach. Finished with a drizzle of lime juice.",
      ingredients: ["1 cup Red Lentils (washed)", "2 cups fresh Spinach", "1 tbsp fresh Ginger (grated)", "1 tsp Turmeric Powder", "1 can light Coconut Milk", "1 lime", "Fresh cilantro"],
      instructions: [
        "In a saucepan, bring washed red lentils and coconut milk/water mixture to a simmer.",
        "Stir in turmeric powder and freshly grated ginger, keeping heat light.",
        "Simmer for 15-20 minutes until lentils are soft and buttery.",
        "Turn off the heat and fold in fresh baby spinach leaves until wilted.",
        "Drizzle with lemon/lime juice and top with fresh chopped cilantro. Perfect restorative menstrual day bowl!"
      ],
      phase: "Menstrual",
      notes: "Provides vital non-heme iron and anti-inflammatory ginger.",
      rating: 5,
      hasEggs: false,
      timestamp: new Date().toISOString()
    }
  ]
};

// Database I/O Helpers
function readDB(): SanctuaryDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(content);
      // Ensure new database fields are initialized
      if (!data.importantDates) {
        data.importantDates = [];
      }
      if (!data.giftPurchases) {
        data.giftPurchases = [];
      }
      if (!data.kitchenDishes) {
        data.kitchenDishes = [];
      }
      return data;
    }
  } catch (err) {
    console.error("Error reading database file, returning defaults. Error:", err);
  }
  // Write default db on creation
  writeDB(DEFAULT_DB);
  return DEFAULT_DB;
}

function writeDB(data: SanctuaryDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

function readCycleDB(): CycleTrackerDB {
  try {
    if (fs.existsSync(CYCLE_DB_FILE)) {
      const content = fs.readFileSync(CYCLE_DB_FILE, "utf-8");
      const data = JSON.parse(content);
      if (!data.periodConfig) {
        data.periodConfig = DEFAULT_CYCLE_DB.periodConfig;
      }
      if (!data.cycleLogs) {
        data.cycleLogs = [];
      }
      return data;
    }
  } catch (err) {
    console.error("Error reading cycle database file, returning defaults. Error:", err);
  }
  writeCycleDB(DEFAULT_CYCLE_DB);
  return DEFAULT_CYCLE_DB;
}

function writeCycleDB(data: CycleTrackerDB) {
  try {
    fs.writeFileSync(CYCLE_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to cycle database file:", err);
  }
}

// API Routes
// 1. Full Database Health & Pull
app.get("/api/database", (req: Request, res: Response) => {
  const db = readDB();
  const cycleDb = readCycleDB();
  res.json({
    ...db,
    periodConfig: cycleDb.periodConfig,
    cycleLogs: cycleDb.cycleLogs
  });
});

// 2. Sensory Gifts Endpoints
app.post("/api/gifts", (req: Request, res: Response) => {
  const { title, description, category, receiver } = req.body;
  if (!title || !description || !category || !receiver) {
     res.status(400).json({ error: "Missing required fields" });
     return;
  }
  const db = readDB();
  const newGift: SensoryGift = {
    id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title,
    description,
    category,
    receiver,
    status: "Available",
    custom: true
  };
  db.gifts.push(newGift);
  writeDB(db);
  res.json(newGift);
});

app.post("/api/gifts/:id/claim", (req: Request, res: Response) => {
  const { id } = req.params;
  const { claimedBy } = req.body; // "Him" | "Her"
  if (!claimedBy) {
     res.status(400).json({ error: "claimedBy is required" });
     return;
  }
  const db = readDB();
  const giftIndex = db.gifts.findIndex(g => g.id === id);
  if (giftIndex === -1) {
     res.status(404).json({ error: "Gift not found" });
     return;
  }
  db.gifts[giftIndex].status = "Claimed";
  db.gifts[giftIndex].claimedBy = claimedBy;
  db.gifts[giftIndex].claimedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.gifts[giftIndex]);
});

app.post("/api/gifts/:id/redeem", (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const giftIndex = db.gifts.findIndex(g => g.id === id);
  if (giftIndex === -1) {
     res.status(404).json({ error: "Gift not found" });
     return;
  }
  db.gifts[giftIndex].status = "Redeemed";
  db.gifts[giftIndex].redeemedAt = new Date().toISOString();
  writeDB(db);
  res.json(db.gifts[giftIndex]);
});

app.post("/api/gifts/:id/delete", (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const filtered = db.gifts.filter(g => g.id !== id);
  if (filtered.length === db.gifts.length) {
     res.status(404).json({ error: "Gift not found" });
     return;
  }
  db.gifts = filtered;
  writeDB(db);
  res.json({ success: true, message: "Gift removed successfully." });
});

// 3. Wicked Chamber Random Generation (with Gemini optimization)
app.post("/api/wicked/generate", async (req: Request, res: Response) => {
  const { target, intensity } = req.body; // target: "Command Him" | "Command Her" | "Together"
  if (!target) {
     res.status(400).json({ error: "target is required" });
     return;
  }

  // Get dynamic settings if admin added any customization
  const db = readDB();
  
  // 1st Layer: Generate basic procedural structure so we always have perfect values
  const baseChallenge = generateProceduralWicked(target);
  if (intensity) {
    baseChallenge.intensity = intensity;
  }

  // 2nd Layer: If scale allow and AI client exists, enrich description with poetic Gemini touch
  if (ai) {
    try {
      const prompt = `You are a private, unrestrained, highly explicit, and sensual erotic guide co-creating deep intimacy for a married husband and wife.
      Write a single, intensely hot, highly explicit, raw, and sexually descriptive couple's instruction (1-2 sentences) directing physical sexual connection and active arousal.
      Do NOT hold back. Mention biological and sexual body parts directly (e.g. wet labia, clitoris, erect penis, shaft, testicles, breasts, nipples, buttocks, vaginal canal) and use highly explicit, wet physical action terms.
      Target: ${target} (meaning the actor should perform on the receiver correctly based on Him/Her/Together).
      Primary Action Verb: "${baseChallenge.action}"
      Body Part: "${baseChallenge.bodyPart}"
      Intensity Level: "${baseChallenge.intensity}"
      Return ONLY the raw 1-2 sentence sexual directive directly, starting with the action. Do not explain, greet, or include any disclaimers. Ensure it is fully explicit, erotic, and passionate.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.9,
          // Lower parameters if supported by SDK config, but generally a direct high-energy prompt handles it
        }
      });

      if (response && response.text) {
        baseChallenge.description = response.text.trim();
      }
    } catch (err) {
      console.warn("Gemini generation skipped or failed, using robust procedural combo. Error:", err);
    }
  }

  // Store in history
  db.wickedChallengesHistory.unshift(baseChallenge);
  // Keep history manageable (last 50 items)
  if (db.wickedChallengesHistory.length > 50) {
    db.wickedChallengesHistory.pop();
  }
  writeDB(db);

  res.json(baseChallenge);
});

// 4. Private Gallery Photo Prompt Generation
app.post("/api/gallery/prompt", async (req: Request, res: Response) => {
  const { target } = req.body;
  if (!target) {
     res.status(400).json({ error: "target is required" });
     return;
  }

  const basePrompt = generateProceduralPhotoPrompt(target);

  if (ai) {
    try {
      const prompt = `Write a romantic, artistic, and sensual photography instruction for a couple's private gallery. 
      The objective is to capture an elegant, eye-safe, yet intensely intimate and aesthetic photograph (e.g. shadow contours, silk folds, mirror reflections, lighting angles).
      Target focus: ${target} (${target === "Command Him" ? "Taking of his form" : target === "Command Her" ? "Taking of her form" : "Both of them intertwined"}).
      Theme Concept: "${basePrompt.theme}"
      Aesthetic Direction: "${basePrompt.setup}"
      Return a response with a JSON object holding exactly these fields (do not wrap in markdown block other than raw format):
      {
        "theme": "${basePrompt.theme}",
        "setup": "detailed 1-sentence pose configuration",
        "angle": "camera perspective & lighting direction suggestion",
        "aestheticTip": "1-sentence tip on shading, black & white, or focus"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      });

      if (response && response.text) {
        const enriched = JSON.parse(response.text.trim());
        basePrompt.theme = enriched.theme || basePrompt.theme;
        basePrompt.setup = enriched.setup || basePrompt.setup;
        basePrompt.angle = enriched.angle || basePrompt.angle;
        basePrompt.aestheticTip = enriched.aestheticTip || basePrompt.aestheticTip;
        
        let objectNoun = "their form";
        if (target === "Command Him") objectNoun = "his structure";
        else if (target === "Command Her") objectNoun = "her curves";
        else objectNoun = "both of your tangled bodies";
        
        basePrompt.description = `Theme: ${basePrompt.theme}. Setup: ${basePrompt.setup}. Angle & Light: ${basePrompt.angle}.`;
      }
    } catch (err) {
      console.warn("Gemini photo prompt enrichment failed, falling back to procedural description. Error:", err);
    }
  }

  res.json(basePrompt);
});

// 5. Private Gallery Upload & AI Captioning
app.post("/api/gallery/upload", async (req: Request, res: Response) => {
  const { imageUrl, promptText, target } = req.body;
  if (!imageUrl || !promptText || !target) {
     res.status(400).json({ error: "imageUrl, promptText and target are required." });
     return;
  }

  const db = readDB();
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

  db.vaultPhotos.unshift(newPhoto);
  writeDB(db);

  res.json(newPhoto);
});

app.post("/api/gallery/delete/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  db.vaultPhotos = db.vaultPhotos.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// 6. Period Tracker Configuration
app.post("/api/period/config", (req: Request, res: Response) => {
  const { lastPeriodDate, cycleLength, periodLength, pregnancyMode, pregnancyStartDate } = req.body;
  if (!lastPeriodDate || !cycleLength || !periodLength) {
     res.status(400).json({ error: "Missing config variables" });
     return;
  }
  const cycleDb = readCycleDB();
  cycleDb.periodConfig = {
    lastPeriodDate,
    cycleLength: parseInt(cycleLength),
    periodLength: parseInt(periodLength),
    pregnancyMode: !!pregnancyMode,
    pregnancyStartDate: pregnancyStartDate || ""
  };
  writeCycleDB(cycleDb);
  res.json(cycleDb.periodConfig);
});

// 7. Add Period Daily Symtoms Log
app.post("/api/period/log", (req: Request, res: Response) => {
  const { date, symptoms, moods, intimacyLevel, notes, flow, temperature, weight, waterIntake, sleepDuration, sex } = req.body;
  if (!date || !symptoms || !moods || !intimacyLevel) {
     res.status(400).json({ error: "Missing required daily credentials" });
     return;
  }
  const cycleDb = readCycleDB();
  
  // check if log for same date already exists, overwrite if yes
  const existingIndex = cycleDb.cycleLogs.findIndex(l => l.date === date);
  const logItem: CycleLog = {
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

  if (existingIndex !== -1) {
    cycleDb.cycleLogs[existingIndex] = logItem;
  } else {
    cycleDb.cycleLogs.unshift(logItem);
  }

  writeCycleDB(cycleDb);
  res.json(logItem);
});

// 8. Admin Settings Update
app.post("/api/admin/settings", (req: Request, res: Response) => {
  const { vibeIntensity, periodRemindersEnabled, wickedActions, wickedBodyParts, photoThemes, photoSetups, theme } = req.body;
  const db = readDB();
  
  db.adminSettings = {
    vibeIntensity: vibeIntensity || db.adminSettings.vibeIntensity,
    periodRemindersEnabled: periodRemindersEnabled !== undefined ? periodRemindersEnabled : db.adminSettings.periodRemindersEnabled,
    wickedActions: wickedActions || db.adminSettings.wickedActions,
    wickedBodyParts: wickedBodyParts || db.adminSettings.wickedBodyParts,
    photoThemes: photoThemes || db.adminSettings.photoThemes,
    photoSetups: photoSetups || db.adminSettings.photoSetups,
    theme: theme || db.adminSettings.theme || "Passionate Red"
  };

  writeDB(db);
  res.json(db.adminSettings);
});


// 9. Important Dates System (Task 1)
app.post("/api/dates", (req: Request, res: Response) => {
  const { id, title, date, category, description, reminderDaysAhead } = req.body;
  if (!title || !date || !category) {
     res.status(400).json({ error: "Missing required title, date, or category" });
     return;
  }
  const db = readDB();
  const dateId = id || `date_${Date.now()}`;
  const existingIndex = db.importantDates.findIndex(d => d.id === dateId);
  const dateItem: ImportantDate = {
    id: dateId,
    title,
    date,
    category,
    description: description || "",
    reminderDaysAhead: Number(reminderDaysAhead) || 0
  };

  if (existingIndex !== -1) {
    db.importantDates[existingIndex] = dateItem;
  } else {
    db.importantDates.push(dateItem);
  }

  writeDB(db);
  res.json(dateItem);
});

app.delete("/api/dates/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  db.importantDates = db.importantDates.filter(d => d.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Date notification deleted" });
});


// 10. Gift Purchases Log with Photo Support (Task 4)
app.post("/api/gift-purchases", (req: Request, res: Response) => {
  const { title, description, category, photoUrl, buyer, price } = req.body;
  if (!title || !description || !category || !buyer) {
     res.status(400).json({ error: "Missing required physical gift details" });
     return;
  }
  
  const db = readDB();
  const newPurchase: GiftPurchase = {
    id: `purchase_${Date.now()}`,
    title,
    description,
    category,
    photoUrl: photoUrl || "",
    buyer,
    price: price || "",
    timestamp: new Date().toISOString()
  };

  db.giftPurchases.unshift(newPurchase);
  writeDB(db);
  res.json(newPurchase);
});

app.delete("/api/gift-purchases/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  db.giftPurchases = db.giftPurchases.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Purchase deleted successfully" });
});


// 11. Period Tracker Bulk Import (Task 3)
app.post("/api/period/import", (req: Request, res: Response) => {
  const { logs, config } = req.body;
  if (!Array.isArray(logs)) {
     res.status(400).json({ error: "Logs payload must be an array of daily states list." });
     return;
  }
  
  const cycleDb = readCycleDB();
  let mergedCount = 0;

  logs.forEach((importedLog) => {
    if (!importedLog.date) return;
    const existingIndex = cycleDb.cycleLogs.findIndex(l => l.date === importedLog.date);
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
      cycleDb.cycleLogs[existingIndex] = logItem;
    } else {
      cycleDb.cycleLogs.push(logItem);
    }
    mergedCount++;
  });

  // Sort chronologically descending
  cycleDb.cycleLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (config) {
    if (config.lastPeriodDate) cycleDb.periodConfig.lastPeriodDate = config.lastPeriodDate;
    if (config.cycleLength) cycleDb.periodConfig.cycleLength = Number(config.cycleLength);
    if (config.periodLength) cycleDb.periodConfig.periodLength = Number(config.periodLength);
    if (config.pregnancyMode !== undefined) cycleDb.periodConfig.pregnancyMode = !!config.pregnancyMode;
    if (config.pregnancyStartDate !== undefined) cycleDb.periodConfig.pregnancyStartDate = config.pregnancyStartDate;
  }

  writeCycleDB(cycleDb);
  res.json({ success: true, count: mergedCount, periodConfig: cycleDb.periodConfig, logsCount: cycleDb.cycleLogs.length });
});


// 11b. Period Tracker PDF/Screenshot AI Import Supporting Route
app.post("/api/period/import-pdf", async (req: Request, res: Response) => {
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
        const cycleDb = readCycleDB();
        
        const logs = parsedData.logs || [];
        const config = parsedData.periodConfig;
        
        let mergedCount = 0;
        logs.forEach((importedLog: any) => {
          if (!importedLog.date) return;
          const existingIndex = cycleDb.cycleLogs.findIndex(l => l.date === importedLog.date);
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
            cycleDb.cycleLogs[existingIndex] = logItem;
          } else {
            cycleDb.cycleLogs.push(logItem);
          }
          mergedCount++;
        });

        // Sort chronologically descending
        cycleDb.cycleLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (config) {
          if (config.lastPeriodDate) cycleDb.periodConfig.lastPeriodDate = config.lastPeriodDate;
          if (config.cycleLength) cycleDb.periodConfig.cycleLength = Number(config.cycleLength);
          if (config.periodLength) cycleDb.periodConfig.periodLength = Number(config.periodLength);
        }

        writeCycleDB(cycleDb);

        res.json({
          success: true,
          count: mergedCount,
          periodConfig: cycleDb.periodConfig,
          logsCount: cycleDb.cycleLogs.length,
          extractedLogs: logs
        });
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
    const cycleDb = readCycleDB();
    const today = new Date();
    
    // Create realistic parsed cycle items
    const generatedLogs: CycleLog[] = [];
    const generatedConfig = {
      lastPeriodDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      cycleLength: 28,
      periodLength: 5,
      pregnancyMode: false,
      pregnancyStartDate: ""
    };

    // Synthesize logs for past period started 14 days ago
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

    generatedLogs.forEach((mockLog) => {
      const existingIndex = cycleDb.cycleLogs.findIndex(l => l.date === mockLog.date);
      if (existingIndex !== -1) {
        cycleDb.cycleLogs[existingIndex] = mockLog;
      } else {
        cycleDb.cycleLogs.push(mockLog);
      }
    });

    cycleDb.cycleLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    cycleDb.periodConfig = generatedConfig;
    
    writeCycleDB(cycleDb);

    res.json({
      success: true,
      count: generatedLogs.length,
      periodConfig: cycleDb.periodConfig,
      logsCount: cycleDb.cycleLogs.length,
      extractedLogs: generatedLogs,
      simulated: true
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed simulated data builder fallback: " + err.message });
  }
});

// 11c. Period Tracker Export Route
app.get("/api/period/export", (req: Request, res: Response) => {
  const format = req.query.format as string;
  const cycleDb = readCycleDB();

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
});


// 12. Sensory Voucher Generation API
app.post("/api/gifts/generate", async (req: Request, res: Response) => {
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
});

// 13. Kitchen & Vegetarian Recipes Generation API
app.post("/api/kitchen/generate", async (req: Request, res: Response) => {
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
});

// 14. Save Selected Recipe to Ledger
app.post("/api/kitchen/save", (req: Request, res: Response) => {
  const { title, description, ingredients, instructions, phase, hasEggs, notes } = req.body;
  if (!title || !ingredients || !instructions) {
    res.status(400).json({ error: "Missing required recipe fields." });
    return;
  }

  const db = readDB();
  const newDish = {
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

  db.kitchenDishes = db.kitchenDishes || [];
  db.kitchenDishes.unshift(newDish);
  writeDB(db);

  res.json(newDish);
});

// 15. Delete Recipe from Ledger
app.delete("/api/kitchen/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  db.kitchenDishes = (db.kitchenDishes || []).filter(d => d.id !== id);
  writeDB(db);
  res.json({ success: true, message: "Dish removed successfully" });
});

// 16. Update Cooking Memory Notes
app.post("/api/kitchen/notes/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const db = readDB();
  const index = (db.kitchenDishes || []).findIndex(d => d.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Dish not found" });
    return;
  }
  db.kitchenDishes![index].notes = notes;
  writeDB(db);
  res.json(db.kitchenDishes![index]);
});

// 17. Update Cooking Memory Love Rating (Hearts)
app.post("/api/kitchen/rating/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating } = req.body;
  const db = readDB();
  const index = (db.kitchenDishes || []).findIndex(d => d.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Dish not found" });
    return;
  }
  db.kitchenDishes![index].rating = Number(rating);
  writeDB(db);
  res.json(db.kitchenDishes![index]);
});


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
