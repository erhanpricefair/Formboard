"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-ink-500">We sent a magic sign-in link to {email}.</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold">Professional login</h1>
      <p className="mt-2 text-sm text-ink-500">Sign in to manage your profile and update lead status.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com.au"
          className="w-full rounded-md border border-ink-700/20 px-3 py-2"
        />
        <button type="submit" className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Send magic link
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
