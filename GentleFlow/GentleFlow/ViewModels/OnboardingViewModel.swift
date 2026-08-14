import Foundation

@MainActor
final class OnboardingViewModel: ObservableObject {

    enum Step: Int, CaseIterable {
        case welcome
        case goals
        case mobility
        case chairPreference
        case jointConcerns
        case sessionLength
        case summary
    }

    @Published var step: Step = .welcome
    @Published var answers: OnboardingAnswers = .empty
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

    func advance() {
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
        persistence.saveUserProfile(profile)

        let plan = PlanGenerator.generateStarterPlan(from: answers)
        persistence.savePlan(plan)
        isComplete = true
        return plan
    }
}
