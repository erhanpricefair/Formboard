import { AssistantChat } from "@/components/broker/assistant-chat";

export default function BrokerAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">AI Assistant</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Ask about your clients or search published listings. It can look things up for you —
          it can&rsquo;t send anything or change any records.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
