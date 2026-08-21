import SwiftUI
import Foundation

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

    /// Rotation of the body about its own vertical axis, in degrees. Narrows
    /// the shoulders and hips, and decides which side of the body is nearer
    /// the viewer — Tai Chi turns through the waist constantly, so without
    /// this the movement reads as flat.
    var bodyTurn: Double = 0

    /// Foreshortening, 0.3...1. Below 1 the arm is angled towards the viewer,
    /// so it is drawn shorter and slightly thicker. This is what lets a pose
    /// show an arm reaching forwards rather than only sideways.
    var leftArmReach: Double = 1
    var rightArmReach: Double = 1

    /// Small rise and fall of the chest, driven separately from the
    /// choreography so breathing continues throughout a movement.
    var chestRise: Double = 0

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
            kneeBend: kneeBend,
            bodyTurn: -bodyTurn,
            leftArmReach: rightArmReach,
            rightArmReach: leftArmReach,
            chestRise: chestRise
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
            kneeBend: mix(a.kneeBend, b.kneeBend),
            bodyTurn: mix(a.bodyTurn, b.bodyTurn),
            leftArmReach: mix(a.leftArmReach, b.leftArmReach),
            rightArmReach: mix(a.rightArmReach, b.rightArmReach),
            chestRise: mix(a.chestRise, b.chestRise)
        )
    }
}

/// Figure proportions in a normalised space roughly 112 units tall.
private enum FigureMetrics {
    static let shoulderY: CGFloat = 27
    static let hipY: CGFloat = 55
    static let shoulderHalfWidth: CGFloat = 10.5
    static let hipHalfWidth: CGFloat = 7.5
    static let headOffset: CGFloat = 13
    static let headRadius: CGFloat = 8
    static let upperArm: CGFloat = 17
    static let forearm: CGFloat = 16
    static let thigh: CGFloat = 23
    static let shin: CGFloat = 22
    static let designWidth: CGFloat = 78
    static let designHeight: CGFloat = 112

    // Limb thicknesses, tapering from the body outwards the way a real limb does.
    static let upperArmWidth: (CGFloat, CGFloat) = (7.4, 5.6)
    static let forearmWidth: (CGFloat, CGFloat) = (5.4, 4.0)
    static let thighWidth: (CGFloat, CGFloat) = (10.5, 7.6)
    static let shinWidth: (CGFloat, CGFloat) = (7.2, 4.6)
    static let neckWidth: CGFloat = 6.0
}

/// All the joint positions needed to draw one pose, already converted into
/// canvas coordinates. Split out from drawing so the geometry stays readable.
private struct FigureSkeleton {
    var unit: CGFloat
    var hipCentre: CGPoint
    var shoulderCentre: CGPoint
    var neckBase: CGPoint
    var headCentre: CGPoint
    var headRadius: CGFloat
    var leftShoulder: CGPoint
    var rightShoulder: CGPoint
    var leftHip: CGPoint
    var rightHip: CGPoint
    var leftElbow: CGPoint
    var leftHand: CGPoint
    var rightElbow: CGPoint
    var rightHand: CGPoint
    var leftKnee: CGPoint
    var leftFoot: CGPoint
    var rightKnee: CGPoint
    var rightFoot: CGPoint
    var leftArmWidthScale: CGFloat
    var rightArmWidthScale: CGFloat
    /// True when the screen-left side of the body has rotated away from the viewer.
    var leftSideIsFar: Bool

    static func build(pose: TaiChiPose, size: CGSize) -> FigureSkeleton? {
        let unit = min(size.width / FigureMetrics.designWidth,
                       size.height / FigureMetrics.designHeight)
        guard unit > 0, size.width > 0, size.height > 0 else { return nil }

        let centreX = size.width / 2
        let topY = (size.height - FigureMetrics.designHeight * unit) / 2
        let sink = CGFloat(pose.kneeBend) * 4

        func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: centreX + x * unit, y: topY + (y + sink) * unit)
        }

        /// Steps along a limb at an absolute angle (degrees clockwise from
        /// straight down).
        func limb(_ from: CGPoint, _ angle: Double, _ length: CGFloat) -> CGPoint {
            let radians = angle * .pi / 180
            return CGPoint(
                x: from.x + CGFloat(sin(radians)) * length * unit,
                y: from.y + CGFloat(cos(radians)) * length * unit
            )
        }

        // Turning the waist narrows the body horizontally, never to nothing.
        let turnScale = max(0.4, CGFloat(cos(pose.bodyTurn * .pi / 180)))
        let shoulderHalf = FigureMetrics.shoulderHalfWidth * turnScale
        let hipHalf = FigureMetrics.hipHalfWidth * turnScale

        let hipCentre = point(CGFloat(pose.weightShift) * 6, FigureMetrics.hipY)

        // The torso points upwards (180°); subtracting the lean keeps a
        // positive `torsoLean` leaning towards screen-right.
        let torsoAngle = 180 - pose.torsoLean
        let torsoLength = FigureMetrics.hipY - FigureMetrics.shoulderY + CGFloat(pose.chestRise)
        let shoulderCentre = limb(hipCentre, torsoAngle, torsoLength)
        let neckBase = limb(shoulderCentre, torsoAngle, 3)
        let headCentre = limb(shoulderCentre, torsoAngle - pose.headTilt, FigureMetrics.headOffset)

        let leftShoulder = CGPoint(x: shoulderCentre.x - shoulderHalf * unit, y: shoulderCentre.y)
        let rightShoulder = CGPoint(x: shoulderCentre.x + shoulderHalf * unit, y: shoulderCentre.y)
        let leftHip = CGPoint(x: hipCentre.x - hipHalf * unit, y: hipCentre.y)
        let rightHip = CGPoint(x: hipCentre.x + hipHalf * unit, y: hipCentre.y)

        let leftReach = CGFloat(max(0.3, min(1.0, pose.leftArmReach)))
        let rightReach = CGFloat(max(0.3, min(1.0, pose.rightArmReach)))

        let leftElbow = limb(leftShoulder, pose.leftUpperArm, FigureMetrics.upperArm * leftReach)
        let leftHand = limb(leftElbow, pose.leftForearm, FigureMetrics.forearm * leftReach)
        let rightElbow = limb(rightShoulder, pose.rightUpperArm, FigureMetrics.upperArm * rightReach)
        let rightHand = limb(rightElbow, pose.rightForearm, FigureMetrics.forearm * rightReach)

        let leftKnee = limb(leftHip, pose.leftThigh, FigureMetrics.thigh)
        let leftFoot = limb(leftKnee, pose.leftShin, FigureMetrics.shin)
        let rightKnee = limb(rightHip, pose.rightThigh, FigureMetrics.thigh)
        let rightFoot = limb(rightKnee, pose.rightShin, FigureMetrics.shin)

        return FigureSkeleton(
            unit: unit,
            hipCentre: hipCentre,
            shoulderCentre: shoulderCentre,
            neckBase: neckBase,
            headCentre: headCentre,
            headRadius: FigureMetrics.headRadius * unit,
            leftShoulder: leftShoulder,
            rightShoulder: rightShoulder,
            leftHip: leftHip,
            rightHip: rightHip,
            leftElbow: leftElbow,
            leftHand: leftHand,
            rightElbow: rightElbow,
            rightHand: rightHand,
            leftKnee: leftKnee,
            leftFoot: leftFoot,
            rightKnee: rightKnee,
            rightFoot: rightFoot,
            // An arm angled towards the viewer is drawn a little thicker.
            leftArmWidthScale: 1 + (1 - leftReach) * 0.55,
            rightArmWidthScale: 1 + (1 - rightReach) * 0.55,
            leftSideIsFar: pose.bodyTurn > 0
        )
    }
}

/// Draws the demonstration figure for a given pose.
///
/// Rendered as a solid silhouette with real limb mass rather than stick
/// lines: it stays legible at small sizes and for users with reduced vision,
/// while reading as a body rather than a diagram.
struct TaiChiFigureView: View {
    let pose: TaiChiPose
    var isSeated: Bool = false
    var strokeColor: Color = .white
    var chairColor: Color = Color.white.opacity(0.28)

    var body: some View {
        Canvas { context, size in
            guard let s = FigureSkeleton.build(pose: pose, size: size) else { return }
            let unit = s.unit

            // MARK: Shading

            let nearShading = GraphicsContext.Shading.linearGradient(
                Gradient(colors: [strokeColor, strokeColor.opacity(0.86)]),
                startPoint: CGPoint(x: 0, y: 0),
                endPoint: CGPoint(x: 0, y: size.height)
            )
            // Limbs on the far side of a turned body sit back in shadow.
            let farShading = GraphicsContext.Shading.color(strokeColor.opacity(0.55))

            // MARK: Helpers

            /// A limb segment that tapers from one width to another, so the
            /// body reads as flesh rather than tubing.
            func taperedLimb(_ a: CGPoint, _ b: CGPoint,
                             _ startWidth: CGFloat, _ endWidth: CGFloat) -> Path {
                let dx = b.x - a.x
                let dy = b.y - a.y
                let length = max(sqrt(dx * dx + dy * dy), 0.0001)
                let nx = -dy / length
                let ny = dx / length
                var path = Path()
                path.move(to: CGPoint(x: a.x + nx * startWidth / 2, y: a.y + ny * startWidth / 2))
                path.addLine(to: CGPoint(x: b.x + nx * endWidth / 2, y: b.y + ny * endWidth / 2))
                path.addLine(to: CGPoint(x: b.x - nx * endWidth / 2, y: b.y - ny * endWidth / 2))
                path.addLine(to: CGPoint(x: a.x - nx * startWidth / 2, y: a.y - ny * startWidth / 2))
                path.closeSubpath()
                return path
            }

            func circle(_ centre: CGPoint, _ radius: CGFloat) -> Path {
                Path(ellipseIn: CGRect(x: centre.x - radius, y: centre.y - radius,
                                       width: radius * 2, height: radius * 2))
            }

            /// One arm, drawn as a continuous shape with rounded joints.
            func armPath(shoulder: CGPoint, elbow: CGPoint, hand: CGPoint,
                         widthScale: CGFloat) -> Path {
                var path = Path()
                let upper = FigureMetrics.upperArmWidth
                let fore = FigureMetrics.forearmWidth
                path.addPath(taperedLimb(shoulder, elbow,
                                         upper.0 * unit * widthScale,
                                         upper.1 * unit * widthScale))
                path.addPath(taperedLimb(elbow, hand,
                                         fore.0 * unit * widthScale,
                                         fore.1 * unit * widthScale))
                path.addPath(circle(elbow, upper.1 * unit * widthScale / 2))
                path.addPath(circle(hand, fore.1 * unit * widthScale * 0.72))
                return path
            }

            func legPath(hip: CGPoint, knee: CGPoint, foot: CGPoint) -> Path {
                var path = Path()
                let thigh = FigureMetrics.thighWidth
                let shin = FigureMetrics.shinWidth
                path.addPath(taperedLimb(hip, knee, thigh.0 * unit, thigh.1 * unit))
                path.addPath(taperedLimb(knee, foot, shin.0 * unit, shin.1 * unit))
                path.addPath(circle(knee, thigh.1 * unit / 2))
                // A simple foot gives the figure a sense of standing on ground.
                path.addPath(Path(ellipseIn: CGRect(x: foot.x - 5 * unit, y: foot.y - 2 * unit,
                                                    width: 10 * unit, height: 4 * unit)))
                return path
            }

            // MARK: Ground shadow

            let lowestFoot = max(s.leftFoot.y, s.rightFoot.y)
            let footSpread = abs(s.leftFoot.x - s.rightFoot.x)
            let shadowRect = CGRect(
                x: (s.leftFoot.x + s.rightFoot.x) / 2 - (footSpread / 2 + 13 * unit),
                y: lowestFoot + unit,
                width: footSpread + 26 * unit,
                height: 7 * unit
            )
            context.fill(Path(ellipseIn: shadowRect), with: .color(.black.opacity(0.18)))

            // MARK: Chair (drawn behind the figure)

            if isSeated {
                var chair = Path()
                let seatY = s.hipCentre.y + 7 * unit
                let seatHalf = 21 * unit
                chair.move(to: CGPoint(x: s.hipCentre.x - seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: s.hipCentre.x + seatHalf, y: seatY))
                chair.move(to: CGPoint(x: s.hipCentre.x + seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: s.hipCentre.x + seatHalf, y: seatY - 32 * unit))
                chair.move(to: CGPoint(x: s.hipCentre.x - seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: s.hipCentre.x - seatHalf, y: seatY + 24 * unit))
                chair.move(to: CGPoint(x: s.hipCentre.x + seatHalf, y: seatY))
                chair.addLine(to: CGPoint(x: s.hipCentre.x + seatHalf, y: seatY + 24 * unit))
                context.stroke(chair, with: .color(chairColor),
                               style: StrokeStyle(lineWidth: 3.5 * unit, lineCap: .round))
            }

            // MARK: Far-side limbs

            if s.leftSideIsFar {
                context.fill(armPath(shoulder: s.leftShoulder, elbow: s.leftElbow,
                                     hand: s.leftHand, widthScale: s.leftArmWidthScale),
                             with: farShading)
                context.fill(legPath(hip: s.leftHip, knee: s.leftKnee, foot: s.leftFoot),
                             with: farShading)
            } else {
                context.fill(armPath(shoulder: s.rightShoulder, elbow: s.rightElbow,
                                     hand: s.rightHand, widthScale: s.rightArmWidthScale),
                             with: farShading)
                context.fill(legPath(hip: s.rightHip, knee: s.rightKnee, foot: s.rightFoot),
                             with: farShading)
            }

            // MARK: Torso, neck and head

            var torso = Path()
            torso.move(to: s.leftShoulder)
            torso.addLine(to: s.rightShoulder)
            torso.addLine(to: s.rightHip)
            torso.addLine(to: s.leftHip)
            torso.closeSubpath()
            // Rounding the shoulders and hips softens the silhouette.
            torso.addPath(circle(s.leftShoulder, 5.2 * unit))
            torso.addPath(circle(s.rightShoulder, 5.2 * unit))
            torso.addPath(circle(s.leftHip, 5.4 * unit))
            torso.addPath(circle(s.rightHip, 5.4 * unit))
            torso.addPath(taperedLimb(s.shoulderCentre, s.neckBase,
                                      FigureMetrics.neckWidth * unit,
                                      FigureMetrics.neckWidth * unit))
            context.fill(torso, with: nearShading)
            context.fill(circle(s.headCentre, s.headRadius), with: nearShading)

            // MARK: Near-side limbs

            if s.leftSideIsFar {
                context.fill(legPath(hip: s.rightHip, knee: s.rightKnee, foot: s.rightFoot),
                             with: nearShading)
                context.fill(armPath(shoulder: s.rightShoulder, elbow: s.rightElbow,
                                     hand: s.rightHand, widthScale: s.rightArmWidthScale),
                             with: nearShading)
            } else {
                context.fill(legPath(hip: s.leftHip, knee: s.leftKnee, foot: s.leftFoot),
                             with: nearShading)
                context.fill(armPath(shoulder: s.leftShoulder, elbow: s.leftElbow,
                                     hand: s.leftHand, widthScale: s.leftArmWidthScale),
                             with: nearShading)
            }
        }
    }
}

#Preview {
    ZStack {
        LinearGradient(colors: [Color(hex: 0x2B2A28), Color(hex: 0x4C7A5E)],
                       startPoint: .topLeading, endPoint: .bottomTrailing)
        HStack(spacing: 0) {
            TaiChiFigureView(pose: TaiChiSequences.standingReady)
            TaiChiFigureView(pose: TaiChiSequences.cloudHandsLeft)
            TaiChiFigureView(pose: TaiChiSequences.seatedReady, isSeated: true)
        }
        .frame(height: 240)
    }
    .ignoresSafeArea()
}
