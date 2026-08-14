import SwiftUI

/// Optional, off-by-default sharing of a plain-language progress summary
/// with a family member or carer — entirely user-initiated via the system
/// share sheet, never automatic and never sent to a server.
struct CaregiverShareView: View {
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @StateObject private var progressViewModel = ProgressViewModel()
    @State private var shareItem: ShareableFile?

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Text("Share Your Progress")
                            .gentleStyle(.title, highContrast: highContrastEnabled)
                        Text("If you'd like, you can send a simple summary of your practice to a family member or carer — by text, email, or however you like. Nothing is shared unless you choose to send it.")
                            .gentleStyle(.body, highContrast: highContrastEnabled)
                    }
                }

                GentleButton(title: "Prepare Summary to Share", systemImage: "square.and.arrow.up") {
                    let text = summaryText
                    if let url = ShareableFile.write(data: Data(text.utf8), filename: "Gentle Flow Progress.txt") {
                        shareItem = url
                    }
                }
            }
            .padding(Theme.Spacing.lg)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Family Sharing")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $shareItem) { file in
            ShareSheet(activityItems: [file.url])
        }
    }

    private var summaryText: String {
        """
        Gentle Flow progress summary

        Days practised: \(progressViewModel.totalDaysPracticed)
        Current streak: \(progressViewModel.currentStreak) days
        This week: \(progressViewModel.thisWeekEntries.count) sessions

        \(progressViewModel.encouragementMessage)
        """
    }
}

#Preview {
    NavigationStack { CaregiverShareView() }
}
