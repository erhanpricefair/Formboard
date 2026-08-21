import Foundation

/// External links used in the app, kept in one place so there's a single
/// spot to update before launch.
///
/// ⚠️ BEFORE SUBMITTING TO THE APP STORE: replace `host` below with your real
/// domain and publish the two pages from `legal/` there. Apple requires a
/// working, publicly reachable privacy policy URL for any app offering
/// subscriptions — a dead link is a guaranteed rejection.
enum AppLinks {
    /// Replace with your real domain, e.g. "gentleflow.com.au".
    private static let host = "gentleflow.example.com"

    static let privacyPolicy = URL(string: "https://\(host)/privacy")!
    static let termsOfUse = URL(string: "https://\(host)/terms")!

    /// Deep link to the system subscription management screen. Apple expects
    /// subscription apps to make cancelling easy to find.
    static let manageSubscriptions = URL(string: "https://apps.apple.com/account/subscriptions")!
}
