"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerBroker } from "@/actions/broker-signup";
import type { BrokerSignupInput } from "@/lib/validation/broker-invite";

const EMPTY: BrokerSignupInput = {
  fullName: "",
  email: "",
  phone: "",
  agencyName: "",
  aclNumber: "",
  password: "",
};

export function BrokerSignupForm() {
  const router = useRouter();
  const [form, setForm] = useState<BrokerSignupInput>(EMPTY);
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<{
    error?: string;
    fieldErrors?: Partial<Record<keyof BrokerSignupInput, string>>;
  }>({});
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof BrokerSignupInput>(key: K, value: BrokerSignupInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setState({});

    if (form.password !== confirm) {
      setState({ fieldErrors: { password: "Passwords do not match." } });
      return;
    }

    startTransition(async () => {
      const result = await registerBroker(form);
      if (!result.success) {
        setState(result);
        return;
      }

      // Sign in with the credentials just created so the pending-approval
      // screen is reachable without asking them to type it all again.
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        // Account exists regardless — send them to the login page rather
        // than implying registration failed.
        router.push("/broker-login");
        return;
      }

      router.push("/broker/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">
        Create your broker account
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Register your agency to refer clients and track their settlement journey. Accounts are
        reviewed before portal access is granted.
      </p>

      <div className="mt-8 space-y-4">
        <Field
          id="fullName"
          label="Full name"
          value={form.fullName}
          error={state.fieldErrors?.fullName}
          onChange={(v) => update("fullName", v)}
        />
        <Field
          id="email"
          label="Work email"
          type="email"
          value={form.email}
          error={state.fieldErrors?.email}
          onChange={(v) => update("email", v)}
        />
        <Field
          id="phone"
          label="Phone (optional)"
          value={form.phone ?? ""}
          error={state.fieldErrors?.phone}
          onChange={(v) => update("phone", v)}
        />
        <Field
          id="agencyName"
          label="Agency name"
          value={form.agencyName}
          error={state.fieldErrors?.agencyName}
          onChange={(v) => update("agencyName", v)}
        />
        <Field
          id="aclNumber"
          label="ACL / credit representative number (optional)"
          value={form.aclNumber ?? ""}
          error={state.fieldErrors?.aclNumber}
          onChange={(v) => update("aclNumber", v)}
        />
        <div>
          <Field
            id="password"
            label="Password"
            type="password"
            value={form.password}
            error={state.fieldErrors?.password}
            onChange={(v) => update("password", v)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">At least 8 characters.</p>
        </div>
        <Field
          id="confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
        />

        {state.error && <p className="text-sm text-red-700">{state.error}</p>}

        <Button variant="accent" className="w-full" onClick={submit} disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-[var(--color-muted)]">
          Already registered?{" "}
          <Link href="/broker-login" className="text-[var(--color-accent-ink)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={type === "password" ? "new-password" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
