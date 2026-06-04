import { Resend } from "resend";

let warned = false;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warned) {
      console.warn("[email] RESEND_API_KEY not set — skipping email send.");
      warned = true;
    }
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Nexus <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}
