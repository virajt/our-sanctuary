import { WickedChallenge, PhotoCameraPrompt } from "../src/types.js";

// --- WICKED CHAMBER LISTS ---
export const ACTIONS = [
  "gently suck and trail wet kisses along", "passionately lick and circle your tongue around",
  "deeply kiss and nibble on", "firmly massage and sensually squeeze", "seductively trace your tongue and lips on",
  "blow warm, heavy breaths directly against", "gently bite and double-kiss", "caress and massage with warm slick oil over",
  "wetly lick in slow circular motions around", "tease with slow circular lips and light suction on",
  "tease with warm wet strokes on", "firmly hold and stroke with high passion across",
  "gently scratch and tickle with feather-light touch along", "run warm trembling fingertips and dry lips over",
  "gently pinch and roll between your fingers", "breathe hotly and suckle on",
  "use your mouth, tongue, and lips to deeply pleasure", "rub your bare chest and body heat against",
  "use soft toys or fingers to apply deep vibration and teasing strokes near", "slowly slide your fingers or hand inside and around",
  "gently slap and stroke the curves of", "press your lips, naked hips, and pelvis tightly against"
];

export const BODY_PARTS = [
  "her sensitive clitoris and wet labia", "his hard erect penis and sensitive shaft",
  "her warm perked nipples and full breasts", "his warm heavy balls and sensitive perineum",
  "her highly sensitive G-spot and vaginal entrance", "her soft rounded buttocks and inner thighs",
  "the highly sensitive nape of their neck and earlobes", "his strong waist, pubic area, and pelvic bone",
  "her lower stomach, waistline, and pubic mound", "the sensitive crease of the hip and groin",
  "the deep arch of her spine and lower back", "the soft skin on the inner thighs right next to the sex organs",
  "each other's naked lips and open mouths", "her sensitive behind-the-knees and inner thighs",
  "his chest, nipples, and muscular shoulders", "her beautiful collarbones and neck pulse points"
];

export const INTENSITIES = [
  { level: "Teasing" as const, instruction: "Keep pressure minimal and build a slow ache of desire. Avoid rushing, ignore declarations of impatience." },
  { level: "Sensual" as const, instruction: "Focus deeply on skin-to-skin touch and synchronous breathing. Sync your movements directly with their pulse." },
  { level: "Intense" as const, instruction: "Use heavier touch, direct eye contact or blindfolds, and let primal desire take control." },
  { level: "Wicked" as const, instruction: "Engage in highly dominant/submissive playful command. Fulfill an unspoken fantasy, leaving them completely breathless." }
];

export const DETAILS = [
  "while maintaining fierce, unbroken eye contact.",
  "while blindfolded, letting touch be the only language.",
  "using a sensory item (like silk, a feather, ice, or skin-safe massage lotion).",
  "while whispering a raw, seductive truth about why you desire them.",
  "guided strictly by their moans—retreating if they plead, and driving forward as they melt.",
  "in total silence, communicating only through touch, gaze, and slow kisses.",
  "counting to 30 slow seconds for each stroke, letting the tension stack.",
  "while they are restrained lightly or told to remain completely still.",
  "switching between warm breath and cold-teasing blows.",
  "while telling them exactly how beautiful and irresistible their body is right now."
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
  const bodyPart = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
  const intensityObj = INTENSITIES[Math.floor(Math.random() * INTENSITIES.length)];
  const detail = DETAILS[Math.floor(Math.random() * DETAILS.length)];

  const id = `wicked_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  // Format the instruction
  let targetPronoun = "your partner";
  if (target === "Command Him") targetPronoun = "him";
  else if (target === "Command Her") targetPronoun = "her";
  else targetPronoun = "each other";

  const description = `${action.charAt(0).toUpperCase() + action.slice(1)} ${bodyPart} ${detail}`;
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
