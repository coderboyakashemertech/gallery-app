import { FolderOpen } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { appTheme } from '../theme';

export function CollectionScreen() {
  return (
    <View style={styles.screen}>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <LucideIcon icon={FolderOpen} color={appTheme.colors.primary} size={24} />
          <Text variant="headlineSmall">Collections</Text>
          <Text variant="bodyLarge" style={styles.body}>
            Use this route for category grids, albums, or server-driven gallery sections.
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
