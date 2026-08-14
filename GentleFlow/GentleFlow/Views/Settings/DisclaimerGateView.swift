import SwiftUI

/// Shown once, the first time the main app appears, so the safety message
/// is seen before any session — but never again nags the user with alerts.
struct DisclaimerGateView: View {
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    let onAccept: () -> Void

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.lg) {
                Image(systemName: "heart.text.square")
                    .font(.system(size: 56))
                    .foregroundColor(colors.primaryGreen)
                    .accessibilityHidden(true)

                Text("Before you begin")
                    .gentleStyle(.largeTitle, highContrast: highContrastEnabled)

                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    disclaimerPoint("Gentle Flow offers general movement guidance, not medical advice or physiotherapy.")
                    disclaimerPoint("Please check with your GP before starting if you have a health condition, recent injury, or are unsure whether this is right for you.")
                    disclaimerPoint("Stop any movement straight away if you feel pain, dizziness, or discomfort.")
                    disclaimerPoint("Keep a sturdy chair or rail nearby for standing sessions, especially at first.")
                }
                .padding(Theme.Spacing.md)
                .gentleCardStyle(highContrast: highContrastEnabled)

                GentleButton(title: "I understand, let's begin", systemImage: "checkmark") {
                    onAccept()
                }
            }
            .padding(Theme.Spacing.lg)
        }
        .background(colors.background.ignoresSafeArea())
        .interactiveDismissDisabled()
    }

    private func disclaimerPoint(_ text: String) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.xs) {
            Image(systemName: "checkmark.circle")
                .foregroundColor(colors.primaryGreen)
            Text(text)
                .gentleStyle(.body, highContrast: highContrastEnabled)
        }
    }
}
