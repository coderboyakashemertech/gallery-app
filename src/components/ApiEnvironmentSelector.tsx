import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import {
  getApiBaseUrl,
  getApiEnvironmentLabel,
  resolveApiEnvironment,
  type ApiEnvironment,
} from '../config/api';

type Props = {
  apiEnvironment?: ApiEnvironment | null;
  onChange: (apiEnvironment: ApiEnvironment) => void;
};

const environmentOptions: ApiEnvironment[] = ['local', 'prod'];

export function ApiEnvironmentSelector({ apiEnvironment, onChange }: Props) {
  const theme = useTheme();
  const resolvedEnvironment = resolveApiEnvironment(apiEnvironment);
  const activeBaseUrl = getApiBaseUrl(resolvedEnvironment);

  return (
    <View style={styles.section}>
      <View style={styles.copy}>
        <Text
          variant="titleMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          API environment
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          Choose whether the app talks to your local backend or the production
          API.
        </Text>
      </View>

      <View style={styles.optionRow}>
        {environmentOptions.map(option => {
          const isActive = option === resolvedEnvironment;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onChange(option)}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isActive
                    ? theme.colors.primaryContainer
                    : theme.colors.elevation.level1,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                },
              ]}
            >
              <Text
                variant="titleSmall"
                style={[
                  styles.optionLabel,
                  {
                    color: isActive
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {getApiEnvironmentLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.urlCard,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        <Text
          variant="labelMedium"
          style={[styles.urlLabel, { color: theme.colors.primary }]}
        >
          Active URL
        </Text>
        <Text
          selectable
          variant="bodySmall"
          style={[styles.urlValue, { color: theme.colors.onSurfaceVariant }]}
        >
          {activeBaseUrl}
        </Text>
      </View>

      <Text
        variant="bodySmall"
        style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
      >
        Changing the environment clears cached API data and returns you to login
        if a session is active.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: 6,
  },
  description: {
    lineHeight: 20,
  },
  note: {
    lineHeight: 18,
  },
  optionButton: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  urlCard: {
    borderRadius: 18,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  urlLabel: {
    fontWeight: '700',
  },
  urlValue: {
    lineHeight: 18,
  },
});
