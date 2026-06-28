// Sends transactional emails via Resend for the personalized reminder and
// teaser systems. Uses the same provider as the build-completion
// notification (scripts/notify-build-complete.sh), but this is the
// runtime/app-side sender, not the build-pipeline one.

import { readDB } from "./firestoreDb";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export type EmailRecipient = "Him" | "Her" | "Both";

export async function sendReminderEmail(who: EmailRecipient, subject: string, body: string, isHtml: boolean = false): Promise<void> {
  const db = await readDB();
  const config = db.adminSettings.notificationConfig;
  
  const addrs: string[] = [];
  if (who === "Him" || who === "Both") {
    if (config?.hisEmail) addrs.push(config.hisEmail);
  }
  if (who === "Her" || who === "Both") {
    if (config?.herEmail) addrs.push(config.herEmail);
  }

  if (addrs.length === 0) {
    console.warn(`[email] No configured recipients for "${who}" - set emails in Admin Panel. Skipping: ${subject}`);
    return;
  }
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY is not set - skipping email: ${subject}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Our Sanctuary <onboarding@resend.dev>",
        to: addrs,
        subject,
        ...(isHtml ? { html: body } : { text: body }),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[email] Resend API error (${res.status}) sending "${subject}":`, errText);
    }
  } catch (err) {
    console.error(`[email] Failed to send "${subject}":`, err);
  }
}
