"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AU_STATES } from "@/lib/validation/onboarding";
import { PROPERTY_TYPES, type ListingInput } from "@/lib/validation/listing";
import { createListing } from "@/actions/developer";

const EMPTY: ListingInput = {
  title: "",
  suburbName: "",
  state: "VIC",
  postcode: "",
  addressLine: "",
  landSizeSqm: 0,
  buildSizeSqm: 0,
  price: 0,
  depositRequired: 0,
  rentalEstimateWeekly: 0,
  growthDriverScore: 50,
  growthDrivers: [],
  nearbyInfrastructure: [],
  propertyType: "townhouse",
  completionStart: "",
  completionEnd: "",
};

export function CreateListingForm({ projectId }: { projectId: string }) {
  const [form, setForm] = useState<ListingInput>(EMPTY);
  const [driversText, setDriversText] = useState("");
  const [infraText, setInfraText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createListing(projectId, {
        ...form,
        growthDrivers: driversText.split(",").map((s) => s.trim()).filter(Boolean),
        nearbyInfrastructure: infraText.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Listing title</Label>
          <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="propertyType">Property type</Label>
          <Select
            id="propertyType"
            value={form.propertyType}
            onChange={(e) => update("propertyType", e.target.value as ListingInput["propertyType"])}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="addressLine">Address (optional)</Label>
        <Input id="addressLine" value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="suburbName">Suburb</Label>
          <Input id="suburbName" value={form.suburbName} onChange={(e) => update("suburbName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Select id="state" value={form.state} onChange={(e) => update("state", e.target.value as never)}>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" value={form.postcode} onChange={(e) => update("postcode", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="landSizeSqm">Land size (sqm)</Label>
          <Input
            id="landSizeSqm"
            type="number"
            value={form.landSizeSqm || ""}
            onChange={(e) => update("landSizeSqm", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="buildSizeSqm">Build size (sqm)</Label>
          <Input
            id="buildSizeSqm"
            type="number"
            value={form.buildSizeSqm || ""}
            onChange={(e) => update("buildSizeSqm", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">Price (AUD)</Label>
          <Input id="price" type="number" value={form.price || ""} onChange={(e) => update("price", Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="depositRequired">Deposit required</Label>
          <Input
            id="depositRequired"
            type="number"
            value={form.depositRequired || ""}
            onChange={(e) => update("depositRequired", Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="rentalEstimateWeekly">Est. weekly rent</Label>
          <Input
            id="rentalEstimateWeekly"
            type="number"
            value={form.rentalEstimateWeekly || ""}
            onChange={(e) => update("rentalEstimateWeekly", Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="growthDriverScore">Growth driver score (0–100)</Label>
        <Input
          id="growthDriverScore"
          type="number"
          min={0}
          max={100}
          value={form.growthDriverScore}
          onChange={(e) => update("growthDriverScore", Number(e.target.value))}
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Admin reviews this against comparable listings before approval — see ARCHITECTURE.md §5.2.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="drivers">Growth drivers (comma-separated tags)</Label>
          <Textarea
            id="drivers"
            value={driversText}
            onChange={(e) => setDriversText(e.target.value)}
            placeholder="rail_upgrade, new_town_centre"
          />
        </div>
        <div>
          <Label htmlFor="infra">Nearby infrastructure</Label>
          <Textarea
            id="infra"
            value={infraText}
            onChange={(e) => setInfraText(e.target.value)}
            placeholder="New train station, shopping precinct"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="completionStart">Estimated completion (from)</Label>
          <Input
            id="completionStart"
            type="date"
            value={form.completionStart}
            onChange={(e) => update("completionStart", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="completionEnd">Estimated completion (to)</Label>
          <Input
            id="completionEnd"
            type="date"
            value={form.completionEnd}
            onChange={(e) => update("completionEnd", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button variant="accent" onClick={submit} disabled={isPending}>
        {isPending ? "Saving…" : "Save as draft"}
      </Button>
    </div>
  );
}
