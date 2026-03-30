import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { FormMessage } from '../../components/FormMessage';
import { useLoginMutation } from '../../store/authApi';
import { clearAuthError, logout } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { AuthLayout } from './AuthLayout';

type Props = {
  onOpenSettings: () => void;
};

export function TwoFactorScreen({ onOpenSettings }: Props) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { error, pendingLogin, requestStatus, user } = useAppSelector(
    state => state.auth,
  );
  const [otp, setOtp] = useState('');
  const [login] = useLoginMutation();

  const formError = useMemo(() => {
    if (!otp.trim()) {
      return 'Enter the 6-digit code from your authenticator app.';
    }

    if (otp.trim().length !== 6) {
      return 'Authenticator codes should be 6 digits.';
    }

    return null;
  }, [otp]);

  const isBusy = requestStatus === 'loading';

  const onSubmit = async () => {
    if (!pendingLogin || formError) {
      return;
    }

    dispatch(clearAuthError());

    try {
      await login({
        otp: otp.trim(),
        password: pendingLogin.password,
        username: pendingLogin.username,
      }).unwrap();
    } catch {
      // Errors are handled in auth slice state.
    }
  };

  return (
    <AuthLayout
      onBack={() => dispatch(logout())}
      onSettings={onOpenSettings}
      subtitle="A second security step is required before we can open your gallery workspace."
      title="Verify your login">
      <View
        style={[
          styles.tag,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}>
        <Text variant="labelLarge">Signing in as</Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}>
          {user?.username ? `@${user.username}` : 'protected account'}
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
          Authenticator code
        </Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          mode="outlined"
          onChangeText={value => {
            if (error) {
              dispatch(clearAuthError());
            }

            setOtp(value.replace(/[^0-9]/g, ''));
          }}
          outlineColor="transparent"
          placeholder="Enter 6-digit code"
          style={[
            styles.field,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={otp}
        />
      </View>

      <FormMessage message={error ?? formError} />

      <Button
        contentStyle={styles.buttonContent}
        disabled={isBusy || !pendingLogin || Boolean(formError)}
        labelStyle={styles.buttonLabel}
        mode="contained"
        onPress={() => {
          onSubmit().catch(() => {});
        }}
        style={styles.primaryButton}>
        {isBusy ? 'Verifying...' : 'Complete sign in'}
      </Button>

      <Button
        disabled={isBusy}
        mode="text"
        onPress={() => dispatch(logout())}>
        Back to login
      </Button>

      {isBusy ? <ActivityIndicator style={styles.loader} /> : null}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 18,
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    paddingHorizontal: 4,
  },
  field: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  primaryButton: {
    borderRadius: 30,
    marginTop: 6,
  },
  buttonContent: {
    minHeight: 56,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  loader: {
    marginTop: 8,
  },
});
