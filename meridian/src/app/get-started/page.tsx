import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <OnboardingForm referralSlug={ref} />
      </main>
    </>
  );
}
