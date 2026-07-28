"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AU_STATES } from "@/lib/validation/onboarding";
import { PROPERTY_TYPES } from "@/lib/validation/listing";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState(searchParams.get("state") ?? "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [minYield, setMinYield] = useState(searchParams.get("minYield") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (propertyType) params.set("type", propertyType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minYield) params.set("minYield", minYield);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clear() {
    setState("");
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setMinYield("");
    router.push(pathname);
  }

  return (
    <div className="grid gap-4 rounded-xl border border-[var(--color-border)] bg-white p-6 sm:grid-cols-5">
      <Select value={state} onChange={(e) => setState(e.target.value)}>
        <option value="">All states</option>
        {AU_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
        <option value="">All property types</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Input placeholder="Min price" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
      <Input placeholder="Max price" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      <Input
        placeholder="Min yield %"
        type="number"
        value={minYield}
        onChange={(e) => setMinYield(e.target.value)}
      />
      <div className="sm:col-span-5 flex gap-2">
        <Button variant="accent" size="sm" onClick={apply}>
          Apply filters
        </Button>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
