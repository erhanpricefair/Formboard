import SwiftUI

struct SessionsLibraryView: View {
    @StateObject private var viewModel = LibraryViewModel()
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @State private var selectedSession: Session?

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    init(initialCategory: SessionCategory? = nil) {
        _viewModel = StateObject(wrappedValue: {
            let vm = LibraryViewModel()
            vm.selectedCategory = initialCategory
            return vm
        }())
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    categoryFilterRow
                    chairFilterRow

                    ForEach(viewModel.filteredSessions) { session in
                        Button {
                            selectedSession = session
                        } label: {
                            SessionRow(session: session, isDownloaded: viewModel.isDownloaded(session))
                        }
                        .buttonStyle(.plain)
                    }

                    if viewModel.filteredSessions.isEmpty {
                        Text("No sessions match these filters yet. Try clearing a filter above.")
                            .gentleStyle(.body, highContrast: highContrastEnabled)
                            .padding(.top, Theme.Spacing.lg)
                    }
                }
                .padding(Theme.Spacing.lg)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("Sessions")
            .sheet(item: $selectedSession) { session in
                SessionDetailView(session: session)
            }
        }
    }

    private var categoryFilterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.xs) {
                filterChip(title: "All", isSelected: viewModel.selectedCategory == nil) {
                    viewModel.selectedCategory = nil
                }
                ForEach(SessionCategory.allCases) { category in
                    filterChip(title: category.title, isSelected: viewModel.selectedCategory == category) {
                        viewModel.selectedCategory = category
                    }
                }
            }
        }
    }

    private var chairFilterRow: some View {
        Toggle(isOn: $viewModel.chairOnlyFilter) {
            Label("Seated sessions only", systemImage: "chair.lounge")
                .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
        }
        .toggleStyle(.switch)
        .tint(colors.primaryGreen)
        .padding(Theme.Spacing.sm)
        .gentleCardStyle(highContrast: highContrastEnabled)
    }

    private func filterChip(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(.subheadline, design: .rounded, weight: .semibold))
                .padding(.horizontal, Theme.Spacing.sm)
                .frame(minHeight: 44)
                .background(isSelected ? colors.primaryGreen : colors.surfaceAlt)
                .foregroundColor(isSelected ? colors.primaryGreenText : colors.primaryText)
                .clipShape(Capsule())
        }
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}

struct SessionRow: View {
    let session: Session
    let isDownloaded: Bool
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous)
                    .fill(colors.surfaceAlt)
                    .frame(width: 56, height: 56)
                Image(systemName: session.thumbnailSystemImage)
                    .foregroundColor(colors.primaryGreen)
                    .font(.system(size: 24))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(session.title)
                    .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                HStack(spacing: Theme.Spacing.xs) {
                    GentleTag(text: "\(session.durationMinutes) min", systemImage: "clock")
                    GentleTag(text: session.difficulty.title)
                    if isDownloaded {
                        GentleTag(text: "Downloaded", systemImage: "arrow.down.circle.fill")
                    }
                }
            }

            Spacer()

            if session.isPremium {
                Image(systemName: "lock.fill")
                    .foregroundColor(colors.secondaryText)
            }
            Image(systemName: "chevron.right")
                .foregroundColor(colors.secondaryText)
        }
        .padding(Theme.Spacing.sm)
        .frame(minHeight: Theme.TouchTarget.minimum)
        .gentleCardStyle(highContrast: highContrastEnabled)
        .accessibilityElement(children: .combine)
        .accessibilityHint(session.isPremium ? "Premium session" : "Opens session details")
    }
}

#Preview {
    SessionsLibraryView()
}
