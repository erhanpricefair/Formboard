import SwiftUI

struct MoodCheckInView: View {
    let onSave: (MoodRating, String?) -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.highContrastEnabled) private var highContrastEnabled
    @State private var selectedMood: MoodRating?
    @State private var note: String = ""

    private var colors: ThemedColors { ThemedColors(highContrast: highContrastEnabled) }

    var body: some View {
        NavigationStack {
            VStack(spacing: Theme.Spacing.lg) {
                Text("How are you feeling today?")
                    .gentleStyle(.title, highContrast: highContrastEnabled)

                HStack(spacing: Theme.Spacing.sm) {
                    ForEach(MoodRating.allCases) { mood in
                        moodButton(mood)
                    }
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("Anything about your balance or confidence today? (Optional)")
                        .gentleStyle(.bodyEmphasis, highContrast: highContrastEnabled)
                    TextEditor(text: $note)
                        .frame(minHeight: 100)
                        .padding(Theme.Spacing.xs)
                        .background(colors.surfaceAlt)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
                }

                Spacer()

                GentleButton(title: "Save Check-In", systemImage: "checkmark") {
                    if let selectedMood {
                        onSave(selectedMood, note.isEmpty ? nil : note)
                        dismiss()
                    }
                }
                .disabled(selectedMood == nil)
            }
            .padding(Theme.Spacing.lg)
            .background(colors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") { dismiss() }.minimumTouchTarget()
                }
            }
        }
    }

    private func moodButton(_ mood: MoodRating) -> some View {
        Button {
            selectedMood = mood
        } label: {
            VStack(spacing: 4) {
                Text(mood.emoji).font(.system(size: 34))
                Text(mood.label)
                    .gentleStyle(.caption, highContrast: highContrastEnabled)
            }
            .frame(maxWidth: .infinity)
            .padding(Theme.Spacing.sm)
            .background(selectedMood == mood ? colors.primaryGreen.opacity(0.15) : colors.surfaceAlt)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous)
                    .strokeBorder(selectedMood == mood ? colors.primaryGreen : .clear, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button, style: .continuous))
        }
        .accessibilityLabel(mood.label)
        .accessibilityAddTraits(selectedMood == mood ? [.isSelected] : [])
    }
}

#Preview {
    MoodCheckInView { _, _ in }
}
