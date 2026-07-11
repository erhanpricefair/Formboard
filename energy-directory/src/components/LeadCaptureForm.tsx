"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadCaptureSchema, type LeadCaptureInput } from "@/lib/validations/lead";
import { AU_STATES, PROFESSIONAL_CATEGORIES } from "@/lib/validations/professional";
import { categoryLabel } from "@/lib/categories";
import { TransparencyNotice } from "@/components/TransparencyNotice";

type Stage = "form" | "verify" | "done";

export function LeadCaptureForm({
  professionalId,
  defaultServiceType,
  privacyPolicyVersion,
}: {
  professionalId: string;
  defaultServiceType?: (typeof PROFESSIONAL_CATEGORIES)[number];
  privacyPolicyVersion: string;
}) {
  const [stage, setStage] = useState<Stage>("form");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadCaptureInput>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: {
      serviceType: defaultServiceType,
      consentMarketing: false,
      privacyPolicyVersion,
    },
  });

  async function onSubmit(values: LeadCaptureInput) {
    setSubmitError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, professionalId }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setSubmitError(payload.error ?? "Something went wrong. Please try again.");
      return;
    }
    setLeadId(payload.leadId);
    setStage("verify");
  }

  async function onVerify() {
    if (!leadId) return;
    setVerifying(true);
    setVerifyError(null);
    const res = await fetch("/api/leads/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, professionalId, code }),
    });
    const payload = await res.json();
    setVerifying(false);
    if (!res.ok) {
      setVerifyError(payload.error ?? "Verification failed.");
      return;
    }
    setStage("done");
  }

  if (stage === "done") {
    return (
      <div className="rounded-lg border border-brand-100 bg-brand-50 p-6">
        <h3 className="text-lg font-semibold text-brand-700">Enquiry sent</h3>
        <p className="mt-2 text-sm text-ink-700">
          Your details have been forwarded to this professional. They typically respond within a few business days.
          You have not paid anything and this is not a booking confirmation.
        </p>
        <div className="mt-4">
          <TransparencyNotice compact />
        </div>
      </div>
    );
  }

  if (stage === "verify") {
    return (
      <div className="rounded-lg border border-ink-700/10 bg-white p-6">
        <h3 className="text-lg font-semibold">Verify your phone number</h3>
        <p className="mt-1 text-sm text-ink-500">
          We texted a 6-digit code to confirm this enquiry is genuinely from you before it’s shared.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-32 rounded-md border border-ink-700/20 px-3 py-2 text-center text-lg tracking-widest"
          />
          <button
            type="button"
            onClick={onVerify}
            disabled={code.length !== 6 || verifying}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {verifying ? "Verifying…" : "Verify"}
          </button>
        </div>
        {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-ink-700/10 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Full name</label>
          <input {...register("fullName")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
          {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input {...register("email")} type="email" className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Mobile</label>
          <input {...register("phone")} placeholder="04xx xxx xxx" className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Service needed</label>
          <select {...register("serviceType")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2">
            {PROFESSIONAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Suburb</label>
          <input {...register("suburb")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
          {errors.suburb && <p className="mt-1 text-xs text-red-600">{errors.suburb.message}</p>}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium">State</label>
            <select {...register("state")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2">
              {AU_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-sm font-medium">Postcode</label>
            <input {...register("postcode")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
            {errors.postcode && <p className="mt-1 text-xs text-red-600">{errors.postcode.message}</p>}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Tell us about your project (optional)</label>
        <textarea {...register("projectDetails")} rows={3} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
      </div>

      {/* Honeypot — hidden from real users, not via display:none (bots skip that) */}
      <input {...register("website")} tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />

      <div className="space-y-2 border-t border-ink-700/10 pt-4">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("consentContact")} className="mt-1" />
          <span>
            I consent to being contacted about my enquiry by a matched professional. <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.consentContact && <p className="text-xs text-red-600">{errors.consentContact.message}</p>}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("consentDataShare")} className="mt-1" />
          <span>
            I consent to my contact details and enquiry being shared with the professional whose profile this is.{" "}
            <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.consentDataShare && <p className="text-xs text-red-600">{errors.consentDataShare.message}</p>}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("consentMarketing")} className="mt-1" />
          <span>Send me occasional home-energy tips and offers by email (optional — you can unsubscribe anytime).</span>
        </label>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send my enquiry"}
      </button>

      <TransparencyNotice compact />
    </form>
  );
}
