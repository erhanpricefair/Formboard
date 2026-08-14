import SwiftUI

struct SessionDetailView: View {
    let session: Session
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var storeKit: StoreKitManager
    @EnvironmentObject private var settings: SettingsViewModel
    @State private var showPaywall = false
    @State private var showPlayer = false

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }
    private var isLocked: Bool { session.isPremium && !storeKit.isPremium }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    header

                    HStack(spacing: Theme.Spacing.xs) {
                        GentleTag(text: "\(session.durationMinutes) min", systemImage: "clock")
                        GentleTag(text: session.difficulty.title)
                        GentleTag(text: session.requiresChair ? "Seated" : "Standing", systemImage: session.requiresChair ? "chair.lounge" : "figure.stand")
                    }

                    GentleCard {
                        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                            Text("About this session")
                                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                            Text(session.summary)
                                .gentleStyle(.body, highContrast: highContrastEnabled)
                        }
                    }

                    GentleCard {
                        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                            Text("Why this helps")
                                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                            Text(session.whyThisHelps)
                                .gentleStyle(.body, highContrast: highContrastEnabled)
                        }
                    }

                    if isLocked {
                        GentleButton(title: "Unlock with Gentle Flow Premium", systemImage: "lock.open") {
                            showPaywall = true
                        }
                    } else {
                        GentleButton(title: "Start Session", systemImage: "play.fill") {
                            showPlayer = true
                        }

                        offlineDownloadRow
                    }
                }
                .padding(Theme.Spacing.lg)
            }
            .background(colors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                        .minimumTouchTarget()
                }
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
            .fullScreenCover(isPresented: $showPlayer) {
                SessionPlayerView(session: session)
            }
        }
    }

    private var header: some View {
        HStack(spacing: Theme.Spacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                    .fill(colors.surfaceAlt)
                    .frame(width: 84, height: 84)
                Image(systemName: session.thumbnailSystemImage)
                    .font(.system(size: 36))
                    .foregroundColor(colors.primaryGreen)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(session.title)
                    .gentleStyle(.largeTitle, highContrast: highContrastEnabled)
                Text(session.category.title)
                    .gentleStyle(.caption, highContrast: highContrastEnabled)
            }
        }
    }

    private var offlineDownloadRow: some View {
        let isDownloaded = settings.downloadedSessionIDs.contains(session.id)
        return Button {
            settings.setDownloaded(session, downloaded: !isDownloaded)
        } label: {
            Label(
                isDownloaded ? "Downloaded for offline use" : "Download for offline use",
                systemImage: isDownloaded ? "checkmark.circle.fill" : "arrow.down.circle"
            )
            .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(minHeight: Theme.TouchTarget.minimum)
        }
    }
}

#Preview {
    SessionDetailView(session: MockContent.sessions[0])
        .environmentObject(StoreKitManager())
        .environmentObject(SettingsViewModel())
}
