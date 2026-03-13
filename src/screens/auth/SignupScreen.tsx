import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { FormMessage } from '../../components/FormMessage';
import { LucideIcon } from '../../components/LucideIcon';
import { useRegisterMutation } from '../../store/authApi';
import { clearAuthError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { AuthLayout } from './AuthLayout';

type Props = {
  onGoToLogin: () => void;
};

function VisiblePasswordIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon color={color} icon={EyeOff} size={size} />;
}

function HiddenPasswordIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon color={color} icon={Eye} size={size} />;
}

export function SignupScreen({ onGoToLogin }: Props) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { error, requestStatus } = useAppSelector(state => state.auth);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [register] = useRegisterMutation();

  const formError = useMemo(() => {
    if (!name.trim() || !username.trim() || !password || !confirmPassword) {
      return 'Complete all fields to create your account.';
    }

    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters.';
    }

    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    if (!acceptedTerms) {
      return 'Please confirm the terms to continue.';
    }

    return null;
  }, [acceptedTerms, confirmPassword, name, password, username]);

  const isBusy = requestStatus === 'loading';

  const clearErrorIfNeeded = () => {
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const onSubmit = async () => {
    if (formError) {
      return;
    }

    dispatch(clearAuthError());

    try {
      await register({
        name: name.trim(),
        password,
        username: username.trim().toLowerCase(),
      }).unwrap();
    } catch {
      // Errors are handled by auth slice state.
    }
  };

  return (
    <AuthLayout
      onBack={onGoToLogin}
      subtitle="Create your account to unlock the gallery dashboard and protected API actions."
      title="Create an account?">
      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
          Name
        </Text>
        <TextInput
          contentStyle={styles.inputContent}
          disabled={isBusy}
          mode="outlined"
          onChangeText={value => {
            clearErrorIfNeeded();
            setName(value);
          }}
          outlineColor="transparent"
          placeholder="Enter your name"
          style={[
            styles.field,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={name}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
          Username
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          contentStyle={styles.inputContent}
          disabled={isBusy}
          left={<TextInput.Affix text="@" />}
          mode="outlined"
          onChangeText={value => {
            clearErrorIfNeeded();
            setUsername(value);
          }}
          outlineColor="transparent"
          placeholder="Choose a username"
          style={[
            styles.field,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={username}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
          Password
        </Text>
        <TextInput
          autoCapitalize="none"
          contentStyle={styles.inputContent}
          disabled={isBusy}
          mode="outlined"
          onChangeText={value => {
            clearErrorIfNeeded();
            setPassword(value);
          }}
          outlineColor="transparent"
          placeholder="Create a password"
          right={
            <TextInput.Icon
              icon={isPasswordVisible ? VisiblePasswordIcon : HiddenPasswordIcon}
              onPress={() => setIsPasswordVisible(current => !current)}
            />
          }
          secureTextEntry={!isPasswordVisible}
          style={[
            styles.field,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={password}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
          Confirm password
        </Text>
        <TextInput
          autoCapitalize="none"
          contentStyle={styles.inputContent}
          disabled={isBusy}
          mode="outlined"
          onChangeText={value => {
            clearErrorIfNeeded();
            setConfirmPassword(value);
          }}
          outlineColor="transparent"
          placeholder="Repeat your password"
          right={
            <TextInput.Icon
              icon={isConfirmVisible ? VisiblePasswordIcon : HiddenPasswordIcon}
              onPress={() => setIsConfirmVisible(current => !current)}
            />
          }
          secureTextEntry={!isConfirmVisible}
          style={[
            styles.field,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={confirmPassword}
        />
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        onPress={() => setAcceptedTerms(current => !current)}
        style={styles.termsRow}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: acceptedTerms
                ? theme.colors.primaryContainer
                : theme.colors.elevation.level1,
              borderColor: acceptedTerms
                ? theme.colors.primary
                : theme.colors.outline,
            },
          ]}>
          {acceptedTerms ? (
            <LucideIcon color={theme.colors.primary} icon={Check} size={14} />
          ) : null}
        </View>
        <Text
          variant="bodySmall"
          style={[styles.termsCopy, { color: theme.colors.onSurfaceVariant }]}>
          I agree to the gallery access terms and secure sign-in policy.
        </Text>
      </Pressable>

      <FormMessage message={error ?? formError} />

      <Button
        contentStyle={styles.buttonContent}
        disabled={isBusy || Boolean(formError)}
        labelStyle={styles.buttonLabel}
        mode="contained"
        onPress={() => {
          onSubmit().catch(() => {});
        }}
        style={styles.primaryButton}>
        {isBusy ? 'Creating account...' : 'Create account'}
      </Button>

      {isBusy ? <ActivityIndicator style={styles.loader} /> : null}

      <View style={styles.footerRow}>
        <Text
          variant="bodySmall"
          style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          Already registered?
        </Text>
        <Pressable accessibilityRole="button" onPress={onGoToLogin}>
          <Text
            variant="labelLarge"
            style={[styles.linkText, { color: theme.colors.primary }]}>
            Back to login
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
  inputContent: {
    minHeight: 58,
  },
  termsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  termsCopy: {
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 30,
    marginTop: 6,
  },
  buttonContent: {
    minHeight: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  loader: {
    marginTop: 8,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 6,
  },
  footerText: {
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '700',
  },
});
