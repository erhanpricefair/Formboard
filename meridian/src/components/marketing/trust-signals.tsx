import { ShieldCheck, FileCheck2, Scale, Eye } from "lucide-react";

const SIGNALS = [
  {
    icon: ShieldCheck,
    title: "Every opportunity vetted",
    body: "No listing reaches you without passing our admin review — documentation, pricing sanity, and developer standing are checked before publication.",
  },
  {
    icon: Scale,
    title: "Independent, not the developer",
    body: "We are a marketplace, not a seller. Every project is clearly attributed to its actual developer — we never hold stock or sit as vendor.",
  },
  {
    icon: FileCheck2,
    title: "Licensed brokers, not sales reps",
    body: "Finance conversations are handled by licensed mortgage brokers, not commission-driven developer sales teams.",
  },
  {
    icon: Eye,
    title: "Full visibility, always",
    body: "From first enquiry to handover, the Settlement Accelerator shows you exactly where things stand — nothing happens in the dark.",
  },
];

export function TrustSignals() {
  return (
    <section className="border-y border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNALS.map((signal) => (
            <div key={signal.title}>
              <signal.icon className="h-6 w-6 text-[var(--color-accent)]" />
              <h3 className="mt-4 text-sm font-semibold text-[var(--color-ink)]">
                {signal.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {signal.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
