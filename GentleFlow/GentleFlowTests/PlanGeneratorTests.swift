import XCTest
@testable import GentleFlow

final class PlanGeneratorTests: XCTestCase {

    func testStarterPlanHasSevenDays() {
        let plan = PlanGenerator.generateStarterPlan(from: .empty)
        XCTAssertEqual(plan.days.count, 7)
    }

    func testEveryFourthDayIsARestDay() {
        let plan = PlanGenerator.generateStarterPlan(from: .empty)
        let restDayNumbers = plan.days.filter(\.isRestDay).map(\.dayNumber)
        XCTAssertEqual(restDayNumbers, [4])
    }

    func testChairOnlyPreferenceOnlyIncludesChairSessions() {
        var answers = OnboardingAnswers.empty
        answers.chairPreference = .chairOnly
        let plan = PlanGenerator.generateStarterPlan(from: answers)
        let sessionsByID = Dictionary(uniqueKeysWithValues: MockContent.sessions.map { ($0.id, $0) })

        for day in plan.days where !day.isRestDay {
            guard let sessionID = day.sessionID, let session = sessionsByID[sessionID] else {
                XCTFail("Expected a session for a non-rest day")
                continue
            }
            XCTAssertTrue(session.requiresChair)
        }
    }
}

final class StreakCalculationTests: XCTestCase {

    func testEmptyEntriesProduceZeroStreak() {
        XCTAssertEqual(HomeViewModel.computeStreak(from: []), 0)
    }

    func testConsecutiveDaysCountCorrectly() {
        let calendar = Calendar.current
        let today = Date()
        let entries = (0..<3).map { offset in
            ProgressEntry(
                date: calendar.date(byAdding: .day, value: -offset, to: today)!,
                sessionID: UUID(),
                completedMinutes: 10
            )
        }
        XCTAssertEqual(HomeViewModel.computeStreak(from: entries), 3)
    }
}
