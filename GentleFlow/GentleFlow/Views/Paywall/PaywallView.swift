import SwiftUI
import StoreKit

/// Pensioner-friendly paywall: honest about what's free vs paid, no dark
/// patterns (no forced countdown, no pre-checked auto-renew trickery), and
/// an always-visible, plain "Not right now" exit.
struct PaywallView: View {
    @EnvironmentObject private var storeKit: StoreKitManager
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @Environment(\.dismiss) private var dismiss
    @State private var selectedProductID: String = GentleFlowProducts.annual

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    Image(systemName: "star.circle.fill")
                        .font(.system(size: 56))
                        .foregroundColor(colors.primaryGreen)

                    Text("Gentle Flow Premium")
                        .gentleStyle(.largeTitle, highContrast: highContrastEnabled)
                        .multilineTextAlignment(.center)

                    Text("Unlock the full session library and take your practice offline — affordable, and cancel any time.")
                        .gentleStyle(.body, highContrast: highContrastEnabled)
                        .multilineTextAlignment(.center)

                    featureList

                    VStack(spacing: Theme.Spacing.sm) {
                        ForEach(planOptions) { option in
                            planOptionRow(option)
                        }
                    }

                    GentleButton(title: "Continue", systemImage: "checkmark") {
                        Task { await purchaseSelected() }
                    }

                    Button("Restore Purchases") {
                        Task { await storeKit.restorePurchases() }
                    }
                    .font(.system(.footnote, design: .rounded, weight: .semibold))
                    .minimumTouchTarget()

                    Text("Payment is charged to your Apple ID. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel any time in your iPhone or iPad Settings.")
                        .gentleStyle(.caption, highContrast: highContrastEnabled)
                        .multilineTextAlignment(.center)

                    Button("Not right now") { dismiss() }
                        .font(.system(.body, design: .rounded, weight: .semibold))
                        .foregroundColor(colors.secondaryText)
                        .minimumTouchTarget()
                }
                .padding(Theme.Spacing.lg)
            }
            .background(colors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }.minimumTouchTarget()
                }
            }
        }
    }

    private var featureList: some View {
        GentleCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                featureRow("Every Chair, Standing, Walking and Calm session")
                featureRow("Download sessions to practise without internet")
                featureRow("New sessions added regularly")
                featureRow("Support an Australian-made app for seniors")
            }
        }
    }

    private func featureRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.xs) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(colors.primaryGreen)
            Text(text)
                .gentleStyle(.body, highContrast: highContrastEnabled)
        }
    }

    /// Prefers real StoreKit products (with real localized prices) when
    /// available, falling back to friendly placeholder copy otherwise —
    /// e.g. in SwiftUI previews or before App Store Connect is configured.
    private var planOptions: [SubscriptionPlanOption] {
        guard !storeKit.products.isEmpty else { return GentleFlowProducts.displayOptions }
        return storeKit.products.map { product in
            SubscriptionPlanOption(
                productIdentifier: product.id,
                title: product.id == GentleFlowProducts.annual ? "Yearly" : "Monthly",
                priceDescription: product.displayPrice,
                billingNote: product.id == GentleFlowProducts.annual ? "Our best value" : "Cancel any time",
                isBestValue: product.id == GentleFlowProducts.annual
            )
        }
    }

    private func planOptionRow(_ option: SubscriptionPlanOption) -> some View {
        Button {
            selectedProductID = option.productIdentifier
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(option.title).gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                        if option.isBestValue {
                            GentleTag(text: "Best Value")
                        }
                    }
                    Text(option.billingNote).gentleStyle(.caption, highContrast: highContrastEnabled)
                }
                Spacer()
                Text(option.priceDescription).gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                Image(systemName: selectedProductID == option.productIdentifier ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(selectedProductID == option.productIdentifier ? colors.primaryGreen : colors.divider)
            }
            .padding(Theme.Spacing.md)
            .frame(minHeight: Theme.TouchTarget.minimum)
            .background(selectedProductID == option.productIdentifier ? colors.primaryGreen.opacity(0.1) : colors.surface)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous)
                    .strokeBorder(selectedProductID == option.productIdentifier ? colors.primaryGreen : colors.divider, lineWidth: 1.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func purchaseSelected() async {
        if let product = storeKit.products.first(where: { $0.id == selectedProductID }) {
            await storeKit.purchase(product)
            if storeKit.isPremium { dismiss() }
        }
    }
}

#Preview {
    PaywallView()
        .environmentObject(StoreKitManager())
}
