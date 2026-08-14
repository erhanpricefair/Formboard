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
            whyThisHelps: "Slow, seated movement wakes up your joints safely without any risk of losing your balance.",
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
            whyThisHelps: "Coordinated arm movement supports shoulder mobility and gentle mind-body focus.",
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
            whyThisHelps: "Stronger legs and ankles are directly linked to fewer falls at home.",
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
            whyThisHelps: "Weight shifting practised slowly builds the balance reflexes that help prevent falls.",
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
            whyThisHelps: "Combining breath with movement is calming and builds core stability.",
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
            whyThisHelps: "Practising controlled balance challenges in a safe way reduces fear of falling over time.",
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
            whyThisHelps: "Walking with attention to each step improves gait steadiness.",
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
            whyThisHelps: "Slow breathing calms the nervous system and can ease everyday worry.",
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
