const TESTIMONIALS = [
  {
    quote:
      "I'd looked at a dozen off-the-plan listings sites and felt sold to every time. Meridian was the first that explained why a property suited us instead of just listing it.",
    name: "David R.",
    role: "First-time investor, NSW",
  },
  {
    quote:
      "The Settlement Accelerator meant I never had to chase my client for updates — I could see exactly where they were in the process and step in at the right moments.",
    name: "Maria T.",
    role: "Mortgage broker, VIC",
  },
  {
    quote:
      "As a cash-flow-focused investor I wanted hard numbers, fast. The comparison tool and yield filters got me to a shortlist in an afternoon.",
    name: "Priya S.",
    role: "Experienced investor, QLD",
  },
];

export function Testimonials() {
  return (
    <section className="bg-[var(--color-paper)]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <h2 className="font-serif text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
          What our investors and brokers say
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-xl border border-[var(--color-border)] bg-white p-6"
            >
              <blockquote className="text-sm leading-relaxed text-[var(--color-ink)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-xs text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-ink)]">{t.name}</span>
                {" — "}
                {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
