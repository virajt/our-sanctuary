export interface SensoryGift {
  id: string;
  title: string;
  description: string;
  category: string;
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
  flow?: "None" | "Spotting" | "Light" | "Medium" | "Heavy";
  temperature?: number;
  weight?: number;
  waterIntake?: number;
  sleepDuration?: number;
  sex?: "None" | "Protected" | "Unprotected";
}

export interface PeriodConfig {
  lastPeriodDate: string; // YYYY-MM-DD
  cycleLength: number;    // default 28
  periodLength: number;   // default 5
  pregnancyMode?: boolean;
  pregnancyStartDate?: string; // YYYY-MM-DD (Gestation LMP)
}

export interface CycleTrackerDB {
  periodConfig: PeriodConfig;
  cycleLogs: CycleLog[];
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
  voucherCategories?: string[];
  giftCategories?: string[];
}

export interface ImportantDate {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: "Anniversary" | "Birthday" | "Special Date" | "Other";
  description?: string;
  reminderDaysAhead: number; // days count to trigger active notifications
  remindWho: "Him" | "Her" | "Both"; // who needs the email reminder
  lastNotifiedDate?: string; // YYYY-MM-DD of the most recent reminder sent, to avoid duplicate emails
}

export interface TeaserHint {
  daysBefore: number; // e.g. 3, 1, 0 (0 = day-of)
  message: string;
}

export interface Teaser {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD - the date/night being teased toward
  createdBy: "Him" | "Her";
  notifyWho: "Him" | "Her" | "Both"; // who receives the teaser hints (usually NOT the creator)
  hints: TeaserHint[]; // sorted descending by daysBefore
  sentHintDays?: number[]; // which daysBefore values have already been sent, to avoid duplicates
  createdAt: string;
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

// A real gift one partner gives the other - an idea/intention created
// ahead of time (e.g. "a weekend trip", "a handwritten letter") which the
// receiver can later claim and redeem. Structurally similar to a voucher
// (SensoryGift) but conceptually distinct: vouchers are sensory/intimate
// experiences either partner can redeem anytime, while Gifts are framed as
// something one partner specifically gives the other, with its own
// separate, admin-editable category list (AdminSettings.giftCategories).
export interface Gift {
  id: string;
  title: string;
  description: string;
  category: string;
  giver: "Him" | "Her" | "Together";
  receiver: "Him" | "Her";
  status: "Planned" | "Given" | "Received";
  givenAt?: string;
  receivedAt?: string;
  custom?: boolean;
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

// --- Merged from the-fantasy ---

export interface VisualLibraryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  intimacyLevel: "Mild" | "Moderate" | "High" | "Deep";
  mood: string;
}

export interface ConversationAnswer {
  id: string;
  promptId: string;
  question: string;
  answeredBy: "Him" | "Her" | "Together";
  answer: string;
  timestamp: string;
}

export interface StoryProgress {
  currentStepId: string;
  history: string[]; // step IDs visited, in order
  updatedAt: string;
}

export interface SanctuaryDB {
  gifts: SensoryGift[]; // these are "Vouchers" in the UI - sensory/intimate experiences either partner can redeem anytime
  cycleLogs: CycleLog[];
  periodConfig: PeriodConfig;
  wickedChallengesHistory: WickedChallenge[];
  vaultPhotos: VaultPhoto[];
  adminSettings: AdminSettings;
  importantDates: ImportantDate[];
  giftPurchases: GiftPurchase[];
  kitchenDishes?: KitchenDish[];
  realGifts?: Gift[]; // the new "Gifts" feature - actual gifts one partner gives the other
  conversationAnswers?: ConversationAnswer[];
  storyProgress?: StoryProgress;
  teasers?: Teaser[];
}
