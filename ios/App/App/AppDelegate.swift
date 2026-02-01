import UIKit
import Capacitor
import GCDWebServer
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var webServer: GCDWebServer?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Start local HTTP server for static files
        startLocalServer()
        return true
    }

    func startLocalServer() {
        webServer = GCDWebServer()

        // Get the path to the public folder
        let publicPath = Bundle.main.resourcePath! + "/public"

        // Add handler for static files
        webServer?.addGETHandler(forBasePath: "/", directoryPath: publicPath, indexFilename: "index.html", cacheAge: 0, allowRangeRequests: true)

        // Start the server on port 8080
        webServer?.start(withPort: 8080, bonjourName: nil)

        if let serverURL = webServer?.serverURL {
            print("Local server started at: \(serverURL)")
        }

        // Set dark background color on webView to prevent white flash
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let webView = self.window?.rootViewController?.view?.subviews.first(where: { $0 is WKWebView }) as? WKWebView {
                webView.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0) // #0f172a
                webView.isOpaque = false
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Stop the server when app terminates
        webServer?.stop()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
