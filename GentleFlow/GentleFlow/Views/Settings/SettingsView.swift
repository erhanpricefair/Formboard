import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: SettingsViewModel
    @EnvironmentObject private var storeKit: StoreKitManager
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @State private var showPaywall = false
    @State private var showResetConfirmation = false

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    membershipCard

                    NavigationLink {
                        AccessibilitySettingsView()
                    } label: {
                        settingsRow(icon: "textformat.size", title: "Accessibility & Display")
                    }

                    NavigationLink {
                        OfflineDownloadsView()
                    } label: {
                        settingsRow(icon: "arrow.down.circle", title: "Offline Downloads")
                    }

                    NavigationLink {
                        AboutDisclaimerView()
                    } label: {
                        settingsRow(icon: "info.circle", title: "About & Safety Information")
                    }

                    NavigationLink {
                        CaregiverShareView()
                    } label: {
                        settingsRow(icon: "person.2", title: "Share Progress with Family")
                    }

                    Button {
                        showResetConfirmation = true
                    } label: {
                        settingsRow(icon: "trash", title: "Clear My Data", tint: colors.warningGentle)
                    }
                }
                .padding(Theme.Spacing.lg)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("Settings")
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
            .alert("Clear all your data?", isPresented: $showResetConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Clear Data", role: .destructive) {
                    settings.resetAllData()
                }
            } message: {
                Text("This removes your plan, progress and preferences from this device. This can't be undone.")
            }
        }
    }

    private var membershipCard: some View {
        GentleCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                HStack {
                    Image(systemName: storeKit.isPremium ? "star.circle.fill" : "star.circle")
                        .font(.system(size: 28))
                        .foregroundColor(colors.primaryGreen)
                    Text(storeKit.isPremium ? "Gentle Flow Premium" : "Gentle Flow Free")
                        .gentleStyle(.title, highContrast: highContrastEnabled)
                }
                Text(storeKit.isPremium
                     ? "Thank you for supporting Gentle Flow. You have full access to every session and offline downloads."
                     : "You have access to our core free sessions. Upgrade any time for the full library and offline downloads.")
                    .gentleStyle(.body, highContrast: highContrastEnabled)

                if !storeKit.isPremium {
                    GentleButton(title: "See Premium Options", systemImage: "star") {
                        showPaywall = true
                    }
                }
            }
        }
    }

    private func settingsRow(icon: String, title: String, tint: Color? = nil) -> some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: icon)
                .foregroundColor(tint ?? colors.primaryGreen)
                .frame(width: 28)
            Text(title)
                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(colors.secondaryText)
        }
        .padding(Theme.Spacing.sm)
        .frame(minHeight: Theme.TouchTarget.minimum)
        .gentleCardStyle(highContrast: highContrastEnabled)
    }
}

#Preview {
    SettingsView()
        .environmentObject(SettingsViewModel())
        .environmentObject(StoreKitManager())
}
