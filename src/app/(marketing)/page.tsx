import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Melbourne launch
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">PropertyConnect</h1>
      <p className="max-w-md text-muted-foreground">
        Scaffold in progress — consumer intake journeys, partner workspace, and
        admin console are not yet built. See docs/PRD.md and docs/ARCHITECTURE.md.
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild>
          <Link href="/sell">Sell a property</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Partner / admin sign in</Link>
        </Button>
      </div>
    </main>
  );
}
