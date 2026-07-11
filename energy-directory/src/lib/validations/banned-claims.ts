/**
 * Shared source of truth for "no promotional hype / absolute claims" rules.
 *
 * This mirrors the patterns seeded into the `banned_claims_patterns` table
 * (see supabase/migrations/0001_init.sql) so the client and API return a
 * useful error *before* the database trigger would reject the write. The
 * database trigger is the non-bypassable backstop — this list existing in
 * two places is intentional defense-in-depth, not duplication to keep in
 * perfect lockstep; if they drift slightly, the DB trigger always wins.
 */

export interface BannedClaimPattern {
  pattern: RegExp;
  reason: string;
}

export const BANNED_CLAIM_PATTERNS: BannedClaimPattern[] = [
  { pattern: /guarantee[ds]?\s+savings?/i, reason: "Absolute savings guarantee — savings vary by property and cannot be guaranteed." },
  { pattern: /100%\s*guarantee/i, reason: "Absolute guarantee claim." },
  { pattern: /risk[- ]free/i, reason: "Implies no risk, which cannot be substantiated." },
  { pattern: /\bbest\b.{0,20}\b(installer|professional|company|price|deal)\b/i, reason: '"Best" superlative claim without substantiation.' },
  { pattern: /\bno\.?\s*1\b|\bnumber\s+one\b/i, reason: "Unsubstantiated market-leadership claim." },
  { pattern: /cheapest\s+in\s+australia/i, reason: "Unsubstantiated pricing superlative." },
  { pattern: /government\s+approved/i, reason: "Implies government endorsement of the business itself, not just rebate-scheme eligibility." },
  { pattern: /guaranteed\s+approval/i, reason: "Absolute outcome guarantee." },
  { pattern: /act\s+now|limited\s+time\s+only|hurry/i, reason: "High-pressure urgency tactic." },
  { pattern: /zero\s+risk|completely\s+safe/i, reason: "Absolute safety claim." },
];

/**
 * Returns the first matching banned-claim reason, or null if the text is
 * clean. Checked against business name, tagline, bio, and any other
 * public-facing free text field on a professional profile.
 */
export function findBannedClaim(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const { pattern, reason } of BANNED_CLAIM_PATTERNS) {
    if (pattern.test(text)) return reason;
  }
  return null;
}
