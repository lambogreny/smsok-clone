const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "SMSOK <noreply@smsok.io>";
const RESEND_API = "https://api.resend.com";

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email");
    return null;
  }

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
      tags: params.tags,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error("[email] Resend error:", error);
    throw new Error(error.message || `Resend API error: ${res.status}`);
  }

  return res.json();
}
