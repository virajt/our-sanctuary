import fs from "fs";
import path from "path";
import {
  sanctuaryDocRef,
  cycleTrackerDocRef,
  vaultPhotosCollection,
  giftPurchasesCollection,
  firestore,
} from "./firestore";
import {
  SanctuaryDB,
  CycleTrackerDB,
  VaultPhoto,
  GiftPurchase,
} from "../src/types";

// --- Defaults (used only if Firestore is completely empty and there is no
// legacy JSON file to migrate from - e.g. a fresh install) ---
const DEFAULT_GIFTS = [
  {
    id: "gift_1",
    title: "Sensual Warm Oil Massage",
    description:
      "A 30-minute full body massage. Lights fully dimmed, sensual ambient music playing, and absolute focus on slow, comforting, or ticklesome touches.",
    category: "Sensual",
    receiver: "Her",
    status: "Available",
  },
];

const DEFAULT_DB_BASE: Omit<SanctuaryDB, "gifts" | "cycleLogs" | "periodConfig" | "vaultPhotos" | "giftPurchases"> = {
  wickedChallengesHistory: [],
  adminSettings: {
    vibeIntensity: "Medium",
    wickedActions: [],
    wickedBodyParts: [],
    photoThemes: [],
    photoSetups: [],
    periodRemindersEnabled: true,
    theme: "Passionate Red",
  },
  importantDates: [],
  kitchenDishes: [],
};

const DEFAULT_PERIOD_CONFIG = {
  lastPeriodDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  cycleLength: 28,
  periodLength: 5,
  pregnancyMode: false,
  pregnancyStartDate: "",
};

// --- One-time migration from the legacy GCS-FUSE-backed JSON files ---
// This runs once on first boot after the Firestore migration ships. It is
// safe to leave in place indefinitely: it only ever writes to Firestore if
// the sanctuary/main document doesn't already exist, so it's a no-op on
// every subsequent boot once the migration has happened.
const LEGACY_DB_DIR = path.join(process.cwd(), "data");
const LEGACY_DB_FILE = path.join(LEGACY_DB_DIR, "sanctuary_db.json");
const LEGACY_CYCLE_DB_FILE = path.join(LEGACY_DB_DIR, "cycle_tracker_db.json");

async function migrateLegacyJsonToFirestoreIfNeeded(): Promise<void> {
  const sanctuarySnap = await sanctuaryDocRef.get();
  if (!sanctuarySnap.exists) {
    let legacyMain: any = {};
    if (fs.existsSync(LEGACY_DB_FILE)) {
      try {
        legacyMain = JSON.parse(fs.readFileSync(LEGACY_DB_FILE, "utf-8"));
        console.log("[firestore-migration] Found legacy sanctuary_db.json, migrating to Firestore.");
      } catch (err) {
        console.error("[firestore-migration] Failed to parse legacy sanctuary_db.json:", err);
      }
    }

    const legacyGifts = legacyMain.gifts || DEFAULT_GIFTS;
    const legacyVaultPhotos: VaultPhoto[] = legacyMain.vaultPhotos || [];
    const legacyGiftPurchases: GiftPurchase[] = legacyMain.giftPurchases || [];

    // Text-only fields go into the single sanctuary/main document.
    await sanctuaryDocRef.set({
      gifts: legacyGifts,
      wickedChallengesHistory: legacyMain.wickedChallengesHistory || DEFAULT_DB_BASE.wickedChallengesHistory,
      adminSettings: legacyMain.adminSettings || DEFAULT_DB_BASE.adminSettings,
      importantDates: legacyMain.importantDates || DEFAULT_DB_BASE.importantDates,
      kitchenDishes: legacyMain.kitchenDishes || DEFAULT_DB_BASE.kitchenDishes,
    });

    // Photos and purchases get migrated into their own collections, one
    // document per item, since they contain base64 images (see
    // server/firestore.ts for why this matters).
    const batch = firestore.batch();
    legacyVaultPhotos.forEach((photo) => {
      batch.set(vaultPhotosCollection.doc(photo.id), photo);
    });
    legacyGiftPurchases.forEach((purchase) => {
      batch.set(giftPurchasesCollection.doc(purchase.id), purchase);
    });
    if (legacyVaultPhotos.length > 0 || legacyGiftPurchases.length > 0) {
      await batch.commit();
    }

    console.log(
      `[firestore-migration] Migrated ${legacyGifts.length} gifts, ${legacyVaultPhotos.length} photos, ${legacyGiftPurchases.length} purchases to Firestore.`
    );
  }

  const cycleSnap = await cycleTrackerDocRef.get();
  if (!cycleSnap.exists) {
    let legacyCycle: any = {};
    if (fs.existsSync(LEGACY_CYCLE_DB_FILE)) {
      try {
        legacyCycle = JSON.parse(fs.readFileSync(LEGACY_CYCLE_DB_FILE, "utf-8"));
        console.log("[firestore-migration] Found legacy cycle_tracker_db.json, migrating to Firestore.");
      } catch (err) {
        console.error("[firestore-migration] Failed to parse legacy cycle_tracker_db.json:", err);
      }
    }
    await cycleTrackerDocRef.set({
      periodConfig: legacyCycle.periodConfig || DEFAULT_PERIOD_CONFIG,
      cycleLogs: legacyCycle.cycleLogs || [],
    });
    console.log(
      `[firestore-migration] Migrated cycle config and ${legacyCycle.cycleLogs?.length || 0} cycle logs to Firestore.`
    );
  }
}

let migrationPromise: Promise<void> | null = null;
/** Ensures the one-time migration has run before any read/write proceeds. */
function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyJsonToFirestoreIfNeeded().catch((err) => {
      console.error("[firestore-migration] Migration failed:", err);
      // Reset so a subsequent request can retry rather than being stuck
      // with a permanently-rejected promise.
      migrationPromise = null;
      throw err;
    });
  }
  return migrationPromise;
}

// --- Public data-access API (mirrors the old readDB/writeDB interface as
// closely as possible, so route handlers barely need to change) ---

export async function readDB(): Promise<SanctuaryDB> {
  await ensureMigrated();
  const [sanctuarySnap, photosSnap, purchasesSnap] = await Promise.all([
    sanctuaryDocRef.get(),
    vaultPhotosCollection.orderBy("timestamp", "desc").get(),
    giftPurchasesCollection.orderBy("timestamp", "desc").get(),
  ]);

  const mainData = sanctuarySnap.exists ? sanctuarySnap.data()! : {};
  return {
    gifts: mainData.gifts || [],
    cycleLogs: [], // populated separately via readCycleDB - kept here only for type compatibility
    periodConfig: DEFAULT_PERIOD_CONFIG, // same as above
    wickedChallengesHistory: mainData.wickedChallengesHistory || [],
    vaultPhotos: photosSnap.docs.map((d) => d.data() as VaultPhoto),
    adminSettings: mainData.adminSettings || DEFAULT_DB_BASE.adminSettings,
    importantDates: mainData.importantDates || [],
    giftPurchases: purchasesSnap.docs.map((d) => d.data() as GiftPurchase),
    kitchenDishes: mainData.kitchenDishes || [],
  };
}

/**
 * Writes back only the text-only fields of SanctuaryDB to the single
 * sanctuary/main document. vaultPhotos and giftPurchases are intentionally
 * NOT written here - they live in their own collections and are managed
 * by the dedicated helper functions below, since writing the whole array
 * back on every save would re-introduce the same per-document size problem
 * this migration exists to avoid.
 */
export async function writeDB(data: SanctuaryDB): Promise<void> {
  await ensureMigrated();
  await sanctuaryDocRef.set({
    gifts: data.gifts,
    wickedChallengesHistory: data.wickedChallengesHistory,
    adminSettings: data.adminSettings,
    importantDates: data.importantDates,
    kitchenDishes: data.kitchenDishes || [],
  });
}

export async function readCycleDB(): Promise<CycleTrackerDB> {
  await ensureMigrated();
  const snap = await cycleTrackerDocRef.get();
  const data = snap.exists ? snap.data()! : {};
  return {
    periodConfig: data.periodConfig || DEFAULT_PERIOD_CONFIG,
    cycleLogs: data.cycleLogs || [],
  };
}

export async function writeCycleDB(data: CycleTrackerDB): Promise<void> {
  await ensureMigrated();
  await cycleTrackerDocRef.set({
    periodConfig: data.periodConfig,
    cycleLogs: data.cycleLogs,
  });
}

// --- Dedicated helpers for the photo/purchase collections ---

export async function addVaultPhoto(photo: VaultPhoto): Promise<void> {
  await ensureMigrated();
  await vaultPhotosCollection.doc(photo.id).set(photo);
}

export async function deleteVaultPhoto(id: string): Promise<void> {
  await ensureMigrated();
  await vaultPhotosCollection.doc(id).delete();
}

export async function addGiftPurchase(purchase: GiftPurchase): Promise<void> {
  await ensureMigrated();
  await giftPurchasesCollection.doc(purchase.id).set(purchase);
}

export async function deleteGiftPurchase(id: string): Promise<void> {
  await ensureMigrated();
  await giftPurchasesCollection.doc(id).delete();
}

/**
 * Runs a read-modify-write on the sanctuary/main document as a real
 * Firestore transaction - this is what actually fixes the concurrency bug.
 * Unlike the old in-process mutex (which only protected against races
 * within a single container instance), a Firestore transaction is safe
 * across every Cloud Run instance, since Firestore itself serializes
 * conflicting transactions and automatically retries on contention.
 */
export async function withSanctuaryTransaction<T>(
  fn: (current: SanctuaryDB, set: (next: Partial<SanctuaryDB>) => void) => T
): Promise<T> {
  await ensureMigrated();
  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(sanctuaryDocRef);
    const mainData = snap.exists ? snap.data()! : {};
    const current: SanctuaryDB = {
      gifts: mainData.gifts || [],
      cycleLogs: [],
      periodConfig: DEFAULT_PERIOD_CONFIG,
      wickedChallengesHistory: mainData.wickedChallengesHistory || [],
      vaultPhotos: [],
      adminSettings: mainData.adminSettings || DEFAULT_DB_BASE.adminSettings,
      importantDates: mainData.importantDates || [],
      giftPurchases: [],
      kitchenDishes: mainData.kitchenDishes || [],
    };

    let pendingUpdate: Partial<SanctuaryDB> | null = null;
    const result = fn(current, (next) => {
      pendingUpdate = next;
    });

    if (pendingUpdate) {
      tx.set(sanctuaryDocRef, { ...mainData, ...pendingUpdate });
    }
    return result;
  });
}

/** Same as withSanctuaryTransaction but for the cycle tracker document. */
export async function withCycleTransaction<T>(
  fn: (current: CycleTrackerDB, set: (next: Partial<CycleTrackerDB>) => void) => T
): Promise<T> {
  await ensureMigrated();
  return firestore.runTransaction(async (tx) => {
    const snap = await tx.get(cycleTrackerDocRef);
    const data = snap.exists ? snap.data()! : {};
    const current: CycleTrackerDB = {
      periodConfig: data.periodConfig || DEFAULT_PERIOD_CONFIG,
      cycleLogs: data.cycleLogs || [],
    };

    let pendingUpdate: Partial<CycleTrackerDB> | null = null;
    const result = fn(current, (next) => {
      pendingUpdate = next;
    });

    if (pendingUpdate) {
      tx.set(cycleTrackerDocRef, { ...data, ...pendingUpdate });
    }
    return result;
  });
}
