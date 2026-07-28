import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildBrokerAssistantTools } from "@/lib/ai/broker-assistant-tools";

export const maxDuration = 60;

const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_PROMPT = `You are the AI assistant inside InvestorSource's broker portal, helping a
mortgage broker work their client roster. You have read-only tools to look
up the broker's clients and search published property listings — use them
rather than guessing. Never invent listing IDs, prices, or client details;
if a tool returns nothing useful, say so plainly. Keep answers concise and
practical for someone working through a client list, not a general property
chatbot. You cannot take actions (no sending emails, no changing records) —
only look things up and advise.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "The AI assistant isn't configured yet (missing ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Same authorisation shape as every other broker action: verified
  // against profiles.role + broker_profiles.is_active, not metadata.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "broker") return new Response("Forbidden", { status: 403 });

  const { data: brokerProfile } = await supabase
    .from("broker_profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!brokerProfile?.is_active) return new Response("Forbidden", { status: 403 });

  const body = (await request.json().catch(() => null)) as { messages?: ChatMessage[] } | null;
  const history = (body?.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );
  if (history.length === 0) {
    return Response.json({ error: "No message provided." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const tools = buildBrokerAssistantTools(supabase, user.id);

  try {
    const finalMessage = await client.beta.messages.toolRunner({
      model: "claude-opus-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages: history.slice(-MAX_HISTORY_MESSAGES).map((m) => ({ role: m.role, content: m.content })),
    });

    const text = finalMessage.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return Response.json({ reply: text || "I wasn't able to come up with a response for that." });
  } catch (error) {
    console.error("[broker/assistant] tool runner failed:", error);
    return Response.json(
      { error: "The assistant hit an error. Please try again." },
      { status: 502 }
    );
  }
}
