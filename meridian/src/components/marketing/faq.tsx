const FAQS = [
  {
    q: "Is Meridian the developer or seller of these properties?",
    a: "No. Meridian is an independent marketplace. Every opportunity is sourced from, and sold by, its actual developer — we match and guide, we never hold stock or act as vendor.",
  },
  {
    q: "Does it cost anything to use Meridian as an investor?",
    a: "No. There is no charge to complete the questionnaire, view matches, or speak with a broker. Meridian is compensated by developer partnerships and broker referral arrangements, not by investors.",
  },
  {
    q: "Will I be pressured to buy?",
    a: "No. Your broker's role is to help you assess whether an opportunity fits your finance and goals — not to close a sale on behalf of a developer's sales team.",
  },
  {
    q: "What is the Settlement Accelerator?",
    a: "It's our nine-stage journey tracker, visible to you and your broker, covering everything from your first enquiry through to construction updates, settlement, and handover.",
  },
  {
    q: "Do I need to already have finance sorted?",
    a: "No. Your finance status is one of the questions we ask, and 'not started' is a completely normal answer — your broker will help assess and progress it.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Match explanations and platform content are general information only. Personal financial or credit advice is provided by your licensed broker, not by Meridian.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <h2 className="font-serif text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-10 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--color-ink)]">
                {item.q}
                <span className="ml-4 text-[var(--color-accent)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
