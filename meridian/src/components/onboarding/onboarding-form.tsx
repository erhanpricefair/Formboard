"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AU_STATES } from "@/lib/validation/onboarding";
import { submitOnboarding, type OnboardingActionState } from "@/actions/onboarding";
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

const STEP_TITLES = [
  "Let's start with you",
  "Your investing experience",
  "Budget and deposit",
  "Where are you looking?",
  "Growth or cash flow?",
  "How will you use the property?",
  "Your finance status",
  "Timeframe and review",
];

export function OnboardingForm({ referralSlug }: { referralSlug?: string }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [result, setResult] = useState<OnboardingActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalSteps = STEP_TITLES.length;
  const progress = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

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

  function next() {
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitOnboarding({
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
        financeStatus: form.financeStatus as FormState["financeStatus"] as never,
        timeframe: form.timeframe as never,
        referralSlug,
      });
      // A successful submission redirects server-side and never resolves
      // here with a value — only failure paths return a result object.
      if (res) setResult(res);
    });
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest text-[var(--color-muted)] uppercase">
          Step {step + 1} of {totalSteps}
        </p>
        <Progress value={progress} className="mt-2" />
      </div>

      <h1 className="font-serif text-2xl font-medium text-[var(--color-ink)]">
        {STEP_TITLES[step]}
      </h1>

      <div className="mt-8 space-y-5">
        {step === 0 && (
          <>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Jordan Smith"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="04XX XXX XXX"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <div className="grid gap-3">
            {(
              [
                { value: "first_property", label: "This is my first investment property" },
                { value: "experienced_investor", label: "I already own investment property" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("experience", opt.value)}
                className={cn(
                  "rounded-lg border p-4 text-left text-sm font-medium transition-colors",
                  form.experience === opt.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
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
            </div>
          </>
        )}

        {step === 3 && (
          <>
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
            </div>
            <div>
              <Label htmlFor="suburbs">Preferred suburbs (optional)</Label>
              <Input
                id="suburbs"
                value={form.preferredSuburbs}
                onChange={(e) => update("preferredSuburbs", e.target.value)}
                placeholder="Clyde North, Ripley (comma-separated)"
              />
            </div>
          </>
        )}

        {step === 4 && (
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={form.growthYieldScore}
              onChange={(e) => update("growthYieldScore", Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--color-muted)]">
              <span>Cash flow / yield focused</span>
              <span>Balanced</span>
              <span>Capital growth focused</span>
            </div>
            <p className="mt-6 text-sm text-[var(--color-muted)]">
              Currently: <span className="font-medium text-[var(--color-ink)]">{form.growthYieldScore}</span> / 100
              {" — "}
              {form.growthYieldScore >= 66
                ? "growth-focused"
                : form.growthYieldScore <= 33
                  ? "yield-focused"
                  : "balanced"}
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-3">
            {(
              [
                { value: "investment", label: "Investment property" },
                { value: "owner_occupier", label: "I plan to live in it" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("occupierIntent", opt.value)}
                className={cn(
                  "rounded-lg border p-4 text-left text-sm font-medium transition-colors",
                  form.occupierIntent === opt.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 6 && (
          <Select
            value={form.financeStatus}
            onChange={(e) => update("financeStatus", e.target.value as FormState["financeStatus"])}
          >
            <option value="" disabled>
              Select your finance status
            </option>
            <option value="pre_approved">Pre-approved</option>
            <option value="applying">Currently applying</option>
            <option value="not_started">Haven&apos;t started yet</option>
            <option value="cash_buyer">Cash buyer</option>
          </Select>
        )}

        {step === 7 && (
          <>
            <Select
              value={form.timeframe}
              onChange={(e) => update("timeframe", e.target.value as FormState["timeframe"])}
            >
              <option value="" disabled>
                Select your purchase timeframe
              </option>
              <option value="immediate">Ready now</option>
              <option value="within_3_months">Within 3 months</option>
              <option value="within_6_months">Within 6 months</option>
              <option value="within_12_months">Within 12 months</option>
              <option value="researching">Just researching</option>
            </Select>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
              <p>
                Budget up to{" "}
                <span className="font-medium text-[var(--color-ink)]">
                  {form.budgetMax ? formatCurrency(Number(form.budgetMax)) : "—"}
                </span>{" "}
                with{" "}
                <span className="font-medium text-[var(--color-ink)]">
                  {form.depositAvailable ? formatCurrency(Number(form.depositAvailable)) : "—"}
                </span>{" "}
                deposit in {form.preferredStates.join(", ") || "—"}.
              </p>
            </div>

            {result?.error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{result.error}</p>
            )}
          </>
        )}
      </div>

      <div className="mt-10 flex justify-between">
        <Button variant="outline" onClick={back} disabled={step === 0 || isPending}>
          Back
        </Button>
        {step < totalSteps - 1 ? (
          <Button variant="accent" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button variant="accent" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Finding your matches…" : "See my matched opportunities"}
          </Button>
        )}
      </div>
    </div>
  );
}
