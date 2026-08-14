import Foundation

/// Lightweight, privacy-first local persistence.
///
/// Design decision: Gentle Flow stores everything on-device using
/// UserDefaults (small Codable structs/arrays as JSON) plus FileManager for
/// downloaded video files. There is no account system and nothing leaves
/// the device — this matches the "privacy-first, minimal data collection"
/// requirement and keeps things simple for a small MVP. If the content
/// library grows large, swap the UserDefaults-backed calls below for
/// SwiftData without changing the call sites (the type is already an
/// injectable protocol-free singleton).
final class PersistenceService {
    static let shared = PersistenceService()

    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private enum Key {
        static let userProfile = "gentleflow.userProfile"
        static let plan = "gentleflow.plan"
        static let progressEntries = "gentleflow.progressEntries"
        static let downloadedSessionIDs = "gentleflow.downloadedSessionIDs"
        static let highContrastEnabled = "gentleflow.highContrastEnabled"
        static let textSizeOverrideRawValue = "gentleflow.textSizeOverride"
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }

    // MARK: User profile

    func loadUserProfile() -> UserProfile {
        load(UserProfile.self, forKey: Key.userProfile) ?? .empty
    }

    func saveUserProfile(_ profile: UserProfile) {
        save(profile, forKey: Key.userProfile)
    }

    // MARK: Plan

    func loadPlan() -> Plan? {
        load(Plan.self, forKey: Key.plan)
    }

    func savePlan(_ plan: Plan) {
        save(plan, forKey: Key.plan)
    }

    // MARK: Progress

    func loadProgressEntries() -> [ProgressEntry] {
        load([ProgressEntry].self, forKey: Key.progressEntries) ?? []
    }

    func saveProgressEntries(_ entries: [ProgressEntry]) {
        save(entries, forKey: Key.progressEntries)
    }

    func appendProgressEntry(_ entry: ProgressEntry) {
        var entries = loadProgressEntries()
        entries.append(entry)
        saveProgressEntries(entries)
    }

    // MARK: Offline downloads (tracks which session IDs have been saved for offline playback)

    func downloadedSessionIDs() -> Set<UUID> {
        Set((load([UUID].self, forKey: Key.downloadedSessionIDs) ?? []))
    }

    func setDownloaded(_ sessionID: UUID, downloaded: Bool) {
        var ids = downloadedSessionIDs()
        if downloaded {
            ids.insert(sessionID)
        } else {
            ids.remove(sessionID)
            try? FileManager.default.removeItem(at: offlineFileURL(for: sessionID))
        }
        save(Array(ids), forKey: Key.downloadedSessionIDs)
    }

    func offlineFileURL(for sessionID: UUID) -> URL {
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("OfflineSessions", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("\(sessionID.uuidString).mov")
    }

    // MARK: Accessibility settings

    func loadHighContrastEnabled() -> Bool {
        defaults.bool(forKey: Key.highContrastEnabled)
    }

    func saveHighContrastEnabled(_ enabled: Bool) {
        defaults.set(enabled, forKey: Key.highContrastEnabled)
    }

    /// Stored as a raw Double multiplier (1.0 = system default) rather than
    /// a DynamicTypeSize directly, so this file doesn't need to import
    /// SwiftUI just to persist a preference.
    func loadTextSizeOverrideStep() -> Int {
        defaults.integer(forKey: Key.textSizeOverrideRawValue) // defaults to 0 = "no override"
    }

    func saveTextSizeOverrideStep(_ step: Int) {
        defaults.set(step, forKey: Key.textSizeOverrideRawValue)
    }

    // MARK: Generic helpers

    private func save<T: Encodable>(_ value: T, forKey key: String) {
        guard let data = try? encoder.encode(value) else { return }
        defaults.set(data, forKey: key)
    }

    private func load<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = defaults.data(forKey: key) else { return nil }
        return try? decoder.decode(T.self, from: data)
    }
}
