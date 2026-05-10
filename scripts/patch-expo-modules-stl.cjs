/**
 * After `npm install`, ensure expo-modules-core links libc++_shared (Windows + NDK 27 / RN New Arch).
 * Safe to run repeatedly; no-op if already patched.
 */
const fs = require('fs');
const path = require('path');

// #region agent log
const logPath = path.join(__dirname, '..', 'debug-442bae.log');
function agentLog(hypothesisId, message, data) {
  const line =
    JSON.stringify({
      sessionId: '442bae',
      hypothesisId,
      location: 'scripts/patch-expo-modules-stl.cjs',
      message,
      data: data || {},
      timestamp: Date.now(),
    }) + '\n';
  try {
    fs.appendFileSync(logPath, line, 'utf8');
  } catch (_) {}
}
// #endregion

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android',
  'cmake',
  'main.cmake',
);

const marker = '_expo_modules_cpp_shared';

if (!fs.existsSync(file)) {
  // #region agent log
  agentLog('H-post', 'expo main.cmake missing (install incomplete?)', { file });
  // #endregion
  process.exit(0);
}

let s = fs.readFileSync(file, 'utf8');
if (s.includes(marker)) {
  // #region agent log
  agentLog('H-post', 'already patched', { marker });
  // #endregion
  process.exit(0);
}

const block = `
# Windows + NDK 27: libexpo-modules-core.so link can omit libc++_shared; link explicitly.
find_library(_expo_modules_cpp_shared c++_shared)
if(_expo_modules_cpp_shared)
  target_link_libraries(expo-modules-core PRIVATE \${_expo_modules_cpp_shared})
endif()
`;

if (!s.trimEnd().endsWith('endif ()')) {
  // #region agent log
  agentLog('H-stl', 'unexpected main.cmake tail; skip patch', {
    tailPreview: s.slice(-120).replace(/\s+/g, ' '),
  });
  // #endregion
  console.warn('[patch-expo-modules-stl] unexpected main.cmake tail; skip');
  process.exit(0);
}

fs.writeFileSync(file, s.trimEnd() + '\n' + block, 'utf8');
// #region agent log
agentLog('H-stl', 'patched expo-modules-core main.cmake', { bytesWritten: fs.statSync(file).size });
// #endregion
console.log('[patch-expo-modules-stl] appended libc++_shared link to expo-modules-core');
