export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "BREVO_API_KEY not configured" });
    return;
  }

  const { to, toName, subject, text, fromName, attachments } = req.body || {};

  if (!to || !subject || !text) {
    res.status(400).json({ error: "Missing required fields: to, subject, text" });
    return;
  }

  const senderName = fromName || "SmartClub";
  const htmlContent = text.replace(/\n/g, "<br>");

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: process.env.MAIL_FROM || "no-reply@smartclub.pf" },
      replyTo: { email: process.env.MAIL_REPLY_TO || "contact@smartclub.pf", name: "SmartClub" },
      to: [{ email: to, name: toName || "" }],
      subject,
      textContent: text,
      htmlContent: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${htmlContent}</div>`,
      ...(attachments && attachments.length > 0 ? {
        attachment: attachments.map((a: { content: string; name: string }) => ({ content: a.content, name: a.name })),
      } : {}),
    }),
  });

  if (!brevoRes.ok) {
    const err = await brevoRes.json().catch(() => ({}));
    res.status(500).json({ error: "Brevo error", details: err });
    return;
  }

  res.status(200).json({ success: true });
}
