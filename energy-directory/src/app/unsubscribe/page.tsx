"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleUnsubscribe(scope: "marketing" | "all") {
    setStatus("loading");
    const res = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, scope }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (!token) {
    return <p className="max-w-md text-sm text-ink-500">This unsubscribe link is missing its token. Please use the link from your email.</p>;
  }

  if (status === "done") {
    return (
      <div className="max-w-md">
        <h1 className="text-xl font-semibold">You’re unsubscribed</h1>
        <p className="mt-2 text-sm text-ink-500">We’ve recorded your request. It may take a short while to fully take effect.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold">Manage your preferences</h1>
      <p className="mt-2 text-sm text-ink-500">Choose what you’d like to stop receiving.</p>
      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={() => handleUnsubscribe("marketing")}
          disabled={status === "loading"}
          className="rounded-md border border-ink-700/20 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Stop marketing emails only
        </button>
        <button
          onClick={() => handleUnsubscribe("all")}
          disabled={status === "loading"}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Withdraw all consent and archive my enquiry
        </button>
      </div>
      {status === "error" && <p className="mt-3 text-sm text-red-600">Something went wrong. Please try again.</p>}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeForm />
    </Suspense>
  );
}
