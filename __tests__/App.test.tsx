/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import 'react-native-gesture-handler/jestSetup';

jest.mock('@env', () => ({
  APP_ENV: 'test',
  LOCAL_API_BASE_URL_ANDROID: 'http://10.0.2.2:3000',
  LOCAL_API_BASE_URL_IOS: 'http://127.0.0.1:3000',
  LOCAL_API_BASE_URL_DEFAULT: 'http://127.0.0.1:3000',
  PROD_API_BASE_URL_ANDROID: 'https://api.example.com',
  PROD_API_BASE_URL_IOS: 'https://api.example.com',
  PROD_API_BASE_URL_DEFAULT: 'https://api.example.com',
}), { virtual: true });

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('@react-navigation/drawer', () => {
  return {
    createDrawerNavigator: () => {
      const Navigator = ({ children }: { children: React.ReactNode }) => children;
      const Screen = ({ children }: { children?: React.ReactNode }) => children ?? null;
      return { Navigator, Screen };
    },
    DrawerContentScrollView: ({ children }: { children: React.ReactNode }) => children,
    DrawerItemList: () => null,
  };
});

jest.mock('../src/store', () => {
  const mockState = {
    auth: {
      token: null,
    },
    preferences: {
      apiEnvironment: 'local',
      isDarkMode: false,
    },
  };

  return {
    persistor: {
      dispatch: jest.fn(),
      getState: () => ({ bootstrapped: true }),
      subscribe: () => () => {},
    },
    store: {
      getState: () => mockState,
      subscribe: () => () => {},
      dispatch: jest.fn(),
    },
    useAppSelector: (selector: (state: typeof mockState) => unknown) =>
      selector(mockState),
  };
});

jest.mock('../src/screens/AuthScreen', () => {
  const { Text } = require('react-native');

  return {
    AuthScreen: () => <Text>Auth Ready</Text>,
  };
});

jest.mock('../src/navigation/DrawerNavigator', () => {
  const { Text } = require('react-native');

  return {
    DrawerNavigator: () => <Text>Drawer Ready</Text>,
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
