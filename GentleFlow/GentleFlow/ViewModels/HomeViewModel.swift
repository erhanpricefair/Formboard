import Foundation

@MainActor
final class HomeViewModel: ObservableObject {

    @Published private(set) var plan: Plan?
    @Published private(set) var todaySession: Session?
    @Published private(set) var streakDays: Int = 0
    @Published private(set) var userName: String?

    private let persistence: PersistenceService
    private let allSessions: [Session]

    init(persistence: PersistenceService = .shared, allSessions: [Session] = MockContent.sessions) {
        self.persistence = persistence
        self.allSessions = allSessions
        load()
    }

    func load() {
        let profile = persistence.loadUserProfile()
        userName = profile.preferredName

        let loadedPlan = persistence.loadPlan()
        plan = loadedPlan

        if let today = loadedPlan?.todayPlanDay, !today.isRestDay, let sessionID = today.sessionID {
            todaySession = allSessions.first { $0.id == sessionID }
        } else {
            todaySession = nil
        }

        streakDays = Self.computeStreak(from: persistence.loadProgressEntries())
    }

    var isRestDayToday: Bool {
        plan?.todayPlanDay?.isRestDay ?? false
    }

    var quickAccessCategories: [SessionCategory] {
        SessionCategory.allCases
    }

    /// Consecutive days (ending today or yesterday) with at least one
    /// completed session — deliberately forgiving: a single missed day
    /// doesn't zero the streak until a second day is missed, so an
    /// occasional gap doesn't feel like failure.
    nonisolated static func computeStreak(from entries: [ProgressEntry]) -> Int {
        guard !entries.isEmpty else { return 0 }
        let calendar = Calendar.current
        let practicedDays = Set(entries.map { calendar.startOfDay(for: $0.date) })
        var streak = 0
        var cursor = calendar.startOfDay(for: Date())

        // Allow "today" to be unpracticed yet without breaking the streak.
        if !practicedDays.contains(cursor) {
            cursor = calendar.date(byAdding: .day, value: -1, to: cursor) ?? cursor
        }

        while practicedDays.contains(cursor) {
            streak += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return streak
    }
}
