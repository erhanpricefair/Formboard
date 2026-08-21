import SwiftUI

/// A simplified adaptation of the Adult Pre-Exercise Screening System (APSS)
/// used across the Australian fitness industry. This is not a substitute for
/// medical advice — it exists so the app doesn't quietly assume everyone who
/// opens it is safe to start standing balance work, and instead points
/// towards a GP or physio conversation when an answer suggests it.
struct HealthScreeningStepView: View {
    @Binding var answers: HealthScreeningAnswers
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "A few quick safety questions",
                subtitle: "These help us know whether to suggest a chat with your GP or physio before you begin. Answer as best you can."
            )

            questionRow(
                "Do you ever feel chest pain, dizziness, or become very short of breath during physical activity?",
                binding: $answers.hasChestPainOrDizzinessDuringActivity
            )
            questionRow(
                "Have you lost your balance or lost consciousness in the last 12 months?",
                binding: $answers.hasLostBalanceOrConsciousness
            )
            questionRow(
                "Do you have a bone or joint problem that could be made worse by physical activity?",
                binding: $answers.hasBoneOrJointProblemAggravatedByActivity
            )
            questionRow(
                "Are you currently taking medication for blood pressure or a heart condition?",
                binding: $answers.takesBloodPressureOrHeartMedication
            )
            questionRow(
                "Have you had a fall, or spent time in hospital, in the last 3 months?",
                binding: $answers.hasRecentFallOrHospitalStay
            )
            questionRow(
                "Has a doctor ever told you that you should only exercise under medical supervision?",
                binding: $answers.doctorAdvisedMedicalSupervisionOnly
            )

            if answers.isFullyAnswered {
                resultBanner
            }
        }
    }

    @ViewBuilder private var resultBanner: some View {
        GentleCard {
            if answers.recommendsMedicalCheckIn {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Label("Worth a quick check with your GP or physio", systemImage: "stethoscope")
                        .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                    Text("Nothing here is an emergency, and you're welcome to keep going. But based on your answers, it's worth a quick conversation before starting standing balance work. We'll start you with seated and breathing sessions for now — you can add standing sessions any time from Settings once you've had that chat.")
                        .gentleStyle(.body, highContrast: highContrastEnabled)
                }
            } else {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Label("Nothing here suggests a reason to hold off", systemImage: "checkmark.seal")
                        .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                    Text("You're welcome to speak with your GP any time you're unsure about anything. Let's carry on setting up your plan.")
                        .gentleStyle(.body, highContrast: highContrastEnabled)
                }
            }
        }
        .accessibilityElement(children: .combine)
    }

    private func questionRow(_ text: String, binding: Binding<Bool?>) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(text)
                .gentleStyle(.body, highContrast: highContrastEnabled)
            HStack(spacing: Theme.Spacing.sm) {
                yesNoButton("Yes", isSelected: binding.wrappedValue == true) { binding.wrappedValue = true }
                yesNoButton("No", isSelected: binding.wrappedValue == false) { binding.wrappedValue = false }
            }
        }
        .padding(Theme.Spacing.sm)
        .gentleCardStyle(highContrast: highContrastEnabled)
    }

    private func yesNoButton(_ title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        let colors = ThemedColors(highContrast: highContrastEnabled)
        return Button(action: action) {
            Text(title)
                .font(.system(.body, design: .rounded, weight: .semibold))
                .frame(maxWidth: .infinity)
                .frame(minHeight: Theme.TouchTarget.minimum)
                .background(isSelected ? colors.primaryGreen : colors.surfaceAlt)
                .foregroundColor(isSelected ? colors.primaryGreenText : colors.primaryText)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
        }
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}

#Preview {
    ScrollView {
        HealthScreeningStepView(answers: .constant(.empty))
            .padding()
    }
}
