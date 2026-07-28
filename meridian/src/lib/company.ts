/**
 * Single source of truth for the operating entity's details. These appear
 * in the footer, the privacy policy, the terms of service and PDF client
 * reports — keeping them here means an ABN or contact-address change is a
 * one-line edit rather than a hunt through prose.
 */
export const COMPANY = {
  legalName: "NewPF Business Group Pty Ltd",
  tradingName: "InvestorSource",
  /** Formatted in the conventional Australian XX XXX XXX XXX grouping. */
  abn: "74 110 731 763",
  contactEmail: "erhan@newpfproperty.com.au",
  website: "www.investorsource.com.au",
  /** Jurisdiction whose law governs the Terms of Service. */
  governingState: "Victoria",
} as const;
