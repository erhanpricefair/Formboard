import SwiftUI

/// A single frozen body position for the demonstration figure.
///
/// All joint angles are **absolute**, measured in degrees clockwise from
/// straight down, so 0° hangs down, 90° points to screen-right, 180° points
/// straight up, and -90° points to screen-left. Absolute (rather than
/// parent-relative) angles make poses far easier to author by hand and they
/// interpolate cleanly between keyframes.
///
/// "left" and "right" refer to **screen** sides, not the figure's own left
/// and right — the figure faces the viewer, so this keeps authoring intuitive.
struct TaiChiPose {
    var torsoLean: Double = 0        // positive leans towards screen-right
    var headTilt: Double = 0
    var leftUpperArm: Double = -14
    var leftForearm: Double = -16
    var rightUpperArm: Double = 14
    var rightForearm: Double = 16
    var leftThigh: Double = -8
    var leftShin: Double = -3
    var rightThigh: Double = 8
    var rightShin: Double = 3
    var weightShift: Double = 0      // -1...1, shifts the hips horizontally
    var kneeBend: Double = 0         // 0...1, sinks the whole figure slightly

    /// Mirrors a pose left-to-right. Used so a movement only has to be
    /// authored once and the opposite side comes out perfectly symmetrical.
    var mirrored: TaiChiPose {
        TaiChiPose(
            torsoLean: -torsoLean,
            headTilt: -headTilt,
            leftUpperArm: -rightUpperArm,
            leftForearm: -rightForearm,
            rightUpperArm: -leftUpperArm,
            rightForearm: -leftForearm,
            leftThigh: -rightThigh,
            leftShin: -rightShin,
            rightThigh: -leftThigh,
            rightShin: -leftShin,
            weightShift: -weightShift,
            kneeBend: kneeBend
        )
    }

    static func lerp(_ a: TaiChiPose, _ b: TaiChiPose, _ t: Double) -> TaiChiPose {
        func mix(_ x: Double, _ y: Double) -> Double { x + (y - x) * t }
        return TaiChiPose(
            torsoLean: mix(a.torsoLean, b.torsoLean),
            headTilt: mix(a.headTilt, b.headTilt),
            leftUpperArm: mix(a.leftUpperArm, b.leftUpperArm),
            leftForearm: mix(a.leftForearm, b.leftForearm),
            rightUpperArm: mix(a.rightUpperArm, b.rightUpperArm),
            rightForearm: mix(a.rightForearm, b.rightForearm),
            leftThigh: mix(a.leftThigh, b.leftThigh),
            leftShin: mix(a.leftShin, b.leftShin),
            rightThigh: mix(a.rightThigh, b.rightThigh),
            rightShin: mix(a.rightShin, b.rightShin),
            weightShift: mix(a.weightShift, b.weightShift),
            kneeBend: mix(a.kneeBend, b.kneeBend)
        )
    }
}

/// Figure proportions in a normalised space roughly 100 units tall.
private enum FigureMetrics {
    static let shoulderY: CGFloat = 27
    static let hipY: CGFloat = 55
    static let shoulderHalfWidth: CGFloat = 10
    static let hipHalfWidth: CGFloat = 7
    static let headOffset: CGFloat = 13
    static let headRadius: CGFloat = 8
    static let upperArm: CGFloat = 17
    static let forearm: CGFloat = 16
    static let thigh: CGFloat = 23
    static let shin: CGFloat = 22
    static let designWidth: CGFloat = 78
    static let designHeight: CGFloat = 112
}

/// Draws the demonstration figure for a given pose.
///
/// Deliberately drawn as a simple, high-contrast silhouette rather than a
/// detailed character: it stays legible at small sizes and for users with
/// reduced vision, and it never distracts from the movement itself.
struct TaiChiFigureView: View {
    let pose: TaiChiPose
    var isSeated: Bool = false
    var strokeColor: Color = .white
    var chairColor: Color = Color.white.opacity(0.3)

    var body: some View {
        Canvas { context, size in
            let unit = min(size.width / FigureMetrics.designWidth,
                           size.height / FigureMetrics.designHeight)
            guard unit > 0 else { return }

            let centreX = size.width / 2
            let topY = (size.height - FigureMetrics.designHeight * unit) / 2
            let sink = CGFloat(pose.kneeBend) * 4

            // Maps normalised design coordinates (x from centre, y from top)
            // into the actual canvas.
            func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
                CGPoint(x: centreX + x * unit, y: topY + (y + sink) * unit)
            }

            // Offset along a limb at an absolute angle (degrees clockwise
            // from straight down).
            func limb(_ from: CGPoint, _ angle: Double, _ length: CGFloat) -> CGPoint {
                let radians = angle * .pi / 180
                return CGPoint(
                    x: from.x + CGFloat(sin(radians)) * length * unit,
                    y: from.y + CGFloat(cos(radians)) * length * unit
                )
            }

            let hipCentre = point(CGFloat(pose.weightShift) * 6, FigureMetrics.hipY)

            // The torso points upwards (180°); subtracting the lean keeps a
            // positive `torsoLean` leaning towards screen-right.
            let torsoAngle = 180 - pose.torsoLean
            let torsoLength = FigureMetrics.hipY - FigureMetrics.shoulderY
            let shoulderCentre = limb(hipCentre, torsoAngle, torsoLength)
            let headCentre = limb(shoulderCentre, torsoAngle - pose.headTilt, FigureMetrics.headOffset)

            let leftShoulder = CGPoint(x: shoulderCentre.x - FigureMetrics.shoulderHalfWidth * unit, y: shoulderCentre.y)
            let rightShoulder = CGPoint(x: shoulderCentre.x + FigureMetrics.shoulderHalfWidth * unit, y: shoulderCentre.y)
            let leftHip = CGPoint(x: hipCentre.x - FigureMetrics.hipHalfWidth * unit, y: hipCentre.y)
            let rightHip = CGPoint(x: hipCentre.x + FigureMetrics.hipHalfWidth * unit, y: hipCentre.y)

            let leftElbow = limb(leftShoulder, pose.leftUpperArm, FigureMetrics.upperArm)
            let leftHand = limb(leftElbow, pose.leftForearm, FigureMetrics.forearm)
            let rightElbow = limb(rightShoulder, pose.rightUpperArm, FigureMetrics.upperArm)
            let rightHand = limb(rightElbow, pose.rightForearm, FigureMetrics.forearm)

            let leftKnee = limb(leftHip, pose.leftThigh, FigureMetrics.thigh)
            let leftFoot = limb(leftKnee, pose.leftShin, FigureMetrics.shin)
            let rightKnee = limb(rightHip, pose.rightThigh, FigureMetrics.thigh)
            let rightFoot = limb(rightKnee, pose.rightShin, FigureMetrics.shin)

            // A simple chair behind the figure makes seated sessions instantly
            // readable without any label.
            if isSeated {
                var chair = Path()
                let seatY = hipCentre.y + 7 * unit
                let seatHalf = 20 * unit
                chair.move(to: CGPoint(x: hipCentre.x - seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: hipCentre.x + seatHalf, y: seatY))
                chair.move(to: CGPoint(x: hipCentre.x + seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: hipCentre.x + seatHalf, y: seatY - 30 * unit))
                chair.move(to: CGPoint(x: hipCentre.x - seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: hipCentre.x - seatHalf, y: seatY + 24 * unit))
                chair.move(to: CGPoint(x: hipCentre.x + seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: hipCentre.x + seatHalf, y: seatY + 24 * unit))
                context.stroke(chair, with: .color(chairColor),
                               style: StrokeStyle(lineWidth: 3.5 * unit, lineCap: .round))
            }

            var body = Path()
            body.move(to: hipCentre)
            body.addLine(to: shoulderCentre)
            body.move(to: leftShoulder)
            body.addLine(to: rightShoulder)
            body.move(to: leftHip)
            body.addLine(to: rightHip)

            body.move(to: leftShoulder)
            body.addLine(to: leftElbow)
            body.addLine(to: leftHand)
            body.move(to: rightShoulder)
            body.addLine(to: rightElbow)
            body.addLine(to: rightHand)

            body.move(to: leftHip)
            body.addLine(to: leftKnee)
            body.addLine(to: leftFoot)
            body.move(to: rightHip)
            body.addLine(to: rightKnee)
            body.addLine(to: rightFoot)

            context.stroke(body, with: .color(strokeColor),
                           style: StrokeStyle(lineWidth: 5 * unit, lineCap: .round, lineJoin: .round))

            let headRect = CGRect(
                x: headCentre.x - FigureMetrics.headRadius * unit,
                y: headCentre.y - FigureMetrics.headRadius * unit,
                width: FigureMetrics.headRadius * 2 * unit,
                height: FigureMetrics.headRadius * 2 * unit
            )
            context.fill(Path(ellipseIn: headRect), with: .color(strokeColor))

            // Hands marked slightly, so the eye can follow them through the
            // movement — hand path is what most Tai Chi cues describe.
            for hand in [leftHand, rightHand] {
                let dot = CGRect(x: hand.x - 3.2 * unit, y: hand.y - 3.2 * unit,
                                 width: 6.4 * unit, height: 6.4 * unit)
                context.fill(Path(ellipseIn: dot), with: .color(strokeColor))
            }
        }
    }
}

#Preview {
    ZStack {
        Color(hex: 0x2B2A28)
        HStack {
            TaiChiFigureView(pose: TaiChiPose())
            TaiChiFigureView(pose: TaiChiSequences.standingReady, isSeated: false)
            TaiChiFigureView(pose: TaiChiSequences.seatedReady, isSeated: true)
        }
        .frame(height: 220)
    }
}
