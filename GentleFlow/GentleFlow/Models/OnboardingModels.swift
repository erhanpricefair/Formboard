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

/// A simplified adaptation of the Adult Pre-Exercise Screening System (APSS)
/// used across the Australian fitness industry. This is not a medical
/// assessment — its only job is to notice when someone should have a quick
/// chat with a GP or physio before starting standing balance work, rather
/// than the app silently assuming everyone who opens it is safe to begin.
struct HealthScreeningAnswers: Codable, Equatable {
    var hasChestPainOrDizzinessDuringActivity: Bool?
    var hasLostBalanceOrConsciousness: Bool?
    var hasBoneOrJointProblemAggravatedByActivity: Bool?
    var takesBloodPressureOrHeartMedication: Bool?
    var hasRecentFallOrHospitalStay: Bool?
    var doctorAdvisedMedicalSupervisionOnly: Bool?

    static let empty = HealthScreeningAnswers()

    private var allAnswers: [Bool?] {
        [
            hasChestPainOrDizzinessDuringActivity,
            hasLostBalanceOrConsciousness,
            hasBoneOrJointProblemAggravatedByActivity,
            takesBloodPressureOrHeartMedication,
            hasRecentFallOrHospitalStay,
            doctorAdvisedMedicalSupervisionOnly
        ]
    }

    var isFullyAnswered: Bool {
        allAnswers.allSatisfy { $0 != nil }
    }

    /// True if any answer suggests a GP or physio conversation before
    /// starting is the safer path. Deliberately errs towards recommending a
    /// check-in — an unanswered question counts the same as a "yes" here,
    /// never the same as a confirmed "no".
    var recommendsMedicalCheckIn: Bool {
        allAnswers.contains { $0 != false }
    }
}

/// Records that the safety disclaimer was actually accepted, and when, and
/// against which wording — a plain boolean can't show that later if it
/// ever mattered. `termsVersion` should be bumped whenever the safety copy
/// in `DisclaimerGateView` changes meaningfully, so an old acceptance is
/// never assumed to cover new wording.
struct SafetyAcceptance: Codable, Equatable {
    var acceptedDate: Date
    var termsVersion: String
}

enum SafetyTerms {
    static let currentVersion = "1.0"
}

struct UserProfile: Codable, Equatable {
    var hasCompletedOnboarding: Bool = false
    var preferredName: String? = nil
    var answers: OnboardingAnswers = .empty
    var healthScreening: HealthScreeningAnswers = .empty
    var safetyAcceptance: SafetyAcceptance? = nil

    static let empty = UserProfile()
}
