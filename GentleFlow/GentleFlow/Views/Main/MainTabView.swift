import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var settings: SettingsViewModel
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .accessibilityLabel("Home, today's session")

            SessionsLibraryView()
                .tabItem {
                    Label("Sessions", systemImage: "square.grid.2x2.fill")
                }
                .accessibilityLabel("Sessions library")

            ProgressHomeView()
                .tabItem {
                    Label("Progress", systemImage: "chart.bar.fill")
                }
                .accessibilityLabel("Your progress")

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .accessibilityLabel("Settings")
        }
        .tint(Theme.color(.primaryGreen, highContrast: highContrastEnabled))
        .fullScreenCover(isPresented: disclaimerBinding) {
            DisclaimerGateView {
                settings.acceptDisclaimer()
            }
        }
    }

    private var disclaimerBinding: Binding<Bool> {
        Binding(
            get: { !settings.userProfile.hasAcceptedDisclaimer },
            set: { _ in }
        )
    }
}

#Preview {
    MainTabView()
        .environmentObject(SettingsViewModel())
        .environmentObject(StoreKitManager())
}
