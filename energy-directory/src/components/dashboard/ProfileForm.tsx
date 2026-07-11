"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { professionalProfileSchema, AU_STATES, PROFESSIONAL_CATEGORIES, type ProfessionalProfileInput } from "@/lib/validations/professional";
import { categoryLabel } from "@/lib/categories";

export function ProfileForm({ defaultValues }: { defaultValues?: Partial<ProfessionalProfileInput> }) {
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalProfileInput>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: { serviceAreaPostcodes: [], categories: [], ...defaultValues },
  });

  async function onSubmit(values: ProfessionalProfileInput) {
    setServerError(null);
    setSaved(false);
    const res = await fetch("/api/professionals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await res.json();
    if (!res.ok) {
      setServerError(payload.error ?? "Couldn’t save profile.");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Profile text is automatically checked against Australian Consumer Law guidance. Avoid absolute claims like
        “guaranteed savings,” “best installer,” or “100% risk-free” — describe what you do, not superlatives about
        how good you are at it.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Business name</label>
          <input {...register("businessName")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
          {errors.businessName && <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">ABN</label>
          <input {...register("abn")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
          {errors.abn && <p className="mt-1 text-xs text-red-600">{errors.abn.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Suburb</label>
          <input {...register("suburb")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
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
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input {...register("phone")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Public email</label>
          <input {...register("publicEmail")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Service categories</label>
        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROFESSIONAL_CATEGORIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={c} {...register("categories")} />
              {categoryLabel(c)}
            </label>
          ))}
        </div>
        {errors.categories && <p className="mt-1 text-xs text-red-600">{errors.categories.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Tagline (max 140 chars)</label>
        <input {...register("tagline")} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
        {errors.tagline && <p className="mt-1 text-xs text-red-600">{errors.tagline.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium">Bio</label>
        <textarea {...register("bio")} rows={5} className="mt-1 w-full rounded-md border border-ink-700/20 px-3 py-2" />
        {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {saved && <p className="text-sm text-brand-700">Saved. Changes are reviewed before appearing publicly if this is a new profile.</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
