# Trace App - Build & Deployment Plan

Step-by-step guide to build and deploy Trace to iOS App Store and Google Play Store. This plan is written to be predictable—each step is independent and restartable if interrupted.

---

## Phase 0: Pre-Build Setup

This phase sets up developer accounts and signing certificates. It requires no code changes—just administration.

### 0.1 Rust Microservice Build Targets

Each Rust engine must compile for both iOS and Android architectures.

| Engine | iOS Target | Android Target | Output Format |
|--------|---|---|---|
| IMU Engine | aarch64-apple-ios | aarch64-linux-android | Static library (.a) / Shared library (.so) |
| Zone Mapper | aarch64-apple-ios | aarch64-linux-android | Static library (.a) / Shared library (.so) |
| CEBE-X | aarch64-apple-ios | aarch64-linux-android | Static library (.a) / Shared library (.so) |

**Why these targets?**
- aarch64-apple-ios: iPhone 6s and later (99% of users)
- aarch64-linux-android: Modern Android devices (95% of market)

### 0.2 Developer Account Setup

**iOS:**
1. Create Apple Developer account at https://developer.apple.com ($99/year)
2. Create App ID: `com.tracementalprecision.app`
3. Generate signing certificates and provisioning profiles
4. Save locally:
   - `ios_distribution.cer`
   - `ios_development.cer`
   - `.mobileprovision` files

**Android:**
1. Create Google Play Developer account at https://play.google.com/console ($25 one-time)
2. Register app bundle: `com.tracementalprecision.app`
3. Generate release keystore:
   ```bash
   keytool -genkey -v -keystore trace_release.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias trace_release_key
   ```

### 0.3 Environment Configuration

Create `.env.production` (do not commit):

```env
# Signing credentials (never shared)
APPLE_TEAM_ID=XXXXXXXXXX
ANDROID_KEYSTORE_PASSWORD=XXXXXXXX

# EAS configuration
EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EAS_BUILD_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXX

# Azure (optional, for guidance feature)
AZURE_OPENAI_KEY=XXXXXXXXXXXXXXXXXXXXXXXX
AZURE_SPEECH_KEY=XXXXXXXXXXXXXXXXXXXXXXXX
```

Add to `.gitignore`:
```
.env.production
trace_release.keystore
*.cer
*.mobileprovision
```

---

## Phase 1: Build Microservices

Build Rust engines as static/shared libraries for each platform.

### 1.1 iOS Production Build

```bash
cd trace-cebe-x-engine
cargo build --release --target aarch64-apple-ios
cp target/aarch64-apple-ios/release/libcebex.a ../ios-frameworks/

cd ../trace-sensing-engine
cargo build --release --target aarch64-apple-ios
cp target/aarch64-apple-ios/release/libtraceimo.a ../ios-frameworks/

cd ../trace-zone-mapper
cargo build --release --target aarch64-apple-ios
cp target/aarch64-apple-ios/release/libzonemap.a ../ios-frameworks/
```

**Output:** `.a` files in `ios-frameworks/` directory

### 1.2 Build Rust Engines for Android

```bash
cd trace-cebe-x-engine
cargo build --release --target aarch64-linux-android
mkdir -p ../android-jniLibs/arm64-v8a
cp target/aarch64-linux-android/release/libcebex.so ../android-jniLibs/arm64-v8a/

cd ../trace-sensing-engine
cargo build --release --target aarch64-linux-android
cp target/aarch64-linux-android/release/libtraceimo.so ../android-jniLibs/arm64-v8a/

cd ../trace-zone-mapper
cargo build --release --target aarch64-linux-android
cp target/aarch64-linux-android/release/libzonemap.so ../android-jniLibs/arm64-v8a/
```

**Output:** `.so` files in `android-jniLibs/arm64-v8a/` directory

### 1.3 Update Native Module Bindings

Update `_utils/services/inference.ts` to load correct native libraries:

```typescript
// src/utils/services/inference.ts
import { NativeModules, Platform } from 'react-native';

const NativeInference = Platform.select({
  ios: NativeModules.TraceInference || require('../../../ios-frameworks/TraceInference.framework'),
  android: NativeModules.TraceInference,
});

export const runInference = async (disruptionEvents: DisruptionEvent[]) => {
  return await NativeInference.rankDisruptions(disruptionEvents);
};
```

### 1.4 Verify Builds

```bash
# Test CEBE-X inference
node -e "require('./_utils/services/inference').testInference()"

# Test Zone Mapper queries
node -e "require('./_utils/services/graph').testQuery()"

# Test IMU processing
node -e "require('./_utils/services/storage').testSensorData()"
```

---

## Phase 2: Configure App

### 2.1 Update `app.json` (Expo Manifest)

```json
{
  "expo": {
    "name": "Trace",
    "slug": "trace-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": false,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": false,
      "bundleIdentifier": "com.tracementalprecision.app",
      "buildNumber": "1",
      "config": {
        "usesNonExemptEncryption": false
      },
      "entitlements": {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.motion": true
      }
    },
    "android": {
      "package": "com.tracementalprecision.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.ACTIVITY_RECOGNITION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Trace needs access to your camera for location verification."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Trace to access your location to map disruption zones."
        }
      ]
    ]
  }
}
```

### 2.2 Update `package.json` Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "build:dev:ios": "eas build --platform ios --profile development",
    "build:dev:android": "eas build --platform android --profile development",
    "build:prod:ios": "eas build --platform ios --profile production",
    "build:prod:android": "eas build --platform android --profile production",
    "submit:ios": "eas submit --platform ios --latest",
    "submit:android": "eas submit --platform android --latest",
    "test": "jest",
    "test:e2e": "detox test e2e --configuration ios.sim.release",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

### 2.3 Create `eas.json` (EAS Build Configuration)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium",
        "image": "latest"
      },
      "android": {
        "resourceClass": "medium",
        "gradleCommand": ":app:bundleRelease"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "XXXXXXXXXXXX"
      },
      "android": {
        "serviceAccount": "google-services.json"
      }
    }
  }
}
```

### 2.4 Update Permissions Configuration

Create `ios/Trace/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSMotionUsageDescription</key>
  <string>Trace uses motion data to detect when your attention was disrupted. This helps us understand where your focus shifted.</string>
  
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>Trace uses location to map the zones where disruptions occurred. This stays on your device.</string>
  
  <key>NSLocalNetworkUsageDescription</key>
  <string>Trace uses local network to detect WiFi networks for environmental fingerprinting.</string>
  
  <key>NSBonjourServiceTypes</key>
  <array>
    <string>_trace._tcp</string>
  </array>
  
  <key>NSHealthShareUsageDescription</key>
  <string>Trace can optionally use health data to improve accuracy of disruption detection.</string>
  
  <key>NSHealthUpdateUsageDescription</key>
  <string>Trace can log disruption events to your health data.</string>
</dict>
</plist>
```

Create `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest ...>
  <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  
  <application ...>
    <service
      android:name=".services.TraceSensorService"
      android:enabled="true"
      android:exported="false" />
  </application>
</manifest>
```

---

## Phase 3: Test Thoroughly

Trace is used by people with early cognitive impairment. Bugs are not acceptable—testing is not optional.

### 3.1 Unit Tests

```bash
npm test -- --coverage

# Expected coverage:
# - _utils/hooks: 90%+
# - _utils/services: 85%+
# - _components: 80%+
```

### 3.2 Integration Tests

```bash
# Test microservice integration
npm run test:integration

# Expected tests:
# ✓ CEBE-X inference integration
# ✓ Zone Mapper query integration
# ✓ IMU Engine data flow
# ✓ State persistence
# ✓ Permission requests
```

### 3.3 Device Testing

```bash
# iOS simulator
npm run ios
# Manual testing on:
# - iPhone 14 Pro (latest)
# - iPhone SE (older device - performance check)
# - iPad Pro (tablet mode)

# Android emulator
npm run android
# Manual testing on:
# - Pixel 6a (target device)
# - Pixel 4 (older device)
# - Samsung Galaxy S20 (different vendor)
```

### 3.4 Performance Profiling

```bash
# Measure:
# - Inference latency: <500ms target
# - Zone Mapper queries: <100ms target
# - Memory footprint: <150MB target
# - Battery drain: <5% per 8 hours idle

# Use Xcode/Android Studio profilers:
# Xcode: Debug > Gauges
# Android Studio: Logcat + Profiler
```

### 3.5 Test Cases

**Onboarding:**
- [ ] Permission requests granted/denied
- [ ] Sensor data permissions
- [ ] Location access (coarse vs fine)
- [ ] Health data integration (optional)

**Core Functionality:**
- [ ] User can ask "Where was I?"
- [ ] Results returned within 2 seconds
- [ ] Confidence scores displayed
- [ ] Zone map visualization loads
- [ ] Timeline scrolling smooth

**Edge Cases:**
- [ ] No disruptions recorded
- [ ] User moved locations during query window
- [ ] Low battery mode active
- [ ] No location services
- [ ] Airplane mode enabled

**Offline Mode:**
- [ ] All features work without internet
- [ ] Optional Azure features disabled gracefully
- [ ] Data syncs when connection restored

---

## Phase 4: Build for Stores

### 4.1 Generate App Icons & Splash Screens

```bash
# Install icon generation tool
npm install -g @expo/cli

# Use Figma template for:
# - Icon: 1024x1024 (transparent background)
# - Splash: 1242x2688 (with safety margins)

# Generate variants:
expo-cli generate-assets
# Outputs:
# - assets/icon.png
# - assets/splash.png
# - assets/adaptive-icon.png (Android)
```

### 4.2 iOS Production Build

```bash
# Prerequisites
eas login
eas build --platform ios --profile production

# This will:
# 1. Configure provisioning profiles
# 2. Build on EAS servers
# 3. Generate .ipa file
# 4. Output: Build URL for TestFlight upload

# Build time: ~15-20 minutes
# Output: trace.ipa (ready for App Store)
```

### 4.3 Android Production Build

```bash
# Prerequisites
eas login

# Build signed APK and AAB
eas build --platform android --profile production

# This will:
# 1. Sign with release keystore
# 2. Generate both APK and AAB
# 3. Build on EAS servers
# 4. Output: trace.aab (for Play Store)

# Build time: ~10-15 minutes
```

### 4.4 Verify Builds Locally (Optional)

```bash
# iOS - requires macOS
npm run build:prod:ios
# Opens Xcode - review code signing

# Android - cross-platform
npm run build:prod:android
# Verifies signing configuration
```

---

## Phase 5: App Store Submission

### 5.1 iOS App Store (TestFlight → Production)

**Step 1: Create App Store Connect Record**

```
1. Visit https://appstoreconnect.apple.com
2. Click "My Apps" → "+"
3. Select "New App"
4. Configure:
   - Platform: iOS
   - App Name: Trace
   - Bundle ID: com.tracementalprecision.app
   - SKU: TRACE-001 (must be unique)
```

**Step 2: Fill Required Metadata**

```
App Information:
├─ App Name: Trace
├─ Subtitle: Find your lost context
├─ Category: Health & Fitness
├─ Privacy Policy URL: https://tracementalprecision.com/privacy
└─ Support URL: https://tracementalprecision.com/support

App Clips: Not needed
Pricing: Free (In-App Purchases: None)
```

**Step 3: Add Screenshots (2-5 per screen)**

Required sizes:
- iPhone: 1242x2688 (6.7") or 1170x2532 (6.1")
- iPad: 2048x2732 or 2732x2048

Example screenshots:
1. Home screen: "Where was I?" query
2. Results: Timeline of disruptions
3. Zone map: Spatial context
4. Behavioral indicators: Motion feedback
5. Settings: Privacy & permissions

**Step 4: Write App Description**

```
Keywords: memory, cognitive impairment, accessibility, independence, context recovery

Description:
"When you get interrupted and lose your train of thought, ask Trace: 
'Where was I?'

Trace detects the moment your attention broke and shows you exactly 
where you were and what you were doing. This helps people with early 
cognitive impairment regain independence and resume their tasks.

Core Features:
• Detects disruption moments from motion patterns
• Shows visual timeline of events  
• Identifies your location during interruption
• Works completely offline—your data stays on your device
• No network required

For people who experience:
✓ Interruptions that strand them
✓ Difficulty remembering what they were doing
✓ Loss of independence when distracted

Trace helps you recover context and get back on track."

Version Release Notes:
"Trace 1.0 - Initial Release

Detects interruptions and guides you back to what you were doing.

Features:
✓ Disruption detection from motion  
✓ Offline operation  
✓ Zone mapping
✓ Privacy-first architecture
✓ Offline operation

Get started: Launch Trace and grant motion permissions 
to begin disruption detection."
```

**Step 5: Content Rating**

Answer questionnaire:
- Violence: None
- Profanity: None
- Adult Content: None
- Gambling: None
- Medical: Yes (health/wellness context recovery)

Rating: 4+

**Step 6: Add Build (from EAS)**

```bash
# Download .ipa from EAS build URL
# In App Store Connect:
# 1. Click "Build" (on app version)
# 2. "Add Build" 
# 3. Select recent build from list
# 4. Set as version being submitted
```

**Step 7: Submission Details**

```
Advertising ID: Not used
Export Compliance: 
  - Contains encryption: Yes (TLS for Azure services)
  - Cryptography: Select "Yes" → standard encryption

Terms & Conditions:
  - Agree to developer agreement
  - Sign and submit
```

**Step 8: Submit for Review**

```
Click "Submit for Review"
Expected review time: 24-48 hours
```

### 5.2 Google Play Store Submission

**Step 1: Create Google Play Store Listing**

```
1. Visit https://play.google.com/console
2. Click "Create app"
3. Configure:
   - App name: Trace
   - Default language: English
   - App category: Health & Fitness
   - App type: Application
```

**Step 2: Fill Required Information**

```
App access:
  - Manage access to app features: No special access

Content rating:
  - Fill questionnaire
  - Categories: Health & Fitness, Productivity
  - Rating: Everyone / PEGI 3

Target audience:
  - Age group: 13+
  - Restrictions: None

Privacy policy:
  - URL: https://tracementalprecision.com/privacy
  - Data collection: Minimal (motion only)
```

**Step 3: Add Screenshots**

Required sizes:
- Phone: 1080x1920 (portrait)
- Tablet: 1280x1800 (portrait)

Minimum: 2 screenshots, Maximum: 8

**Step 4: Upload Build (AAB)**

```bash
# In Play Console:
# 1. Click "Internal testing"
# 2. Upload trace.aab from EAS build
# 3. Set version code & name
# 4. Click "Save"
# 5. Wait for validation (~10 minutes)

# Move to Production:
# 1. Click "Production"
# 2. Select internal build
# 3. Set rollout: 100%
# 4. Review changes
# 5. Click "Review release"
```

**Step 5: Store Listing Details**

```
Title: Trace

Short description (80 chars max):
"Find your lost attention in seconds"

Full description:
"[Same as iOS]"

Feature graphic (1024x500):
- Design showing "Where was I?" concept

Promotional video (optional):
- Show 30-second demo

Promotional images:
- App in use scenarios
- Privacy-first messaging
```

**Step 6: Content Rating Questionnaire**

```
Answer IARC ratings:
  - Violence: No
  - Sexual content: No
  - Profanity: No
  - Alcohol/Tobacco: No
  - Medical: Yes (context recovery)

Resulting rating: PEGI 3
```

**Step 7: Submit for Review**

```
1. Review all information
2. Check "Countries & regions" (all selected)
3. Click "Submit app for review"
4. Expected review time: 24-48 hours
```

---

## Phase 6: Launch & Post-Launch (Week 5+)

### 6.1 Launch Announcement

**Social Media Campaign**

```
Twitter:
"🚀 Trace is now available on iOS & Android!

Find your lost attention in seconds.
Ask "Where was I?" and Trace shows the moment 
your focus shifted.

Privacy-first. Offline. Always.

Download now:
🍎 App Store [link]
🤖 Play Store [link]"

LinkedIn:
"Excited to announce Trace is live!

Built with privacy at its core, Trace uses 
on-device ML to help people recover their 
mental context when they get distracted.

All processing happens locally. No data 
transmission. Just results."

Website:
https://tracementalprecision.com
  - Download buttons
  - Feature tour
  - Privacy policy
  - FAQ
```

### 6.2 Version Release Process

Each update:

```bash
# Increment version
npm run version:patch   # 1.0.0 → 1.0.1
npm run version:minor   # 1.0.0 → 1.1.0
npm run version:major   # 1.0.0 → 2.0.0

# Build & submit
npm run build:prod:ios && npm run build:prod:android
npm run submit:ios
npm run submit:android
```

### 6.3 Continuous Improvement

**Metrics to Track:**
- Daily active users (DAU)
- Query success rate
- Average inference latency
- Battery drain per session
- Crash rate
- User feedback/ratings

**Regular Tasks:**
- [ ] Monitor App Store/Play Store reviews
- [ ] Track analytics dashboard
- [ ] Bug fixes & patches (weekly)
- [ ] Feature updates (monthly)
- [ ] Security updates (as needed)

### 6.4 Monitoring & Analytics

Integrate with:

```typescript
// src/utils/services/analytics.ts
import { Sentry } from "@sentry/react-native";
import { Analytics } from "@react-native-firebase/analytics";

export const trackEvent = async (event: string, data: object) => {
  await Analytics().logEvent(event, data);
};

export const trackError = (error: Error) => {
  Sentry.captureException(error);
};

// Track key metrics
export const trackQueryPerformed = (window_ms: number, result_count: number) => {
  trackEvent("query_performed", { window_ms, result_count });
};

export const trackInferenceLLatency = (latency_ms: number) => {
  trackEvent("inference_latency", { latency_ms });
};
```

---

## Phase 7: Advanced Deployment (Optional, Week 6+)

### 7.1 Over-the-Air Updates (EAS Updates)

```bash
# Configure OTA updates
eas update --branch production --message "Bug fix patch"

# Users get updates without App Store review
# (UI changes only; no native code changes)
```

### 7.2 Server-Side Features (Optional)

If integrating Azure services:

```bash
# Deploy Azure backend
az webapp create -g trace-rg -p trace-asp -n trace-api

# Configure endpoints in .env
AZURE_OPENAI_ENDPOINT=https://trace-openai.openai.azure.com/
AZURE_SPEECH_ENDPOINT=https://trace-speech.tts.speech.microsoft.com/

# Test endpoints
curl https://trace-api.azurewebsites.net/health
```

### 7.3 Beta Testing Program

```bash
# iOS: TestFlight external testers
eas build --platform ios --profile preview
# Send link to beta testers
# Gather feedback for 1-2 weeks before production

# Android: Google Play beta track
# Same build on Play Store with reduced rollout
# Monitor for 1 week before expanding to 100%
```

---

## Checklist: Ready for Store Submission

### Before Building

- [ ] All code committed to git
- [ ] Version bumped in `app.json`
- [ ] All tests passing (`npm test`)
- [ ] No console warnings/errors
- [ ] TypeScript strict mode passing
- [ ] ESLint passing

### Before Submitting iOS

- [ ] App signing certificates configured
- [ ] Provisioning profiles created
- [ ] Privacy Policy URL ready
- [ ] Screenshots captured (5 per device)
- [ ] App description written
- [ ] Release notes prepared
- [ ] Build tested on physical device
- [ ] Notch/safe area handled correctly

### Before Submitting Android

- [ ] Keystore configured
- [ ] Google Play Console account verified
- [ ] Play Console Developer Program payment made
- [ ] Privacy Policy URL ready
- [ ] Screenshots captured (2-8 per size)
- [ ] App description translated if needed
- [ ] Release notes prepared
- [ ] Build tested on multiple devices
- [ ] Permissions minimized (only what's needed)

### Post-Launch Checklist

- [ ] Monitor crashes in Sentry/Firebase
- [ ] Check store review feedback daily
- [ ] Respond to negative reviews professionally
- [ ] Version 1.0.1 patch ready for bugs
- [ ] Analytics dashboard configured
- [ ] Support email monitored
- [ ] Social media notifications sent

---

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 0 | 3-5 days | Setup accounts, certificates, keystores |
| Phase 1 | 3-5 days | Build Rust microservices for platforms |
| Phase 2 | 2-3 days | Configure app, permissions, icons |
| Phase 3 | 3-5 days | Testing on simulators, devices |
| Phase 4 | 2-3 days | Production builds via EAS |
| Phase 5 | 3-5 days | Store submission, review, approval |
| **Total** | **4-5 weeks** | Full launch cycle |

---

## Troubleshooting

### Build Fails: "Rust compilation error"

```bash
# Solution 1: Update Rust
rustup update

# Solution 2: Clean and rebuild
cargo clean
cargo build --release --target aarch64-apple-ios

# Solution 3: Check target installed
rustup target list | grep installed
```

### iOS: "Provisioning profile not found"

```bash
# Regenerate
eas credentials
# Select: Regenerate provisioning profiles
```

### Android: "Keystore signature invalid"

```bash
# Verify keystore exists
ls -la trace_release.keystore

# Confirm alias
keytool -list -v -keystore trace_release.keystore
```

### Store Rejection: "Missing privacy policy"

```
Solution: Add privacy URL to app.json:
"privacy": "https://tracementalprecision.com/privacy"

Privacy policy must cover:
- What data is collected (motion only)
- How it's used (on-device processing)
- What's NOT collected (no location upload)
- User rights (delete data anytime)
```

---

## References

- [Expo Build Services](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [iOS App Distribution](https://developer.apple.com/help/app-store-connect/)
- [Android App Publishing](https://developer.android.com/distribute)

---

**Last Updated:** January 2, 2026  
**Status:** Ready for Phase 0 - Pre-Build Setup
