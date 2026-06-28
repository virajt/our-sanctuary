// Sends transactional emails via Resend for the personalized reminder and
// teaser systems. Uses the same provider as the build-completion
// notification (scripts/notify-build-complete.sh), but this is the
// runtime/app-side sender, not the build-pipeline one.

import { readDB } from "./firestoreDb";


export type EmailRecipient = "Him" | "Her" | "Both";

export async function sendReminderEmail(who: EmailRecipient, subject: string, body: string, isHtml: boolean = false, fromName: string = "Our Sanctuary"): Promise<{success: boolean, error?: string}> {
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
    return { success: false, error: "No configured recipients for this role." };
  }
  const apiKey = config?.resendApiKey;
  if (!apiKey) {
    console.warn(`[email] Resend API Key is not set in Admin Settings - skipping email: ${subject}`);
    return { success: false, error: "Resend API Key is not configured in Admin Panel." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <Sanctuary@virajtrivedi.com>`,
        to: addrs,
        subject,
        ...(isHtml ? { html: body } : { text: body }),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[email] Resend API error (${res.status}) sending "${subject}":`, errText);
      return { success: false, error: `Resend Error (${res.status}): ${errText}` };
    }
    return { success: true };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}":`, err);
    return { success: false, error: String(err) };
  }
}
