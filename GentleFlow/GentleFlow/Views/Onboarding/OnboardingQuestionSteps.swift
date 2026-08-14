import SwiftUI

struct GoalsStepView: View {
    @Binding var selectedGoals: Set<PrimaryGoal>

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "What would you like help with?",
                subtitle: "Choose as many as you like."
            )
            ForEach(PrimaryGoal.allCases) { goal in
                SelectableOptionRow(
                    title: goal.title,
                    subtitle: goal.subtitle,
                    systemImage: goal.systemImage,
                    isSelected: selectedGoals.contains(goal)
                ) {
                    if selectedGoals.contains(goal) {
                        selectedGoals.remove(goal)
                    } else {
                        selectedGoals.insert(goal)
                    }
                }
            }
        }
    }
}

struct MobilityStepView: View {
    @Binding var selection: MobilityLevel

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "How would you describe your movement today?",
                subtitle: "There's no wrong answer — this just helps us start you at a comfortable level."
            )
            ForEach(MobilityLevel.allCases) { level in
                SelectableOptionRow(title: level.title, isSelected: selection == level) {
                    selection = level
                }
            }
        }
    }
}

struct ChairPreferenceStepView: View {
    @Binding var selection: ChairPreference

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "Seated or standing?",
                subtitle: "You can always switch this later in a session."
            )
            ForEach(ChairPreference.allCases) { preference in
                SelectableOptionRow(title: preference.title, isSelected: selection == preference) {
                    selection = preference
                }
            }
        }
    }
}

struct JointConcernsStepView: View {
    @Binding var selectedConcerns: Set<JointConcern>
    @Environment(\.highContrastEnabled) private var highContrastEnabled

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "Any joints we should be gentle with?",
                subtitle: "Optional — select any that apply."
            )
            ForEach(JointConcern.allCases) { concern in
                SelectableOptionRow(title: concern.title, isSelected: selectedConcerns.contains(concern)) {
                    if selectedConcerns.contains(concern) {
                        selectedConcerns.remove(concern)
                    } else {
                        selectedConcerns.insert(concern)
                    }
                }
            }
            Text("This helps us highlight sessions that suit you. It's general guidance, not medical advice — please check with your GP or physiotherapist if you're ever unsure.")
                .gentleStyle(.caption, highContrast: highContrastEnabled)
                .padding(.top, Theme.Spacing.xs)
        }
    }
}

struct SessionLengthStepView: View {
    @Binding var selection: SessionLengthPreference

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            OnboardingQuestionHeader(
                title: "How long would you like sessions to be?",
                subtitle: "You can pick shorter or longer sessions any time."
            )
            ForEach(SessionLengthPreference.allCases) { length in
                SelectableOptionRow(title: length.title, isSelected: selection == length) {
                    selection = length
                }
            }
        }
    }
}
