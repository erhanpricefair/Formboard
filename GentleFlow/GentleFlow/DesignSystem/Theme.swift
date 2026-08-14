import SwiftUI

/// Gentle Flow's colour system.
///
/// Design intent: warm, calm, high-contrast, and never clinical. Colours are
/// defined in code (rather than only an asset catalog) so that the optional
/// "High Contrast" setting can swap the whole palette for a stronger one
/// without needing two full asset catalogs. Drop equivalent named colours
/// into Assets.xcassets later if you want colour-scheme-aware assets too.
enum ThemeColor {
    case background
    case surface
    case surfaceAlt
    case primaryText
    case secondaryText
    case primaryGreen
    case primaryGreenText // text/icon colour to use ON primaryGreen
    case accentTerracotta
    case divider
    case success
    case warningGentle
}

enum Theme {

    static func color(_ token: ThemeColor, highContrast: Bool) -> Color {
        switch token {
        case .background:
            return highContrast ? Color.white : Color(hex: 0xFAF6EF) // warm cream
        case .surface:
            return highContrast ? Color.white : Color(hex: 0xFFFFFF)
        case .surfaceAlt:
            return highContrast ? Color(hex: 0xF0F0F0) : Color(hex: 0xEFE7DA)
        case .primaryText:
            return highContrast ? Color.black : Color(hex: 0x2B2A28) // warm near-black
        case .secondaryText:
            return highContrast ? Color(hex: 0x1A1A1A) : Color(hex: 0x5B5952)
        case .primaryGreen:
            return highContrast ? Color(hex: 0x1F4A34) : Color(hex: 0x4C7A5E) // sage green
        case .primaryGreenText:
            return Color.white
        case .accentTerracotta:
            return highContrast ? Color(hex: 0x8A3B12) : Color(hex: 0xC97B4A)
        case .divider:
            return highContrast ? Color(hex: 0x000000).opacity(0.4) : Color(hex: 0xD9D0BF)
        case .success:
            return highContrast ? Color(hex: 0x1F4A34) : Color(hex: 0x3E8E5B)
        case .warningGentle:
            return highContrast ? Color(hex: 0x7A3B00) : Color(hex: 0xB5651D)
        }
    }

    // Generous, senior-friendly spacing scale. Prefer these over ad-hoc numbers.
    enum Spacing {
        static let xs: CGFloat = 8
        static let sm: CGFloat = 12
        static let md: CGFloat = 20
        static let lg: CGFloat = 28
        static let xl: CGFloat = 40
    }

    enum Radius {
        static let card: CGFloat = 20
        static let button: CGFloat = 18
        static let pill: CGFloat = 999
    }

    // Minimum tappable side length per Apple HIG + WCAG 2.2 AA (44pt minimum);
    // Gentle Flow deliberately goes larger for a senior audience.
    enum TouchTarget {
        static let minimum: CGFloat = 56
    }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex & 0xFF0000) >> 16) / 255.0
        let g = Double((hex & 0x00FF00) >> 8) / 255.0
        let b = Double(hex & 0x0000FF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}

// MARK: - High contrast environment plumbing

private struct HighContrastKey: EnvironmentKey {
    static let defaultValue: Bool = false
}

extension EnvironmentValues {
    var highContrastEnabled: Bool {
        get { self[HighContrastKey.self] }
        set { self[HighContrastKey.self] = newValue }
    }
}

/// Convenience so views can write `Theme.color(.primaryText, ...)` less often
/// and instead read colours straight from the environment.
struct ThemedColors {
    let highContrast: Bool

    var background: Color { Theme.color(.background, highContrast: highContrast) }
    var surface: Color { Theme.color(.surface, highContrast: highContrast) }
    var surfaceAlt: Color { Theme.color(.surfaceAlt, highContrast: highContrast) }
    var primaryText: Color { Theme.color(.primaryText, highContrast: highContrast) }
    var secondaryText: Color { Theme.color(.secondaryText, highContrast: highContrast) }
    var primaryGreen: Color { Theme.color(.primaryGreen, highContrast: highContrast) }
    var primaryGreenText: Color { Theme.color(.primaryGreenText, highContrast: highContrast) }
    var accentTerracotta: Color { Theme.color(.accentTerracotta, highContrast: highContrast) }
    var divider: Color { Theme.color(.divider, highContrast: highContrast) }
    var success: Color { Theme.color(.success, highContrast: highContrast) }
    var warningGentle: Color { Theme.color(.warningGentle, highContrast: highContrast) }
}

