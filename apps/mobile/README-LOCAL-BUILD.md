# Local Android Production Build Guide

This guide helps you build the production APK locally on your machine, bypassing Expo's cloud (EAS).

## Prerequisites

1.  **JDK 17** installed and `JAVA_HOME` set.
2.  **Android SDK** installed and `ANDROID_HOME` set.
3.  **Signing Key**: You need a `.keystore` file to sign the release APK.

## Step 1: Generate a Signing Key

Run this command to create a keystore file (replace `your_password` and `my-key-alias` with your own values):

```bash
keytool -genkeypair -v -storepass your_password -alias my-key-alias -keypass your_password -keyalg RSA -keysize 2048 -validity 10000 -keystore my-release-key.keystore
```

Move the generated `my-release-key.keystore` to `apps/mobile/android/app/`.

## Step 2: Configure Gradle Signing

Once the `android` folder is generated (after running the build script once or `npx expo prebuild`), edit `apps/mobile/android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your_password'
            keyAlias 'my-key-alias'
            keyPassword 'your_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

## Step 3: Run the Build Script

Run the `build-release.bat` file in this directory.

```cmd
build-release.bat
```

The APK will be located at:
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
