import Foundation

/// Turns onboarding answers into a starter plan. Kept as a pure, stateless
/// function (rather than a class) so it's trivial to unit test.
enum PlanGenerator {

    static func generateStarterPlan(from answers: OnboardingAnswers, sessions: [Session] = MockContent.sessions) -> Plan {
        let candidates = sessions.filter { session in
            switch answers.chairPreference {
            case .chairOnly: return session.requiresChair
            case .standingOnly: return !session.requiresChair
            case .both: return true
            }
        }

        // Rank sessions by how well they match the person's stated goals so
        // the first few days feel immediately relevant, without ever
        // excluding categories entirely.
        func score(_ session: Session) -> Int {
            var value = 0
            if answers.goals.contains(.balance), session.category == .standingTaiChi || session.category == .taiChiWalking {
                value += 2
            }
            if answers.goals.contains(.mobility), session.category == .chairTaiChi || session.category == .standingTaiChi {
                value += 2
            }
            if answers.goals.contains(.calm), session.category == .breathingCalm {
                value += 2
            }
            if session.durationMinutes <= answers.preferredSessionLength.rawValue + 3 {
                value += 1
            }
            if session.difficulty == .gentle {
                value += 1
            }
            return value
        }

        let ranked = candidates.sorted { score($0) > score($1) }
        let pool = ranked.isEmpty ? sessions : ranked

        var days: [PlanDay] = []
        let length = PlanLength.starter
        for dayNumber in 1...length.rawValue {
            // Every 4th day is a rest day — consistent, gentle, never punishing.
            let isRestDay = dayNumber % 4 == 0
            let session = isRestDay ? nil : pool[(dayNumber - 1) % pool.count]
            days.append(PlanDay(dayNumber: dayNumber, sessionID: session?.id, isRestDay: isRestDay))
        }

        return Plan(title: "Your 7-Day Starter Plan", length: length, days: days)
    }
}
