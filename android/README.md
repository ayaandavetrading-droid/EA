# Apex Gold AI — Native Android MediaProjection Build

## Overview

This native Android project bridges the Apex Gold AI web interface with Android's official `MediaProjection` system API, allowing full-device and cross-application screen capture (including the MetaTrader 5 mobile app).

### Why Native Android is Required for Cross-App Capture
Standard web browser tabs on Android (Chrome/Firefox/Samsung Internet) enforce browser-level sandboxes that prevent web pages from capturing other applications without explicit OS approval.
This native package solves this by implementing:
1. `MediaProjectionManager.createScreenCaptureIntent()` to invoke the official Android system permission dialog: *"Start recording or casting with Apex Gold AI?"*
2. An Android Foreground Service (`ApexScreenCaptureService`) of type `mediaProjection` with a persistent status notification so Android does not kill screen observation when you switch to MT5.
3. Two-way JavaScript bridge (`ApexAndroidBridge`) between the web dashboard and the native Android OS.

### Building the APK
```bash
cd android
# Build debug APK:
./gradlew assembleDebug
# The output APK will be in:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Installing on Device
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Run:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Open **Apex Gold AI** on your phone, tap **CONNECT MT5**, then tap **SHARE SCREEN**. Grant the system permission once, and switch to MT5!
