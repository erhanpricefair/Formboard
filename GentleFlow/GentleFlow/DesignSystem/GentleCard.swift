import SwiftUI

/// A reusable rounded card container. Keeping this as one component (rather
/// than repeating background/corner/border modifiers everywhere) means a
/// future visual tweak — e.g. a stronger border for low-vision users —
/// happens in one place.
struct GentleCard<Content: View>: View {
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .gentleCardStyle(highContrast: highContrastEnabled)
    }
}

/// Small rounded "pill" used for tags like difficulty or duration.
struct GentleTag: View {
    let text: String
    var systemImage: String? = nil
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    var body: some View {
        let colors = ThemedColors(highContrast: highContrastEnabled)
        HStack(spacing: 4) {
            if let systemImage {
                Image(systemName: systemImage)
            }
            Text(text)
        }
        .font(.system(.footnote, design: .rounded, weight: .semibold))
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(colors.surfaceAlt)
        .foregroundColor(colors.primaryText)
        .clipShape(Capsule())
    }
}
