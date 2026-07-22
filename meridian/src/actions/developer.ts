"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDeveloperId } from "@/lib/developer/get-developer-id";
import { projectSchema, listingSchema, type ProjectInput, type ListingInput } from "@/lib/validation/listing";

export interface DeveloperActionState {
  error?: string;
}

async function requireDeveloper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const developerId = await getDeveloperId(supabase, user.id);
  if (!developerId) {
    throw new Error(
      "Your account isn't linked to a developer company yet — contact Meridian to complete setup."
    );
  }
  return { supabase, user, developerId };
}

export async function createProject(input: ProjectInput): Promise<DeveloperActionState> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { supabase, developerId } = await requireDeveloper();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      developer_id: developerId,
      name: parsed.data.name,
      description: parsed.data.description,
      primary_state: parsed.data.primaryState,
      primary_suburb: parsed.data.primarySuburb,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not create the project. Please try again." };

  revalidatePath("/developer/projects");
  redirect(`/developer/projects/${data.id}`);
}

async function resolveSuburbId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
  state: string,
  postcode: string
) {
  const { data: existing } = await supabase
    .from("suburbs")
    .select("id")
    .eq("name", name)
    .eq("state", state)
    .eq("postcode", postcode)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("suburbs")
    .insert({ name, state, postcode })
    .select("id")
    .single();
  if (error || !created) throw new Error("Could not resolve suburb.");
  return created.id;
}

export async function createListing(
  projectId: string,
  input: ListingInput
): Promise<DeveloperActionState> {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;

  const { supabase } = await requireDeveloper();

  let suburbId: string;
  try {
    suburbId = await resolveSuburbId(supabase, data.suburbName, data.state, data.postcode);
  } catch {
    return { error: "Could not resolve the suburb. Please try again." };
  }

  const completionTimeline =
    data.completionStart && data.completionEnd
      ? `[${data.completionStart},${data.completionEnd})`
      : null;

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      project_id: projectId,
      suburb_id: suburbId,
      title: data.title,
      address_line: data.addressLine,
      land_size_sqm: data.landSizeSqm,
      build_size_sqm: data.buildSizeSqm,
      price: data.price,
      deposit_required: data.depositRequired,
      rental_estimate_weekly: data.rentalEstimateWeekly,
      growth_driver_score: data.growthDriverScore,
      growth_drivers: data.growthDrivers,
      nearby_infrastructure: data.nearbyInfrastructure,
      property_type: data.propertyType,
      completion_timeline: completionTimeline,
    })
    .select("id")
    .single();

  if (error || !listing) return { error: "Could not create the listing. Please try again." };

  revalidatePath(`/developer/projects/${projectId}`);
  redirect(`/developer/projects/${projectId}/listings/${listing.id}/edit`);
}

export async function submitListingForReview(listingId: string, projectId: string) {
  const { supabase } = await requireDeveloper();

  const { error } = await supabase
    .from("listings")
    .update({ status: "pending_review", submitted_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) throw error;

  revalidatePath(`/developer/projects/${projectId}`);
  revalidatePath(`/developer/projects/${projectId}/listings/${listingId}/edit`);
}

export async function recordListingImage(listingId: string, storagePath: string, isFloorPlan: boolean) {
  const { supabase } = await requireDeveloper();
  const { error } = await supabase
    .from("listing_images")
    .insert({ listing_id: listingId, storage_path: storagePath, is_floor_plan: isFloorPlan });
  if (error) throw error;
  revalidatePath(`/developer/projects`);
}

export async function recordListingDocument(
  listingId: string,
  storagePath: string,
  documentType: "brochure" | "floor_plan" | "contract_template" | "other",
  fileName: string
) {
  const { supabase } = await requireDeveloper();
  const { error } = await supabase
    .from("listing_documents")
    .insert({ listing_id: listingId, storage_path: storagePath, document_type: documentType, file_name: fileName });
  if (error) throw error;
  revalidatePath(`/developer/projects`);
}
