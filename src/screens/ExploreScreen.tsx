import { Compass } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { appTheme } from '../theme';

export function ExploreScreen() {
  return (
    <View style={styles.screen}>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <LucideIcon icon={Compass} color={appTheme.colors.secondary} size={24} />
          <Text variant="headlineSmall">Explore</Text>
          <Text variant="bodyLarge" style={styles.body}>
            Keep discovery, search, recommendations, or trend-based layouts here.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: 24,
  },
  content: {
    gap: 12,
    paddingVertical: 8,
  },
  body: {
    color: appTheme.colors.onSurfaceVariant,
  },
});
