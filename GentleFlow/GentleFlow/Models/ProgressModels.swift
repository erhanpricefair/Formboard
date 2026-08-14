import Foundation

/// A calm, low-pressure 4-point mood scale — deliberately not a 1-10 scale,
/// which reads as clinical and invites overthinking.
enum MoodRating: Int, Codable, CaseIterable, Identifiable {
    case low = 1
    case okay = 2
    case good = 3
    case great = 4

    var id: Int { rawValue }

    var emoji: String {
        switch self {
        case .low: return "🙁"
        case .okay: return "😐"
        case .good: return "🙂"
        case .great: return "😄"
        }
    }

    var label: String {
        switch self {
        case .low: return "Not great"
        case .okay: return "Okay"
        case .good: return "Good"
        case .great: return "Great"
        }
    }
}

struct ProgressEntry: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var sessionID: UUID?
    var completedMinutes: Int
    var moodRating: MoodRating?
    var balanceConfidenceNote: String?

    init(
        id: UUID = UUID(),
        date: Date = Date(),
        sessionID: UUID?,
        completedMinutes: Int,
        moodRating: MoodRating? = nil,
        balanceConfidenceNote: String? = nil
    ) {
        self.id = id
        self.date = date
        self.sessionID = sessionID
        self.completedMinutes = completedMinutes
        self.moodRating = moodRating
        self.balanceConfidenceNote = balanceConfidenceNote
    }
}
