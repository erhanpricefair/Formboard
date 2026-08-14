import SwiftUI

struct AccessibilitySettingsView: View {
    @EnvironmentObject private var settings: SettingsViewModel
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Toggle(isOn: $settings.highContrastEnabled) {
                            Label("High Contrast Mode", systemImage: "circle.lefthalf.filled")
                                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                        }
                        .tint(colors.primaryGreen)
                        Text("Uses stronger black-and-white contrast throughout the app.")
                            .gentleStyle(.caption, highContrast: highContrastEnabled)
                    }
                }

                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Label("Text Size", systemImage: "textformat.size")
                            .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                        Text("This adds extra size on top of the text size you've already chosen in your iPhone or iPad's own Settings.")
                            .gentleStyle(.caption, highContrast: highContrastEnabled)

                        Picker("Text size", selection: $settings.textSizeOverrideStep) {
                            Text("Standard").tag(0)
                            Text("Larger").tag(1)
                            Text("Extra Large").tag(2)
                            Text("Maximum").tag(3)
                        }
                        .pickerStyle(.segmented)

                        Text("Sample text at this size")
                            .font(.system(.body, design: .default))
                            .padding(.top, Theme.Spacing.xs)
                    }
                }

                GentleCard {
                    VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                        Label("Reduce Motion", systemImage: "figure.walk.motion")
                            .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                        Text("Gentle Flow already follows the Reduce Motion setting in your device's own Settings app, under Accessibility.")
                            .gentleStyle(.caption, highContrast: highContrastEnabled)
                    }
                }

                Text("Gentle Flow also fully supports VoiceOver. Every button, image and control has a clear spoken label.")
                    .gentleStyle(.caption, highContrast: highContrastEnabled)
            }
            .padding(Theme.Spacing.lg)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Accessibility & Display")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack { AccessibilitySettingsView() }
        .environmentObject(SettingsViewModel())
}
