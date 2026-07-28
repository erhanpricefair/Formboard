import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Same palette as globals.css (--color-ink / --color-accent / etc.) --
// react-pdf's StyleSheet can't consume CSS custom properties, so the hex
// values are duplicated here. Keep in sync if the brand palette changes.
const COLORS = {
  ink: "#0b1220",
  muted: "#6b7280",
  border: "#e4e1d8",
  paper: "#faf9f6",
  accent: "#b8925a",
  accentSoft: "#f3e9dc",
  accentInk: "#6b4d24",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: COLORS.ink, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink,
    paddingBottom: 16,
    marginBottom: 20,
  },
  agencyName: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  brokerLine: { marginTop: 4, color: COLORS.muted, fontSize: 9 },
  reportTitle: { textAlign: "right", fontSize: 9, color: COLORS.muted },
  reportDate: { textAlign: "right", fontSize: 9, color: COLORS.muted, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 18,
    color: COLORS.ink,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { flexGrow: 1 },
  statLabel: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase" },
  statValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  listingCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  listingHeader: { flexDirection: "row", justifyContent: "space-between" },
  listingTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  listingSuburb: { fontSize: 9, color: COLORS.muted, textTransform: "uppercase" },
  listingStats: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  explanation: {
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.accentSoft,
    color: COLORS.accentInk,
    borderRadius: 3,
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    fontSize: 8,
    color: COLORS.muted,
  },
  nextSteps: { fontSize: 10, lineHeight: 1.6, color: COLORS.ink },
});

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export interface ReportBroker {
  agencyName: string;
  fullName: string;
  email: string;
  phone: string | null;
  aclNumber: string | null;
}

export interface ReportClient {
  fullName: string;
  budgetMax: number;
  depositAvailable: number;
  preferredStates: string[];
  preferredSuburbs: string[];
  financeStatus: string;
  timeframe: string;
  growthYieldPreference: string;
}

export interface ReportListing {
  title: string;
  suburbName: string;
  state: string;
  propertyType: string;
  price: number;
  depositRequired: number;
  expectedYield: number;
  rentalEstimateWeekly: number;
  explanation?: string;
}

function humanise(value: string): string {
  return value.replace(/_/g, " ");
}

export function ClientReportDocument({
  broker,
  client,
  listings,
  generatedAt,
}: {
  broker: ReportBroker;
  client: ReportClient;
  listings: ReportListing[];
  generatedAt: Date;
}) {
  return (
    <Document title={`${client.fullName} — Property Report`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.agencyName}>{broker.agencyName}</Text>
            <Text style={styles.brokerLine}>
              {broker.fullName}
              {broker.aclNumber ? ` · ACL ${broker.aclNumber}` : ""}
            </Text>
            <Text style={styles.brokerLine}>
              {broker.email}
              {broker.phone ? ` · ${broker.phone}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>PROPERTY OPPORTUNITY REPORT</Text>
            <Text style={styles.reportDate}>
              Prepared for {client.fullName} on{" "}
              {generatedAt.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Client requirements</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>{AUD.format(client.budgetMax)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Deposit available</Text>
              <Text style={styles.statValue}>{AUD.format(client.depositAvailable)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Finance status</Text>
              <Text style={styles.statValue}>{humanise(client.financeStatus)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Timeframe</Text>
              <Text style={styles.statValue}>{humanise(client.timeframe)}</Text>
            </View>
          </View>
          <View style={[styles.statRow, { marginTop: 10 }]}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Preferred location(s)</Text>
              <Text style={styles.statValue}>
                {client.preferredSuburbs.length > 0
                  ? client.preferredSuburbs.join(", ")
                  : client.preferredStates.join(", ") || "Open"}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Growth vs. yield</Text>
              <Text style={styles.statValue}>{humanise(client.growthYieldPreference)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recommended properties</Text>
        {listings.length === 0 ? (
          <Text style={{ color: COLORS.muted }}>
            No current matches — new stock is published regularly, check back soon.
          </Text>
        ) : (
          listings.map((listing, i) => (
            <View key={i} style={styles.listingCard} wrap={false}>
              <View style={styles.listingHeader}>
                <View>
                  <Text style={styles.listingSuburb}>
                    {listing.suburbName}, {listing.state}
                  </Text>
                  <Text style={styles.listingTitle}>{listing.title}</Text>
                </View>
                <Text style={styles.listingSuburb}>{humanise(listing.propertyType)}</Text>
              </View>
              <View style={styles.listingStats}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Price</Text>
                  <Text style={styles.statValue}>{AUD.format(listing.price)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Deposit</Text>
                  <Text style={styles.statValue}>{AUD.format(listing.depositRequired)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Est. yield</Text>
                  <Text style={styles.statValue}>{listing.expectedYield.toFixed(1)}%</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Est. rent</Text>
                  <Text style={styles.statValue}>{AUD.format(listing.rentalEstimateWeekly)}/wk</Text>
                </View>
              </View>
              {listing.explanation && <Text style={styles.explanation}>{listing.explanation}</Text>}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Next steps</Text>
        <View style={styles.card}>
          <Text style={styles.nextSteps}>
            1. Review the recommended properties above and shortlist any that stand out.{"\n"}
            2. {broker.fullName} will walk through finance pre-approval (if not already arranged)
            and confirm suitability against your circumstances.{"\n"}
            3. Once you select a property, {broker.agencyName} manages the process end-to-end
            through to settlement via the Settlement Accelerator — contract, construction updates,
            and handover.
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          Prepared by {broker.agencyName} via InvestorSource. This report is a summary for
          discussion purposes and does not constitute financial or legal advice. Figures shown are
          estimates based on data provided by the listing developer and are not guaranteed.
        </Text>
      </Page>
    </Document>
  );
}
