import Foundation

@MainActor
final class OnboardingViewModel: ObservableObject {

    enum Step: Int, CaseIterable {
        case welcome
        case healthScreening
        case goals
        case mobility
        case chairPreference
        case jointConcerns
        case sessionLength
        case summary
    }

    @Published var step: Step = .welcome
    @Published var answers: OnboardingAnswers = .empty
    @Published var screeningAnswers: HealthScreeningAnswers = .empty
    @Published var isComplete: Bool = false

    private let persistence: PersistenceService

    init(persistence: PersistenceService = .shared) {
        self.persistence = persistence
    }

    var progress: Double {
        Double(step.rawValue) / Double(Step.allCases.count - 1)
    }

    var canGoBack: Bool {
        step != .welcome
    }

    /// Gates the Continue button on the screening step so it can't be
    /// skipped past unanswered — every other step has a sensible default,
    /// this one doesn't.
    var canAdvanceFromCurrentStep: Bool {
        if step == .healthScreening {
            return screeningAnswers.isFullyAnswered
        }
        return true
    }

    func advance() {
        if step == .healthScreening, screeningAnswers.recommendsMedicalCheckIn {
            // Bias the default towards seated practice when screening flags
            // something — the person can still choose standing sessions
            // later, but the app shouldn't nudge them there by default.
            answers.chairPreference = .chairOnly
        }
        guard let next = Step(rawValue: step.rawValue + 1) else { return }
        step = next
    }

    func goBack() {
        guard let previous = Step(rawValue: step.rawValue - 1) else { return }
        step = previous
    }

    /// Onboarding can be skipped from the welcome screen for someone who
    /// just wants to get moving — they land on sensible defaults and can
    /// refine their plan later from Settings.
    func skipToDefaults() -> Plan {
        answers = .empty
        return complete()
    }

    @discardableResult
    func complete() -> Plan {
        var profile = persistence.loadUserProfile()
        profile.hasCompletedOnboarding = true
        profile.answers = answers
        profile.healthScreening = screeningAnswers
        persistence.saveUserProfile(profile)

        let plan = PlanGenerator.generateStarterPlan(from: answers)
        persistence.savePlan(plan)
        isComplete = true
        return plan
    }
}
