import SwiftUI

struct AboutDisclaimerView: View {
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Text("Safety First")
                            .gentleStyle(.title, highContrast: highContrastEnabled)
                        Text("""
                        Gentle Flow offers general movement guidance for wellbeing purposes. It is not medical advice, physiotherapy, or a substitute for professional care.

                        Please speak with your GP before starting if you have a health condition, a recent injury, or are otherwise unsure whether gentle movement is right for you.

                        Stop straight away if you feel pain, dizziness, or discomfort. Keep a sturdy chair or rail nearby for standing sessions, especially when you're just starting out.
                        """)
                            .gentleStyle(.body, highContrast: highContrastEnabled)
                    }
                }

                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Text("Your Privacy")
                            .gentleStyle(.title, highContrast: highContrastEnabled)
                        Text("""
                        Gentle Flow does not require an account. Your plan and progress are stored only on this device and are never sold or shared with advertisers.

                        If you choose to share progress with a family member, that information is sent only when you explicitly choose to send it.
                        """)
                            .gentleStyle(.body, highContrast: highContrastEnabled)
                    }
                }

                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Text("About Gentle Flow")
                            .gentleStyle(.title, highContrast: highContrastEnabled)
                        Text("Gentle Flow was built for Australian seniors and pensioners, with a focus on balance, comfort and calm. Version 1.0.0.")
                            .gentleStyle(.body, highContrast: highContrastEnabled)
                    }
                }

                VStack(spacing: Theme.Spacing.sm) {
                    Link("Privacy Policy", destination: AppLinks.privacyPolicy)
                    Link("Terms of Use", destination: AppLinks.termsOfUse)
                }
                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
            }
            .padding(Theme.Spacing.lg)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("About & Safety")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack { AboutDisclaimerView() }
}
