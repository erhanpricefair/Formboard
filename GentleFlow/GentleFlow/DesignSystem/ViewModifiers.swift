import SwiftUI

/// Ensures any tappable control meets Gentle Flow's minimum touch target
/// (56pt), which is larger than Apple's own 44pt HIG minimum. Seniors with
/// reduced fine motor control benefit from the extra margin.
struct MinimumTouchTarget: ViewModifier {
    var size: CGFloat = Theme.TouchTarget.minimum

    func body(content: Content) -> some View {
        content.frame(minWidth: size, minHeight: size)
    }
}

extension View {
    func minimumTouchTarget(_ size: CGFloat = Theme.TouchTarget.minimum) -> some View {
        modifier(MinimumTouchTarget(size: size))
    }

    /// Wraps content in a soft, rounded card with consistent padding —
    /// the base visual unit used across Home, Library and Progress.
    func gentleCardStyle(highContrast: Bool) -> some View {
        self
            .padding(Theme.Spacing.md)
            .background(Theme.color(.surface, highContrast: highContrast))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                    .strokeBorder(Theme.color(.divider, highContrast: highContrast), lineWidth: highContrast ? 1.5 : 1)
            )
    }

    /// Respects the system Reduce Motion setting by disabling implicit
    /// animation instead of just slowing it down.
    func gentleAnimation<V: Equatable>(_ value: V) -> some View {
        modifier(GentleAnimationModifier(value: value))
    }
}

private struct GentleAnimationModifier<V: Equatable>: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let value: V

    func body(content: Content) -> some View {
        content.animation(reduceMotion ? nil : .easeInOut(duration: 0.35), value: value)
    }
}

// MARK: - Typography

/// Text style tokens. All sizes below are the *minimum* — SwiftUI's
/// relative text styles (.title, .body, etc.) already scale with Dynamic
/// Type, and the app additionally lets users push a size override on top
/// in Settings (see SettingsViewModel.effectiveDynamicTypeSize).
enum GentleTextStyle {
    case largeTitle   // Screen headings, e.g. "Good morning, Margaret"
    case title        // Card titles, e.g. session name
    case body         // Standard paragraph copy (min. ~18-20pt equivalent)
    case bodyEmphasis
    case caption      // Supporting/meta text — never the *only* way info is conveyed
}

extension Text {
    func gentleStyle(_ style: GentleTextStyle, highContrast: Bool) -> Text {
        let color = Theme.color(.primaryText, highContrast: highContrast)
        let secondary = Theme.color(.secondaryText, highContrast: highContrast)
        switch style {
        case .largeTitle:
            return self.font(.system(.largeTitle, design: .rounded, weight: .bold)).foregroundColor(color)
        case .title:
            return self.font(.system(.title2, design: .rounded, weight: .semibold)).foregroundColor(color)
        case .body:
            return self.font(.system(.body, design: .default)).foregroundColor(color)
        case .bodyEmphasis:
            return self.font(.system(.body, design: .default, weight: .semibold)).foregroundColor(color)
        case .caption:
            return self.font(.system(.subheadline, design: .default)).foregroundColor(secondary)
        }
    }
}
