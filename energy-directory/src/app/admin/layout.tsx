import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: admin } = await supabase.from("admins").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!admin) redirect("/dashboard");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-lg border border-ink-700/10 bg-ink-900/[0.02] px-4 py-3">
        <p className="font-medium">Admin console</p>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/professionals" className="hover:text-brand-700">
            Professionals
          </Link>
          <Link href="/admin/fees" className="hover:text-brand-700">
            Fees
          </Link>
          <Link href="/admin/leads" className="hover:text-brand-700">
            Leads
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
