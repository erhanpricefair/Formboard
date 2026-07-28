import { BrokerSignupForm } from "@/components/auth/broker-signup-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function BrokerSignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <BrokerSignupForm />
      </main>
    </>
  );
}
