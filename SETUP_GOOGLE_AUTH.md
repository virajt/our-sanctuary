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
     `http://localhost:3000` too.
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

**Why this step exists:** the three variables you just set in step 2 are
*runtime* variables - Cloud Run hands them to the container only once it's
already running. But GOOGLE_CLIENT_ID also needs to be baked into the
frontend's JavaScript file at *build* time, because Vite (the tool that
builds the React frontend) replaces it directly into the compiled code
before the container ever runs. Runtime-only variables never reach that
step, so the sign-in button would silently have no Client ID to use.

Since your Cloud Run service rebuilds automatically from GitHub on every
push (continuous deployment via a Cloud Build trigger), here's how to fix
it for your exact setup:

1. Go to your Cloud Run service page, and click "Edit repo settings" (or
   "Manage connected repositories") near the "Continuously deploy from a
   repository" section. This opens the underlying Cloud Build trigger.
2. Find the trigger and click Edit.
3. Scroll to Advanced -> Substitution variables (sometimes shown simply
   as "Variables").
4. Add a substitution variable:
   - Variable: _GOOGLE_CLIENT_ID
   - Value: your Client ID from step 1
5. This repo already includes a cloudbuild.yaml with the build wired up to
   read ${_GOOGLE_CLIENT_ID} and pass it into the Docker build as a build
   argument. If your trigger's "Configuration" is set to "Cloud Build
   configuration file (yaml or json)", point it at cloudbuild.yaml in the
   repo root and it will pick this up automatically.
   - If the trigger is instead set to "Dockerfile" as the build type
     (common with the "quick connect" flow), Cloud Run's UI doesn't expose
     a way to pass build args directly - in that case, switch the trigger's
     build configuration to use cloudbuild.yaml instead, since that file
     is what actually threads the Client ID through to the Docker build.
6. Save, then push any small commit (or click Run on the trigger
   manually) to kick off a fresh build with the Client ID included.

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
