import { Resend } from "resend";

export type ReminderEmailPayload = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Missing API key or a failed send both degrade silently — reminders still
 * show up in the cabinet either way, email is a bonus, not a dependency.
 * Mirrors the gating pattern in src/lib/categorize/claude.ts.
 *
 * Returns whether an email was actually sent. Callers that track
 * "already notified today" (e.g. the reminders cron) must only record that
 * when this is true — otherwise a reminder's one-time email window gets
 * silently burned on a deployment with no RESEND_API_KEY configured yet,
 * and it would never retry once a key is added.
 */
export async function sendReminderEmail(payload: ReminderEmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Esep <reminders@esep.kz>",
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[email] sendReminderEmail failed:", (error as Error).message);
    }
    return false;
  }
}
