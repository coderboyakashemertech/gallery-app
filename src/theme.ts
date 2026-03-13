import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

const sharedTheme = {
  roundness: 6,
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  ...sharedTheme,
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

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  ...sharedTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#87d8bd',
    onPrimary: '#00382b',
    primaryContainer: '#01513f',
    onPrimaryContainer: '#a2f4d7',
    secondary: '#e2c85d',
    onSecondary: '#3a3000',
    secondaryContainer: '#554600',
    onSecondaryContainer: '#ffea9b',
    background: '#111613',
    onBackground: '#e1e4dd',
    surface: '#181d1a',
    onSurface: '#e1e4dd',
    surfaceVariant: '#414941',
    onSurfaceVariant: '#c1c9bf',
    outline: '#8b9389',
  },
};

export function getPaperTheme(isDarkMode: boolean) {
  return isDarkMode ? darkTheme : lightTheme;
}

export function getNavigationTheme(isDarkMode: boolean): NavigationTheme {
  const baseTheme = isDarkMode ? NavigationDarkTheme : NavigationLightTheme;
  const paperTheme = getPaperTheme(isDarkMode);

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: paperTheme.colors.background,
      border: paperTheme.colors.outline,
      card: paperTheme.colors.surface,
      notification: paperTheme.colors.primary,
      primary: paperTheme.colors.primary,
      text: paperTheme.colors.onSurface,
    },
  };
}
