/**
 * `adb install -r` the newest `.apk` under `android/app/build/outputs/apk/release/`.
 * Resolves `adb` from ANDROID_HOME / ANDROID_SDK_ROOT / default Windows SDK path
 * when `adb` is not on PATH.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release');

if (!fs.existsSync(releaseDir)) {
  console.error('[install-release-apk] No release output folder. Run: npm run android:release');
  process.exit(1);
}

const apks = fs
  .readdirSync(releaseDir)
  .filter((f) => f.endsWith('.apk'))
  .map((f) => ({
    name: f,
    full: path.join(releaseDir, f),
    mtime: fs.statSync(path.join(releaseDir, f)).mtimeMs,
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (!apks.length) {
  console.error('[install-release-apk] No .apk in release folder. Run: npm run android:release');
  process.exit(1);
}

const apk = apks[0].full;
console.log('[install-release-apk]', path.relative(path.join(__dirname, '..'), apk));

const isWin = process.platform === 'win32';
const adbExe = isWin ? 'adb.exe' : 'adb';

/** @returns {string | undefined} absolute path to adb, if found on disk */
function resolveAdbFromSdk() {
  const fromAdb = process.env.ADB?.trim();
  if (fromAdb) {
    if (fs.existsSync(fromAdb) && fs.statSync(fromAdb).isFile()) {
      return path.resolve(fromAdb);
    }
    const inPlatformTools = path.join(fromAdb, adbExe);
    if (fs.existsSync(inPlatformTools)) {
      return path.resolve(inPlatformTools);
    }
  }

  const roots = new Set();
  for (const k of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) {
    const v = process.env[k]?.trim();
    if (v) {
      roots.add(path.resolve(v));
    }
  }
  if (isWin) {
    if (process.env.LOCALAPPDATA) {
      roots.add(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
    }
    if (process.env.USERPROFILE) {
      roots.add(path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk'));
    }
  } else {
    const home = process.env.HOME;
    if (home) {
      roots.add(path.join(home, 'Library', 'Android', 'sdk'));
      roots.add(path.join(home, 'Android', 'Sdk'));
    }
  }

  for (const root of roots) {
    const candidate = path.join(root, 'platform-tools', adbExe);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function printAdbHelp() {
  console.error('[install-release-apk] adb not found.');
  console.error('  Install Android SDK Platform-Tools, then either:');
  console.error('  - Add <SDK>\\platform-tools to your PATH, or');
  console.error('  - Set ANDROID_HOME (or ANDROID_SDK_ROOT) to the SDK folder, e.g. on Windows:');
  console.error('      %LOCALAPPDATA%\\Android\\Sdk');
  console.error('  - Or set ADB to the full path of adb.exe (or to the platform-tools folder).');
}

const sdkAdb = resolveAdbFromSdk();
const tryPaths = sdkAdb ? [sdkAdb] : [];
tryPaths.push(adbExe);

let lastErr;
for (const adbPath of tryPaths) {
  try {
    execFileSync(adbPath, ['install', '-r', apk], { stdio: 'inherit', env: process.env });
    process.exit(0);
  } catch (e) {
    lastErr = e;
    if (e.code !== 'ENOENT') {
      process.exit(e.status ?? 1);
    }
  }
}

printAdbHelp();
if (lastErr && lastErr.message) {
  console.error(lastErr.message);
}
process.exit(1);
