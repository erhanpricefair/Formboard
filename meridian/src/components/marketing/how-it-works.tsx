const STEPS = [
  {
    step: "01",
    title: "Tell us your investment goals",
    body: "A short questionnaire on budget, deposit, preferred locations, and whether you're chasing capital growth or cash flow.",
  },
  {
    step: "02",
    title: "Get matched, with reasons why",
    body: "Our matching engine shortlists vetted opportunities and explains, in plain language, why each one fits your criteria.",
  },
  {
    step: "03",
    title: "Speak with a licensed broker",
    body: "Book a strategy consultation to confirm finance and refine your shortlist — no pressure, no developer sales pitch.",
  },
  {
    step: "04",
    title: "Track every step to settlement",
    body: "The Settlement Accelerator keeps you and your broker aligned from contract through construction to handover.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[var(--color-paper)]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-[var(--color-muted)]">
            A guided path from first enquiry to keys in hand — not a
            listings wall you&rsquo;re left to navigate alone.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.step} className="border-t-2 border-[var(--color-accent)] pt-4">
              <span className="font-serif text-2xl text-[var(--color-accent)]">
                {s.step}
              </span>
              <h3 className="mt-3 text-base font-semibold text-[var(--color-ink)]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
