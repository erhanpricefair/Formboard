"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addServicePartner } from "@/actions/admin";
import type { ServicePartnerInput } from "@/lib/validation/service-partner";

const EMPTY = {
  partnerType: "",
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  defaultCommissionRate: "",
  notes: "",
};

export function AddServicePartnerForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState<{
    error?: string;
    fieldErrors?: Partial<Record<keyof ServicePartnerInput, string>>;
  }>({});
  const [isPending, startTransition] = useTransition();

  function update(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setState({});
    startTransition(async () => {
      const result = await addServicePartner({
        partnerType: form.partnerType as ServicePartnerInput["partnerType"],
        businessName: form.businessName,
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        defaultCommissionRate: form.defaultCommissionRate
          ? Number(form.defaultCommissionRate)
          : undefined,
        notes: form.notes || undefined,
      });
      if (result.error) {
        setState(result);
        return;
      }
      setForm(EMPTY);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--color-ink)]">Add a service partner</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="partnerType">Type</Label>
          <Select
            id="partnerType"
            value={form.partnerType}
            onChange={(e) => update("partnerType", e.target.value)}
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="conveyancer">Conveyancer</option>
            <option value="building_inspector">Building inspector</option>
            <option value="insurer">Insurer</option>
            <option value="property_manager">Property manager</option>
            <option value="other">Other</option>
          </Select>
          {state.fieldErrors?.partnerType && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.partnerType}</p>
          )}
        </div>
        <div>
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
          />
          {state.fieldErrors?.businessName && (
            <p className="mt-1 text-xs text-red-700">{state.fieldErrors.businessName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contactName">Contact name (optional)</Label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="partnerEmail">Email (optional)</Label>
          <Input
            id="partnerEmail"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="partnerPhone">Phone (optional)</Label>
          <Input id="partnerPhone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="commissionRate">Default commission rate % (optional)</Label>
          <Input
            id="commissionRate"
            type="number"
            value={form.defaultCommissionRate}
            onChange={(e) => update("defaultCommissionRate", e.target.value)}
          />
        </div>
      </div>

      {state.error && <p className="mt-4 text-sm text-red-700">{state.error}</p>}

      <Button variant="accent" className="mt-4" onClick={submit} disabled={isPending}>
        {isPending ? "Adding…" : "Add partner"}
      </Button>
    </div>
  );
}
