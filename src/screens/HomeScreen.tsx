import { Camera, ChevronRight, LayoutGrid, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Surface, Text } from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { useAppSelector } from '../store';
import { appTheme } from '../theme';

const quickStats = [
  {
    title: 'Featured works',
    value: '128',
    icon: LayoutGrid,
  },
  {
    title: 'New arrivals',
    value: '24',
    icon: Sparkles,
  },
  {
    title: 'Studio shots',
    value: '09',
    icon: Camera,
  },
];

function FeaturedChipIcon({ size, color }: { size: number; color: string }) {
  return <LucideIcon icon={Sparkles} size={size} color={color} />;
}

export function HomeScreen() {
  const welcomeMessage = useAppSelector(state => state.gallery.welcomeMessage);
  const featuredCount = useAppSelector(state => state.gallery.featuredCount);

  return (
    <View style={styles.screen}>
      <Surface style={styles.hero} elevation={1}>
        <Text variant="headlineMedium" style={styles.heroTitle}>
          Gallery Home
        </Text>
        <Text variant="bodyLarge" style={styles.heroBody}>
          {welcomeMessage}
        </Text>
        <View style={styles.chipRow}>
          <Chip icon={FeaturedChipIcon}>
            {featuredCount} featured picks
          </Chip>
          <Chip compact>Paper UI</Chip>
          <Chip compact>Redux state</Chip>
        </View>
      </Surface>

      {quickStats.map(item => (
        <Card key={item.title} mode="contained" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View>
              <Text variant="titleMedium">{item.title}</Text>
              <Text variant="displaySmall" style={styles.statValue}>
                {item.value}
              </Text>
            </View>
            <View style={styles.iconBadge}>
              <LucideIcon icon={item.icon} color={appTheme.colors.primary} size={22} />
            </View>
          </Card.Content>
        </Card>
      ))}

      <Card mode="elevated" style={styles.ctaCard}>
        <Card.Content style={styles.ctaRow}>
          <View style={styles.ctaText}>
            <Text variant="titleMedium">Start building the next screen</Text>
            <Text variant="bodyMedium">
              This boilerplate is ready for new routes, async slices, and themed components.
            </Text>
          </View>
          <LucideIcon icon={ChevronRight} color={appTheme.colors.primary} size={22} />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
    padding: 20,
  },
  hero: {
    borderRadius: 24,
    gap: 14,
    padding: 20,
  },
  heroTitle: {
    color: appTheme.colors.onSurface,
    fontWeight: '700',
  },
  heroBody: {
    color: appTheme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    backgroundColor: appTheme.colors.surface,
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    color: appTheme.colors.primary,
    fontWeight: '700',
    marginTop: 6,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.primaryContainer,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  ctaCard: {
    marginTop: 'auto',
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  ctaText: {
    flex: 1,
    gap: 4,
  },
});
