import SwiftUI

/// Shown before standing sessions start, and again whenever someone
/// switches from chair to standing mid-session — a brief, non-alarming
/// checkpoint rather than a wall of legal text nobody reads. Deliberately
/// blocks nothing: it just asks for a moment of attention before the
/// higher-risk part of a session begins.
struct StandingSafetyReminderView: View {
    let onReady: () -> Void
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Image(systemName: "figure.stand")
                .font(.system(size: 48))
                .foregroundColor(colors.primaryGreen)

            Text("Before you stand up")
                .gentleStyle(.largeTitle, highContrast: highContrastEnabled)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                point("Have a sturdy chair, bench, or rail within easy reach.")
                point("Make sure the floor around you is clear and non-slip.")
                point("Stop straight away if you feel pain, dizziness, or discomfort.")
                point("Take it at your own pace — there's no rush, and no one's watching.")
            }
            .padding(Theme.Spacing.md)
            .gentleCardStyle(highContrast: highContrastEnabled)

            Spacer()

            GentleButton(title: "I'm Ready, Let's Begin", systemImage: "checkmark") {
                onReady()
            }
        }
        .padding(Theme.Spacing.lg)
        .background(colors.background.ignoresSafeArea())
        .interactiveDismissDisabled()
    }

    private func point(_ text: String) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.xs) {
            Image(systemName: "checkmark.circle")
                .foregroundColor(colors.primaryGreen)
            Text(text)
                .gentleStyle(.body, highContrast: highContrastEnabled)
        }
    }
}

#Preview {
    StandingSafetyReminderView(onReady: {})
}
