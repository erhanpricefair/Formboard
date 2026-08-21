import SwiftUI
import AVKit

struct SessionPlayerView: View {
    @StateObject private var viewModel: SessionPlayerViewModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(session: Session) {
        _viewModel = StateObject(wrappedValue: SessionPlayerViewModel(session: session))
    }

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                videoArea
                controlsPanel
            }

            if viewModel.isOnRecoveryBreak {
                RecoveryBreakOverlay(
                    secondsRemaining: viewModel.recoveryBreakSecondsRemaining,
                    onSkip: { viewModel.endRecoveryBreakEarly() }
                )
            }
        }
        .statusBar(hidden: true)
        .onDisappear { viewModel.stopAndReset() }
        .fullScreenCover(isPresented: .constant(viewModel.didFinish)) {
            SessionCompleteView(session: viewModel.session, onDone: { dismiss() })
        }
    }

    // MARK: Video area

    private var videoArea: some View {
        ZStack {
            // Animated demonstration figure stands in for real instructor
            // video. To use real footage instead, drop an AVPlayer view in
            // place of AnimatedInstructorView (see README "Next steps").
            LinearGradient(
                colors: [Color(hex: 0x2B2A28), Color(hex: 0x4C7A5E)],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )

            VStack(spacing: Theme.Spacing.sm) {
                AnimatedInstructorView(
                    category: viewModel.session.category,
                    isChairMode: viewModel.isChairMode,
                    isPlaying: viewModel.isPlaying
                )
                .frame(maxWidth: 260, maxHeight: 200)

                Text(viewModel.currentCueText)
                    .font(.system(.title3, design: .rounded, weight: .semibold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Theme.Spacing.lg)
                    .accessibilityLabel("On-screen cue: \(viewModel.currentCueText)")
            }
            .padding(.top, Theme.Spacing.xl)
            .padding(.bottom, Theme.Spacing.md)

            VStack {
                topBar
                Spacer()
            }
        }
        .frame(maxWidth: .infinity)
        .frame(minHeight: 340)
        .clipped()
    }

    private var topBar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.down")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.white)
                    .padding()
            }
            .minimumTouchTarget()
            .accessibilityLabel("Close session")

            Spacer()

            Text(viewModel.session.title)
                .font(.system(.headline, design: .rounded))
                .foregroundColor(.white)

            Spacer()

            // AirPlay / screen mirroring — AVRoutePickerView bridged for SwiftUI.
            AirPlayButton()
                .frame(width: 44, height: 44)
                .accessibilityLabel("AirPlay and screen mirroring")
        }
        .padding(.horizontal, Theme.Spacing.sm)
        .padding(.top, Theme.Spacing.sm)
    }

    // MARK: Controls panel

    private var controlsPanel: some View {
        VStack(spacing: Theme.Spacing.md) {
            HStack {
                Text(progressTimeText)
                    .font(.system(.subheadline, design: .rounded, weight: .medium))
                    .foregroundColor(colors.secondaryText)
                Spacer()
                ChairStandingToggle(isChairMode: $viewModel.isChairMode)
            }

            ProgressView(value: viewModel.progressFraction)
                .tint(colors.primaryGreen)
                .accessibilityLabel("Session progress")
                .accessibilityValue("\(Int(viewModel.progressFraction * 100)) percent complete")

            PlayerControlsView(
                isPlaying: viewModel.isPlaying,
                onSkipBack: { viewModel.skipBack15() },
                onPlayPause: { viewModel.togglePlayPause() },
                onSkipForward: { viewModel.skipForward15() }
            )

            Text("Voice guidance is on. You can pause any time — there's no rush.")
                .font(.footnote)
                .foregroundColor(colors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(Theme.Spacing.lg)
        .background(colors.background)
    }

    private var progressTimeText: String {
        "\(viewModel.remainingTimeText) remaining"
    }
}

struct ChairStandingToggle: View {
    @Binding var isChairMode: Bool
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        HStack(spacing: 0) {
            toggleButton(title: "Chair", systemImage: "chair.lounge", isSelected: isChairMode) { isChairMode = true }
            toggleButton(title: "Standing", systemImage: "figure.stand", isSelected: !isChairMode) { isChairMode = false }
        }
        .background(colors.surfaceAlt)
        .clipShape(Capsule())
    }

    private func toggleButton(title: String, systemImage: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.system(.footnote, design: .rounded, weight: .semibold))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(isSelected ? colors.primaryGreen : Color.clear)
                .foregroundColor(isSelected ? colors.primaryGreenText : colors.primaryText)
                .clipShape(Capsule())
        }
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}

/// Thin SwiftUI wrapper around AVKit's route picker, which natively handles
/// AirPlay and screen mirroring device selection.
struct AirPlayButton: UIViewRepresentable {
    func makeUIView(context: Context) -> AVRoutePickerView {
        let view = AVRoutePickerView()
        view.tintColor = .white
        view.activeTintColor = .white
        return view
    }

    func updateUIView(_ uiView: AVRoutePickerView, context: Context) {}
}

#Preview {
    SessionPlayerView(session: MockContent.sessions[0])
}
