# VendraHub Android packaging

This folder is intentionally minimal because Android APK generation must run in a local environment with:

- Android Studio
- Android SDK
- Java / Gradle toolchain
- a valid keystore for signed release builds

To generate a build locally after installing dependencies:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

Then open the generated Android project in Android Studio and build the APK.
