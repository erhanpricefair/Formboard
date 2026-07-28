"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which of my clients haven't finished onboarding yet?",
  "Find published houses in QLD under $650,000 with yield above 5%",
  "Summarise where my top client is up to",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/broker/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-[var(--color-border)] bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted)]">
              Ask about your clients or search published listings. Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm text-[var(--color-accent-ink)]"
                  : "max-w-[80%] whitespace-pre-wrap rounded-2xl bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-ink)]"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-muted)]">
              Thinking…
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t border-[var(--color-border)] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask about a client or search listings…"
          rows={2}
          disabled={isSending}
          className="flex-1 resize-none rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
        />
        <Button type="submit" variant="accent" disabled={isSending || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
