import SwiftUI

struct OnboardingQuestionHeader: View {
    let title: String
    var subtitle: String? = nil
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(title)
                .gentleStyle(.largeTitle, highContrast: highContrastEnabled)
                .fixedSize(horizontal: false, vertical: true)
            if let subtitle {
                Text(subtitle)
                    .gentleStyle(.body, highContrast: highContrastEnabled)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

/// A large, tappable selectable row used for both single- and multi-select
/// onboarding questions. The checkmark/circle is purely decorative — the
/// selected state is also announced via accessibility trait, so VoiceOver
/// users don't rely on the icon alone.
struct SelectableOptionRow: View {
    let title: String
    var subtitle: String? = nil
    var systemImage: String? = nil
    let isSelected: Bool
    let action: () -> Void

    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.sm) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 24))
                        .foregroundColor(colors.primaryGreen)
                        .frame(width: 32)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                    if let subtitle {
                        Text(subtitle)
                            .gentleStyle(.caption, highContrast: highContrastEnabled)
                    }
                }
                Spacer()
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 26))
                    .foregroundColor(isSelected ? colors.primaryGreen : colors.divider)
            }
            .padding(Theme.Spacing.md)
            .frame(minHeight: Theme.TouchTarget.minimum)
            .background(isSelected ? colors.primaryGreen.opacity(0.12) : colors.surface)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous)
                    .strokeBorder(isSelected ? colors.primaryGreen : colors.divider, lineWidth: isSelected ? 2 : 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}
