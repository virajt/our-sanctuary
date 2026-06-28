// Sends transactional emails via Resend for the personalized reminder and
// teaser systems. Uses the same provider as the build-completion
// notification (scripts/notify-build-complete.sh), but this is the
// runtime/app-side sender, not the build-pipeline one.

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const HIS_EMAIL = process.env.HIS_EMAIL || "";
const HER_EMAIL = process.env.HER_EMAIL || "";

export type EmailRecipient = "Him" | "Her" | "Both";

function resolveRecipients(who: EmailRecipient): string[] {
  const addrs: string[] = [];
  if (who === "Him" || who === "Both") {
    if (HIS_EMAIL) addrs.push(HIS_EMAIL);
  }
  if (who === "Her" || who === "Both") {
    if (HER_EMAIL) addrs.push(HER_EMAIL);
  }
  return addrs;
}

export async function sendReminderEmail(who: EmailRecipient, subject: string, body: string): Promise<void> {
  const recipients = resolveRecipients(who);
  if (recipients.length === 0) {
    console.warn(`[email] No configured recipients for "${who}" - set HIS_EMAIL/HER_EMAIL env vars. Skipping: ${subject}`);
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
        to: recipients,
        subject,
        text: body,
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
