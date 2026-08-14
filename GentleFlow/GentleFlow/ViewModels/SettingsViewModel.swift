import SwiftUI
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {

    /// Steps away from the system Dynamic Type size, e.g. +2 nudges body
    /// text noticeably larger without forcing everyone to the most extreme
    /// accessibility size. 0 means "just follow the system setting".
    static let textSizeSteps: [Int] = [0, 1, 2, 3]

    @Published var highContrastEnabled: Bool {
        didSet { persistence.saveHighContrastEnabled(highContrastEnabled) }
    }

    @Published var textSizeOverrideStep: Int {
        didSet { persistence.saveTextSizeOverrideStep(textSizeOverrideStep) }
    }

    @Published var downloadedSessionIDs: Set<UUID>
    @Published var userProfile: UserProfile

    private let persistence: PersistenceService

    init(persistence: PersistenceService = .shared) {
        self.persistence = persistence
        self.highContrastEnabled = persistence.loadHighContrastEnabled()
        self.textSizeOverrideStep = persistence.loadTextSizeOverrideStep()
        self.downloadedSessionIDs = persistence.downloadedSessionIDs()
        self.userProfile = persistence.loadUserProfile()
    }

    /// Applied on top of whatever Dynamic Type size iOS already reports, by
    /// mapping the step to an absolute size ceiling. SwiftUI clamps
    /// `dynamicTypeSize` so this only ever makes text larger, never smaller
    /// than what the user picked in iOS Settings.
    var effectiveDynamicTypeSize: DynamicTypeSize {
        switch textSizeOverrideStep {
        case 1: return .xLarge
        case 2: return .xxLarge
        case 3: return .accessibility2
        default: return .large
        }
    }

    func acceptDisclaimer() {
        userProfile.hasAcceptedDisclaimer = true
        persistence.saveUserProfile(userProfile)
    }

    func setDownloaded(_ session: Session, downloaded: Bool) {
        persistence.setDownloaded(session.id, downloaded: downloaded)
        downloadedSessionIDs = persistence.downloadedSessionIDs()
    }

    func removeAllDownloads() {
        for id in downloadedSessionIDs {
            persistence.setDownloaded(id, downloaded: false)
        }
        downloadedSessionIDs = persistence.downloadedSessionIDs()
    }

    /// Wipes locally stored profile, plan and progress. Used from Settings
    /// "Clear my data" — there is no account, so this is a full local reset.
    func resetAllData() {
        persistence.saveUserProfile(.empty)
        persistence.saveProgressEntries([])
        removeAllDownloads()
        userProfile = .empty
    }
}
