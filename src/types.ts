export interface SensoryGift {
  id: string;
  title: string;
  description: string;
  category: "Pampering" | "Sensual" | "Intimate" | "Wicked";
  receiver: "Him" | "Her" | "Together";
  status: "Available" | "Claimed" | "Redeemed";
  claimedBy?: "Him" | "Her";
  claimedAt?: string;
  redeemedAt?: string;
  custom?: boolean;
}

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal";

export interface PhaseProtocol {
  phase: CyclePhase;
  days: string;
  description: string;
  wifeSymptoms: string[];
  husbandToDos: string[];
  recommendedIntimacy: string;
  foodsToProvide: string[];
}

export interface CycleLog {
  id: string;
  date: string;
  symptoms: string[];
  moods: string[];
  intimacyLevel: "None" | "Light Touch" | "Sensual" | "Intense";
  notes?: string;
}

export interface PeriodConfig {
  lastPeriodDate: string; // YYYY-MM-DD
  cycleLength: number;    // default 28
  periodLength: number;   // default 5
}

export interface WickedChallenge {
  id: string;
  action: string;
  bodyPart: string;
  intensity: "Teasing" | "Sensual" | "Intense" | "Wicked";
  target: "Command Him" | "Command Her" | "Together";
  howTo: string;
  description: string;
  timestamp: string;
  rating?: number; // Optional couple feedback rating (1-5 hearts)
}

export interface PhotoCameraPrompt {
  id: string;
  theme: string;
  setup: string;
  angle: string;
  target: "Command Him" | "Command Her" | "Together";
  aestheticTip: string;
  description: string;
}

export interface VaultPhoto {
  id: string;
  promptText: string;
  imageUrl: string; // Base64 data or standard fallback
  description: string; // Gemini-written / generated caption
  target: "Command Him" | "Command Her" | "Together";
  timestamp: string;
  captionGeneratedByAI: boolean;
}

export interface AdminSettings {
  vibeIntensity: "Soft" | "Medium" | "High";
  wickedActions: string[];
  wickedBodyParts: string[];
  photoThemes: string[];
  photoSetups: string[];
  periodRemindersEnabled: boolean;
  theme?: "Passionate Red" | "Midnight Blue" | "Golden Hour";
}

export interface ImportantDate {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: "Anniversary" | "Birthday" | "Special Date" | "Other";
  description?: string;
  reminderDaysAhead: number; // days count to trigger active notifications
}

export interface GiftPurchase {
  id: string;
  title: string;
  description: string;
  category: "Lingerie" | "Apparel" | "Flowers" | "Lounge & Spa" | "Jewelry" | "Chocolates" | "Other";
  photoUrl: string; // base64 string
  buyer: "Him" | "Her" | "Together";
  price?: string;
  timestamp: string;
}

export interface KitchenDish {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  phase?: string; // e.g. Menstrual, Follicular, Ovulatory, Luteal, or General
  notes?: string;
  rating?: number; // 1-5 rating of love
  hasEggs: boolean;
  timestamp: string;
}

export interface SanctuaryDB {
  gifts: SensoryGift[];
  cycleLogs: CycleLog[];
  periodConfig: PeriodConfig;
  wickedChallengesHistory: WickedChallenge[];
  vaultPhotos: VaultPhoto[];
  adminSettings: AdminSettings;
  importantDates: ImportantDate[];
  giftPurchases: GiftPurchase[];
  kitchenDishes?: KitchenDish[];
}
