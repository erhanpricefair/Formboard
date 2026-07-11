import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, business_name, verification_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-lg border border-ink-700/10 bg-ink-900/[0.02] px-4 py-3">
        <div>
          <p className="font-medium">{professional?.business_name ?? "Complete your profile"}</p>
          <p className="text-xs text-ink-500">
            {professional?.verification_status === "verified"
              ? "Verified — visible in the public directory"
              : "Pending verification — not yet visible publicly"}
          </p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-brand-700">
            Leads
          </Link>
          <Link href="/dashboard/profile" className="hover:text-brand-700">
            Profile
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
