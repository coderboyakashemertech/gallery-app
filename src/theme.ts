import { MD3LightTheme } from 'react-native-paper';

export const appTheme = {
  ...MD3LightTheme,
  roundness: 6,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1f6f5b',
    onPrimary: '#ffffff',
    primaryContainer: '#c9f0df',
    onPrimaryContainer: '#002019',
    secondary: '#6f5f17',
    onSecondary: '#ffffff',
    secondaryContainer: '#f9e287',
    onSecondaryContainer: '#221b00',
    background: '#f6f3ea',
    onBackground: '#1b1c18',
    surface: '#fffdf7',
    onSurface: '#1b1c18',
    surfaceVariant: '#dde5db',
    onSurfaceVariant: '#414941',
    outline: '#727970',
  },
};
