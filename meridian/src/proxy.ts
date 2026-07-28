import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, roleForPath } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";

// Next.js 16 renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()` —
// see node_modules/next/dist/docs/.../upgrading/version-16.md, "middleware
// to proxy". Behaviour here mirrors what ARCHITECTURE.md §4.2 calls the
// first (fast-fail, UX) enforcement layer; Row-Level Security in the
// database is the actual security boundary, enforced independently.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const requiredRole = roleForPath(pathname);

  if (requiredRole) {
    if (!user) {
      const loginPaths: Record<string, string> = {
        broker: "/broker-login",
        developer: "/developer-login",
        admin: "/admin-login",
        investor: "/login",
      };
      const loginUrl = new URL(loginPaths[requiredRole], request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Checked against profiles.role, not user_metadata.role. The latter
    // is only ever set at the moment an auth user is first created (via
    // whatever options.data was passed to signUp/createUser at the time)
    // and never updated after — an account promoted to a role later by an
    // admin UPDATE on `profiles` (e.g. the manual admin-account setup, or
    // a broker approved after self-registering) would have the right
    // database role but stale/absent metadata, and this check would
    // bounce them off their own portal forever. See migration 0012 for
    // why metadata is also untrustworthy as a security signal, not just
    // stale — both reasons point the same way: always read profiles.role.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const userRole = profile?.role as UserRole | undefined;
    if (userRole !== requiredRole) {
      return NextResponse.redirect(new URL(userRole ? ROLE_HOME[userRole] : "/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/investor/:path*",
    "/broker/:path*",
    "/developer/:path*",
    "/admin/:path*",
  ],
};
