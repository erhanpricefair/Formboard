"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordListingImage, recordListingDocument } from "@/actions/developer";

export function MediaUploader({
  listingId,
  kind,
}: {
  listingId: string;
  kind: "image" | "document";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const bucket = kind === "image" ? "listing-images" : "listing-documents";
      const path = `${listingId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      try {
        if (kind === "image") {
          await recordListingImage(listingId, path, false);
        } else {
          await recordListingDocument(listingId, path, "brochure", file.name);
        }
        router.refresh();
      } catch {
        setError("Uploaded, but could not save the record. Please refresh and try again.");
      }
    });
  }

  return (
    <div>
      <label className="inline-block">
        <span className="sr-only">Upload {kind}</span>
        <input
          type="file"
          accept={kind === "image" ? "image/png,image/jpeg,image/webp" : "application/pdf"}
          onChange={handleFile}
          disabled={isPending}
          className="text-sm text-[var(--color-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--color-ink-hover)]"
        />
      </label>
      {isPending && <p className="mt-1 text-xs text-[var(--color-muted)]">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

