export const metadata = { title: "Privacy Policy — AU Home Energy Directory" };

const POLICY_VERSION = process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION ?? "2026-07-11";

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-sm max-w-2xl">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-ink-500">Version {POLICY_VERSION}</p>

      <p>
        This platform (“we”, “us”) operates an independent directory of home energy and retrofit professionals in
        Australia. We are not an installer, financial advisor, or party to any contract between you and a
        professional. This policy explains what we collect, why, and how it’s shared, consistent with the
        Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth).
      </p>

      <h2>What we collect</h2>
      <p>
        When you submit an enquiry, we collect your name, email, phone number, suburb/postcode, the service you’re
        interested in, and any project details you provide. We also record the timestamp, IP address, and browser
        details associated with your consent, so we can demonstrate what you agreed to and when if a dispute arises.
      </p>

      <h2>How your data is shared</h2>
      <p>
        Your enquiry is shared with the specific professional whose profile you submitted it through — and only that
        professional — once you’ve confirmed your phone number. We do not sell your details, and we do not
        broadcast a single enquiry to multiple competing professionals.
      </p>

      <h2>Consent</h2>
      <p>
        Submitting an enquiry requires two explicit opt-ins: consent to be contacted, and consent to your details
        being shared with the professional. Neither box is pre-ticked. A separate, genuinely optional opt-in covers
        marketing emails from us — you can decline this and still submit your enquiry.
      </p>

      <h2>Verification</h2>
      <p>
        We send a one-time SMS code to confirm your phone number belongs to you before your enquiry is forwarded.
        This protects professionals from spam/fake leads and protects you from someone else submitting your details
        without your knowledge.
      </p>

      <h2>Your rights</h2>
      <p>
        You can withdraw consent, request access to your data, or ask us to delete it at any time via the{" "}
        <a href="/unsubscribe">unsubscribe page</a> or by emailing privacy@example-directory.au. Withdrawing consent
        stops future contact but does not retroactively undo an enquiry already shared with a professional.
      </p>

      <h2>Retention</h2>
      <p>
        Enquiry and consent records are retained for as long as needed to support the professional relationship and
        for a reasonable period afterward for dispute-resolution and billing-reconciliation purposes, after which
        they are deleted or de-identified.
      </p>
    </article>
  );
}
