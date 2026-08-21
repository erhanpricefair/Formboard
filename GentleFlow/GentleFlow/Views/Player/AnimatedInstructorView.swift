import SwiftUI

/// Plays the demonstration figure through its pose sequence, in step with
/// the session player's play/pause state.
///
/// This is a built-in stand-in for real instructor video: it means every
/// session shows the actual shape of the movement from day one, and it stays
/// useful afterwards as a low-bandwidth or offline fallback.
struct AnimatedInstructorView: View {
    let category: SessionCategory
    let isChairMode: Bool
    let isPlaying: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Playback time is tracked manually so pausing freezes the movement
    /// mid-flow and resuming carries on from the same point.
    @State private var accumulatedTime: Double = 0
    @State private var resumedAt: Date = Date()

    private var sequence: PoseSequence {
        TaiChiSequences.sequence(for: category, seated: isChairMode)
    }

    /// Layers a slow breath and a barely-there sway on top of the
    /// choreography. Running on its own cycle rather than on the keyframes
    /// means the figure keeps living even while holding a position — without
    /// it, held poses look frozen.
    private static func withBreathing(_ pose: TaiChiPose, at time: Double) -> TaiChiPose {
        var breathed = pose
        let breathCycle = sin(time * 2 * .pi / 5.5)   // roughly 5.5s per breath
        let swayCycle = sin(time * 2 * .pi / 8.0)
        breathed.chestRise += breathCycle * 1.1
        breathed.torsoLean += swayCycle * 0.7
        breathed.headTilt += swayCycle * 0.5
        return breathed
    }

    var body: some View {
        Group {
            if reduceMotion {
                // Reduce Motion is common in this audience — show the movement's
                // resting posture rather than animating it.
                TaiChiFigureView(pose: sequence.restingPose, isSeated: isChairMode)
            } else {
                TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: !isPlaying)) { context in
                    let elapsed = accumulatedTime
                        + (isPlaying ? context.date.timeIntervalSince(resumedAt) : 0)
                    TaiChiFigureView(
                        pose: Self.withBreathing(sequence.pose(at: elapsed), at: elapsed),
                        isSeated: isChairMode
                    )
                }
            }
        }
        .onAppear { resumedAt = Date() }
        .onChange(of: isPlaying) { _, nowPlaying in
            if nowPlaying {
                resumedAt = Date()
            } else {
                accumulatedTime += Date().timeIntervalSince(resumedAt)
            }
        }
        // The spoken and on-screen cues carry the instruction; the figure is
        // a visual aid, so VoiceOver skips it rather than describing shapes.
        .accessibilityHidden(true)
    }
}

#Preview {
    ZStack {
        Color(hex: 0x2B2A28)
        AnimatedInstructorView(category: .standingTaiChi, isChairMode: false, isPlaying: true)
            .frame(height: 240)
    }
}
