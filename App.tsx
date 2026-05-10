import { StatusBar } from 'expo-status-bar';

import { WebShellScreen } from './src/screens/WebShellScreen';

export default function App() {
  return (
    <>
      <WebShellScreen />
      <StatusBar style="dark" />
    </>
  );
}
