import type { ComponentProps } from 'react';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AtSign, ShieldCheck, UserRound } from 'lucide-react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  List,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import FastImage from 'react-native-fast-image';

import { ApiEnvironmentSelector } from '../components/ApiEnvironmentSelector';
import { FormMessage } from '../components/FormMessage';
import { LucideIcon } from '../components/LucideIcon';
import { Screen } from '../components/Screen';
import type { ApiEnvironment } from '../config/api';
import {
  authApi,
  useBeginTwoFactorSetupMutation,
  useDisableTwoFactorMutation,
  useGetProfileQuery,
  useVerifyTwoFactorSetupMutation,
} from '../store/authApi';
import { clearAuthError, logout } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setApiEnvironment,
  toggleDarkMode,
} from '../store/preferencesSlice';

type ListIconProps = Omit<ComponentProps<typeof List.Icon>, 'icon'>;

function renderAccountIcon(props: ListIconProps) {
  return (
    <View style={[styles.listIconWrap, props.style]}>
      <LucideIcon color={props.color} icon={UserRound} size={20} />
    </View>
  );
}

function renderUsernameIcon(props: ListIconProps) {
  return (
    <View style={[styles.listIconWrap, props.style]}>
      <LucideIcon color={props.color} icon={AtSign} size={20} />
    </View>
  );
}

function renderShieldIcon(props: ListIconProps) {
  return (
    <View style={[styles.listIconWrap, props.style]}>
      <LucideIcon color={props.color} icon={ShieldCheck} size={20} />
    </View>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { error, requestStatus, twoFactorSetup, user } = useAppSelector(
    state => state.auth,
  );
  const token = useAppSelector(state => state.auth.token);
  const apiEnvironment = useAppSelector(
    state => state.preferences.apiEnvironment,
  );
  const isDarkMode = useAppSelector(state => state.preferences.isDarkMode);
  const [enableOtp, setEnableOtp] = useState('');
  const [disableOtp, setDisableOtp] = useState('');
  const { refetch } = useGetProfileQuery(undefined, {
    skip: !token,
  });
  const [beginTwoFactorSetup] = useBeginTwoFactorSetupMutation();
  const [verifyTwoFactorSetup] = useVerifyTwoFactorSetupMutation();
  const [disableTwoFactor] = useDisableTwoFactorMutation();
  const isBusy = requestStatus === 'loading';

  const onStart2FA = async () => {
    dispatch(clearAuthError());
    setEnableOtp('');
    await beginTwoFactorSetup().unwrap();
  };

  const onVerify2FA = async () => {
    dispatch(clearAuthError());
    await verifyTwoFactorSetup({ otp: enableOtp }).unwrap();
  };

  const onDisable2FA = async () => {
    dispatch(clearAuthError());
    await disableTwoFactor({ otp: disableOtp }).unwrap();
  };

  const onLogout = () => {
    dispatch(logout());
    dispatch(authApi.util.resetApiState());
  };

  const onRefreshProfile = () => {
    refetch().catch(() => { });
  };

  const onPressStart2FA = () => {
    onStart2FA().catch(() => { });
  };

  const onPressVerify2FA = () => {
    onVerify2FA().catch(err => {
      console.log(err);
    });
  };

  const onPressDisable2FA = () => {
    onDisable2FA().catch(() => { });
  };

  const onChangeApiEnvironment = (nextEnvironment: ApiEnvironment) => {
    if (nextEnvironment === apiEnvironment) {
      return;
    }

    dispatch(setApiEnvironment(nextEnvironment));
    dispatch(logout());
    dispatch(authApi.util.resetApiState());
  };

  return (
    <Screen>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
            Settings
          </Text>
          <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
            Manage your account preferences and security settings.
          </Text>
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            Appearance
          </Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="bodyLarge">Dark mode</Text>
              <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                Adjust the app's visual theme.
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={() => {
                dispatch(toggleDarkMode());
              }}
            />
          </View>
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <ApiEnvironmentSelector
            apiEnvironment={apiEnvironment}
            onChange={onChangeApiEnvironment}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            Profile
          </Text>
          <List.Item
            title={user?.name ?? 'Unknown user'}
            description="Display name"
            left={renderAccountIcon}
            titleStyle={{ fontWeight: '600' }}
          />
          <Divider />
          <List.Item
            title={user?.username ?? '-'}
            description="Username"
            left={renderUsernameIcon}
            titleStyle={{ fontWeight: '600' }}
          />
          <Divider />
          <List.Item
            title={user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            description="Two-factor authentication"
            left={renderShieldIcon}
            titleStyle={{ fontWeight: '600' }}
          />
          <Button
            mode="outlined"
            onPress={onRefreshProfile}
            disabled={isBusy}
            style={{ borderRadius: 12 }}
          >
            Refresh profile
          </Button>
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            Security (2FA)
          </Text>
          {!user?.twoFactorEnabled ? (
            <>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                Enhance your account security by enabling Two-Factor
                Authentication.
              </Text>
              <Button
                mode="contained"
                onPress={onPressStart2FA}
                disabled={isBusy}
                style={{ borderRadius: 12 }}
              >
                Start 2FA setup
              </Button>
              {twoFactorSetup ? (
                <>
                  <FastImage
                    source={{ uri: twoFactorSetup.qrCodeDataUrl }}
                    style={styles.qrCode}
                    resizeMode={FastImage.resizeMode.contain}
                    fallback={twoFactorSetup.qrCodeDataUrl.startsWith('data:')}
                  />
                  <Text
                    selectable
                    variant="bodySmall"
                    style={{ textAlign: 'center', opacity: 0.6 }}
                  >
                    Secret: {twoFactorSetup.secret}
                  </Text>
                  <TextInput
                    keyboardType="number-pad"
                    label="Authenticator code"
                    maxLength={6}
                    mode="outlined"
                    onChangeText={setEnableOtp}
                    value={enableOtp}
                    outlineStyle={{ borderRadius: 12 }}
                  />
                  <Button
                    mode="contained-tonal"
                    onPress={onPressVerify2FA}
                    disabled={isBusy}
                    style={{ borderRadius: 12 }}
                  >
                    Verify and enable
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                Enter your current code to disable security protections.
              </Text>
              <TextInput
                keyboardType="number-pad"
                label="Current 2FA code"
                maxLength={6}
                mode="outlined"
                onChangeText={setDisableOtp}
                value={disableOtp}
                outlineStyle={{ borderRadius: 12 }}
              />
              <Button
                mode="contained-tonal"
                onPress={onPressDisable2FA}
                disabled={isBusy}
                style={{ borderRadius: 12 }}
              >
                Disable 2FA
              </Button>
            </>
          )}
          <FormMessage message={error} />
          {isBusy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={onLogout}
        style={[styles.logoutBtn, { borderColor: theme.colors.outlineVariant }]}
        textColor={theme.colors.error}
      >
        Logout
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowText: {
    flex: 1,
    gap: 4,
    paddingRight: 16,
  },
  qrCode: {
    alignSelf: 'center',
    borderRadius: 12,
    height: 180,
    width: 180,
  },
  listIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
});
