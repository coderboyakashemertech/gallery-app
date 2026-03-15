import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Eye, EyeOff, RectangleEllipsisIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { FormMessage } from '../../components/FormMessage';
import { LucideIcon } from '../../components/LucideIcon';
import { useLoginMutation } from '../../store/authApi';
import { clearAuthError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { AuthLayout } from './AuthLayout';

type Props = {
  onCreateAccount: () => void;
};

function VisiblePasswordIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon color={color} icon={EyeOff} size={size} />;
}

function HiddenPasswordIcon({ color, size }: { color: string; size: number }) {
  return <LucideIcon color={color} icon={Eye} size={size} />;
}

export function LoginScreen({ onCreateAccount }: Props) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { error, requestStatus } = useAppSelector(state => state.auth);
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [login] = useLoginMutation();

  const formError = useMemo(() => {
    if (!username.trim() || !password.trim()) {
      return 'Enter your username and password to continue.';
    }

    return null;
  }, [password, username]);

  const isBusy = requestStatus === 'loading';

  const onSubmit = async () => {
    if (formError) {
      return;
    }

    dispatch(clearAuthError());

    try {
      await login({
        password,
        username: username.trim().toLowerCase(),
        otp: code,
      }).unwrap();
    } catch (err) {
      console.log(err);
      // Errors are stored in Redux by the auth slice.
    }
  };

  return (
    <AuthLayout
      subtitle="Welcome back. Sign in to reach your collections, settings, and two-factor protected actions."
      title="Welcome to Gallery"
    >
      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
        >
          Username
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          contentStyle={styles.inputContent}
          disabled={isBusy}
          mode="outlined"
          onChangeText={value => {
            if (error) {
              dispatch(clearAuthError());
            }

            setUsername(value);
          }}
          outlineColor="transparent"
          outlineStyle={styles.noOutline}
          placeholder="Enter username"
          style={[
            styles.field,
            styles.borderlessField,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={username}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
        >
          Password
        </Text>
        <TextInput
          autoCapitalize="none"
          contentStyle={styles.inputContent}
          disabled={isBusy}
          mode="outlined"
          onChangeText={value => {
            if (error) {
              dispatch(clearAuthError());
            }

            setPassword(value);
          }}
          onSubmitEditing={() => {
            onSubmit().catch(() => { });
          }}
          outlineColor="transparent"
          outlineStyle={styles.noOutline}
          placeholder="Enter password"
          right={
            <TextInput.Icon
              icon={
                isPasswordVisible ? VisiblePasswordIcon : HiddenPasswordIcon
              }
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
          style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
        >
          2FA Code
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          contentStyle={styles.inputContent}
          disabled={isBusy}
          left={<TextInput.Affix text="@" />}
          mode="outlined"
          onChangeText={value => {
            if (error) {
              dispatch(clearAuthError());
            }

            setCode(value);
          }}
          outlineColor="transparent"
          outlineStyle={styles.noOutline}
          placeholder="Enter 2fa code"
          style={[
            styles.field,
            styles.borderlessField,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
          value={code}
        />
      </View>

      <View style={styles.metaRow}>
        <Text
          variant="bodySmall"
          style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}
        >
          2FA-supported accounts are handled automatically.
        </Text>
        <Pressable accessibilityRole="button" onPress={onCreateAccount}>
          <Text
            variant="labelLarge"
            style={[styles.linkText, { color: theme.colors.primary }]}
          >
            Create account
          </Text>
        </Pressable>
      </View>

      <FormMessage message={error ?? formError} />

      <Button
        contentStyle={styles.buttonContent}
        disabled={isBusy || Boolean(formError)}
        labelStyle={styles.buttonLabel}
        mode="contained"
        onPress={() => {
          onSubmit().catch(() => { });
        }}
        style={styles.primaryButton}
      >
        {isBusy ? 'Logging in...' : 'Login'}
      </Button>

      {isBusy ? <ActivityIndicator style={styles.loader} /> : null}
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
  borderlessField: {
    borderWidth: 0,
  },
  inputContent: {
    minHeight: 58,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  metaText: {
    flex: 1,
  },
  linkText: {
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 30,
    marginTop: 8,
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
  noOutline: {
    borderWidth: 0,
  },
});
