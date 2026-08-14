import Foundation

/// What the person hopes to get out of practising. Multi-select — most
/// people pick more than one, and the plan generator blends them.
enum PrimaryGoal: String, Codable, CaseIterable, Identifiable {
    case balance
    case mobility
    case calm

    var id: String { rawValue }

    var title: String {
        switch self {
        case .balance: return "Better balance"
        case .mobility: return "Easier movement"
        case .calm: return "Calm and less stress"
        }
    }

    var subtitle: String {
        switch self {
        case .balance: return "Feel steadier on your feet"
        case .mobility: return "Move with less stiffness"
        case .calm: return "Feel more relaxed each day"
        }
    }

    var systemImage: String {
        switch self {
        case .balance: return "figure.stand"
        case .mobility: return "figure.walk"
        case .calm: return "leaf"
        }
    }
}

enum MobilityLevel: String, Codable, CaseIterable, Identifiable {
    case mostlySeated
    case standWithSupport
    case standConfidently
    case activeAndMobile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .mostlySeated: return "I'm mostly seated"
        case .standWithSupport: return "I can stand, with support nearby"
        case .standConfidently: return "I can stand and move confidently"
        case .activeAndMobile: return "I'm active and mobile"
        }
    }
}

enum ChairPreference: String, Codable, CaseIterable, Identifiable {
    case chairOnly
    case standingOnly
    case both

    var id: String { rawValue }

    var title: String {
        switch self {
        case .chairOnly: return "Seated sessions only"
        case .standingOnly: return "Standing sessions only"
        case .both: return "A mix of both"
        }
    }
}

enum JointConcern: String, Codable, CaseIterable, Identifiable {
    case knees
    case hips
    case back
    case shoulders

    var id: String { rawValue }

    var title: String {
        switch self {
        case .knees: return "Knees"
        case .hips: return "Hips"
        case .back: return "Back"
        case .shoulders: return "Shoulders"
        }
    }
}

enum SessionLengthPreference: Int, Codable, CaseIterable, Identifiable {
    case five = 5
    case ten = 10
    case fifteen = 15
    case twenty = 20

    var id: Int { rawValue }
    var title: String { "\(rawValue) minutes" }
}

enum PlanLength: Int, Codable, CaseIterable, Identifiable {
    case starter = 7
    case fortnight = 14
    case fourWeeks = 28

    var id: Int { rawValue }
    var title: String { "\(rawValue)-day plan" }
}

struct OnboardingAnswers: Codable, Equatable {
    var goals: Set<PrimaryGoal> = []
    var mobilityLevel: MobilityLevel = .standWithSupport
    var chairPreference: ChairPreference = .both
    var jointConcerns: Set<JointConcern> = []
    var preferredSessionLength: SessionLengthPreference = .ten

    static let empty = OnboardingAnswers()
}

struct UserProfile: Codable, Equatable {
    var hasCompletedOnboarding: Bool = false
    var preferredName: String? = nil
    var answers: OnboardingAnswers = .empty
    var hasAcceptedDisclaimer: Bool = false

    static let empty = UserProfile()
}
