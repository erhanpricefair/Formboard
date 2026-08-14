import SwiftUI

struct ProgressHomeView: View {
    @StateObject private var viewModel = ProgressViewModel()
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @State private var showMoodCheckIn = false

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    encouragementCard
                    statsRow
                    moodCheckInCard

                    if !viewModel.entries.isEmpty {
                        Text("Recent activity")
                            .gentleStyle(.title, highContrast: highContrastEnabled)
                        ForEach(viewModel.entries.prefix(10)) { entry in
                            ProgressEntryRow(entry: entry)
                        }
                    }
                }
                .padding(Theme.Spacing.lg)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("Your Progress")
            .onAppear { viewModel.load() }
            .sheet(isPresented: $showMoodCheckIn) {
                MoodCheckInView { mood, note in
                    viewModel.addMoodCheckIn(mood, note: note)
                }
            }
        }
    }

    private var encouragementCard: some View {
        GentleCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Image(systemName: "sparkles")
                    .font(.system(size: 28))
                    .foregroundColor(colors.primaryGreen)
                Text(viewModel.encouragementMessage)
                    .gentleStyle(.title, highContrast: highContrastEnabled)
            }
        }
    }

    private var statsRow: some View {
        HStack(spacing: Theme.Spacing.sm) {
            statTile(value: "\(viewModel.currentStreak)", label: "Day streak")
            statTile(value: "\(viewModel.totalDaysPracticed)", label: "Days practised")
            statTile(value: "\(viewModel.thisWeekEntries.count)", label: "This week")
        }
    }

    private func statTile(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title, design: .rounded, weight: .bold))
                .foregroundColor(colors.primaryGreen)
            Text(label)
                .gentleStyle(.caption, highContrast: highContrastEnabled)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.sm)
        .gentleCardStyle(highContrast: highContrastEnabled)
        .accessibilityElement(children: .combine)
    }

    private var moodCheckInCard: some View {
        GentleCard {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("How are you feeling today?")
                    .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                GentleButton(title: "Add a Mood Check-In", systemImage: "face.smiling", kind: .secondary) {
                    showMoodCheckIn = true
                }
            }
        }
    }
}

struct ProgressEntryRow: View {
    let entry: ProgressEntry
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: entry.sessionID != nil ? "figure.mind.and.body" : "face.smiling")
                .foregroundColor(colors.primaryGreen)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                Text(entry.date.formatted(date: .abbreviated, time: .omitted))
                    .gentleStyle(.caption, highContrast: highContrastEnabled)
            }
            Spacer()
            if let mood = entry.moodRating {
                Text(mood.emoji).font(.title2)
            }
        }
        .padding(Theme.Spacing.sm)
        .gentleCardStyle(highContrast: highContrastEnabled)
        .accessibilityElement(children: .combine)
    }

    private var title: String {
        if entry.sessionID != nil {
            return "\(entry.completedMinutes) minute session completed"
        }
        return "Mood check-in"
    }
}

#Preview {
    ProgressHomeView()
}
