import Foundation

/// Sample session catalogue used until real video content is dropped in.
/// Each `videoAssetName` is a placeholder filename — see README for how to
/// wire up real video files or a remote CDN.
enum MockContent {

    static let sessions: [Session] = [
        // MARK: Chair Tai Chi
        Session(
            title: "Morning Chair Warm-Up",
            category: .chairTaiChi,
            durationMinutes: 8,
            difficulty: .gentle,
            requiresChair: true,
            videoAssetName: "chair_morning_warmup",
            thumbnailSystemImage: "sun.max",
            summary: "A gentle seated warm-up for shoulders, wrists and ankles to start your day.",
            whyThisHelps: "Slow, seated movement is a gentle way to warm up your joints, with much less balance risk than standing work.",
            hasVoiceGuidance: true
        ),
        Session(
            title: "Seated Flowing Hands",
            category: .chairTaiChi,
            durationMinutes: 12,
            difficulty: .gentle,
            requiresChair: true,
            videoAssetName: "chair_flowing_hands",
            thumbnailSystemImage: "hand.raised",
            summary: "Classic Tai Chi hand movements adapted for a chair, flowing at a relaxed pace.",
            whyThisHelps: "Many people find coordinated arm movement like this gentle on the shoulders, with a calm, focused feel.",
            hasVoiceGuidance: true
        ),
        Session(
            title: "Seated Leg & Ankle Strength",
            category: .chairTaiChi,
            durationMinutes: 15,
            difficulty: .easyPlus,
            requiresChair: true,
            videoAssetName: "chair_leg_strength",
            thumbnailSystemImage: "figure.strengthtraining.functional",
            summary: "Gentle seated leg lifts and ankle circles to support everyday strength.",
            whyThisHelps: "Gentle seated leg and ankle movement is a comfortable way to work on everyday strength.",
            isPremium: true,
            hasVoiceGuidance: true
        ),

        // MARK: Standing Tai Chi
        Session(
            title: "Standing Tai Chi Basics",
            category: .standingTaiChi,
            durationMinutes: 10,
            difficulty: .gentle,
            requiresChair: false,
            videoAssetName: "standing_basics",
            thumbnailSystemImage: "figure.mind.and.body",
            summary: "Simple, slow standing movements. Keep a chair or bench nearby for support.",
            whyThisHelps: "Slow weight shifting is one of the ways people work on steadiness on their feet, at whatever pace suits you.",
            hasVoiceGuidance: true
        ),
        Session(
            title: "Cloud Hands, Standing",
            category: .standingTaiChi,
            durationMinutes: 14,
            difficulty: .easyPlus,
            requiresChair: false,
            videoAssetName: "standing_cloud_hands",
            thumbnailSystemImage: "wind",
            summary: "A gentle standing flow focused on smooth, continuous arm movement.",
            whyThisHelps: "Combining breath with slow movement is calming, and many people find it supports steadiness through the middle of the body.",
            isPremium: true,
            hasVoiceGuidance: true
        ),
        Session(
            title: "Standing Balance Confidence",
            category: .standingTaiChi,
            durationMinutes: 12,
            difficulty: .building,
            requiresChair: false,
            videoAssetName: "standing_balance_confidence",
            thumbnailSystemImage: "figure.stand.line.dotted.figure.stand",
            summary: "Supported single-leg holds and slow turns to build steady confidence.",
            whyThisHelps: "Practising gentle balance challenges at your own pace, in a safe setting, is one way some people build confidence over time.",
            isPremium: true,
            hasVoiceGuidance: true
        ),

        // MARK: Tai Chi Walking
        Session(
            title: "Mindful Walking Indoors",
            category: .taiChiWalking,
            durationMinutes: 10,
            difficulty: .gentle,
            requiresChair: false,
            videoAssetName: "walking_indoors",
            thumbnailSystemImage: "figure.walk",
            summary: "Slow, deliberate walking practice you can do in a hallway or lounge room.",
            whyThisHelps: "Walking slowly and paying attention to each step is a calm way to bring more awareness to how you move.",
            hasVoiceGuidance: true
        ),
        Session(
            title: "Garden or Park Walking Flow",
            category: .taiChiWalking,
            durationMinutes: 15,
            difficulty: .easyPlus,
            requiresChair: false,
            videoAssetName: "walking_outdoors",
            thumbnailSystemImage: "tree",
            summary: "A calming outdoor walking sequence, ideal for a garden or local park.",
            whyThisHelps: "Fresh air, gentle movement and nature together support mood and mobility.",
            isPremium: true,
            hasVoiceGuidance: true
        ),

        // MARK: Breathing & Calm
        Session(
            title: "Settle & Breathe",
            category: .breathingCalm,
            durationMinutes: 5,
            difficulty: .gentle,
            requiresChair: true,
            videoAssetName: "breathing_settle",
            thumbnailSystemImage: "leaf",
            summary: "A short breathing practice you can do seated, anywhere, any time you feel tense.",
            whyThisHelps: "Slow breathing is a simple way to help settle the nervous system, and can ease everyday worry for some people.",
            hasVoiceGuidance: true
        ),
        Session(
            title: "Evening Wind-Down",
            category: .breathingCalm,
            durationMinutes: 8,
            difficulty: .gentle,
            requiresChair: true,
            videoAssetName: "breathing_evening",
            thumbnailSystemImage: "moon.stars",
            summary: "A gentle Qigong-style breathing flow to help you relax before bed.",
            whyThisHelps: "A calm wind-down routine can support more settled sleep.",
            hasVoiceGuidance: true
        ),
        Session(
            title: "Qigong Gentle Stretch",
            category: .breathingCalm,
            durationMinutes: 10,
            difficulty: .easyPlus,
            requiresChair: true,
            videoAssetName: "breathing_qigong_stretch",
            thumbnailSystemImage: "sparkles",
            summary: "Slow stretching paired with breath, seated or standing — your choice.",
            whyThisHelps: "Combining gentle stretch with breath supports both flexibility and calm.",
            isPremium: true,
            hasVoiceGuidance: true
        )
    ]
}
