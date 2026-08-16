@echo off
SETLOCAL EnableDelayedExpansion

echo [1/4] Checking for production .env...
if not exist .env (
    echo Error: .env file not found. Please create it first.
    exit /b 1
)

echo [2/4] Generating native Android project (prebuild)...
call npx expo prebuild --platform android --no-install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Prebuild failed. Make sure expo-cli is installed or run "npm install" first.
    exit /b 1
)

echo [3/4] Entering android directory...
cd android

echo [4/4] Building Release APK...
echo Note: This requires a keystore and signing configuration in android/app/build.gradle.
call .\gradlew assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! APK generated at:
    echo apps\mobile\android\app\build\outputs\apk\release\app-release.apk
) else (
    echo Error: Build failed. Check the errors above.
)

pause
