import { Hero } from "@/components/marketing/hero";
import { TrustSignals } from "@/components/marketing/trust-signals";
import { DeveloperPartners } from "@/components/marketing/developer-partners";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhyInvestors } from "@/components/marketing/why-investors";
import { SettlementAcceleratorExplainer } from "@/components/marketing/settlement-accelerator-explainer";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustSignals />
      <DeveloperPartners />
      <HowItWorks />
      <WhyInvestors />
      <SettlementAcceleratorExplainer />
      <Testimonials />
      <FAQ />
    </>
  );
}
