"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AU_STATES } from "@/lib/validation/onboarding";
import { createProject } from "@/actions/developer";

export function CreateProjectForm() {
  const [name, setName] = useState("");
  const [state, setState] = useState<(typeof AU_STATES)[number] | "">("");
  const [suburb, setSuburb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!state) {
      setError("Select a state");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createProject({ name, primaryState: state, primarySuburb: suburb });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="projectName">Project name</Label>
        <Input id="projectName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="projectState">State</Label>
        <Select id="projectState" value={state} onChange={(e) => setState(e.target.value as never)}>
          <option value="" disabled>
            Select
          </option>
          {AU_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="projectSuburb">Primary suburb (optional)</Label>
        <Input id="projectSuburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
      </div>
      {error && <p className="sm:col-span-3 text-sm text-red-700">{error}</p>}
      <div className="sm:col-span-3">
        <Button variant="accent" onClick={submit} disabled={isPending || !name}>
          {isPending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </div>
  );
}
