"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";

type LinkState = "checking" | "valid" | "invalid";

/**
 * Landing page for the Supabase invite email (see actions/admin.ts
 * inviteBroker). The invite link hits Supabase's /auth/v1/verify, which
 * redirects here with the session in the URL — createBrowserClient's
 * detectSessionInUrl picks that up during initialisation, so by the time
 * getSession() resolves the user is authenticated and can set a password.
 * The `code` branch below covers projects configured for the PKCE-style
 * email flow, where an explicit exchange is required instead.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    async function resolveSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setLinkState("valid");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          setLinkState("valid");
          return;
        }
      }

      setLinkState("invalid");
    }

    resolveSession();
  }, []);

  function submit() {
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const role = data.user?.user_metadata?.role as UserRole | undefined;
      router.push(role ? ROLE_HOME[role] : "/login");
      router.refresh();
    });
  }

  if (linkState === "checking") {
    return (
      <div className="mx-auto max-w-sm px-6 py-20">
        <p className="text-sm text-[var(--color-muted)]">Checking your invite link…</p>
      </div>
    );
  }

  if (linkState === "invalid") {
    return (
      <div className="mx-auto max-w-sm px-6 py-20">
        <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">
          This invite link has expired
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Invite links can only be used once and expire after 24 hours. Ask your InvestorSource
          contact to send a new invite.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">
        Set your password
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Choose a password to finish setting up your account.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">At least 8 characters.</p>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button variant="accent" className="w-full" onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : "Set password and continue"}
        </Button>
      </div>
    </div>
  );
}
