import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @State private var playerSession: Session?

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    greeting

                    if viewModel.streakDays > 0 {
                        StreakBadgeView(streakDays: viewModel.streakDays)
                    }

                    TodaySessionCard(
                        session: viewModel.todaySession,
                        isRestDay: viewModel.isRestDayToday,
                        onStart: { session in playerSession = session }
                    )

                    if let plan = viewModel.plan {
                        NavigationLink {
                            PlanDetailView(plan: plan, sessions: MockContent.sessions)
                        } label: {
                            HStack {
                                Label("View My Full Plan", systemImage: "calendar")
                                    .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                                Spacer()
                                Image(systemName: "chevron.right").foregroundColor(colors.secondaryText)
                            }
                            .padding(Theme.Spacing.sm)
                            .frame(minHeight: Theme.TouchTarget.minimum)
                            .gentleCardStyle(highContrast: highContrastEnabled)
                        }
                        .buttonStyle(.plain)
                    }

                    WhyThisHelpsCard()

                    Text("Explore")
                        .gentleStyle(.title, highContrast: highContrastEnabled)

                    QuickAccessGrid(categories: viewModel.quickAccessCategories)
                }
                .padding(Theme.Spacing.lg)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("Gentle Flow")
            .onAppear { viewModel.load() }
            .fullScreenCover(item: $playerSession) { session in
                SessionPlayerView(session: session)
            }
        }
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(greetingText)
                .gentleStyle(.largeTitle, highContrast: highContrastEnabled)
            Text(todayDateText)
                .gentleStyle(.caption, highContrast: highContrastEnabled)
        }
        .accessibilityElement(children: .combine)
    }

    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let timeOfDay: String
        switch hour {
        case 0..<12: timeOfDay = "Good morning"
        case 12..<17: timeOfDay = "Good afternoon"
        default: timeOfDay = "Good evening"
        }
        if let name = viewModel.userName, !name.isEmpty {
            return "\(timeOfDay), \(name)"
        }
        return timeOfDay
    }

    private var todayDateText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE d MMMM"
        return formatter.string(from: Date())
    }
}

#Preview {
    HomeView()
        .environmentObject(SettingsViewModel())
        .environmentObject(StoreKitManager())
}
