import { Card, CardContent } from "@/components/ui/card";

export default function DeveloperDashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-[var(--color-ink)]">
        Developer dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Your authenticated developer account is wired up. Project/listing
        submission with media and document upload (FR-8) builds on this
        shell in the next implementation pass.
      </p>
      <Card className="mt-6">
        <CardContent className="pt-6 text-sm text-[var(--color-muted)]">
          Coming next: create projects, submit listings for admin review,
          and track approval status.
        </CardContent>
      </Card>
    </div>
  );
}
