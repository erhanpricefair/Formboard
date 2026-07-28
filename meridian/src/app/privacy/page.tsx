import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { COMPANY } from "@/lib/company";
import { absoluteUrl } from "@/lib/seo";

const LAST_UPDATED = "28 July 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How InvestorSource collects, uses, stores and discloses your personal information, and how to access, correct or complain about it under the Australian Privacy Principles.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains how <strong>{COMPANY.legalName}</strong> (ABN {COMPANY.abn}),
        trading as <strong>{COMPANY.tradingName}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
        &ldquo;our&rdquo;), handles personal information. We are bound by the{" "}
        <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
      </p>
      <p>
        It applies to {COMPANY.website} and every part of the InvestorSource platform — the investor
        questionnaire and dashboard, the broker portal, the developer portal, and any communication
        we send you.
      </p>

      <h2>1. The personal information we collect</h2>

      <h3>If you are an investor</h3>
      <p>When you complete our questionnaire or a broker sets up an account for you, we collect:</p>
      <ul>
        <li>
          <strong>Identity and contact details</strong> — your name, email address and (optionally)
          phone number.
        </li>
        <li>
          <strong>Financial and investment information</strong> — your maximum budget, deposit
          available, finance status (for example pre-approved, applying, not started, or cash
          buyer), purchase timeframe, investment experience, whether you are buying to invest or to
          live in, your growth-versus-yield preference, and your preferred states and suburbs.
        </li>
        <li>
          <strong>Activity on the platform</strong> — properties you save, compare or download
          documents for, consultation bookings, and your progress through the Settlement
          Accelerator.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> collect government identifiers, bank account details, credit
        card numbers, tax file numbers, or credit reporting information through this platform. If a
        broker needs that information to assess a loan, they collect it directly from you under
        their own privacy policy and their own Australian Credit Licence obligations — not through
        InvestorSource.
      </p>

      <h3>If you are a broker or developer</h3>
      <p>
        We collect your name, business email, phone number, agency or entity name, ABN, and
        licensing details such as an Australian Credit Licence number, together with the business
        content you upload (project and listing information, images and documents).
      </p>

      <h3>Automatically</h3>
      <p>
        We use strictly necessary cookies to keep you signed in. We do not use advertising or
        cross-site tracking cookies on this platform.
      </p>

      <h2>2. How we collect it</h2>
      <ul>
        <li>Directly from you, when you complete the questionnaire, register, or contact us.</li>
        <li>
          <strong>From a mortgage broker acting on your behalf.</strong> A broker can create an
          account and enter your details so that your matches are ready before your first
          conversation. If your account was created this way, the broker is responsible for having
          obtained your consent, and you can contact us at any time to access, correct or delete
          what is held.
        </li>
        <li>
          Through a broker&rsquo;s referral link, which tells us which broker introduced you.
        </li>
        <li>
          From partner websites we operate or work with, where you have submitted an enquiry and
          consented to being contacted about property investment opportunities.
        </li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>
          To run our matching engine, which scores published properties against your budget,
          deposit, location preferences, timeframe and growth-versus-yield preference, and explains
          why each one matched.
        </li>
        <li>To connect you with a licensed mortgage broker and support that relationship.</li>
        <li>To track your purchase through the nine stages of the Settlement Accelerator.</li>
        <li>
          To send you service messages about your account, your matches, and the progress of your
          journey.
        </li>
        <li>To operate, secure, support and improve the platform, and to meet legal obligations.</li>
      </ul>
      <p>
        We do not sell your personal information. We do not disclose it to third parties for their
        own marketing.
      </p>

      <h2>4. Who we disclose it to</h2>
      <ul>
        <li>
          <strong>Your mortgage broker.</strong> The broker linked to your account can see your
          contact details, your questionnaire answers, your matches, and your Settlement Accelerator
          progress. This is the core purpose of the platform. Brokers can only ever see their own
          clients.
        </li>
        <li>
          <strong>Service partners you are referred to</strong> — such as a conveyancer, building
          inspector, insurer or property manager — where you have been referred and only to the
          extent needed to make that introduction.
        </li>
        <li>
          <strong>Developers: no.</strong> Property developers listing on InvestorSource can see
          their own projects and listings. They cannot see investor names, contact details,
          budgets, finance details, or any other investor personal information.
        </li>
        <li>
          <strong>Our service providers</strong>, described in section 5.
        </li>
        <li>
          <strong>Where required by law</strong>, or to protect our rights, safety or property.
        </li>
      </ul>

      <h2>5. Where your information is stored, and overseas disclosure</h2>

      <h3>Stored in Australia</h3>
      <p>
        Our database, authentication system and file storage are provided by{" "}
        <strong>Supabase</strong> and are hosted in the <strong>Sydney region</strong>. This means
        your account, your questionnaire answers, your matches, your Settlement Accelerator history
        and any documents held for you are <strong>stored at rest in Australia</strong>.
      </p>

      <h3>Processed partly overseas</h3>
      <p>
        Some supporting services necessarily process information outside Australia, including in the
        United States:
      </p>
      <ul>
        <li>
          <strong>Vercel</strong> — website and application hosting, operated over a global network,
          so page requests may be served from outside Australia.
        </li>
        <li>
          <strong>Resend</strong> — transactional and notification email, so the content of emails we
          send you is processed overseas.
        </li>
        <li>
          <strong>Anthropic</strong> — the AI assistant available to brokers inside the broker
          portal. When a broker asks the assistant a question about a client, relevant client
          information is sent to Anthropic to generate the response. It is not used to train
          Anthropic&rsquo;s models.
        </li>
      </ul>
      <p>
        By using the platform you acknowledge this overseas processing. We take reasonable steps
        under APP 8 to ensure these providers handle personal information consistently with the
        Australian Privacy Principles, but we may not be able to control or remedy every act of an
        overseas recipient.
      </p>

      <h2>6. How we protect it</h2>
      <p>
        Access to data is enforced at the database level using row-level security, so that each
        account can only read the records it is entitled to — an investor sees only their own data,
        a broker only their own clients, a developer only their own listings. Traffic is encrypted
        in transit. Passwords are hashed and are never visible to us or to any broker or
        administrator.
      </p>
      <p>
        No system is perfectly secure. If a data breach occurs that is likely to cause you serious
        harm, we will notify you and the Office of the Australian Information Commissioner as
        required by the Notifiable Data Breaches scheme.
      </p>

      <h2>7. How long we keep it</h2>
      <p>
        We keep your personal information for as long as your account is active and for as long
        afterwards as we need it for the purposes described above or to meet legal, tax or record
        keeping obligations. When it is no longer needed we delete it or de-identify it. You can ask
        us to delete your account at any time.
      </p>

      <h2>8. Accessing and correcting your information</h2>
      <p>
        You can view and update most of your details yourself from your{" "}
        <Link href="/investor/profile">profile page</Link> once signed in. You can also ask us for a
        copy of the personal information we hold about you, or ask us to correct it, by emailing{" "}
        <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>. We will respond within
        30 days. If we refuse a request we will tell you why in writing.
      </p>

      <h2>9. Marketing and unsubscribing</h2>
      <p>
        We may send you information about opportunities and services relevant to your investment
        goals. Every marketing message includes an unsubscribe link, and you can opt out at any time
        by emailing us. Service messages about your account, your matches or an active purchase are
        not marketing and will continue while your account is open.
      </p>

      <h2>10. Complaints</h2>
      <p>
        If you believe we have mishandled your personal information, contact us first at{" "}
        <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>. We will acknowledge
        your complaint and aim to resolve it within 30 days.
      </p>
      <p>
        If you are not satisfied with our response, you can complain to the Office of the Australian
        Information Commissioner at{" "}
        <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
          oaic.gov.au
        </a>{" "}
        or on 1300 363 992.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy as the platform changes. The current version is always available
        at {COMPANY.website}/privacy, and the &ldquo;last updated&rdquo; date above tells you when it
        last changed. Material changes will be notified to you by email or in the platform.
      </p>

      <h2>12. Contact us</h2>
      <p>
        {COMPANY.legalName} (ABN {COMPANY.abn}) trading as {COMPANY.tradingName}
        <br />
        Email: <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
