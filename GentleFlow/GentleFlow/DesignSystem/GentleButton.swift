import SwiftUI

enum GentleButtonStyleKind {
    case primary     // Solid sage green — main calls to action
    case secondary   // Outlined — lower-emphasis actions
    case plain       // Text-only — tertiary actions like "Skip"
}

/// A large, high-contrast, VoiceOver-friendly button used everywhere in
/// Gentle Flow instead of raw SwiftUI `Button`s, so touch-target size and
/// typography stay consistent without repeating modifiers at every call site.
struct GentleButton: View {
    let title: String
    var systemImage: String? = nil
    var kind: GentleButtonStyleKind = .primary
    var accessibilityHint: String? = nil
    let action: () -> Void

    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @Environment(\.isEnabled) private var isEnabled

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.xs) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 20, weight: .semibold))
                }
                Text(title)
                    .font(.system(.body, design: .rounded, weight: .bold))
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: Theme.TouchTarget.minimum)
            .padding(.horizontal, Theme.Spacing.md)
        }
        .background(background)
        .foregroundColor(foreground)
        .overlay(border)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
        .opacity(isEnabled ? 1 : 0.5)
        .accessibilityHint(accessibilityHint ?? "")
    }

    @ViewBuilder private var background: some View {
        switch kind {
        case .primary: colors.primaryGreen
        case .secondary: colors.surface
        case .plain: Color.clear
        }
    }

    private var foreground: Color {
        switch kind {
        case .primary: colors.primaryGreenText
        case .secondary: colors.primaryGreen
        case .plain: colors.primaryGreen
        }
    }

    @ViewBuilder private var border: some View {
        switch kind {
        case .secondary:
            RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous)
                .strokeBorder(colors.primaryGreen, lineWidth: 2)
        default:
            EmptyView()
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        GentleButton(title: "Start Today's Session", systemImage: "play.fill", kind: .primary) {}
        GentleButton(title: "Not today, thanks", kind: .secondary) {}
        GentleButton(title: "Skip", kind: .plain) {}
    }
    .padding()
}
