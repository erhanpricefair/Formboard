import { Card, CardContent } from "@/components/ui/card";

const REASONS = [
  {
    title: "Curated, not overwhelming",
    body: "A handful of well-explained matches beats two hundred undifferentiated listings. We filter so you don't have to.",
  },
  {
    title: "One journey, always visible",
    body: "Your Settlement Accelerator status answers 'where are we up to?' at any point — for you and your broker.",
  },
  {
    title: "No developer sales pressure",
    body: "You deal with your broker and InvestorSource, not an in-house sales team incentivised to close you on their own stock.",
  },
  {
    title: "Built for real numbers",
    body: "Yield, growth drivers, and completion timelines are shown plainly — comparable side by side, not buried in a brochure.",
  },
];

export function WhyInvestors() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl font-medium text-[var(--color-ink)] sm:text-4xl">
            Why investors use InvestorSource
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {REASONS.map((r) => (
            <Card key={r.title} className="border-[var(--color-border)]">
              <CardContent className="pt-6">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {r.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
