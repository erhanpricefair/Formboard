import Foundation

struct PlanDay: Identifiable, Codable, Hashable {
    let id: UUID
    var dayNumber: Int
    var sessionID: UUID?
    var isRestDay: Bool
    var isCompleted: Bool

    init(id: UUID = UUID(), dayNumber: Int, sessionID: UUID?, isRestDay: Bool = false, isCompleted: Bool = false) {
        self.id = id
        self.dayNumber = dayNumber
        self.sessionID = sessionID
        self.isRestDay = isRestDay
        self.isCompleted = isCompleted
    }
}

struct Plan: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var length: PlanLength
    var days: [PlanDay]
    var createdDate: Date

    init(id: UUID = UUID(), title: String, length: PlanLength, days: [PlanDay], createdDate: Date = Date()) {
        self.id = id
        self.title = title
        self.length = length
        self.days = days
        self.createdDate = createdDate
    }

    /// Which plan day corresponds to "today", based on days elapsed since
    /// the plan started. Clamped so a break in practice doesn't push the
    /// person past the end of the plan — Gentle Flow never punishes a gap.
    var todayIndex: Int {
        let calendar = Calendar.current
        let daysElapsed = calendar.dateComponents([.day], from: calendar.startOfDay(for: createdDate), to: calendar.startOfDay(for: Date())).day ?? 0
        return min(max(daysElapsed, 0), days.count - 1)
    }

    var todayPlanDay: PlanDay? {
        guard days.indices.contains(todayIndex) else { return nil }
        return days[todayIndex]
    }
}
