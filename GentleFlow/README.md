# Gentle Flow

A calm, accessible Tai Chi and mindful movement app for Australian seniors and pensioners — built with SwiftUI for iOS 17+.

Gentle Flow focuses on balance confidence, joint-friendly mobility, and stress reduction, with a design system tuned for larger text, high contrast, generous touch targets, and VoiceOver support from the ground up.

## Requirements

- Xcode 15.4+ (iOS 17 SDK)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) to generate the `.xcodeproj` from `project.yml`
- An Apple Developer account for StoreKit / TestFlight / App Store distribution (not required to build and run locally)

## Getting started

```bash
brew install xcodegen
cd GentleFlow
xcodegen generate
open GentleFlow.xcodeproj
```

Then build and run the `GentleFlow` scheme on a simulator or device running iOS 17+.

> Why XcodeGen instead of a committed `.xcodeproj`? Generated Xcode project files are large, binary-adjacent XML that merge poorly and are easy to corrupt by hand. `project.yml` is a small, readable, diffable source of truth — regenerate any time with `xcodegen generate`.

## Project structure

```
GentleFlow/
  project.yml                  # XcodeGen project definition
  GentleFlow/
    App/                       # App entry point (GentleFlowApp)
    DesignSystem/              # Theme, colours, typography, reusable components
    Models/                    # Codable data models (Session, Plan, Progress, Onboarding, Subscription)
    Services/                  # Persistence, StoreKit, PDF export, mock content, plan generation
    ViewModels/                # One observable view model per major screen (MVVM)
    Views/
      Onboarding/               # Multi-step senior-first onboarding quiz
      Main/                     # MainTabView (Home | Sessions | Progress | Settings)
      Home/                     # Today's session, streak, quick access, "why this helps"
      Library/                  # Session catalogue + detail
      Player/                   # Full-screen session player with large controls
      Progress/                 # Streaks, mood check-ins, simple stats
      Settings/                 # Accessibility, offline downloads, disclaimer, family sharing
      Paywall/                  # Pensioner-friendly subscription screen
      PlanDetail/               # Full plan overview + PDF export
    Resources/                  # Drop bundled video/audio assets here
    Supporting/                 # Info.plist, entitlements
  GentleFlowTests/              # Unit tests for plan generation and streak logic
```

## Architecture

**Clean MVVM.** Views are thin and declarative; all state and business logic lives in `@MainActor` `ObservableObject` view models under `ViewModels/`. Views read published state and call view model methods — they never talk to `PersistenceService` or `StoreKitManager` directly.

**Persistence.** `PersistenceService` is a small `UserDefaults` + `FileManager` wrapper (Codable JSON for structured data, files for downloaded video). There's no backend and no account system — everything lives on-device, matching the app's privacy-first design. If the content library grows large enough to need querying, swap the internals for SwiftData without touching call sites.

**Content.** `MockContent.swift` defines a sample catalogue of 11 sessions across all four categories (Chair Tai Chi, Standing Tai Chi, Tai Chi Walking, Breathing & Calm). `PlanGenerator` turns onboarding answers into a personalised 7-day starter plan by scoring sessions against the user's stated goals, chair preference, and session-length preference.

**Subscriptions.** `StoreKitManager` is a StoreKit 2 skeleton: product loading, purchase, restore, and transaction listening are wired up against placeholder product identifiers (`au.com.gentleflow.premium.monthly` / `.annual`). The free tier is fully functional — premium unlocks the extended session library and offline downloads only.

## Accessibility notes

- **Dynamic Type**: all text uses SwiftUI's relative text styles via `Text.gentleStyle(_:highContrast:)`. Settings additionally offers a text-size override (`SettingsViewModel.effectiveDynamicTypeSize`) that raises the *floor* on top of the system setting, up to `.accessibility2`.
- **High contrast**: a single app-level toggle (Settings → Accessibility & Display) swaps the whole colour palette for a stronger black/white variant via `Theme.color(_:highContrast:)` — no separate dark-mode asset catalog to maintain.
- **Touch targets**: `Theme.TouchTarget.minimum` (56pt) is enforced via the `.minimumTouchTarget()` modifier and baked into `GentleButton`, well above the 44pt HIG/WCAG minimum.
- **VoiceOver**: interactive rows use `.accessibilityElement(children: .combine)` and explicit labels/hints so VoiceOver reads one coherent phrase per control rather than fragments.
- **Reduce Motion**: `.gentleAnimation(_:)` checks `\.accessibilityReduceMotion` and disables animation entirely rather than just slowing it down.

## Next steps for a developer picking this up

1. **Real video content.** `SessionPlayerView.videoArea` currently renders a placeholder gradient + SF Symbol + on-screen cue text where the instructor video belongs. Session models already carry a `videoAssetName` — wire in `AVPlayer`/`AVPlayerLayer` (bundled assets or a CDN/HLS stream) and remove the placeholder. Keep the large play/pause/skip controls and recovery-break overlay as-is; they're deliberately oversized for this audience.
2. **Voice guidance audio.** The cue text in the player currently updates on a timer as placeholder "voice guidance." Record real narration per session and drive an `AVAudioPlayer`/`AVSpeechSynthesizer` from the same cue timeline.
3. **App Store Connect**: create the two subscription products matching `GentleFlowProducts.monthly` / `.annual`, configure pricing (the in-app copy assumes AUD, pensioner-friendly pricing), and add a `Configuration.storekit` file for local StoreKit testing.
4. **App icon, launch screen and marketing assets**: `project.yml` currently generates a default launch screen; replace with real branding plus App Store screenshots sized for the iPhone and iPad breakpoints this app supports.
5. **Real content review**: have an accredited Tai Chi/Qigong instructor and, ideally, a physiotherapist review all session scripts and movement sequences before release — the sample copy in `MockContent.swift` is illustrative only.
6. **Testing with seniors**: run moderated usability sessions with the target audience (60+, varying tech confidence and vision) specifically on: onboarding comprehension, locating "Start Today's Session" without help, text legibility at default size, and recovering from a wrong tap. Iterate spacing/copy based on findings — this audience is the actual acceptance test, not a device matrix.
7. **Offline downloads**: `PersistenceService.setDownloaded` currently only tracks a flag; wire up a real background download (e.g. `URLSession` background configuration) into `PersistenceService.offlineFileURL(for:)`.
8. **Privacy policy / terms links**: `AboutDisclaimerView` links to placeholder `gentleflow.example.com` URLs — point these at real, published policy pages before release.
9. **SwiftData migration** (optional): if the session library grows large or you want richer querying/relationships, replace `PersistenceService`'s UserDefaults-backed calls with SwiftData `@Model` types — the call sites in view models won't need to change.

## Medical & safety disclaimer

Gentle Flow provides general movement guidance for wellbeing, not medical advice or physiotherapy. This is shown to every user once, before first use (`DisclaimerGateView`), and repeated in Settings → About & Safety. Any real deployment should have this copy reviewed by a qualified health professional and, depending on jurisdiction, legal counsel.
