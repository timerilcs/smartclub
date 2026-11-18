export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  fromName?: string;
  fromEmail?: string;
  attachments?: { content: string; name: string }[];
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Échec de l'envoi de l'email");
  }
}
