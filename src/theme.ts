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

const lightPalette = {
  primary: '#435dd8',
  onPrimary: '#ffffff',
  primaryContainer: '#dfe4ff',
  onPrimaryContainer: '#111b45',
  secondary: '#566071',
  onSecondary: '#ffffff',
  secondaryContainer: '#dae2f1',
  onSecondaryContainer: '#131c29',
  tertiary: '#2d695b',
  onTertiary: '#ffffff',
  tertiaryContainer: '#bfeee0',
  onTertiaryContainer: '#06201a',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
  background: '#f7f8fc',
  onBackground: '#171b23',
  surface: '#ffffff',
  onSurface: '#171b23',
  surfaceVariant: '#e1e6f0',
  onSurfaceVariant: '#434a58',
  outline: '#737b8a',
  outlineVariant: '#c3c8d3',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2c3139',
  inverseOnSurface: '#eef1f8',
  inversePrimary: '#b8c7ff',
  surfaceTint: '#435dd8',
  elevation: {
    level0: 'transparent',
    level1: '#f2f4fb',
    level2: '#edf0f8',
    level3: '#e7ebf5',
    level4: '#e2e6f2',
    level5: '#dde2ef',
  },
};

const darkPalette = {
  primary: '#b8c7ff',
  onPrimary: '#0d1848',
  primaryContainer: '#2f427f',
  onPrimaryContainer: '#dfe4ff',
  secondary: '#c1c7d7',
  onSecondary: '#283140',
  secondaryContainer: '#3a4352',
  onSecondaryContainer: '#dde4f3',
  tertiary: '#96d8c7',
  onTertiary: '#0f2a23',
  tertiaryContainer: '#26483f',
  onTertiaryContainer: '#cff4e8',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  background: '#11131a',
  onBackground: '#eceff7',
  surface: '#191c24',
  onSurface: '#eceff7',
  surfaceVariant: '#2a2f3a',
  onSurfaceVariant: '#c1c6d2',
  outline: '#8b919f',
  outlineVariant: '#414754',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#eceff7',
  inverseOnSurface: '#2c3038',
  inversePrimary: '#435dd8',
  surfaceTint: '#b8c7ff',
  elevation: {
    level0: 'transparent',
    level1: '#20242d',
    level2: '#262a34',
    level3: '#2c303b',
    level4: '#313643',
    level5: '#373c4b',
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  ...sharedTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    ...lightPalette,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  ...sharedTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkPalette,
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
    dark: isDarkMode,
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
