import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { COMPANY } from "@/lib/company";
import { absoluteUrl } from "@/lib/seo";

const LAST_UPDATED = "28 July 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing use of the InvestorSource property investment marketplace by investors, mortgage brokers and property developers.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These terms govern your use of the InvestorSource platform at {COMPANY.website}, operated by{" "}
        <strong>{COMPANY.legalName}</strong> (ABN {COMPANY.abn}) trading as{" "}
        <strong>{COMPANY.tradingName}</strong>. By creating an account or using the platform, you
        agree to them. If you do not agree, do not use the platform.
      </p>

      <h2>1. What InvestorSource is — and is not</h2>
      <p>
        InvestorSource is an <strong>independent marketplace</strong>. We source property investment
        opportunities from developers, review them before publishing, match them against the goals
        you tell us about, and introduce you to a licensed mortgage broker.
      </p>
      <p>We are not:</p>
      <ul>
        <li>
          the developer, vendor, owner or seller of any property listed — every property is sold by
          its actual developer, and any contract of sale is between you and that developer;
        </li>
        <li>a real estate agent acting for you or for any vendor;</li>
        <li>a mortgage broker, credit provider or credit assistance provider;</li>
        <li>a financial adviser, tax adviser or legal adviser.</li>
      </ul>

      <h2>2. Not financial, credit, legal or tax advice</h2>
      <p>
        Everything on the platform — including match scores, match explanations, yield and rental
        estimates, growth driver notes, and any output of our AI assistant — is{" "}
        <strong>general information only</strong>. It does not take into account your personal
        objectives, financial situation or needs, and it is not personal financial advice, credit
        assistance, legal advice or tax advice.
      </p>
      <p>
        Personal credit advice is provided by the licensed mortgage broker you are introduced to,
        under their own Australian Credit Licence, and not by us. Before making any investment or
        finance decision you should obtain independent financial, legal and taxation advice, and
        read all contract and disclosure documents.
      </p>
      <p>
        <strong>Estimates are estimates.</strong> Expected yields, weekly rental figures, completion
        timelines and growth driver scores are projections based on information supplied by
        developers and on general market data. They are not guarantees. Property values and rents
        can fall as well as rise. Past performance does not indicate future performance.
      </p>

      <h2>3. How we are paid</h2>
      <p>
        Using InvestorSource is <strong>free for investors</strong>. We are compensated through
        commercial arrangements with property developers and through referral arrangements with
        mortgage brokers and service partners such as conveyancers, building inspectors, insurers
        and property managers. This means we may receive a fee or commission if you proceed with a
        purchase, a loan, or a service partner introduced through the platform.
      </p>
      <p>
        We disclose this so you can weigh it. It does not change the fact that the assessment of
        whether a property and a loan suit you is made by you, with your broker and your own
        advisers.
      </p>

      <h2>4. Eligibility and your account</h2>
      <ul>
        <li>You must be at least 18 years old and able to enter a binding contract.</li>
        <li>You must give accurate information and keep it up to date. Our matching is only as good as what you tell us.</li>
        <li>You are responsible for keeping your password secure and for activity on your account.</li>
        <li>Do not share your account, scrape the platform, attempt to access data you are not entitled to, or interfere with its operation.</li>
      </ul>

      <h2>5. Property listings</h2>
      <p>
        Listings are submitted by developers and reviewed by us before publication. That review is a
        reasonable-care check for completeness and plausibility — it is{" "}
        <strong>not</strong> an audit, valuation, structural inspection, or endorsement of the
        property or the developer.
      </p>
      <p>
        Information including price, land and build size, inclusions, completion timeline and
        estimated rent originates from the developer. Availability and pricing can change without
        notice. You must satisfy yourself of all details, and obtain your own building inspection,
        legal review of the contract, and valuation, before committing.
      </p>

      <h2>6. Additional terms for mortgage brokers</h2>
      <p>If you use the broker portal, you additionally agree that:</p>
      <ul>
        <li>
          you hold, or are an authorised credit representative under, a current Australian Credit
          Licence, and you will tell us immediately if that changes;
        </li>
        <li>
          you have your clients&rsquo; informed consent before entering their personal information
          into the platform on their behalf;
        </li>
        <li>
          you will handle client information you access here in accordance with the{" "}
          <em>Privacy Act 1988</em> (Cth) and your own obligations, and use it only to serve that
          client;
        </li>
        <li>
          you will not use the AI assistant as a substitute for your own professional judgement, and
          you remain responsible for any advice you give;
        </li>
        <li>
          your access requires approval and can be suspended or withdrawn, including where we
          reasonably believe these terms have been breached.
        </li>
      </ul>

      <h2>7. Additional terms for developers</h2>
      <p>If you use the developer portal, you additionally warrant that:</p>
      <ul>
        <li>
          you have the right to market every property you list, and the information and images you
          upload are accurate, current, not misleading, and yours to use;
        </li>
        <li>
          your listings comply with all applicable law, including the Australian Consumer Law
          prohibition on misleading or deceptive conduct;
        </li>
        <li>
          you will update or withdraw a listing promptly when it is sold, withdrawn or materially
          changed;
        </li>
        <li>
          you indemnify us against claims arising from listing content you supply or from your
          dealings with a purchaser.
        </li>
      </ul>
      <p>We may decline, edit, pause or remove any listing at our discretion.</p>

      <h2>8. Intellectual property</h2>
      <p>
        The platform, its design, its matching methodology and its content (other than material you
        upload) belong to us. You may use the platform for its intended purpose. You may not copy,
        scrape, republish or build a competing product from it. Content you upload remains yours,
        and you grant us the licence needed to host and display it on the platform.
      </p>

      <h2>9. Availability</h2>
      <p>
        We aim to keep the platform available but do not guarantee uninterrupted access. We may
        change, suspend or discontinue features, and may perform maintenance, without notice.
      </p>

      <h2>10. Liability</h2>
      <p>
        Nothing in these terms excludes, restricts or modifies any guarantee, right or remedy you
        have under the Australian Consumer Law or any other law that cannot lawfully be excluded.
      </p>
      <p>
        Subject to that, and to the maximum extent permitted by law: the platform is provided
        &ldquo;as is&rdquo;; we exclude all implied warranties; we are not liable for indirect,
        incidental, special or consequential loss, or for loss of profit, revenue, opportunity or
        anticipated savings; and we are not liable for investment losses, for a property&rsquo;s
        performance, for the conduct of any developer, broker or service partner, or for decisions
        you make in reliance on general information published here.
      </p>
      <p>
        Where liability cannot be excluded, our total liability is limited, at our option, to
        resupplying the relevant service or paying the cost of having it resupplied.
      </p>

      <h2>11. Termination</h2>
      <p>
        You can close your account at any time by contacting us. We may suspend or terminate access
        where we reasonably believe these terms have been breached, or where required by law.
        Sections that by their nature should survive termination — including sections 2, 3, 8 and 10
        — do survive it.
      </p>

      <h2>12. Privacy</h2>
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle personal information
        and forms part of these terms.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        We may update these terms. The current version is always at {COMPANY.website}/terms, with
        the &ldquo;last updated&rdquo; date above. Material changes will be notified by email or in
        the platform. Continuing to use the platform after a change means you accept it.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of {COMPANY.governingState}, Australia. You submit to
        the non-exclusive jurisdiction of the courts of {COMPANY.governingState}.
      </p>

      <h2>15. Contact</h2>
      <p>
        {COMPANY.legalName} (ABN {COMPANY.abn}) trading as {COMPANY.tradingName}
        <br />
        Email: <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
      </p>
    </LegalPage>
  );
}
