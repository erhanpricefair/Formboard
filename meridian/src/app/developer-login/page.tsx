import { PasswordLoginForm } from "@/components/auth/password-login-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function DeveloperLoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <PasswordLoginForm role="developer" title="Developer portal sign in" />
      </main>
    </>
  );
}
