/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import 'react-native-gesture-handler/jestSetup';

jest.mock('../src/store', () => {
  return {
    store: {
      getState: () => ({
        gallery: {
          featuredCount: 12,
          welcomeMessage: 'Test welcome message',
        },
      }),
      subscribe: () => () => {},
      dispatch: jest.fn(),
    },
  };
});

jest.mock('../src/navigation/DrawerNavigator', () => {
  const mockReact = require('react');
  const { Text } = require('react-native');

  return {
    DrawerNavigator: () => mockReact.createElement(Text, null, 'Drawer Ready'),
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
