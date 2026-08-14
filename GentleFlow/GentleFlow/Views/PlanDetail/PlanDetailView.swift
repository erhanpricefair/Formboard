import SwiftUI

struct PlanDetailView: View {
    let plan: Plan
    let sessions: [Session]
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @State private var shareItem: ShareableFile?

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }
    private var sessionsByID: [UUID: Session] { Dictionary(uniqueKeysWithValues: sessions.map { ($0.id, $0) }) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                Text(plan.title)
                    .gentleStyle(.largeTitle, highContrast: highContrastEnabled)

                Text("A gentle overview of your plan. Completed days are ticked off — there's no penalty for a day off.")
                    .gentleStyle(.body, highContrast: highContrastEnabled)

                ForEach(plan.days) { day in
                    planDayRow(day)
                }

                GentleButton(title: "Print or Save as PDF", systemImage: "printer") {
                    let data = PDFPlanGenerator.generatePDF(for: plan, sessions: sessions)
                    shareItem = ShareableFile.write(data: data, filename: "\(plan.title).pdf")
                }
                .padding(.top, Theme.Spacing.sm)
            }
            .padding(Theme.Spacing.lg)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("Your Plan")
        .sheet(item: $shareItem) { file in
            ShareSheet(activityItems: [file.url])
        }
    }

    private func planDayRow(_ day: PlanDay) -> some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: day.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundColor(day.isCompleted ? colors.success : colors.divider)
                .font(.system(size: 22))

            VStack(alignment: .leading, spacing: 2) {
                Text("Day \(day.dayNumber)")
                    .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                Text(dayDescription(day))
                    .gentleStyle(.caption, highContrast: highContrastEnabled)
            }
            Spacer()
        }
        .padding(Theme.Spacing.sm)
        .gentleCardStyle(highContrast: highContrastEnabled)
    }

    private func dayDescription(_ day: PlanDay) -> String {
        if day.isRestDay { return "Rest day" }
        guard let id = day.sessionID, let session = sessionsByID[id] else { return "Session" }
        return "\(session.title) · \(session.durationMinutes) min"
    }
}

/// Wraps a temporary file URL so it can drive a `.sheet(item:)` share sheet.
struct ShareableFile: Identifiable {
    let id = UUID()
    let url: URL

    static func write(data: Data, filename: String) -> ShareableFile? {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: url, options: .atomic)
            return ShareableFile(url: url)
        } catch {
            return nil
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
