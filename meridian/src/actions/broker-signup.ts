"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmin } from "@/lib/email/notify";
import {
  brokerSignupSchema,
  slugifyAgency,
  type BrokerSignupInput,
} from "@/lib/validation/broker-invite";

export interface BrokerSignupState {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<keyof BrokerSignupInput, string>>;
}

/**
 * Public, unauthenticated broker registration (/broker-signup).
 *
 * Deliberately isolated in its own file: unlike everything in
 * actions/broker.ts, this runs for anyone on the internet, so the input
 * is treated as hostile and the resulting account is created with
 * is_active = false. A broker can see their linked investors' contact
 * details, budget, and finance status, so portal access is granted by an
 * admin in Admin > Brokers — never by the act of signing up.
 */
export async function registerBroker(input: BrokerSignupInput): Promise<BrokerSignupState> {
  const parsed = brokerSignupSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: BrokerSignupState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof BrokerSignupInput] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();
  if (existing) {
    return {
      error: "An account already exists with that email address. Try signing in instead.",
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      role: "broker",
      full_name: data.fullName,
      phone: data.phone ?? null,
    },
  });

  if (createError || !created?.user) {
    console.error("[registerBroker] createUser failed:", createError);
    return { error: createError?.message ?? "Could not create your account. Please try again." };
  }

  await admin
    .from("profiles")
    .update({ role: "broker", full_name: data.fullName, phone: data.phone ?? null })
    .eq("id", created.user.id);

  const baseSlug = slugifyAgency(data.agencyName);
  let slug = baseSlug;
  for (let attempt = 2; attempt <= 20; attempt++) {
    const { data: taken } = await admin
      .from("broker_profiles")
      .select("id")
      .eq("referral_link_slug", slug)
      .maybeSingle();
    if (!taken) break;
    slug = `${baseSlug}-${attempt}`;
  }

  const { error: profileError } = await admin.from("broker_profiles").insert({
    id: created.user.id,
    agency_name: data.agencyName,
    acl_number: data.aclNumber || null,
    referral_link_slug: slug,
    is_active: false,
  });

  if (profileError) {
    console.error("[registerBroker] broker_profiles insert failed:", profileError);
    // Roll the auth user back so a retry isn't blocked by the
    // "email already exists" check above on a half-created account.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Could not complete your registration. Please try again." };
  }

  await notifyAdmin(
    `Broker registration pending approval: ${data.agencyName}`,
    `<p><strong>${data.fullName}</strong> registered as a broker and is waiting for approval.</p>` +
      `<p><strong>Agency:</strong> ${data.agencyName}<br/>` +
      `<strong>Email:</strong> ${data.email}<br/>` +
      `<strong>Phone:</strong> ${data.phone || "—"}<br/>` +
      `<strong>ACL number:</strong> ${data.aclNumber || "—"}</p>` +
      `<p>They cannot access the broker portal until you activate them in Admin &rsaquo; Brokers.</p>`
  );

  return { success: true };
}
