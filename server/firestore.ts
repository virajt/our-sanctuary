import { Firestore } from "@google-cloud/firestore";

// Uses Application Default Credentials automatically - on Cloud Run this
// is the service's own attached service account (no key file needed), and
// locally it's whatever `gcloud auth application-default login` set up.
//
// FIRESTORE_DATABASE_ID lets this point at a named database (this project
// uses "our-sanctuary", not the "(default)" database) without hardcoding
// it, in case it's ever recreated under a different ID.
const databaseId = process.env.FIRESTORE_DATABASE_ID || "our-sanctuary";

export const firestore = new Firestore({
  databaseId,
});

// --- Collection/document references ---
//
// Schema design notes:
// - "sanctuary/main" and "cycleTracker/main" hold everything that's
//   text-only and safely stays well under Firestore's 1MiB-per-document
//   limit even after years of daily use (gifts, cycle logs, settings,
//   etc. - see migration notes for the size math).
// - vaultPhotos and giftPurchases get their OWN top-level collections,
//   one document per item, because both contain base64-encoded images.
//   A single photo can approach Firestore's 1MiB document limit on its
//   own; bundling many photos into one document (the old JSON-file
//   approach) would blow past that limit after just a few uploads.
export const sanctuaryDocRef = firestore.collection("sanctuary").doc("main");
export const cycleTrackerDocRef = firestore.collection("cycleTracker").doc("main");
export const vaultPhotosCollection = firestore.collection("vaultPhotos");
export const giftPurchasesCollection = firestore.collection("giftPurchases");
