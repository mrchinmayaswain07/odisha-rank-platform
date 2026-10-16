# OdishaRank Mobile Application (React Native & Expo)

The native mobile application for the OdishaRank competitive exam preparation platform, built with **React Native**, **Expo SDK 51**, and **Expo Router**.

---

## 1. Quick Start

### Prerequisites
- Node.js `v18+` or `v20+` (verified with Node `v24.20.0` and npm `11.19.0`)
- Expo Go app on Android/iOS or an Android Emulator

### Installation & Run
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies (if not already installed)
npm install

# Start the Expo development server
npm start
```

### Running on Android Device / Emulator
```bash
npm run android
```

---

## 2. Environment Variables

Create a `mobile/.env.local` file with your public Supabase client credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Security Note:** Never add `SUPABASE_SERVICE_ROLE_KEY` to the mobile project. Client operations rely on Supabase Row Level Security (RLS) policies.

---

## 3. Deep Linking & Authentication Callback

- **App Scheme:** `odisharank://`
- **Supported Deep Links:**
  - `odisharank://auth/callback` (Email verification)
  - `odisharank://reset-password` (Password reset)
  - `https://odisharank.vercel.app/auth/*` (Universal links on Android/iOS)

---

## 4. Android Build Workflows (EAS Build)

### 1. Build Android APK (For Sideloading & Internal Testing)
```bash
npx eas-cli build --platform android --profile preview
```
This builds an installable `.apk` file that can be distributed directly to testers.

### 2. Build Android App Bundle (AAB - For Google Play Store)
```bash
npx eas-cli build --platform android --profile production
```
This produces an optimized `.aab` archive ready for upload to the Google Play Console.

---

## 5. Over-the-Air (OTA) Updates vs Native Builds

- **OTA Updates (`eas update`):** Can be used for JavaScript/TypeScript code changes, React components, styling adjustments, bug fixes, and API integration updates.
- **New Native Builds Required:** Required when modifying native dependencies, updating Expo SDK version, modifying `app.json` intent filters or permissions, or changing native app icons.
