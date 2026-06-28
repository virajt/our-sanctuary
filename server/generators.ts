import { WickedChallenge, PhotoCameraPrompt } from "../src/types.js";
import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// --- WICKED CHAMBER LISTS ---
export const ACTIONS = [
  "ruthlessly fuck and deeply penetrate", "roughly grind your hips against", 
  "forcefully hold down and savagely devour", "passionately suck and furiously ride",
  "deeply deep-throat and aggressively milk", "mercilessly tease and edge",
  "smother with wet kisses and fiercely bite", "spread wide and hungrily eat out",
  "firmly command and aggressively thrust into", "slap hard and demand submission from",
  "use your tongue to relentlessly stimulate", "pin down and wildly grind against",
  "violently pull hair while completely dominating", "shove your fingers deep inside and stretch",
  "bend over and completely surrender to", "relentlessly stroke and edge to the brink of begging",
  "smother with your body weight and aggressively ravage", "force to their knees to worship",
  "tie down and mercilessly overstimulate", "choke lightly while relentlessly pounding"
];

export const HER_BODY_PARTS = [
  "her dripping wet cunt and sensitive clit", "her tight vaginal canal and soaked labia",
  "her sensitive G-spot and quivering thighs", "her perked nipples and sensitive breasts",
  "her soft ass and tight asshole", "her throat and open mouth",
  "her spread legs and exposed pussy", "her inner thighs and sensitive pubic mound"
];

export const HIS_BODY_PARTS = [
  "his hard throbbing cock and sensitive shaft", "his heavy balls and dripping tip",
  "his thick erect dick and tight perineum", "his face and open mouth",
  "his strong chest and muscular thighs"
];

export const SHARED_BODY_PARTS = [
  "each other's naked lips and filthy mouths", "each other's sensitive erogenous zones",
  "the highly sensitive skin between the thighs", "each other's exposed, flushed bodies"
];

export const INTENSITIES = [
  { level: "Teasing" as const, instruction: "Edge them mercilessly. Force them to beg for release. Deny them completely until they are desperate and crying out for it." },
  { level: "Sensual" as const, instruction: "Use slow, wet, agonizingly deep movements. Make every single thrust or lick last an eternity." },
  { level: "Intense" as const, instruction: "Be rough, aggressive, and highly dominant. Leave marks, pull hair, and take absolute control without hesitation." },
  { level: "Wicked" as const, instruction: "Completely degrade and dominate them. Unleash your wildest, most filthy fantasies. Break all boundaries and take exactly what you want." }
];

export const DETAILS = [
  "while forcing them to maintain eye contact and beg for more",
  "while completely restraining their wrists and ankles",
  "using spit, a vibrator, or a butt plug to amplify the sensation",
  "while whispering filthy, degrading, and sexually explicit commands",
  "ignoring their pleas and continuing until they are a shaking mess",
  "while slapping their ass hard enough to leave a red handprint",
  "forcing them to edge and ruining their orgasm at the last second",
  "while blindfolded and gagged, making them entirely helpless",
  "making them worship your body and swallow every drop",
  "while telling them exactly what a good, obedient slut they are being"
];

// --- PRIVATE GALLERY LISTS ---
export const PHOTO_THEMES = [
  "Shadow & Silhouette", "Silk & Satin Sheets", "Steamy Mirror Reveal", "Candlelit Elegance",
  "Seductive Contrast", "Morning After Glow", "Lace & Details", "Monochrome Mystique",
  "Velvet Shadows", "Forbidden Angle Only"
];

export const PHOTO_SETUPS = [
  "lying diagonally across a rumpled dark bedsheet, limbs loosely draped",
  "framed against a misted glass shower page, with condensation dripping down",
  "backlit directly by a warm, single lamp, creating a soft glowing rim-light",
  "draped in an oversized unbuttoned clothing item, revealing a hint of skin and muscle",
  "surrounded by five flickering beeswax candles in an otherwise dark room",
  "half-hidden behind a translucent curtain with morning golden-hour rays spilling through",
  "with leather or lace accents catching a high-contrast sharp highlight",
  "lying face down on soft velvet with focus centered on the curved dip of the lower back"
];

export const PHOTO_ANGLES = [
  "a close-up macro shot focusing entirely on textures (skin, hair, fabric)",
  "a low-exposure monochrome focus highlighting the sensual contrast of shadows",
  "a playful high-angle overview capturing symmetry and relaxed posture",
  "a side-profile mystery shot of lips, neck, and shoulder casting elegant lines",
  "an abstract reflection shot captured via a dresser mirror with deliberately blurred margins",
  "a soft-focus overhead gaze looking down at the natural vulnerability and allure"
];

export const PHOTO_AESTHETICS = [
  "No flash. Keep exposures low to hide details in the deep texture of shadows.",
  "Incorporate a hand placement of the photographer lightly touching the frame border.",
  "Focus on capturing movement, like a slight motion blur or a tossing of hair.",
  "Utilize black and white color profile (monochrome) to highlight raw anatomical aesthetic.",
  "Include a glass of red wine or a burning incense line in the background for atmospheric depth.",
  "Let one piece of fabric spill across the model's form, emphasizing beautiful folds."
];

// --- RANDOM GENERATOR LOGIC ---
export function generateProceduralWicked(target: "Command Him" | "Command Her" | "Together"): WickedChallenge {
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const intensityObj = INTENSITIES[Math.floor(Math.random() * INTENSITIES.length)];
  const detail = DETAILS[Math.floor(Math.random() * DETAILS.length)];

  // Pick a body part from the list that actually matches the target, so
  // a "Command Him" challenge never describes "her clitoris" or similar -
  // this agreement is the core fix for the grammar bug.
  let bodyPartPool: string[];
  let targetPronoun: string;
  if (target === "Command Him") {
    bodyPartPool = HIS_BODY_PARTS;
    targetPronoun = "him";
  } else if (target === "Command Her") {
    bodyPartPool = HER_BODY_PARTS;
    targetPronoun = "her";
  } else {
    bodyPartPool = [...HER_BODY_PARTS, ...HIS_BODY_PARTS, ...SHARED_BODY_PARTS];
    targetPronoun = "each other";
  }
  const bodyPart = bodyPartPool[Math.floor(Math.random() * bodyPartPool.length)];

  const id = `wicked_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Build as a direct second-person instruction: "<Action> <target's body
  // part>, <detail>." - grammatically consistent regardless of which
  // target/body-part combination gets picked, since the body part is now
  // always drawn from a pool matching the chosen target.
  const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
  const description = target === "Together"
    ? `${capitalizedAction} ${bodyPart}, ${detail}.`
    : `${capitalizedAction} ${bodyPart}, ${detail}. Direct this toward ${targetPronoun}.`;
  const howTo = `Intensity: ${intensityObj.level}. Instructions: ${intensityObj.instruction}`;

  return {
    id,
    action,
    bodyPart,
    intensity: intensityObj.level,
    target,
    howTo,
    description,
    timestamp: new Date().toISOString()
  };
}

export function generateProceduralPhotoPrompt(target: "Command Him" | "Command Her" | "Together"): PhotoCameraPrompt {
  const theme = PHOTO_THEMES[Math.floor(Math.random() * PHOTO_THEMES.length)];
  const setup = PHOTO_SETUPS[Math.floor(Math.random() * PHOTO_SETUPS.length)];
  const angle = PHOTO_ANGLES[Math.floor(Math.random() * PHOTO_ANGLES.length)];
  const aestheticTip = PHOTO_AESTHETICS[Math.floor(Math.random() * PHOTO_AESTHETICS.length)];

  const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  let objectPronoun = "their form";
  if (target === "Command Him") objectPronoun = "his beautiful body";
  else if (target === "Command Her") objectPronoun = "her gorgeous curves";
  else objectPronoun = "both of your tangled bodies";

  const description = `Theme: ${theme}. Setup: Capture ${objectPronoun} ${setup}. Use ${angle}.`;

  return {
    id,
    theme,
    setup,
    angle,
    target,
    aestheticTip,
    description
  };
}

export async function generateGeminiWicked(target: "Command Him" | "Command Her" | "Together", intensity: string = "Sensual"): Promise<WickedChallenge> {
  if (!ai) {
    console.warn("GEMINI_API_KEY not set, falling back to procedural generation");
    return generateProceduralWicked(target);
  }

  const prompt = `You are an intimate, uninhibited couples fantasy generator.
Generate a wicked challenge for a couple.
Target: ${target}
Intensity Slider: ${intensity} (where Teasing is mild, Sensual is deep, Intense is dominant, and Wicked is straight up hardcore and filthy with no limits).
If Intensity is Wicked, make it highly explicit, dominating, and hardcore.

Respond with ONLY a JSON object (no markdown, no backticks) with these exact keys:
"action": A short phrase describing the action (e.g. "relentlessly stroke and edge")
"bodyPart": The specific body part being targeted
"howTo": Instructions on how to execute it (e.g. "Intensity: Wicked. Tie them down and don't stop until they beg.")
"description": A complete sentence describing the act (e.g. "Relentlessly stroke and edge his hard throbbing cock while tying his wrists.")`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 1.2 }
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    return {
      id: `wicked_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: data.action || "intensely stimulate",
      bodyPart: data.bodyPart || "their body",
      intensity: intensity as any,
      target,
      howTo: data.howTo || "Follow your instincts.",
      description: data.description || "Take absolute control and follow your instincts.",
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error("Gemini Wicked error:", err);
    return generateProceduralWicked(target);
  }
}

export async function generateGeminiPhotoPrompt(target: "Command Him" | "Command Her" | "Together"): Promise<PhotoCameraPrompt> {
  if (!ai) {
    return generateProceduralPhotoPrompt(target);
  }

  const prompt = `You are a professional boudoir and intimate couples photographer.
Generate a creative photo setup for a private vault.
Target: ${target}

Respond with ONLY a JSON object (no markdown, no backticks) with these exact keys:
"theme": A short theme (e.g. "Shadow & Silhouette")
"setup": The physical pose or framing (e.g. "lying diagonally across a rumpled dark bedsheet")
"angle": The camera angle (e.g. "a close-up macro shot")
"aestheticTip": Photography advice (e.g. "No flash. Keep exposures low.")
"description": A complete sentence describing the shot.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 1.0 }
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    return {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      theme: data.theme || "Intimate Glow",
      setup: data.setup || "natural pose",
      angle: data.angle || "close-up",
      target,
      aestheticTip: data.aestheticTip || "Use warm lighting.",
      description: data.description || "Capture the raw intimacy."
    };
  } catch (err) {
    console.error("Gemini Photo error:", err);
    return generateProceduralPhotoPrompt(target);
  }
}
