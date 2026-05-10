/**
 * Runs `gradlew assembleRelease` from `android/` (Windows: gradlew.bat, else ./gradlew).
 */
const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const isWin = process.platform === 'win32';
const gradle = isWin ? 'gradlew.bat' : './gradlew';

execSync(`${gradle} assembleRelease`, {
  cwd: androidDir,
  stdio: 'inherit',
  env: process.env,
});
