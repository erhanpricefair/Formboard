import { SetPasswordForm } from "@/components/auth/set-password-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function SetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-white">
        <SetPasswordForm />
      </main>
    </>
  );
}
