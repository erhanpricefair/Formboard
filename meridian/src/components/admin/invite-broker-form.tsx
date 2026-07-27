"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { inviteBroker } from "@/actions/admin";
import type { BrokerInviteInput } from "@/lib/validation/broker-invite";

const EMPTY: BrokerInviteInput = {
  email: "",
  fullName: "",
  agencyName: "",
  aclNumber: "",
};

export function InviteBrokerForm() {
  const router = useRouter();
  const [form, setForm] = useState<BrokerInviteInput>(EMPTY);
  const [state, setState] = useState<{
    error?: string;
    success?: string;
    fieldErrors?: Partial<Record<keyof BrokerInviteInput, string>>;
  }>({});
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof BrokerInviteInput>(key: K, value: BrokerInviteInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setState({});
    startTransition(async () => {
      const result = await inviteBroker(form);
      setState(result);
      if (result.success) {
        setForm(EMPTY);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-sm font-semibold text-[var(--color-ink)]">Invite a broker</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          They&rsquo;ll get an email to set their own password. You never see or send it.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            id="fullName"
            label="Full name"
            value={form.fullName}
            error={state.fieldErrors?.fullName}
            onChange={(v) => update("fullName", v)}
          />
          <Field
            id="email"
            label="Email"
            type="email"
            value={form.email}
            error={state.fieldErrors?.email}
            onChange={(v) => update("email", v)}
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
            label="ACL number (optional)"
            value={form.aclNumber ?? ""}
            error={state.fieldErrors?.aclNumber}
            onChange={(v) => update("aclNumber", v)}
          />
        </div>

        {state.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}
        {state.success && <p className="mt-4 text-sm text-emerald-700">{state.success}</p>}

        <Button variant="accent" className="mt-4" onClick={submit} disabled={isPending}>
          {isPending ? "Sending invite…" : "Send invite"}
        </Button>
      </CardContent>
    </Card>
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
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
