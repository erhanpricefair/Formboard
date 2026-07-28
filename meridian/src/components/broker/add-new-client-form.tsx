"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AU_STATES } from "@/lib/validation/onboarding";
import { addClientDirectly } from "@/actions/broker";
import type { BrokerClientIntakeInput } from "@/lib/validation/broker-client-intake";
import { cn, formatCurrency } from "@/lib/utils";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  experience: "first_property" | "experienced_investor" | "";
  budgetMax: string;
  depositAvailable: string;
  preferredStates: string[];
  preferredSuburbs: string;
  growthYieldScore: number;
  occupierIntent: "investment" | "owner_occupier";
  financeStatus: "pre_approved" | "applying" | "not_started" | "cash_buyer" | "";
  timeframe:
    | "immediate"
    | "within_3_months"
    | "within_6_months"
    | "within_12_months"
    | "researching"
    | "";
};

const INITIAL_STATE: FormState = {
  fullName: "",
  email: "",
  phone: "",
  experience: "",
  budgetMax: "",
  depositAvailable: "",
  preferredStates: [],
  preferredSuburbs: "",
  growthYieldScore: 50,
  occupierIntent: "investment",
  financeStatus: "",
  timeframe: "",
};

export function AddNewClientForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BrokerClientIntakeInput, string>>
  >({});
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleState(state: string) {
    setForm((prev) => ({
      ...prev,
      preferredStates: prev.preferredStates.includes(state)
        ? prev.preferredStates.filter((s) => s !== state)
        : [...prev.preferredStates, state],
    }));
  }

  function submit() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await addClientDirectly({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        experience: form.experience as "first_property" | "experienced_investor",
        budgetMax: Number(form.budgetMax),
        depositAvailable: Number(form.depositAvailable),
        preferredStates: form.preferredStates as never,
        preferredSuburbs: form.preferredSuburbs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        growthYieldScore: form.growthYieldScore,
        occupierIntent: form.occupierIntent,
        financeStatus: form.financeStatus as
          | "pre_approved"
          | "applying"
          | "not_started"
          | "cash_buyer",
        timeframe: form.timeframe as BrokerClientIntakeInput["timeframe"],
      });

      if (result.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setForm(INITIAL_STATE);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="fullName"
          label="Full name"
          value={form.fullName}
          error={fieldErrors.fullName}
          onChange={(v) => update("fullName", v)}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={form.email}
          error={fieldErrors.email}
          onChange={(v) => update("email", v)}
        />
        <Field
          id="phone"
          label="Phone (optional)"
          value={form.phone}
          error={fieldErrors.phone}
          onChange={(v) => update("phone", v)}
        />
        <div>
          <Label htmlFor="budgetMax">Maximum budget (AUD)</Label>
          <Input
            id="budgetMax"
            type="number"
            inputMode="numeric"
            value={form.budgetMax}
            onChange={(e) => update("budgetMax", e.target.value)}
            placeholder="700000"
          />
          {fieldErrors.budgetMax && <p className="mt-1 text-xs text-red-700">{fieldErrors.budgetMax}</p>}
        </div>
        <div>
          <Label htmlFor="depositAvailable">Deposit available (AUD)</Label>
          <Input
            id="depositAvailable"
            type="number"
            inputMode="numeric"
            value={form.depositAvailable}
            onChange={(e) => update("depositAvailable", e.target.value)}
            placeholder="70000"
          />
          {fieldErrors.depositAvailable && (
            <p className="mt-1 text-xs text-red-700">{fieldErrors.depositAvailable}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Experience</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: "first_property", label: "First investment property" },
              { value: "experienced_investor", label: "Already owns investment property" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("experience", opt.value)}
              className={cn(
                "rounded-lg border p-3 text-left text-sm font-medium transition-colors",
                form.experience === opt.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                  : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-accent)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {fieldErrors.experience && <p className="mt-1 text-xs text-red-700">{fieldErrors.experience}</p>}
      </div>

      <div>
        <Label>Preferred state(s)</Label>
        <div className="flex flex-wrap gap-2">
          {AU_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleState(s)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                form.preferredStates.includes(s)
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                  : "border-[var(--color-border)] bg-white text-[var(--color-ink)]"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {fieldErrors.preferredStates && (
          <p className="mt-1 text-xs text-red-700">{fieldErrors.preferredStates}</p>
        )}
      </div>

      <Field
        id="suburbs"
        label="Preferred suburbs (optional)"
        value={form.preferredSuburbs}
        onChange={(v) => update("preferredSuburbs", v)}
        placeholder="Clyde North, Ripley (comma-separated)"
      />

      <div>
        <Label>Growth vs. yield preference</Label>
        <input
          type="range"
          min={0}
          max={100}
          value={form.growthYieldScore}
          onChange={(e) => update("growthYieldScore", Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="flex justify-between text-xs text-[var(--color-muted)]">
          <span>Yield focused</span>
          <span>Balanced</span>
          <span>Growth focused</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Intent</Label>
          <div className="grid gap-2">
            {(
              [
                { value: "investment", label: "Investment property" },
                { value: "owner_occupier", label: "Plans to live in it" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("occupierIntent", opt.value)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm font-medium transition-colors",
                  form.occupierIntent === opt.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="financeStatus">Finance status</Label>
            <Select
              id="financeStatus"
              value={form.financeStatus}
              onChange={(e) => update("financeStatus", e.target.value as FormState["financeStatus"])}
            >
              <option value="" disabled>
                Select finance status
              </option>
              <option value="pre_approved">Pre-approved</option>
              <option value="applying">Currently applying</option>
              <option value="not_started">Hasn&apos;t started yet</option>
              <option value="cash_buyer">Cash buyer</option>
            </Select>
            {fieldErrors.financeStatus && (
              <p className="mt-1 text-xs text-red-700">{fieldErrors.financeStatus}</p>
            )}
          </div>
          <div>
            <Label htmlFor="timeframe">Purchase timeframe</Label>
            <Select
              id="timeframe"
              value={form.timeframe}
              onChange={(e) => update("timeframe", e.target.value as FormState["timeframe"])}
            >
              <option value="" disabled>
                Select timeframe
              </option>
              <option value="immediate">Ready now</option>
              <option value="within_3_months">Within 3 months</option>
              <option value="within_6_months">Within 6 months</option>
              <option value="within_12_months">Within 12 months</option>
              <option value="researching">Just researching</option>
            </Select>
            {fieldErrors.timeframe && <p className="mt-1 text-xs text-red-700">{fieldErrors.timeframe}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
        Budget up to{" "}
        <span className="font-medium text-[var(--color-ink)]">
          {form.budgetMax ? formatCurrency(Number(form.budgetMax)) : "—"}
        </span>{" "}
        with{" "}
        <span className="font-medium text-[var(--color-ink)]">
          {form.depositAvailable ? formatCurrency(Number(form.depositAvailable)) : "—"}
        </span>{" "}
        deposit{form.preferredStates.length > 0 ? ` in ${form.preferredStates.join(", ")}` : ""}.
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button variant="accent" onClick={submit} disabled={isPending}>
        {isPending ? "Adding client…" : "Add client and find matches"}
      </Button>
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
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
