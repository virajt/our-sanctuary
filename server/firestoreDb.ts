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
  uploadDataUriToStorage,
  deleteStorageObject,
  getSignedUrlForObject,
} from "./storage";
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
    voucherCategories: ["Pampering", "Sensual", "Intimate", "Wicked"],
    giftCategories: ["Jewelry", "Experience", "Letter", "Trip", "Keepsake", "Other"],
  },
  importantDates: [],
  kitchenDishes: [],
  realGifts: [],
  conversationAnswers: [],
  storyProgress: { currentStepId: "root", history: [], updatedAt: new Date().toISOString() },
  teasers: [],
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
      realGifts: legacyMain.realGifts || DEFAULT_DB_BASE.realGifts,
      conversationAnswers: legacyMain.conversationAnswers || DEFAULT_DB_BASE.conversationAnswers,
      storyProgress: legacyMain.storyProgress || DEFAULT_DB_BASE.storyProgress,
      teasers: legacyMain.teasers || DEFAULT_DB_BASE.teasers,
    });

    // Photos and purchases get migrated via the same addVaultPhoto /
    // addGiftPurchase helpers used for normal uploads, which push the
    // actual image bytes to Cloud Storage and store only a short object
    // path in Firestore. This is the real fix for Firestore's ~1MiB
    // document limit - the original version of this migration wrote raw
    // base64 directly into Firestore documents, which is exactly what hit
    // that limit and broke the entire migration the first time around
    // (confirmed in production logs). Each item is still migrated
    // individually so one bad item can't block everything else.
    let migratedPhotoCount = 0;
    let skippedPhotoCount = 0;
    for (const photo of legacyVaultPhotos) {
      try {
        await addVaultPhoto(photo);
        migratedPhotoCount++;
      } catch (err) {
        skippedPhotoCount++;
        console.error(`[firestore-migration] Skipped photo ${photo.id}:`, (err as Error).message);
      }
    }

    let migratedPurchaseCount = 0;
    let skippedPurchaseCount = 0;
    for (const purchase of legacyGiftPurchases) {
      try {
        await addGiftPurchase(purchase);
        migratedPurchaseCount++;
      } catch (err) {
        skippedPurchaseCount++;
        console.error(
          `[firestore-migration] Skipped purchase ${purchase.id} (likely exceeds Firestore's ~1MiB document limit):`,
          (err as Error).message
        );
      }
    }

    console.log(
      `[firestore-migration] Migrated ${legacyGifts.length} gifts, ${migratedPhotoCount}/${legacyVaultPhotos.length} photos (${skippedPhotoCount} skipped - too large), ${migratedPurchaseCount}/${legacyGiftPurchases.length} purchases (${skippedPurchaseCount} skipped - too large) to Firestore.`
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

// Distinguishes a stored Cloud Storage object path (e.g.
// "vault-photos/photo_123.jpg") from a legacy raw base64 data URI (e.g.
// "data:image/png;base64,...") that might still exist on items migrated
// before the Cloud Storage fix. Object paths never start with "data:".
function isStorageObjectPath(value: string): boolean {
  return !!value && !value.startsWith("data:") && !value.startsWith("http");
}

async function resolvePhotoUrl(storedValue: string): Promise<string> {
  if (!storedValue) return storedValue;
  if (isStorageObjectPath(storedValue)) {
    try {
      return await getSignedUrlForObject(storedValue);
    } catch (err) {
      console.error(`[storage] Failed to sign URL for ${storedValue}:`, err);
      return "";
    }
  }
  // Legacy raw base64 or already-a-URL - return as-is.
  return storedValue;
}

export async function readDB(): Promise<SanctuaryDB> {
  await ensureMigrated();
  const [sanctuarySnap, photosSnap, purchasesSnap] = await Promise.all([
    sanctuaryDocRef.get(),
    vaultPhotosCollection.orderBy("timestamp", "desc").get(),
    giftPurchasesCollection.orderBy("timestamp", "desc").get(),
  ]);

  const mainData = sanctuarySnap.exists ? sanctuarySnap.data()! : {};

  // Resolve stored object paths into fresh, short-lived signed URLs on
  // every read - this is why only the path is persisted, never a URL with
  // a baked-in expiry that would eventually stop working.
  const vaultPhotos = await Promise.all(
    photosSnap.docs.map(async (d) => {
      const photo = d.data() as VaultPhoto;
      return { ...photo, imageUrl: await resolvePhotoUrl(photo.imageUrl) };
    })
  );
  const giftPurchases = await Promise.all(
    purchasesSnap.docs.map(async (d) => {
      const purchase = d.data() as GiftPurchase;
      return { ...purchase, photoUrl: await resolvePhotoUrl(purchase.photoUrl) };
    })
  );

  return {
    gifts: mainData.gifts || [],
    cycleLogs: [], // populated separately via readCycleDB - kept here only for type compatibility
    periodConfig: DEFAULT_PERIOD_CONFIG, // same as above
    wickedChallengesHistory: mainData.wickedChallengesHistory || [],
    vaultPhotos,
    adminSettings: mainData.adminSettings || DEFAULT_DB_BASE.adminSettings,
    importantDates: mainData.importantDates || [],
    giftPurchases,
    kitchenDishes: mainData.kitchenDishes || [],
    realGifts: mainData.realGifts || [],
    conversationAnswers: mainData.conversationAnswers || [],
    storyProgress: mainData.storyProgress || DEFAULT_DB_BASE.storyProgress,
    teasers: mainData.teasers || [],
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
    realGifts: data.realGifts || [],
    conversationAnswers: data.conversationAnswers || [],
    storyProgress: data.storyProgress || DEFAULT_DB_BASE.storyProgress,
    teasers: data.teasers || [],
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
//
// imageUrl/photoUrl arrive from the frontend as base64 data URIs. Storing
// that directly in a Firestore document field hits the ~1MiB document
// limit on anything but a small/heavily-compressed image - confirmed in
// production ("The value of property 'imageUrl' is longer than 1048487
// bytes"). Instead, the actual image bytes go to Cloud Storage, and only
// the resulting object path is stored in Firestore. readDB() resolves
// that path back into a fresh signed URL on every read.

export async function addVaultPhoto(photo: VaultPhoto): Promise<void> {
  await ensureMigrated();
  const objectPath = `vault-photos/${photo.id}`;
  await uploadDataUriToStorage(photo.imageUrl, objectPath);
  await vaultPhotosCollection.doc(photo.id).set({ ...photo, imageUrl: objectPath });
}

export async function deleteVaultPhoto(id: string): Promise<void> {
  await ensureMigrated();
  const snap = await vaultPhotosCollection.doc(id).get();
  const data = snap.data();
  if (data?.imageUrl && isStorageObjectPath(data.imageUrl)) {
    await deleteStorageObject(data.imageUrl);
  }
  await vaultPhotosCollection.doc(id).delete();
}

export async function addGiftPurchase(purchase: GiftPurchase): Promise<void> {
  await ensureMigrated();
  if (purchase.photoUrl) {
    const objectPath = `gift-purchase-photos/${purchase.id}`;
    await uploadDataUriToStorage(purchase.photoUrl, objectPath);
    await giftPurchasesCollection.doc(purchase.id).set({ ...purchase, photoUrl: objectPath });
  } else {
    await giftPurchasesCollection.doc(purchase.id).set(purchase);
  }
}

export async function deleteGiftPurchase(id: string): Promise<void> {
  await ensureMigrated();
  const snap = await giftPurchasesCollection.doc(id).get();
  const data = snap.data();
  if (data?.photoUrl && isStorageObjectPath(data.photoUrl)) {
    await deleteStorageObject(data.photoUrl);
  }
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
      realGifts: mainData.realGifts || [],
      conversationAnswers: mainData.conversationAnswers || [],
      storyProgress: mainData.storyProgress || DEFAULT_DB_BASE.storyProgress,
      teasers: mainData.teasers || [],
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
