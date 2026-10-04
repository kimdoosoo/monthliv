import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS and Android apps.
 * The apps open the live site, so a web deploy updates the apps too. Store review needs
 * features a website can't offer (push alerts for payment day, extensions and move-in details;
 * search near me) — see README, "모바일 앱".
 *
 * Set CAP_SERVER_URL to the live site before `npx cap sync`: the apps open that address.
 */
const serverUrl = process.env.CAP_SERVER_URL || "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "com.gosuplus.monthliv",
  appName: "MONTHLIV",
  // Shown only when the site can't be reached (no connection).
  webDir: "app-shell",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    allowNavigation: [new URL(serverUrl).hostname],
  },
  ios: {
    contentInset: "never",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
