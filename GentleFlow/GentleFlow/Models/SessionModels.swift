import Foundation

enum SessionCategory: String, Codable, CaseIterable, Identifiable, Hashable {
    case chairTaiChi
    case standingTaiChi
    case taiChiWalking
    case breathingCalm

    var id: String { rawValue }

    var title: String {
        switch self {
        case .chairTaiChi: return "Chair Tai Chi"
        case .standingTaiChi: return "Standing Tai Chi"
        case .taiChiWalking: return "Tai Chi Walking"
        case .breathingCalm: return "Breathing & Calm"
        }
    }

    var shortDescription: String {
        switch self {
        case .chairTaiChi: return "Gentle seated movement — no standing needed"
        case .standingTaiChi: return "Slow, supported standing movement"
        case .taiChiWalking: return "Mindful walking, indoors or out"
        case .breathingCalm: return "Short breathing and Qigong-style calm"
        }
    }

    var systemImage: String {
        switch self {
        case .chairTaiChi: return "chair.lounge"
        case .standingTaiChi: return "figure.mind.and.body"
        case .taiChiWalking: return "figure.walk"
        case .breathingCalm: return "wind"
        }
    }
}

/// Difficulty is intentionally framed around comfort, not fitness —
/// "gentle" never implies the higher levels are unsafe to skip.
enum SessionDifficulty: String, Codable, CaseIterable, Identifiable, Comparable {
    case gentle
    case easyPlus
    case building

    var id: String { rawValue }

    var title: String {
        switch self {
        case .gentle: return "Gentle"
        case .easyPlus: return "Gentle Plus"
        case .building: return "Building Confidence"
        }
    }

    private var order: Int {
        switch self {
        case .gentle: return 0
        case .easyPlus: return 1
        case .building: return 2
        }
    }

    static func < (lhs: SessionDifficulty, rhs: SessionDifficulty) -> Bool {
        lhs.order < rhs.order
    }
}

struct Session: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var category: SessionCategory
    var durationMinutes: Int
    var difficulty: SessionDifficulty
    var requiresChair: Bool
    /// Name of a bundled/downloadable video asset. Placeholder until real
    /// video content is dropped in — see README "Next steps".
    var videoAssetName: String?
    var thumbnailSystemImage: String
    var summary: String
    var whyThisHelps: String
    var isPremium: Bool
    var hasVoiceGuidance: Bool

    init(
        id: UUID = UUID(),
        title: String,
        category: SessionCategory,
        durationMinutes: Int,
        difficulty: SessionDifficulty,
        requiresChair: Bool,
        videoAssetName: String? = nil,
        thumbnailSystemImage: String,
        summary: String,
        whyThisHelps: String,
        isPremium: Bool = false,
        hasVoiceGuidance: Bool = true
    ) {
        self.id = id
        self.title = title
        self.category = category
        self.durationMinutes = durationMinutes
        self.difficulty = difficulty
        self.requiresChair = requiresChair
        self.videoAssetName = videoAssetName
        self.thumbnailSystemImage = thumbnailSystemImage
        self.summary = summary
        self.whyThisHelps = whyThisHelps
        self.isPremium = isPremium
        self.hasVoiceGuidance = hasVoiceGuidance
    }
}
