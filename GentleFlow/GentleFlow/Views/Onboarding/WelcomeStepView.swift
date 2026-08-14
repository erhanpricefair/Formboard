import SwiftUI

struct WelcomeStepView: View {
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    let onGetStarted: () -> Void
    let onSkip: () -> Void

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer(minLength: Theme.Spacing.xl)

            Image(systemName: "figure.mind.and.body")
                .font(.system(size: 72))
                .foregroundColor(colors.primaryGreen)
                .accessibilityHidden(true)

            Text("Welcome to Gentle Flow")
                .gentleStyle(.largeTitle, highContrast: highContrastEnabled)
                .multilineTextAlignment(.center)

            Text("A calm, easy way to move each day — Tai Chi and gentle breathing, at your own pace. No experience needed, and you can practise seated or standing.")
                .gentleStyle(.body, highContrast: highContrastEnabled)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Theme.Spacing.sm)

            Text("A few quick questions will help us build a plan that suits you. It takes about a minute, and you can change your answers any time.")
                .gentleStyle(.caption, highContrast: highContrastEnabled)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Theme.Spacing.sm)

            Spacer(minLength: Theme.Spacing.lg)

            GentleButton(title: "Let's Get Started", systemImage: "arrow.right", accessibilityHint: "Begin a short set-up questions") {
                onGetStarted()
            }

            GentleButton(title: "Skip and use default settings", kind: .plain) {
                onSkip()
            }
        }
    }
}
