import SwiftUI

/// Decides whether to show onboarding or the main app, based on the stored
/// user profile. Also gates a one-time medical disclaimer acceptance —
/// shown once, calmly, rather than as an interruptive alert later.
struct RootView: View {
    @EnvironmentObject private var settings: SettingsViewModel
    @State private var hasCompletedOnboarding: Bool = PersistenceService.shared.loadUserProfile().hasCompletedOnboarding

    var body: some View {
        Group {
            if hasCompletedOnboarding {
                MainTabView()
            } else {
                OnboardingContainerView(onFinished: {
                    hasCompletedOnboarding = true
                })
            }
        }
    }
}

#Preview {
    RootView()
        .environmentObject(SettingsViewModel())
        .environmentObject(StoreKitManager())
}
