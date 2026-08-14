import SwiftUI

struct OnboardingSummaryStepView: View {
    let answers: OnboardingAnswers
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "Your gentle plan is ready",
                subtitle: "We've put together a 7-day starter plan based on your answers."
            )

            GentleCard {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    summaryRow(icon: "target", text: goalsSummary)
                    summaryRow(icon: "figure.stand", text: answers.mobilityLevel.title)
                    summaryRow(icon: "chair.lounge", text: answers.chairPreference.title)
                    summaryRow(icon: "clock", text: "\(answers.preferredSessionLength.title) sessions")
                }
            }

            Text("You can change any of this later in Settings. Your plan will gently adjust as you go.")
                .gentleStyle(.caption, highContrast: highContrastEnabled)
        }
    }

    private var goalsSummary: String {
        answers.goals.isEmpty ? "General gentle movement" : answers.goals.map(\.title).joined(separator: ", ")
    }

    private func summaryRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.sm) {
            Image(systemName: icon)
                .foregroundColor(Theme.color(.primaryGreen, highContrast: highContrastEnabled))
                .frame(width: 26)
            Text(text)
                .gentleStyle(.body, highContrast: highContrastEnabled)
            Spacer()
        }
    }
}
