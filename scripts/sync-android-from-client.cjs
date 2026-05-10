/**
 * Syncs native Android from repo root `client.config.json` (run on `npm install` or `npm run sync:android`).
 *
 * - ANDROID_PACKAGE → `app/build.gradle` namespace + applicationId, and moves
 *   `MainActivity.kt` / `MainApplication.kt` under `android/app/src/main/java/<package path>/`.
 *   Same id as an installed app = Android update. Different id = new app (side-by-side).
 * - APP_DISPLAY_NAME → `strings.xml` app_name, `settings.gradle` rootProject.name
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const clientPath = path.join(root, 'client.config.json');
const stringsPath = path.join(root, 'android/app/src/main/res/values/strings.xml');
const settingsPath = path.join(root, 'android/settings.gradle');
const appBuildGradle = path.join(root, 'android/app/build.gradle');
const javaRoot = path.join(root, 'android/app/src/main/java');

function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeGradleSingleQuoted(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function isValidAndroidPackageId(pkg) {
  return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(pkg);
}

function findKotlinFile(baseDir, fileName) {
  if (!fs.existsSync(baseDir)) {
    return null;
  }
  const stack = [baseDir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        stack.push(p);
      } else if (e.name === fileName) {
        return p;
      }
    }
  }
  return null;
}

function setKotlinPackageLine(source, newPkg) {
  if (/^package\s+[\w.]+\s*\r?\n/m.test(source)) {
    return source.replace(/^package\s+[\w.]+\s*\r?\n/m, `package ${newPkg}\n`);
  }
  return `package ${newPkg}\n\n${source}`;
}

function pruneEmptyDirsFrom(dir) {
  const normJava = path.normalize(javaRoot);
  let d = path.normalize(dir);
  while (d && d.length >= normJava.length && d !== normJava) {
    if (!fs.existsSync(d)) {
      d = path.dirname(d);
      continue;
    }
    let names;
    try {
      names = fs.readdirSync(d);
    } catch {
      break;
    }
    if (names.length === 0) {
      try {
        fs.rmdirSync(d);
      } catch {
        break;
      }
      d = path.dirname(d);
    } else {
      break;
    }
  }
}

if (!fs.existsSync(clientPath)) {
  process.exit(0);
}

const client = JSON.parse(fs.readFileSync(clientPath, 'utf8'));

const androidPkg =
  typeof client.ANDROID_PACKAGE === 'string' && client.ANDROID_PACKAGE.trim()
    ? client.ANDROID_PACKAGE.trim()
    : null;

if (androidPkg && !isValidAndroidPackageId(androidPkg)) {
  console.warn('[sync-android-from-client] ANDROID_PACKAGE looks invalid; skipped:', androidPkg);
}

if (androidPkg && isValidAndroidPackageId(androidPkg) && fs.existsSync(appBuildGradle)) {
  let bg = fs.readFileSync(appBuildGradle, 'utf8');
  const before = bg;
  bg = bg.replace(/namespace\s+'[^']+'/, `namespace '${androidPkg}'`);
  bg = bg.replace(/applicationId\s+'[^']+'/, `applicationId '${androidPkg}'`);
  if (bg !== before) {
    fs.writeFileSync(appBuildGradle, bg, 'utf8');
    console.log('[sync-android-from-client] updated namespace + applicationId in android/app/build.gradle');
  }

  if (fs.existsSync(javaRoot)) {
    const oldMain = findKotlinFile(javaRoot, 'MainActivity.kt');
    const oldApp = findKotlinFile(javaRoot, 'MainApplication.kt');
    if (oldMain && oldApp) {
      const newDir = path.join(javaRoot, ...androidPkg.split('.'));
      const newMain = path.join(newDir, 'MainActivity.kt');
      const newApp = path.join(newDir, 'MainApplication.kt');
      const mainBody = setKotlinPackageLine(fs.readFileSync(oldMain, 'utf8'), androidPkg);
      const appBody = setKotlinPackageLine(fs.readFileSync(oldApp, 'utf8'), androidPkg);
      fs.mkdirSync(newDir, { recursive: true });
      fs.writeFileSync(newMain, mainBody, 'utf8');
      fs.writeFileSync(newApp, appBody, 'utf8');
      const same =
        path.normalize(oldMain) === path.normalize(newMain) &&
        path.normalize(oldApp) === path.normalize(newApp);
      if (!same) {
        fs.unlinkSync(oldMain);
        fs.unlinkSync(oldApp);
        pruneEmptyDirsFrom(path.dirname(oldMain));
        if (path.dirname(oldApp) !== path.dirname(oldMain)) {
          pruneEmptyDirsFrom(path.dirname(oldApp));
        }
        console.log('[sync-android-from-client] moved Kotlin to', path.relative(root, newDir));
      } else {
        console.log('[sync-android-from-client] refreshed Kotlin package line (same path)');
      }
    } else {
      console.warn(
        '[sync-android-from-client] MainActivity.kt / MainApplication.kt not found under',
        path.relative(root, javaRoot),
        '— skipped Kotlin move',
      );
    }
  }
}

const name = client.APP_DISPLAY_NAME;
if (typeof name === 'string' && name.trim()) {
  const escaped = escapeXmlText(name.trim());

  if (fs.existsSync(stringsPath)) {
    let xml = fs.readFileSync(stringsPath, 'utf8');
    if (!/<string name="app_name">/.test(xml)) {
      console.warn('[sync-android-from-client] app_name string not found; skip strings.xml');
    } else {
      xml = xml.replace(
        /<string name="app_name">[^<]*<\/string>/,
        `<string name="app_name">${escaped}</string>`,
      );
      fs.writeFileSync(stringsPath, xml, 'utf8');
      console.log('[sync-android-from-client] updated android/app/.../strings.xml');
    }
  }

  if (fs.existsSync(settingsPath)) {
    let gradle = fs.readFileSync(settingsPath, 'utf8');
    const g = escapeGradleSingleQuoted(name.trim());
    if (/rootProject\.name\s*=/.test(gradle)) {
      gradle = gradle.replace(/rootProject\.name\s*=\s*'[^']*'/, `rootProject.name = '${g}'`);
      fs.writeFileSync(settingsPath, gradle, 'utf8');
      console.log('[sync-android-from-client] updated android/settings.gradle rootProject.name');
    }
  }
} else {
  console.warn('[sync-android-from-client] APP_DISPLAY_NAME missing; skipped label sync');
}
