import UIKit

/// Generates a simple, large-print PDF summary of a plan so it can be
/// printed and stuck on the fridge — many users in this audience prefer a
/// paper reminder over checking an app each day.
enum PDFPlanGenerator {

    static func generatePDF(for plan: Plan, sessions: [Session]) -> Data {
        let pageWidth: CGFloat = 612 // US Letter, matches most home printers used in AU too
        let pageHeight: CGFloat = 792
        let margin: CGFloat = 48
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: pageWidth, height: pageHeight))

        let sessionsByID = Dictionary(uniqueKeysWithValues: sessions.map { ($0.id, $0) })

        let data = renderer.pdfData { context in
            var cursorY: CGFloat = margin
            context.beginPage()

            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 26, weight: .bold),
                .foregroundColor: UIColor.black
            ]
            let subtitleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 14, weight: .regular),
                .foregroundColor: UIColor.darkGray
            ]
            let dayAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16, weight: .semibold),
                .foregroundColor: UIColor.black
            ]
            let detailAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 14, weight: .regular),
                .foregroundColor: UIColor.black
            ]

            let title = "Gentle Flow — \(plan.title)"
            title.draw(at: CGPoint(x: margin, y: cursorY), withAttributes: titleAttributes)
            cursorY += 34

            "Your personalised gentle movement plan. Always practise at your own pace.".draw(
                at: CGPoint(x: margin, y: cursorY), withAttributes: subtitleAttributes
            )
            cursorY += 30

            for day in plan.days.sorted(by: { $0.dayNumber < $1.dayNumber }) {
                if cursorY > pageHeight - margin - 60 {
                    context.beginPage()
                    cursorY = margin
                }

                let dayLabel = "Day \(day.dayNumber)"
                dayLabel.draw(at: CGPoint(x: margin, y: cursorY), withAttributes: dayAttributes)
                cursorY += 20

                let detail: String
                if day.isRestDay {
                    detail = "Rest day — a short walk or gentle stretch if you feel like it."
                } else if let sessionID = day.sessionID, let session = sessionsByID[sessionID] {
                    detail = "\(session.title) · \(session.durationMinutes) min · \(session.category.title)"
                } else {
                    detail = "Session"
                }
                detail.draw(at: CGPoint(x: margin, y: cursorY), withAttributes: detailAttributes)
                cursorY += 26
            }

            cursorY += 10
            let footer = "Please stop if anything hurts, and check with your GP before starting a new activity if you're unsure. This plan is general guidance, not medical advice."
            let footerRect = CGRect(x: margin, y: pageHeight - margin - 40, width: pageWidth - margin * 2, height: 40)
            footer.draw(in: footerRect, withAttributes: subtitleAttributes)
        }

        return data
    }
}
