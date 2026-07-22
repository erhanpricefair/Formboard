import { PasswordLoginForm } from "@/components/auth/password-login-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function AdminLoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <PasswordLoginForm role="admin" title="Admin sign in" />
      </main>
    </>
  );
}
