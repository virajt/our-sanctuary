# Setting up email reminders & teasers

## 1. Add environment variables on Cloud Run

Go to Cloud Run > your service > "Edit & Deploy New Revision" > Variables &
Secrets, and add these (same place ALLOWED_EMAILS/SESSION_SECRET already
live - never put these in the repo):

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | your Resend API key (same one used for build emails) |
| `HIS_EMAIL` | virajttrivedi@gmail.com |
| `HER_EMAIL` | her email address |
| `SCHEDULER_SECRET` | a long random string - see below |

Generate a `SCHEDULER_SECRET` with:
```
openssl rand -hex 24
```
(or use this one, generated for you - feel free to use it or make your own):
```
d6a477ae16e87cd862cd1421cb044db11c1981e398fe0ea4
```

## 2. Create the Cloud Scheduler job

This is what actually triggers the daily check, since Cloud Run scales to
zero and nothing runs on its own otherwise.

1. Go to **Cloud Scheduler** in the console > **Create Job**.
2. **Name**: `our-sanctuary-daily-reminders`
3. **Region**: `australia-southeast1` (same as your Cloud Run service)
4. **Frequency**: `0 8 * * *` (8:00 AM every day - edit the hour to taste)
5. **Timezone**: your local timezone
6. **Target type**: HTTP
7. **URL**: `https://our-sanctuary.virajtrivedi.com/internal/run-reminders`
8. **HTTP method**: POST
9. **Headers**: add one header:
   - Name: `X-Scheduler-Secret`
   - Value: the same `SCHEDULER_SECRET` you set in step 1
10. Click **Create**.

You can click **Force Run** on the job afterward to test it immediately
rather than waiting for the next scheduled time.

## 3. What it does

Once a day, the job calls `/internal/run-reminders`, which:

- Checks every **Important Date** - if today is exactly
  `reminderDaysAhead` days before it, or the day itself, sends an email to
  whoever you set as "who needs the reminder" (Him / Her / Both) when
  creating the date.
- Checks every **Teaser** - for each hint stage you set (e.g. "3 days
  before", "1 day before", "day of"), sends that specific hint by email to
  whoever you set as the recipient, exactly once per stage.

Each date/teaser only gets notified once per matching day - re-running the
job the same day won't send duplicates.

## 4. Verifying it works

After setting everything up, you can manually trigger a test:

```
curl -X POST https://our-sanctuary.virajtrivedi.com/internal/run-reminders \
  -H "X-Scheduler-Secret: YOUR_SECRET_HERE"
```

A `401` means the secret doesn't match what's set in Cloud Run's env vars.
A `200` with `{"success":true,...}` means it ran - check your inbox, and
check Cloud Run logs for any `[email]` warning lines if nothing arrives
(most likely cause: `HIS_EMAIL`/`HER_EMAIL` not set yet, or `RESEND_API_KEY`
missing).
