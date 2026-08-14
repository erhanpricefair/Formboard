import SwiftUI

struct OfflineDownloadsView: View {
    @EnvironmentObject private var settings: SettingsViewModel
    @EnvironmentObject private var storeKit: StoreKitManager
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private let allSessions = MockContent.sessions

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                if !storeKit.isPremium {
                    GentleCard {
                        Label("Offline downloads are a Premium feature.", systemImage: "lock")
                            .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                    }
                }

                ForEach(allSessions) { session in
                    let isDownloaded = settings.downloadedSessionIDs.contains(session.id)
                    HStack {
                        Text(session.title)
                            .gentleStyle(.body, highContrast: highContrastEnabled)
                        Spacer()
                        Button {
                            settings.setDownloaded(session, downloaded: !isDownloaded)
                        } label: {
                            Image(systemName: isDownloaded ? "checkmark.circle.fill" : "arrow.down.circle")
                                .font(.system(size: 24))
                                .foregroundColor(isDownloaded ? colors.success : colors.primaryGreen)
                        }
                        .disabled(!storeKit.isPremium)
                        .minimumTouchTarget()
                        .accessibilityLabel(isDownloaded ? "Remove download" : "Download for offline use")
                    }
                    .padding(Theme.Spacing.sm)
                    .gentleCardStyle(highContrast: highContrastEnabled)
                }

                if !settings.downloadedSessionIDs.isEmpty {
                    GentleButton(title: "Remove All Downloads", kind: .secondary) {
                        settings.removeAllDownloads()
                    }
                }
            }
            .padding(Theme.Spacing.lg)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Offline Downloads")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack { OfflineDownloadsView() }
        .environmentObject(SettingsViewModel())
        .environmentObject(StoreKitManager())
}
