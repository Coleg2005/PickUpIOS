import 'dotenv/config';

// Which app "flavor" to build. Set by EAS build profiles (see eas.json) for
// real builds, or by your local .env for `npm start`. Defaults to development
// so local runs always use the dev flavor.
const APP_ENV = process.env.APP_ENV || 'development';
const IS_PROD_APP = APP_ENV === 'production';

export default {
  expo: {
    name: IS_PROD_APP ? "PickUp" : "PickUp (Dev)",
    // The slug is the project's identity on expo.dev (tied to
    // extra.eas.projectId and the updates URL) — never user-visible.
    // Renaming it breaks the EAS link; the display name above is the
    // one that matters for branding.
    slug: "PickUp2",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "pickup",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      // v1 targets phones only — the UI has never been tested on iPad, and
      // App Review tests tablet layouts when this is true.
      supportsTablet: false,
      // Permanent once submitted to the App Store. The dev flavor gets a
      // separate id so it can be installed alongside the production app.
      bundleIdentifier: IS_PROD_APP ? "me.pickupiosbackend.app" : "me.pickupiosbackend.app.dev",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "PickUp uses your location to show nearby pick-up games and set where a game is happening.",
        NSCameraUsageDescription:
          "PickUp uses your camera so you can take a profile photo.",
        NSPhotoLibraryUsageDescription:
          "PickUp needs access to your photos so you can choose a profile picture."
      }
    },
    android: {
      package: IS_PROD_APP ? "me.pickupiosbackend.app" : "me.pickupiosbackend.app.dev",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#2C2C2E"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#2C2C2E"
        }
      ],
      "expo-web-browser",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "4b83280c-61ed-4120-b089-1f6fbe7b70f6"
      },
      BACKEND_URL: process.env.BACKEND_URL
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/4b83280c-61ed-4120-b089-1f6fbe7b70f6"
    }
  }
};
