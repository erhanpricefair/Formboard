import { InvestorLoginForm } from "@/components/auth/investor-login-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <InvestorLoginForm />
      </main>
    </>
  );
}
