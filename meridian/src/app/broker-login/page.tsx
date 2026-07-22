import { PasswordLoginForm } from "@/components/auth/password-login-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function BrokerLoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <PasswordLoginForm role="broker" title="Broker sign in" />
      </main>
    </>
  );
}
