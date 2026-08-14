import SwiftUI

/// Large, unmistakable playback controls. Deliberately oversized compared
/// to typical media player UI — this is the single most important control
/// surface in the app, used mid-exercise when attention is on the body,
/// not the screen.
struct PlayerControlsView: View {
    let isPlaying: Bool
    let onSkipBack: () -> Void
    let onPlayPause: () -> Void
    let onSkipForward: () -> Void

    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        HStack(spacing: Theme.Spacing.xl) {
            controlButton(systemImage: "gobackward.15", size: 30, action: onSkipBack)
                .accessibilityLabel("Skip back 15 seconds")

            Button(action: onPlayPause) {
                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 40))
                    .foregroundColor(colors.primaryGreenText)
                    .frame(width: 88, height: 88)
                    .background(colors.primaryGreen)
                    .clipShape(Circle())
            }
            .accessibilityLabel(isPlaying ? "Pause" : "Play")

            controlButton(systemImage: "goforward.15", size: 30, action: onSkipForward)
                .accessibilityLabel("Skip forward 15 seconds")
        }
    }

    private func controlButton(systemImage: String, size: CGFloat, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: size))
                .foregroundColor(colors.primaryText)
                .frame(width: 64, height: 64)
                .background(colors.surfaceAlt)
                .clipShape(Circle())
        }
    }
}

struct RecoveryBreakOverlay: View {
    let secondsRemaining: Int
    let onSkip: () -> Void

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Image(systemName: "cup.and.saucer")
                .font(.system(size: 48))
                .foregroundColor(.white)

            Text("Short Recovery Break")
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundColor(.white)

            Text("Take a sip of water and a slow breath. We'll continue in a moment.")
                .font(.system(.body))
                .foregroundColor(.white.opacity(0.9))
                .multilineTextAlignment(.center)
                .padding(.horizontal, Theme.Spacing.lg)

            Text("\(secondsRemaining)")
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .accessibilityLabel("\(secondsRemaining) seconds remaining")

            Button(action: onSkip) {
                Text("Continue Now")
                    .font(.system(.body, design: .rounded, weight: .bold))
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: Theme.TouchTarget.minimum)
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
            }
            .padding(.horizontal, Theme.Spacing.xl)
        }
        .padding(Theme.Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.black.opacity(0.85))
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.updatesFrequently)
    }
}

struct SessionCompleteView: View {
    let session: Session
    let onDone: () -> Void
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 72))
                .foregroundColor(colors.primaryGreen)

            Text("Well done!")
                .gentleStyle(.largeTitle, highContrast: highContrastEnabled)

            Text("You've completed \(session.title). That's \(session.durationMinutes) minutes of gentle movement — every session adds up.")
                .gentleStyle(.body, highContrast: highContrastEnabled)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Theme.Spacing.lg)

            Spacer()

            GentleButton(title: "Done", systemImage: "checkmark") {
                onDone()
            }
            .padding(.horizontal, Theme.Spacing.lg)
        }
        .padding(.vertical, Theme.Spacing.xl)
        .background(colors.background.ignoresSafeArea())
    }
}
