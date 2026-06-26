import { Storage } from "@google-cloud/storage";

// Uses Application Default Credentials automatically, same as Firestore -
// on Cloud Run this is the service's own attached service account.
const storage = new Storage();

const BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "the-parent-500004-sanctuary-media";
export const mediaBucket = storage.bucket(BUCKET_NAME);

// Signed URLs let the frontend display images straight from a PRIVATE
// bucket (no public access) without the server having to proxy every
// byte through itself. They expire after this long, then need refreshing -
// see getSignedUrlForObject below for why the expiry has to be invisible
// to the data model (we never store a URL with a baked-in expiry, only
// the stable object path - the signed URL is generated fresh on every read).
const SIGNED_URL_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Uploads a base64 data URI (e.g. "data:image/jpeg;base64,...") as raw
 * bytes to Cloud Storage, returning the stable object path to store in
 * Firestore. This is the fix for Firestore's ~1MiB document field limit -
 * base64-encoded photos were hitting that limit directly; actual image
 * bytes in Cloud Storage have no such constraint (multi-GB objects are
 * fine), and Firestore only ever stores a short path string.
 */
export async function uploadDataUriToStorage(dataUri: string, objectPath: string): Promise<void> {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URI - expected a base64-encoded data: URL.");
  }
  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  const file = mediaBucket.file(objectPath);
  await file.save(buffer, {
    contentType,
    resumable: false, // single-shot upload; these files are small enough (a few MB at most) that resumable upload overhead isn't worth it
  });
}

/** Deletes an object from the media bucket. Safe to call even if it doesn't exist. */
export async function deleteStorageObject(objectPath: string): Promise<void> {
  try {
    await mediaBucket.file(objectPath).delete();
  } catch (err: any) {
    // Code 404 = object already gone - not a real error for a delete operation.
    if (err?.code !== 404) {
      throw err;
    }
  }
}

/**
 * Generates a fresh, time-limited signed URL for a private object. Called
 * on every read (e.g. every /api/database response that includes photos),
 * not stored anywhere, so it's never stale - the underlying object path
 * is the only thing that's persisted.
 */
export async function getSignedUrlForObject(objectPath: string): Promise<string> {
  const [url] = await mediaBucket.file(objectPath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + SIGNED_URL_EXPIRY_MS,
  });
  return url;
}
