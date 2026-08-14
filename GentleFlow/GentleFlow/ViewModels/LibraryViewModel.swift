import Foundation

@MainActor
final class LibraryViewModel: ObservableObject {

    @Published var selectedCategory: SessionCategory?
    @Published var chairOnlyFilter: Bool = false
    @Published private(set) var allSessions: [Session]

    private let persistence: PersistenceService

    init(allSessions: [Session] = MockContent.sessions, persistence: PersistenceService = .shared) {
        self.allSessions = allSessions
        self.persistence = persistence
    }

    var filteredSessions: [Session] {
        allSessions.filter { session in
            let matchesCategory = selectedCategory == nil || session.category == selectedCategory
            let matchesChair = !chairOnlyFilter || session.requiresChair
            return matchesCategory && matchesChair
        }
    }

    func sessions(in category: SessionCategory) -> [Session] {
        allSessions.filter { $0.category == category }
    }

    func isDownloaded(_ session: Session) -> Bool {
        persistence.downloadedSessionIDs().contains(session.id)
    }
}
