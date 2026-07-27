"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";

// Email+password sign-in for broker, developer, and admin accounts, per
// PRD FR-15 ("broker, developer, or admin account... login requires
// email+password"). Account creation for these roles is an admin/ops
// action, out of scope for this pass — see ARCHITECTURE.md build order.
export function PasswordLoginForm({ role, title }: { role: Exclude<UserRole, "investor">; title: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function signIn() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      const actualRole = data.user?.user_metadata?.role as UserRole | undefined;
      router.push(actualRole ? ROLE_HOME[actualRole] : ROLE_HOME[role]);
      router.refresh();
    });
  }

  function resetPassword() {
    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError("Enter your email address first, then choose “Forgot password”.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      // Reuses the invite landing page — same job, same session-from-link
      // handling (see components/auth/set-password-form.tsx).
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      });
      // Deliberately unconditional: revealing whether an address has an
      // account here would turn this form into an account-enumeration tool.
      setNotice("If that email has an account, a reset link is on its way.");
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">{title}</h1>

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {notice && <p className="text-sm text-emerald-700">{notice}</p>}

        <Button variant="accent" className="w-full" onClick={signIn} disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>

        <button
          type="button"
          onClick={resetPassword}
          disabled={isPending}
          className="w-full text-center text-sm text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline disabled:opacity-50"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
