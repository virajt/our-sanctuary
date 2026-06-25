# Setting Up Google Sign-In for Our Sanctuary

This app now uses real Google Sign-In, verified on the server, with access
limited to a whitelist of email addresses you control entirely from Google
Cloud — no code changes needed to add or remove someone.

There are three things to set up: an OAuth Client ID, three environment
variables on Cloud Run, and (if you haven't already) the Cloud Run service
itself.

---

## 1. Create the OAuth Client ID

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and
   select the GCP project this app is deployed under (or create one if you
   haven't yet).
2. In the left sidebar, go to **APIs & Services → OAuth consent screen**.
   - User type: **External** (this just means "not restricted to a Google
     Workspace org" — your email whitelist on the backend is what actually
     restricts access, not this setting).
   - Fill in an app name (e.g. "Our Sanctuary"), your support email, and
     developer contact email.
   - You do **not** need to submit this for verification — it's fine to
     leave it in "Testing" mode indefinitely for a 2-person app. In Testing
     mode, add yourself and your wife under **Test users** as well — Google
     requires this in addition to your own backend whitelist.
3. Go to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: anything, e.g. "Our Sanctuary Web Client".
   - **Authorized JavaScript origins**: add the exact URL(s) the app is
     served from, with no trailing slash, e.g.:
     ```
     https://our-sanctuary-xxxxx-uc.a.run.app
     ```
     If you're also testing locally with `npm run dev`, add
     `http://localhost:3000` too. **If you use a custom domain** (e.g.
     `https://our-sanctuary.yourdomain.com`) instead of the default
     `*.run.app` URL, add that exact custom domain here too - sign-in will
     fail with "Error 400: origin_mismatch" if the domain you're actually
     visiting isn't in this list, even if the default Cloud Run URL is.
   - **Authorized redirect URIs**: you can leave this empty — this app uses
     the Google Identity Services popup/button flow, which doesn't redirect.
5. Click **Create**. Copy the **Client ID** (it looks like
   `123456789-abc123xyz.apps.googleusercontent.com`). You don't need the
   client secret for this flow — only the Client ID is used.

---

## 2. Set environment variables on Cloud Run

This is also where you control **who is allowed in** — just edit
`ALLOWED_EMAILS` here whenever you need to, no redeploy of source code
required.

1. Go to **Cloud Run** in the console, click your service.
2. Click **Edit & deploy new revision**.
3. Under **Variables & Secrets**, add:

   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | the Client ID from step 1 |
   | `ALLOWED_EMAILS` | `you@gmail.com,yourwife@gmail.com` (comma-separated, no spaces needed) |
   | `SESSION_SECRET` | a long random string — generate one below |

   To generate a strong `SESSION_SECRET`, run this once on your own machine
   (not in the app):
   ```
   openssl rand -base64 48
   ```
   Paste the output as the value. Keep it secret — treat it like a password.
   You never need to type this anywhere except this one Cloud Run field.

4. Click **Deploy**.

To revoke access for someone, or add a new person later, just come back to
this screen, edit `ALLOWED_EMAILS`, and deploy. That's the entire process —
their browser session will stop working on their very next request.

---

## 3. Make the Client ID available at BUILD time too

This is the step that's easy to miss, and it's why signing in might not
work yet even after setting the variables in step 2.

**Why this step exists:** the three variables you set in step 2 are
*runtime* variables - Cloud Run hands them to the container only once it's
already running. But GOOGLE_CLIENT_ID also needs to be baked into the
frontend's JavaScript file at *build* time, because Vite (the tool that
builds the React frontend) replaces it directly into the compiled code
before the container ever runs.

**Important note on how this repo's build works:** this project has a
Dockerfile, and Cloud Run's GitHub-connected continuous deployment builds
straight from it. The gcloud flag normally suggested for this
(--update-build-env-vars on `gcloud run deploy --source`) is documented for
buildpacks-based builds and does NOT reliably apply when a literal
Dockerfile is present - we confirmed this directly while setting this up.
Because of that, cloudbuild.yaml in this repo builds the Docker image as an
explicit step with a real `docker build --build-arg GOOGLE_CLIENT_ID=...`,
then pushes that image and deploys it - rather than using the single-step
`gcloud run deploy --source .` shortcut.

Setup steps:

1. Go to your Cloud Run service page, and click "Edit repo settings" (or
   "Manage connected repositories") near the "Continuously deploy from a
   repository" section. This opens the underlying Cloud Build trigger.
2. Find the trigger and click Edit.
3. Under Configuration, make sure "Repository" is selected (not "Inline"),
   pointing at cloudbuild.yaml in the repo root. If it's set to "Inline",
   the trigger is using its own embedded config and will silently ignore
   the cloudbuild.yaml in this repo entirely.
4. Scroll to Advanced -> Substitution variables and add:
   - Variable: _GOOGLE_CLIENT_ID
   - Value: your Client ID from step 1
5. Save, then push any small commit (or click Run on the trigger manually)
   to kick off a fresh build with the Client ID included.
6. Make sure there is only ONE trigger for this service. Duplicate
   triggers (e.g. one left over from an earlier setup attempt) can race
   each other on every push, and whichever finishes last "wins" and becomes
   the live revision - which can make a working fix look like it
   "sometimes doesn't work."

After this rebuild completes, the sign-in button should actually have a
Client ID to work with.

---

## 4. Try it

1. Visit your deployed URL.
2. You should see a dark "Our Sanctuary" sign-in screen with a Google
   button — not the old password screen.
3. Sign in with one of the whitelisted accounts. You should land in the app.
4. Try signing in with a different Google account (or ask a friend to try) —
   it should be rejected with "This Google account is not authorized."

---

## What changed, security-wise

- The old "trust" / "mansi123" / "viraj123" text passwords are gone from the
  main gate. They were stored in the app's source code (now public on
  GitHub) and only checked in the browser — anyone could open dev tools and
  flip the unlock state without ever knowing a password, and anyone could
  call the API directly and skip the password screens entirely.
- Every `/api/*` route now requires a valid, server-verified session tied to
  one of your whitelisted Google accounts. There is no longer a way to
  reach the data without signing in with Google first.
- Sessions are signed with `SESSION_SECRET` and stored in an httpOnly cookie
  (JavaScript running on the page can't read it, which blocks a common way
  session tokens get stolen).
- The secondary Admin and Gallery PIN screens still exist as an extra layer
  inside an already-authenticated session, but they are not the real
  security boundary anymore — Google Sign-In is.
