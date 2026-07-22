const PLACEHOLDER_PARTNERS = [
  "Northbank Communities",
  "Harrow & Vale",
  "Clearwater Estates",
  "Selborne Group",
  "Ashfield Developments",
];

export function DeveloperPartners() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p className="text-center text-xs font-medium tracking-widest text-[var(--color-muted)] uppercase">
          Opportunities sourced from vetted development partners
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {PLACEHOLDER_PARTNERS.map((name) => (
            <span
              key={name}
              className="font-serif text-lg text-[var(--color-ink)]/50"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
