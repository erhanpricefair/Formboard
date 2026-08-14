import SwiftUI

@main
struct GentleFlowApp: App {

    @StateObject private var settingsViewModel = SettingsViewModel()
    @StateObject private var storeKitManager = StoreKitManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(settingsViewModel)
                .environmentObject(storeKitManager)
                // Senior-first accessibility: let the app-wide text size override
                // (set in Settings) stack on top of whatever Dynamic Type size
                // the user has chosen in iOS itself, rather than fighting it.
                .dynamicTypeSize(settingsViewModel.effectiveDynamicTypeSize)
                .environment(\.highContrastEnabled, settingsViewModel.highContrastEnabled)
                .tint(Theme.color(.primaryGreen, highContrast: settingsViewModel.highContrastEnabled))
                .task {
                    await storeKitManager.start()
                }
        }
    }
}
