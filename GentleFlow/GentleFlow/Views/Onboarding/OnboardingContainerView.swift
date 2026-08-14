import SwiftUI

struct OnboardingContainerView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    let onFinished: () -> Void

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if viewModel.step != .welcome {
                    OnboardingProgressBar(progress: viewModel.progress)
                        .padding(.horizontal, Theme.Spacing.lg)
                        .padding(.top, Theme.Spacing.sm)
                }

                ScrollView {
                    VStack(spacing: Theme.Spacing.lg) {
                        stepContent
                    }
                    .padding(Theme.Spacing.lg)
                }

                navigationButtons
                    .padding(.horizontal, Theme.Spacing.lg)
                    .padding(.bottom, Theme.Spacing.md)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if viewModel.canGoBack {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            viewModel.goBack()
                        } label: {
                            Image(systemName: "chevron.left")
                        }
                        .accessibilityLabel("Go back")
                        .minimumTouchTarget()
                    }
                }
            }
        }
    }

    @ViewBuilder private var stepContent: some View {
        switch viewModel.step {
        case .welcome:
            WelcomeStepView(
                onGetStarted: { viewModel.advance() },
                onSkip: {
                    _ = viewModel.skipToDefaults()
                    onFinished()
                }
            )
        case .goals:
            GoalsStepView(selectedGoals: $viewModel.answers.goals)
        case .mobility:
            MobilityStepView(selection: $viewModel.answers.mobilityLevel)
        case .chairPreference:
            ChairPreferenceStepView(selection: $viewModel.answers.chairPreference)
        case .jointConcerns:
            JointConcernsStepView(selectedConcerns: $viewModel.answers.jointConcerns)
        case .sessionLength:
            SessionLengthStepView(selection: $viewModel.answers.preferredSessionLength)
        case .summary:
            OnboardingSummaryStepView(answers: viewModel.answers)
        }
    }

    @ViewBuilder private var navigationButtons: some View {
        if viewModel.step == .welcome {
            EmptyView() // Welcome step has its own buttons
        } else if viewModel.step == .summary {
            GentleButton(title: "Create My Gentle Plan", systemImage: "checkmark.circle.fill") {
                _ = viewModel.complete()
                onFinished()
            }
        } else {
            GentleButton(title: "Continue", systemImage: "arrow.right") {
                viewModel.advance()
            }
        }
    }
}

struct OnboardingProgressBar: View {
    let progress: Double
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let colors = ThemedColors(highContrast: highContrastEnabled)
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Capsule().fill(colors.surfaceAlt)
                Capsule()
                    .fill(colors.primaryGreen)
                    .frame(width: geometry.size.width * progress)
                    .animation(reduceMotion ? nil : .easeInOut, value: progress)
            }
        }
        .frame(height: 10)
        .accessibilityHidden(true)
    }
}

#Preview {
    OnboardingContainerView(onFinished: {})
}
