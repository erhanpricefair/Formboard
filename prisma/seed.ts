import { PrismaClient, LeadType, FeeType } from "@prisma/client";

const prisma = new PrismaClient();

// Platform default referral fee schedule — see docs/FEE_SCHEDULE.md for the
// business reasoning behind each number. These are ReferralAgreement rows
// with partnerId = null, which the fee-service falls back to whenever a
// partner has no negotiated override for a given LeadType (see
// docs/FEE_SCHEDULE.md "Resolution order").
const DEFAULT_FEE_SCHEDULE: Array<{
  leadType: LeadType;
  flatAmount: number;
}> = [
  { leadType: LeadType.SELL, flatAmount: 1500 },
  { leadType: LeadType.BUY, flatAmount: 1500 },
  { leadType: LeadType.FINANCE, flatAmount: 600 },
  { leadType: LeadType.CONVEYANCING, flatAmount: 200 },
  { leadType: LeadType.INSPECTION, flatAmount: 100 },
  { leadType: LeadType.PROPERTY_MANAGEMENT, flatAmount: 250 },
];

async function main() {
  for (const { leadType, flatAmount } of DEFAULT_FEE_SCHEDULE) {
    const existingDefault = await prisma.referralAgreement.findFirst({
      where: { partnerId: null, leadType, active: true },
    });

    if (existingDefault) {
      console.log(`Default fee for ${leadType} already exists ($${existingDefault.flatAmount}) — skipping`);
      continue;
    }

    const created = await prisma.referralAgreement.create({
      data: {
        partnerId: null,
        leadType,
        feeType: FeeType.FLAT,
        flatAmount,
      },
    });

    console.log(`Created default fee for ${leadType}: $${created.flatAmount}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
