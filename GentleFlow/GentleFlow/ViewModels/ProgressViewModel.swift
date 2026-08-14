import Foundation

@MainActor
final class ProgressViewModel: ObservableObject {

    @Published private(set) var entries: [ProgressEntry] = []
    private let persistence: PersistenceService

    init(persistence: PersistenceService = .shared) {
        self.persistence = persistence
        load()
    }

    func load() {
        entries = persistence.loadProgressEntries().sorted { $0.date > $1.date }
    }

    var totalDaysPracticed: Int {
        let calendar = Calendar.current
        return Set(entries.map { calendar.startOfDay(for: $0.date) }).count
    }

    var currentStreak: Int {
        HomeViewModel.computeStreak(from: entries)
    }

    var thisWeekEntries: [ProgressEntry] {
        let calendar = Calendar.current
        guard let weekStart = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: Date())) else {
            return []
        }
        return entries.filter { $0.date >= weekStart }
    }

    /// A gentle, non-repetitive celebration message — never over-the-top,
    /// matching the "calm, never pressure" tone.
    var encouragementMessage: String {
        switch currentStreak {
        case 0: return "Ready when you are — every session counts, no pressure."
        case 1: return "Lovely start. One session practised."
        case 2...3: return "You're building a gentle habit. Well done."
        case 4...6: return "Wonderful consistency this week."
        default: return "Fantastic — your consistency is really paying off."
        }
    }

    func addMoodCheckIn(_ mood: MoodRating, note: String? = nil) {
        let entry = ProgressEntry(sessionID: nil, completedMinutes: 0, moodRating: mood, balanceConfidenceNote: note)
        persistence.appendProgressEntry(entry)
        load()
    }
}
