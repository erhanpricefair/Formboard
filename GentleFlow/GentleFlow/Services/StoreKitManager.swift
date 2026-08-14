import Foundation
import StoreKit

/// Minimal StoreKit 2 integration skeleton for Gentle Flow Premium.
///
/// This intentionally keeps the free tier fully usable — premium only
/// unlocks offline downloads and the extended session library, per the
/// "strong free tier" requirement. Wire real product identifiers up in App
/// Store Connect matching `GentleFlowProducts` before shipping.
@MainActor
final class StoreKitManager: ObservableObject {

    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedProductIDs: Set<String> = []
    @Published private(set) var isLoadingProducts = false
    @Published var lastErrorMessage: String?

    private var transactionListenerTask: Task<Void, Never>?

    static let productIdentifiers: Set<String> = [
        GentleFlowProducts.monthly,
        GentleFlowProducts.annual
    ]

    var isPremium: Bool {
        !purchasedProductIDs.isEmpty
    }

    func start() async {
        transactionListenerTask = listenForTransactions()
        await loadProducts()
        await refreshEntitlements()
    }

    deinit {
        transactionListenerTask?.cancel()
    }

    func loadProducts() async {
        isLoadingProducts = true
        defer { isLoadingProducts = false }
        do {
            products = try await Product.products(for: Self.productIdentifiers)
        } catch {
            // Products fail to load without network or without App Store
            // Connect configuration (e.g. in Simulator/dev builds) — the
            // paywall falls back to GentleFlowProducts.displayOptions copy.
            lastErrorMessage = "Couldn't load subscription options. Please check your connection and try again."
        }
    }

    func purchase(_ product: Product) async {
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                if case .verified(let transaction) = verification {
                    purchasedProductIDs.insert(transaction.productID)
                    await transaction.finish()
                }
            case .userCancelled, .pending:
                break
            @unknown default:
                break
            }
        } catch {
            lastErrorMessage = "The purchase couldn't be completed. Please try again."
        }
    }

    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await refreshEntitlements()
        } catch {
            lastErrorMessage = "Couldn't restore purchases. Please try again."
        }
    }

    private func refreshEntitlements() async {
        var active: Set<String> = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result, transaction.revocationDate == nil {
                active.insert(transaction.productID)
            }
        }
        purchasedProductIDs = active
    }

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self else { return }
                if case .verified(let transaction) = result {
                    await MainActor.run {
                        self.purchasedProductIDs.insert(transaction.productID)
                    }
                    await transaction.finish()
                }
            }
        }
    }
}
