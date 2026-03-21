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
  roundness: 10,
};

const appPalette = {
  primary: '#8aa4ff',
  onPrimary: '#10131c',
  primaryContainer: '#2c3550',
  onPrimaryContainer: '#dbe3ff',
  secondary: '#c7ced9',
  onSecondary: '#1b1f28',
  secondaryContainer: '#313744',
  onSecondaryContainer: '#e3e8f1',
  tertiary: '#8fd4c1',
  onTertiary: '#12201d',
  tertiaryContainer: '#253b37',
  onTertiaryContainer: '#ccefe5',
  error: '#ffb4ab',
  onError: '#3b0907',
  errorContainer: '#5c1511',
  onErrorContainer: '#ffdad5',
  background: '#181a20',
  onBackground: '#f3f4f6',
  surface: '#232329',
  onSurface: '#f3f4f6',
  surfaceVariant: '#2c2f38',
  onSurfaceVariant: '#aeb4bf',
  outline: '#454b57',
  outlineVariant: '#343944',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#f3f4f6',
  inverseOnSurface: '#181a20',
  inversePrimary: '#43527e',
  elevation: {
    level0: 'transparent',
    level1: '#232329',
    level2: '#272a31',
    level3: '#2b2f37',
    level4: '#30343d',
    level5: '#343944',
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  ...sharedTheme,
  dark: true,
  colors: {
    ...MD3LightTheme.colors,
    ...appPalette,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  ...sharedTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...appPalette,
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
    dark: true,
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
