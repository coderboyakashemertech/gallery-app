import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { store, persistor, useAppSelector } from './src/store';
import { getNavigationTheme, getPaperTheme } from './src/theme';
import { ensureAndroidStoragePermission } from './src/utils/storagePermissions';

const rootStyle = { flex: 1 } as const;

function App() {
  return (
    <GestureHandlerRootView style={rootStyle}>
      <Provider store={store}>
        <PersistGate loading={<SplashScreen />} persistor={persistor}>
          <AppProviders />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

function AppProviders() {
  const isDarkMode = useAppSelector(state => state.preferences.isDarkMode);
  const isAuthenticated = useAppSelector(state => Boolean(state.auth.token));
  const paperTheme = getPaperTheme(isDarkMode);
  const navigationTheme = getNavigationTheme(isDarkMode);

  useEffect(() => {
    ensureAndroidStoragePermission().catch(error => {
      console.warn('Storage permission request failed:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar
          backgroundColor={paperTheme.colors.background}
          barStyle={paperTheme.dark ? 'light-content' : 'dark-content'}
        />
        <NavigationContainer theme={navigationTheme}>
          {isAuthenticated ? <DrawerNavigator /> : <AuthScreen />}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
