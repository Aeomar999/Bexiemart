# Local Android Production Build Setup

This plan sets up the environment and native files required to build a release APK locally on your machine, bypassing Expo's cloud services.

## User Review Required

> [!IMPORTANT]
> **Android SDK & JDK:** To run the build commands locally, you must have the **Android SDK** and **JDK 17** installed on your machine.
> **Signing Key:** You will need to generate a `.keystore` file manually (I will provide the command) to sign the app for production.

## Proposed Changes

### Configuration
#### [NEW] [.env](file:///C:/Users/suadi/OneDrive/Desktop/Bexiemart/apps/mobile/.env)
Create a local environment file with production API URLs and keys.

### Native Setup
#### [GENERATE] [android folder](file:///C:/Users/suadi/OneDrive/Desktop/Bexiemart/apps/mobile/android)
Run `npx expo prebuild --platform android` to generate the native Android project.

### Build Scripts
#### [NEW] [build-release.bat](file:///C:/Users/suadi/OneDrive/Desktop/Bexiemart/apps/mobile/build-release.bat)
A helper script to run the local build process in one go.

## Verification Plan

### Manual Verification
1. Run the `build-release.bat` script.
2. Verify that `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` is generated.
