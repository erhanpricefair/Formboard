"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME } from "@/lib/auth/roles";

// Investor accounts are created passwordless during onboarding (see
// actions/onboarding.ts) — there is no password to sign back in with, by
// design. Re-entry uses a one-time code emailed to the investor, per
// PRD FR-15 ("lightweight magic-link/OTP mechanism").
export function InvestorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestCode() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setError(error.message);
        return;
      }
      setStage("code");
    });
  }

  function verifyCode() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) {
        setError(error.message);
        return;
      }
      router.push(ROLE_HOME.investor);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">
        Sign in to your dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        We&rsquo;ll email you a one-time code — no password needed.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={stage === "code"}
          />
        </div>

        {stage === "code" && (
          <div>
            <Label htmlFor="code">6-digit code</Label>
            <Input
              id="code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        {stage === "email" ? (
          <Button variant="accent" className="w-full" onClick={requestCode} disabled={isPending || !email}>
            {isPending ? "Sending…" : "Send me a code"}
          </Button>
        ) : (
          <Button variant="accent" className="w-full" onClick={verifyCode} disabled={isPending || !code}>
            {isPending ? "Verifying…" : "Sign in"}
          </Button>
        )}
      </div>
    </div>
  );
}
