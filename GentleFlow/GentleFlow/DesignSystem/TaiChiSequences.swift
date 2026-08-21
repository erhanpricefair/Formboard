import Foundation

struct PoseKeyframe {
    let pose: TaiChiPose
    /// How long to spend easing from this pose into the next one.
    let duration: Double
}

/// A looping series of poses making up one demonstration movement.
struct PoseSequence {
    let keyframes: [PoseKeyframe]

    var restingPose: TaiChiPose {
        keyframes.first?.pose ?? TaiChiPose()
    }

    var totalDuration: Double {
        keyframes.reduce(0) { $0 + $1.duration }
    }

    /// The interpolated pose at a point in time, looping forever.
    func pose(at time: Double) -> TaiChiPose {
        guard keyframes.count > 1 else { return restingPose }
        let total = totalDuration
        guard total > 0 else { return restingPose }

        var t = time.truncatingRemainder(dividingBy: total)
        if t < 0 { t += total }

        var elapsed = 0.0
        for (index, keyframe) in keyframes.enumerated() {
            let isLast = index == keyframes.count - 1
            if t < elapsed + keyframe.duration || isLast {
                let raw = keyframe.duration > 0 ? (t - elapsed) / keyframe.duration : 0
                let eased = Self.smoothstep(min(max(raw, 0), 1))
                let next = keyframes[(index + 1) % keyframes.count]
                return TaiChiPose.lerp(keyframe.pose, next.pose, eased)
            }
            elapsed += keyframe.duration
        }
        return restingPose
    }

    /// Ease-in-out curve. Tai Chi movement accelerates and settles gently —
    /// a linear blend between poses looks mechanical and unlike the real thing.
    private static func smoothstep(_ t: Double) -> Double {
        t * t * (3 - 2 * t)
    }
}

enum TaiChiSequences {

    // MARK: - Named poses

    static let standingReady = TaiChiPose(
        leftUpperArm: -14, leftForearm: -18,
        rightUpperArm: 14, rightForearm: 18,
        leftThigh: -9, leftShin: -4,
        rightThigh: 9, rightShin: 4,
        kneeBend: 0.15
    )

    static let armsWide = TaiChiPose(
        leftUpperArm: -78, leftForearm: -86,
        rightUpperArm: 78, rightForearm: 86,
        leftThigh: -9, leftShin: -4,
        rightThigh: 9, rightShin: 4,
        kneeBend: 0.25
    )

    static let armsOverhead = TaiChiPose(
        leftUpperArm: -150, leftForearm: -165,
        rightUpperArm: 150, rightForearm: 165,
        leftThigh: -9, leftShin: -4,
        rightThigh: 9, rightShin: 4,
        kneeBend: 0.05
    )

    /// Cloud Hands: upper hand crosses the chest, lower hand sweeps the waist,
    /// with the weight settling onto one leg.
    static let cloudHandsLeft = TaiChiPose(
        torsoLean: -6,
        leftUpperArm: -28, leftForearm: 45,
        rightUpperArm: 68, rightForearm: -140,
        leftThigh: -14, leftShin: -2,
        rightThigh: 5, rightShin: 8,
        weightShift: -0.5,
        kneeBend: 0.35
    )

    /// Gentle knee lift used for walking practice, weight on the other leg.
    static let stepLeft = TaiChiPose(
        torsoLean: 4,
        leftUpperArm: -30, leftForearm: -40,
        rightUpperArm: 20, rightForearm: 34,
        leftThigh: -42, leftShin: -14,
        rightThigh: 6, rightShin: 3,
        weightShift: 0.28,
        kneeBend: 0.2
    )

    static let seatedReady: TaiChiPose = seat(TaiChiPose(
        leftUpperArm: -20, leftForearm: -30,
        rightUpperArm: 20, rightForearm: 30
    ))

    // MARK: - Sequences

    /// Commencing form flowing into Cloud Hands — the signature slow,
    /// symmetrical weight-shifting movement of gentle Tai Chi.
    static let standingTaiChi = PoseSequence(keyframes: [
        PoseKeyframe(pose: standingReady, duration: 3.0),
        PoseKeyframe(pose: armsWide, duration: 3.0),
        PoseKeyframe(pose: cloudHandsLeft, duration: 3.5),
        PoseKeyframe(pose: cloudHandsLeft.mirrored, duration: 3.5),
        PoseKeyframe(pose: armsWide, duration: 3.0)
    ])

    /// Slow arm raise and lower, paced to a comfortable breath cycle.
    static let breathingCalm = PoseSequence(keyframes: [
        PoseKeyframe(pose: standingReady, duration: 3.5),
        PoseKeyframe(pose: armsWide, duration: 3.0),
        PoseKeyframe(pose: armsOverhead, duration: 4.0),
        PoseKeyframe(pose: armsWide, duration: 3.0)
    ])

    /// Stepping in place — deliberate, controlled knee lifts.
    static let taiChiWalking = PoseSequence(keyframes: [
        PoseKeyframe(pose: standingReady, duration: 1.8),
        PoseKeyframe(pose: stepLeft, duration: 2.0),
        PoseKeyframe(pose: standingReady, duration: 1.8),
        PoseKeyframe(pose: stepLeft.mirrored, duration: 2.0)
    ])

    // MARK: - Lookup

    /// Picks the movement for a session, and converts it to a seated version
    /// when the user is practising in a chair. Deriving the seated variant
    /// from the standing one means every category works in both modes without
    /// authoring two separate sets of choreography.
    static func sequence(for category: SessionCategory, seated: Bool) -> PoseSequence {
        let base: PoseSequence
        switch category {
        case .chairTaiChi:
            base = standingTaiChi
        case .standingTaiChi:
            base = standingTaiChi
        case .taiChiWalking:
            base = taiChiWalking
        case .breathingCalm:
            base = breathingCalm
        }
        return seated ? seatedVariant(of: base) : base
    }

    // MARK: - Seated conversion

    /// Replaces leg positions with a seated posture, keeping the arm work
    /// exactly as authored.
    private static func seatedVariant(of sequence: PoseSequence) -> PoseSequence {
        PoseSequence(keyframes: sequence.keyframes.map { keyframe in
            PoseKeyframe(pose: seat(keyframe.pose), duration: keyframe.duration)
        })
    }

    private static func seat(_ pose: TaiChiPose) -> TaiChiPose {
        var seated = pose
        seated.leftThigh = -58
        seated.leftShin = -6
        seated.rightThigh = 58
        seated.rightShin = 6
        // Weight shifts are much smaller seated, and there's no knee sink.
        seated.weightShift = pose.weightShift * 0.25
        seated.torsoLean = pose.torsoLean * 0.6
        seated.kneeBend = 0
        return seated
    }
}
