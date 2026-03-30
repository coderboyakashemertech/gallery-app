import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';

import { ApiEnvironmentSelector } from '../../components/ApiEnvironmentSelector';
import type { ApiEnvironment } from '../../config/api';
import { authApi } from '../../store/authApi';
import { logout } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setApiEnvironment,
  toggleDarkMode,
} from '../../store/preferencesSlice';
import { AuthLayout } from './AuthLayout';

type Props = {
  onBack: () => void;
};

export function AuthSettingsScreen({ onBack }: Props) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const apiEnvironment = useAppSelector(
    state => state.preferences.apiEnvironment,
  );
  const isDarkMode = useAppSelector(state => state.preferences.isDarkMode);

  const onChangeApiEnvironment = (nextEnvironment: ApiEnvironment) => {
    if (nextEnvironment === apiEnvironment) {
      return;
    }

    dispatch(setApiEnvironment(nextEnvironment));
    dispatch(logout());
    dispatch(authApi.util.resetApiState());
  };

  return (
    <AuthLayout
      onBack={onBack}
      subtitle="Adjust the app appearance before you sign in."
      title="Settings"
    >
      <View
        style={[
          styles.preferenceCard,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        <View style={styles.preferenceCopy}>
          <Text
            variant="titleMedium"
            style={[styles.preferenceTitle, { color: theme.colors.onSurface }]}
          >
            Dark mode
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.preferenceDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Switch between light and dark appearance while you are on the auth
            screens.
          </Text>
          <Text
            variant="labelMedium"
            style={[styles.preferenceStatus, { color: theme.colors.primary }]}
          >
            Current mode: {isDarkMode ? 'Dark' : 'Light'}
          </Text>
        </View>

        <Switch
          accessibilityLabel="Toggle dark mode"
          value={isDarkMode}
          onValueChange={() => {
            dispatch(toggleDarkMode());
          }}
        />
      </View>

      <ApiEnvironmentSelector
        apiEnvironment={apiEnvironment}
        onChange={onChangeApiEnvironment}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  preferenceCard: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  preferenceCopy: {
    flex: 1,
    gap: 6,
  },
  preferenceDescription: {
    lineHeight: 20,
  },
  preferenceStatus: {
    fontWeight: '700',
  },
  preferenceTitle: {
    fontWeight: '700',
  },
});
