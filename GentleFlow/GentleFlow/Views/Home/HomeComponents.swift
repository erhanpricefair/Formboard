import SwiftUI

struct TodaySessionCard: View {
    let session: Session?
    let isRestDay: Bool
    let onStart: (Session) -> Void

    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        GentleCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("Today's Session")
                    .gentleStyle(.caption, highContrast: highContrastEnabled)
                    .textCase(.uppercase)

                if isRestDay {
                    restDayContent
                } else if let session {
                    sessionContent(session)
                } else {
                    noPlanContent
                }
            }
        }
        .accessibilityElement(children: .combine)
    }

    private var restDayContent: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: "moon.zzz")
                    .font(.system(size: 32))
                    .foregroundColor(colors.primaryGreen)
                Text("Rest Day")
                    .gentleStyle(.title, highContrast: highContrastEnabled)
            }
            Text("Your plan has a rest day today. A short stroll or gentle stretch is lovely if you feel like it — but resting fully is just as good.")
                .gentleStyle(.body, highContrast: highContrastEnabled)
        }
    }

    private func sessionContent(_ session: Session) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous)
                        .fill(colors.surfaceAlt)
                        .frame(width: 64, height: 64)
                    Image(systemName: session.thumbnailSystemImage)
                        .font(.system(size: 28))
                        .foregroundColor(colors.primaryGreen)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(session.title)
                        .gentleStyle(.title, highContrast: highContrastEnabled)
                    Text("\(session.durationMinutes) min · \(session.category.title)")
                        .gentleStyle(.caption, highContrast: highContrastEnabled)
                }
            }

            Text(session.summary)
                .gentleStyle(.body, highContrast: highContrastEnabled)

            GentleButton(title: "Start Today's Session", systemImage: "play.fill", accessibilityHint: "Opens the session player") {
                onStart(session)
            }
        }
    }

    private var noPlanContent: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("No plan yet")
                .gentleStyle(.title, highContrast: highContrastEnabled)
            Text("Head to the Sessions tab any time to choose something gentle to start with.")
                .gentleStyle(.body, highContrast: highContrastEnabled)
        }
    }
}

struct StreakBadgeView: View {
    let streakDays: Int
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "leaf.fill")
                .foregroundColor(colors.primaryGreen)
            Text(streakText)
                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
            Spacer()
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.vertical, Theme.Spacing.sm)
        .background(colors.primaryGreen.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private var streakText: String {
        streakDays == 1 ? "1 day practised in a row — nicely done" : "\(streakDays) days practised in a row — nicely done"
    }
}

struct WhyThisHelpsCard: View {
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        GentleCard {
            HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                Image(systemName: "lightbulb")
                    .font(.system(size: 24))
                    .foregroundColor(colors.accentTerracotta)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Why this helps")
                        .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                    Text("Many people find that practising slow, gentle movement regularly helps them feel steadier and more confident on their feet over time.")
                        .gentleStyle(.body, highContrast: highContrastEnabled)
                }
            }
        }
    }
}

struct QuickAccessGrid: View {
    let categories: [SessionCategory]
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    private let columns = [GridItem(.flexible(), spacing: Theme.Spacing.sm), GridItem(.flexible(), spacing: Theme.Spacing.sm)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: Theme.Spacing.sm) {
            ForEach(categories) { category in
                NavigationLink(value: category) {
                    VStack(spacing: Theme.Spacing.xs) {
                        Image(systemName: category.systemImage)
                            .font(.system(size: 30))
                            .foregroundColor(colors.primaryGreen)
                        Text(category.title)
                            .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(Theme.Spacing.md)
                    .frame(minHeight: 110)
                    .gentleCardStyle(highContrast: highContrastEnabled)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(category.title)
                .accessibilityHint(category.shortDescription)
            }
        }
        .navigationDestination(for: SessionCategory.self) { category in
            SessionsLibraryView(initialCategory: category)
        }
    }
}
