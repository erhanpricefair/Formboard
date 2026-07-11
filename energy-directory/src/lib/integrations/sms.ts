import "server-only";

export interface SmsProvider {
  send(params: { to: string; body: string }): Promise<void>;
}

/** Dev fallback: logs instead of sending. Used whenever Twilio env vars are unset. */
class ConsoleSmsProvider implements SmsProvider {
  async send(params: { to: string; body: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[dev sms] to=${params.to}\n${params.body}`);
  }
}

class TwilioSmsProvider implements SmsProvider {
  constructor(private accountSid: string, private authToken: string, private from: string) {}

  async send(params: { to: string; body: string }): Promise<void> {
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: params.to, From: this.from, Body: params.body }),
    });

    if (!res.ok) {
      throw new Error(`Twilio send failed: ${res.status} ${await res.text()}`);
    }
  }
}

export function getSmsProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    return new TwilioSmsProvider(sid, token, from);
  }
  return new ConsoleSmsProvider();
}
