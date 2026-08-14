import Foundation

enum SubscriptionTier: String, Codable {
    case free
    case premium
}

/// Pensioner-friendly pricing tiers shown on the paywall. Real prices and
/// StoreKit product identifiers should be configured in App Store Connect
/// and match `StoreKitManager.productIdentifiers`.
struct SubscriptionPlanOption: Identifiable {
    let id = UUID()
    let productIdentifier: String
    let title: String
    let priceDescription: String
    let billingNote: String
    let isBestValue: Bool
}

enum GentleFlowProducts {
    static let monthly = "au.com.gentleflow.premium.monthly"
    static let annual = "au.com.gentleflow.premium.annual"

    /// Fallback display copy shown before real StoreKit product prices load
    /// (or in SwiftUI previews / offline). Actual prices always come from
    /// StoreKit once products load — this is just a friendly placeholder.
    static let displayOptions: [SubscriptionPlanOption] = [
        SubscriptionPlanOption(
            productIdentifier: monthly,
            title: "Monthly",
            priceDescription: "$6.99 / month",
            billingNote: "Cancel any time",
            isBestValue: false
        ),
        SubscriptionPlanOption(
            productIdentifier: annual,
            title: "Yearly",
            priceDescription: "$49.99 / year",
            billingNote: "Just over $4 a month — our best value",
            isBestValue: true
        )
    ]
}
