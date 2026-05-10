# Google Play & production release — Subhchandra Organics (Expo)

This document is the operational companion to the managed Expo WebView app. Replace placeholder package names, signing keys, and URLs with your production values.

---

## 1. Final folder structure (release-relevant)

```
subhchandra-webview/
├── app.config.ts              # Dynamic Expo config (version from package.json, SDK targets)
├── eas.json                   # EAS Build / Submit profiles
├── package.json               # version = Play "Version name"
├── docs/
│   └── PLAY_STORE_AND_RELEASE.md
└── src/
    ├── hooks/
    │   ├── useAppResumeEffect.ts
    │   ├── useWebViewLoadTimeout.ts
    │   └── ...
    └── utils/
        ├── errorMessages.ts
        ├── logger.ts
        ├── navigationPolicy.ts
        └── redirectLoopGuard.ts
```

---

## 2. Production app configuration (summary)

| Item                  | Where                                            | Notes                                                                                             |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| App display name      | `app.config.ts` → `name`                         | Shown in launcher                                                                                 |
| Android applicationId | `app.config.ts` → `android.package`              | **Must match Play Console**                                                                       |
| Version name (semver) | `package.json` → `version`                       | Sync with `app.config.ts` via import                                                              |
| Version code          | `app.config.ts` → `android.versionCode` baseline | **EAS `autoIncrement`** bumps on each production build                                            |
| Target / compile SDK  | `expo-build-properties` in `app.config.ts`       | `targetSdkVersion` / `compileSdkVersion` **35** (Play policy; verify current Google requirements) |
| Min SDK               | `minSdkVersion` **24**                           | Adjust only if you must support older devices                                                     |
| Permissions           | `android.permissions`                            | **INTERNET**, **ACCESS_NETWORK_STATE** only (minimal surface)                                     |
| Icons                 | `icon`, `android.adaptiveIcon`                   | 1024×1024 master; adaptive foreground safe zone                                                   |
| Splash                | `splash` + `expo-splash-screen` plugin           | Keep background consistent with shell color                                                       |
| Status / nav bar      | `android.statusBar`, `android.navigationBar`     | Edge-to-edge: test on Android 14–15 devices                                                       |

Environment override for CI:

```bash
set ANDROID_VERSION_CODE=42
```

(Unix: `export ANDROID_VERSION_CODE=42`)

---

## 3. EAS CLI — install, login, link project

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Login

```bash
eas login
```

### Link repository to Expo / EAS

From the project root:

```bash
cd path/to/subhchandra-webview
eas init
```

Follow prompts to create or link an Expo project. This writes `extra.eas.projectId` into `app.config.ts` (or you can paste it under `extra.eas`).

### Verify config

```bash
npx expo config --type public
```

---

## 4. Build commands

| Goal                  | Command                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| **Internal / QA APK** | `npm run build:apk` → `eas build --platform android --profile preview`    |
| **Play Store AAB**    | `npm run build:aab` → `eas build --platform android --profile production` |
| **Dev client**        | `npm run build:dev`                                                       |
| **Local native run**  | `npx expo run:android` (after credentials / device setup)                 |

Non-interactive CI (after first login & secrets):

```bash
eas build --platform android --profile production --non-interactive
```

`eas.json` uses:

- **preview**: APK, `channel: preview`
- **production**: AAB, `autoIncrement: true`, `channel: production`
- **appVersionSource: local** — version name comes from your repo (`package.json` / `app.config.ts`)

---

## 5. Submit commands (Play Store)

1. Create a **Google Play Console** API service account JSON with release permissions.
2. Store it **outside git** (e.g. `~/secrets/play-api.json`).
3. Point EAS Submit at it (first time often interactive):

```bash
eas submit --platform android --latest
```

Or use npm scripts (uses profiles from `eas.json`):

```bash
npm run submit:internal    # track: internal
npm run submit:play        # track: production
```

Configure `serviceAccountKeyPath` via EAS credentials or submit prompts; do not commit keys.

---

## 6. Updates (optional OTA)

This project does **not** bundle `expo-updates` by default (keeps the binary minimal). To ship JS-only updates:

1. `npx expo install expo-updates`
2. Configure `runtimeVersion` / `updates.url` per Expo docs
3. `eas update --branch production`

WebView + native dependency changes still require a **new store build**.

---

## 7. Google Play — release checklist

### Must complete before production rollout

- [ ] **Unique package name** registered in Play Console; matches `android.package`
- [ ] **Signing**: Play App Signing enabled; upload key managed via EAS or Play
- [ ] **versionCode** strictly increases every upload (`autoIncrement` helps)
- [ ] **Privacy policy URL** (required for apps handling user data / accounts — WebView loads your site; disclose what the **app** and **site** collect)
- [ ] **Data safety form** completed honestly (cookies, payment data, crash logs if any)
- [ ] **Content rating** questionnaire (IARC)
- [ ] **Target API level** meets Google deadline (verify against current Play policy; project targets SDK 35 in config)
- [ ] **Store listing**: title, short/full description, icon, feature graphic, phone screenshots (and tablet if required)
- [ ] **Test**: internal / closed track with **release** build (not Expo Go) — especially **checkout**, **back**, **resume from wallet app**

### Store assets (typical)

- **Icon**: 512×512 (Play); source 1024×1024 for generation
- **Feature graphic**: 1024×500
- **Screenshots**: phone (required), 7" / 10" tablet if you claim tablet support
- **Short description**: ≤80 chars

### Common rejection / review causes

- Misleading metadata or missing privacy policy for login / payments
- **Version code** regression or duplicate
- **Target SDK** below Play requirement
- Broken **billing / login** in production track testing
- **Data safety** inconsistent with actual behavior (e.g. declaring no data when cookies / payments exist)
- **WebView** apps flagged if they look like a thin wrapper around a site without added value — ensure policy-compliant listing and a clear user benefit

---

## 8. WebView / release debugging

- **Dev**: rely on `logInfo` / `logWarn` in `src/utils/logger.ts` (`__DEV__` only).
- **Release APK testing**: Android **Logcat** filtered by app package; reproduce on device.
- **Chrome remote debugging**: `chrome://inspect` → WebView (debuggable builds).
- **Common issues**: SSL MITM proxies, stale DNS, `intent://` wallet not installed, redirect loops (guarded in app), process death (`onRenderProcessGone` reloads).

---

## 9. Security review (practical)

- **URL policy**: `resolveNavigation` + origin whitelist; `file:` blocked; `javascript:` allowed (required for many SPAs — supply-chain risk is mainly on **your website**)
- **Mixed content**: `mixedContentMode: compatibility` — prefer **HTTPS-only** on the server
- **External links**: HTTPS opens in **Custom Tabs** when possible; intents use `Linking`
- **Permissions**: minimal (network only)
- **Third-party cookies**: enabled for payment / session realism — aligns with merchant site needs; disclose in Data safety

---

## 10. Release notes template (1.0.0 example)

```text
Subhchandra Organics — initial Play release

- Browse and shop at subhchandraorganics.com in a fast, secure in-app experience
- Reliable checkout flows with external wallet / browser support where needed
- Offline detection, error recovery, and pull-to-refresh
- Android back navigation with exit confirmation

Security: HTTPS-only merchant content; minimal Android permissions.
```

Adjust per actual shipped features.

---

## 11. Common deployment mistakes

1. Forgetting to bump **`versionCode`** (mitigated by EAS `autoIncrement`)
2. **`applicationId` mismatch** between Expo and Play Console
3. Testing only in **Expo Go** instead of a **release** binary
4. Shipping **debug** credentials or API keys in the repo
5. **Auto-reloading WebView on every app resume** (breaks payments) — this app avoids that; only connectivity recovery reloads after offline
6. Over-declaring or under-declaring **Data safety**
7. Missing **privacy policy** link for account / payment flows

---

## 12. Production recommendations

- Run **internal track** for 24–48h with real **UPI / card** tests
- Monitor Play **pre-launch reports** and **ANRs**
- Keep `PAYMENT_HOST_PATTERNS` / `AUTH_HOST_PATTERNS` in `src/constants/config.ts` aligned with real checkout domains
- Re-verify **targetSdk** / **policy** quarterly — Android requirements change
