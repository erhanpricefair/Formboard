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

    /// Both arms floating forwards towards the viewer — the low `armReach`
    /// values foreshorten them, which is what sells the forward direction.
    static let armsForward = TaiChiPose(
        leftUpperArm: -38, leftForearm: -26,
        rightUpperArm: 38, rightForearm: 26,
        leftThigh: -9, leftShin: -4,
        rightThigh: 9, rightShin: 4,
        kneeBend: 0.3,
        leftArmReach: 0.52,
        rightArmReach: 0.52
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
        kneeBend: 0.05,
        chestRise: 1.4
    )

    /// Cloud Hands: upper hand crosses the chest, lower hand sweeps the waist,
    /// with the weight settling onto one leg and the waist turning with it.
    static let cloudHandsLeft = TaiChiPose(
        torsoLean: -5,
        leftUpperArm: -26, leftForearm: 48,
        rightUpperArm: 66, rightForearm: -138,
        leftThigh: -15, leftShin: -2,
        rightThigh: 4, rightShin: 9,
        weightShift: -0.5,
        kneeBend: 0.38,
        bodyTurn: -18,
        leftArmReach: 0.86,
        rightArmReach: 0.92
    )

    /// The moment between the two sides of Cloud Hands, hands passing the
    /// centre line. Stops the transition cutting straight across the body.
    static let cloudHandsCentre = TaiChiPose(
        leftUpperArm: -44, leftForearm: 22,
        rightUpperArm: 44, rightForearm: -22,
        leftThigh: -11, leftShin: -4,
        rightThigh: 11, rightShin: 4,
        kneeBend: 0.32,
        leftArmReach: 0.88,
        rightArmReach: 0.88
    )

    /// Gentle knee lift used for walking practice, weight on the other leg.
    static let stepLeft = TaiChiPose(
        torsoLean: 4,
        leftUpperArm: -30, leftForearm: -40,
        rightUpperArm: 20, rightForearm: 34,
        leftThigh: -42, leftShin: -14,
        rightThigh: 6, rightShin: 3,
        weightShift: 0.28,
        kneeBend: 0.2,
        bodyTurn: 8,
        leftArmReach: 0.9,
        rightArmReach: 0.78
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
        PoseKeyframe(pose: armsForward, duration: 2.6),
        PoseKeyframe(pose: armsWide, duration: 2.4),
        PoseKeyframe(pose: cloudHandsLeft, duration: 3.2),
        PoseKeyframe(pose: cloudHandsCentre, duration: 1.6),
        PoseKeyframe(pose: cloudHandsLeft.mirrored, duration: 3.2),
        PoseKeyframe(pose: cloudHandsCentre, duration: 1.6),
        PoseKeyframe(pose: armsWide, duration: 2.4)
    ])

    /// Slow arm raise and lower, paced to a comfortable breath cycle.
    static let breathingCalm = PoseSequence(keyframes: [
        PoseKeyframe(pose: standingReady, duration: 3.5),
        PoseKeyframe(pose: armsWide, duration: 3.0),
        PoseKeyframe(pose: armsOverhead, duration: 4.0),
        PoseKeyframe(pose: armsWide, duration: 3.0),
        PoseKeyframe(pose: armsForward, duration: 2.8)
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
