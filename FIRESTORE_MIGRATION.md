# Migrating from JSON files to Firestore

## What changed

The app's database used to be two JSON files (`sanctuary_db.json` and
`cycle_tracker_db.json`) sitting on a Cloud Storage bucket, mounted into
the container via GCS FUSE. That setup had two real, documented problems:

1. **No file locking.** Per Google's own docs on Cloud Storage FUSE:
   "Cloud Storage FUSE does not provide concurrency control for multiple
   writes... the last write wins and all previous writes are lost." If
   both of you used the app at the same time, one person's save could
   silently disappear.
2. **Stale reads.** Cloud Run's GCS FUSE mount caches file metadata for up
   to 60 seconds by default. A save could succeed, then a read shortly
   after - even a full page reload - could still show the old data,
   especially right after the container scaled from 0 to a fresh instance.

This is the root cause of "I added a gift and it just doesn't show up."

The fix: the database now lives in **Firestore**, a real database that
handles concurrent writes safely. All the actual data access logic is in
`server/firestoreDb.ts` and `server/firestore.ts`.

## Schema

- `sanctuary/main` (one document): gifts, wicked challenge history, admin
  settings, important dates, kitchen dishes. All text, safely well under
  Firestore's 1MiB-per-document limit even after years of use.
- `cycleTracker/main` (one document): period config and cycle logs.
- `vaultPhotos` (one collection, one document per photo): kept separate
  because each photo is a base64-encoded image, which can approach the
  1MiB limit on its own - bundling many into one document (like the old
  JSON file did) would eventually break.
- `giftPurchases` (one collection, one document per purchase): same reason
  as vaultPhotos.

## The one-time migration

The very first time the new code runs against a Firestore database that
doesn't have a `sanctuary/main` document yet, it automatically reads the
**old** JSON files (still present via the GCS volume mount, which hasn't
been removed yet on purpose) and copies everything into Firestore. This
happens once, automatically, with no manual steps - you should not lose
any existing gifts, photos, logs, or settings.

This logic lives in `migrateLegacyJsonToFirestoreIfNeeded()` in
`server/firestoreDb.ts`, and logs clearly to Cloud Run's logs either way:

```
[firestore-migration] Found legacy sanctuary_db.json, migrating to Firestore.
[firestore-migration] Migrated 12 gifts, 8 photos, 3 purchases to Firestore.
```

## What to check after this deploys

1. **Check Cloud Run logs** for the `[firestore-migration]` lines above,
   confirming the migration ran and found your real data (not 0 gifts/0
   photos, unless that's genuinely accurate).
2. **Add a test gift**, then do a real full page reload (not just staying
   on the page) - it should still be there.
3. **Check your existing gifts/photos/logs are all still present** -
   nothing should have been lost in the migration.
4. If anything looks wrong, the old JSON files are untouched and still on
   the GCS volume - nothing has been deleted. The volume mount stays in
   place until this is confirmed working, specifically as a safety net.

## What's intentionally NOT removed yet

- The GCS volume mount in `cloudbuild.yaml` (`db-volume`) - kept as a
  fallback/reference until Firestore is confirmed solid in production.
- The legacy JSON files themselves on the bucket - not deleted, just no
  longer read after the first successful migration.

Once you've used the app for a while and are confident everything's
working, these can be cleaned up - just say so and that's a quick follow-up
change.

## Required IAM permission

The Cloud Run service's identity needs Firestore access. This was granted
manually in the console (Cloud Datastore Admin role, broader than strictly
necessary but functional - could be narrowed to "Cloud Datastore User"
later for tighter permissions).
