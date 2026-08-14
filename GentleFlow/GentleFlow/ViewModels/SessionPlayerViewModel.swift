import Foundation
import Combine

@MainActor
final class SessionPlayerViewModel: ObservableObject {

    let session: Session

    @Published var isPlaying: Bool = false
    @Published var elapsedSeconds: Int = 0
    @Published var isChairMode: Bool
    @Published var isOnRecoveryBreak: Bool = false
    @Published var recoveryBreakSecondsRemaining: Int = 0
    @Published private(set) var didFinish: Bool = false

    /// On-screen text cue shown alongside voice guidance — kept short and
    /// plain so it's readable at a glance without straining.
    @Published var currentCueText: String = "Get comfortable and take a slow breath in."

    private let totalSeconds: Int
    private var timerCancellable: AnyCancellable?
    private let persistence: PersistenceService
    private let recoveryBreakInterval = 240 // offer a short break every 4 minutes
    private let recoveryBreakDuration = 20

    private let cues = [
        "Get comfortable and take a slow breath in.",
        "Relax your shoulders. There's no rush.",
        "Shift your weight gently, only as far as feels comfortable.",
        "Breathe out slowly as you move.",
        "If anything feels uncomfortable, pause any time.",
        "Well done — keep going at your own pace.",
        "Notice your feet feeling steady beneath you.",
        "Nearly there. You're doing wonderfully."
    ]

    init(session: Session, persistence: PersistenceService = .shared) {
        self.session = session
        self.isChairMode = session.requiresChair
        self.totalSeconds = session.durationMinutes * 60
        self.persistence = persistence
    }

    var progressFraction: Double {
        guard totalSeconds > 0 else { return 0 }
        return min(Double(elapsedSeconds) / Double(totalSeconds), 1)
    }

    var remainingTimeText: String {
        let remaining = max(totalSeconds - elapsedSeconds, 0)
        return String(format: "%d:%02d", remaining / 60, remaining % 60)
    }

    func togglePlayPause() {
        isPlaying.toggle()
        if isPlaying {
            startTimer()
        } else {
            stopTimer()
        }
    }

    func skipBack15() {
        elapsedSeconds = max(elapsedSeconds - 15, 0)
    }

    func skipForward15() {
        elapsedSeconds = min(elapsedSeconds + 15, totalSeconds)
    }

    func endRecoveryBreakEarly() {
        isOnRecoveryBreak = false
        recoveryBreakSecondsRemaining = 0
    }

    private func startTimer() {
        timerCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.tick()
            }
    }

    private func stopTimer() {
        timerCancellable?.cancel()
        timerCancellable = nil
    }

    private func tick() {
        if isOnRecoveryBreak {
            recoveryBreakSecondsRemaining -= 1
            if recoveryBreakSecondsRemaining <= 0 {
                isOnRecoveryBreak = false
            }
            return
        }

        elapsedSeconds += 1

        if elapsedSeconds % recoveryBreakInterval == 0, elapsedSeconds < totalSeconds {
            isOnRecoveryBreak = true
            recoveryBreakSecondsRemaining = recoveryBreakDuration
        }

        updateCue()

        if elapsedSeconds >= totalSeconds {
            finish()
        }
    }

    private func updateCue() {
        let cueIndex = min(elapsedSeconds / max(totalSeconds / cues.count, 1), cues.count - 1)
        let newCue = cues[cueIndex]
        if newCue != currentCueText {
            currentCueText = newCue
        }
    }

    private func finish() {
        isPlaying = false
        stopTimer()
        didFinish = true
        persistence.appendProgressEntry(
            ProgressEntry(sessionID: session.id, completedMinutes: session.durationMinutes)
        )
    }

    func stopAndReset() {
        stopTimer()
        isPlaying = false
    }
}
