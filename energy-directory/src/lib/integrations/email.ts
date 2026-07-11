import "server-only";

export interface EmailProvider {
  send(params: { to: string; subject: string; text: string }): Promise<void>;
}

/** Dev fallback: logs instead of sending. Used whenever RESEND_API_KEY is unset. */
class ConsoleEmailProvider implements EmailProvider {
  async send(params: { to: string; subject: string; text: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[dev email] to=${params.to} subject="${params.subject}"\n${params.text}`);
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}

  async send(params: { to: string; subject: string; text: string }): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
      }),
    });

    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
    }
  }
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_VERIFICATION_FROM_EMAIL;

  if (apiKey && from) {
    return new ResendEmailProvider(apiKey, from);
  }
  return new ConsoleEmailProvider();
}
