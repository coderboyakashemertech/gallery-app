import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DrawerNavigator } from './src/navigation/DrawerNavigator';
import { store } from './src/store';
import { appTheme } from './src/theme';

const rootStyle = { flex: 1 } as const;

function App() {
  return (
    <GestureHandlerRootView style={rootStyle}>
      <Provider store={store}>
        <SafeAreaProvider>
          <PaperProvider theme={appTheme}>
            <StatusBar
              backgroundColor={appTheme.colors.surface}
              barStyle="dark-content"
            />
            <DrawerNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
