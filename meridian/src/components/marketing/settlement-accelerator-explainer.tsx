const STAGES = [
  "Investor Enquiry",
  "Strategy Consultation",
  "Finance Assessment",
  "Property Selection",
  "Contract Signed",
  "Construction Updates",
  "Settlement Preparation",
  "Handover",
  "Property Management",
];

export function SettlementAcceleratorExplainer() {
  return (
    <section id="settlement-accelerator" className="bg-[var(--color-ink)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-medium tracking-widest text-[var(--color-accent)] uppercase">
            Our signature process
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
            Settlement Accelerator&trade;
          </h2>
          <p className="mt-4 text-white/70">
            Every InvestorSource investor gets a single, shared journey tracker —
            visible to you and your broker — from the moment you enquire to
            the day your property is tenanted and managed. Nine stages,
            fully timestamped, nothing lost in a phone call or forgotten
            email thread.
          </p>
        </div>

        <ol className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-9">
          {STAGES.map((stage, i) => (
            <li key={stage} className="relative">
              <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[var(--color-accent)] text-xs font-semibold text-[var(--color-accent)]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white/90">
                  {stage}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
