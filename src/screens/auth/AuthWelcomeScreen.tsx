import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  ChevronsRight,
  Play,
  Settings,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../../components/LucideIcon';

type Props = {
  onCreateAccount: () => void;
  onOpenSettings: () => void;
  onStart: () => void;
};

export function AuthWelcomeScreen({
  onCreateAccount,
  onOpenSettings,
  onStart,
}: Props) {
  const theme = useTheme();
  const heroBackground = theme.dark
    ? theme.colors.primaryContainer
    : theme.colors.onPrimaryContainer;
  const heroTextColor = theme.dark
    ? theme.colors.onPrimaryContainer
    : theme.colors.onPrimary;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text
            variant="titleLarge"
            style={[styles.brand, { color: theme.colors.primary }]}>
            Gallery
          </Text>
          <Pressable
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            onPress={onOpenSettings}
            style={[
              styles.topBarButton,
              { backgroundColor: theme.colors.surface },
            ]}>
            <LucideIcon
              color={theme.colors.onSurface}
              icon={Settings}
              size={18}
            />
          </Pressable>
        </View>

        <View style={[styles.heroCard, { backgroundColor: heroBackground }]}>
          <View
            style={[
              styles.heroGlow,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          />

          <View style={styles.heroCopy}>
            <Text
              variant="displaySmall"
              style={[styles.heroTitle, { color: heroTextColor }]}>
              Curate every collection in one place
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.heroSubtitle, { color: heroTextColor }]}>
              Sign in, manage settings, and move through your secure gallery flow
              with a cleaner control center.
            </Text>
          </View>

          <View style={styles.deviceStage}>
            <View
              style={[
                styles.deviceShadow,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.deviceOuter,
                { backgroundColor: theme.colors.surface },
              ]}>
              <View
                style={[
                  styles.deviceInner,
                  { backgroundColor: theme.colors.onSurface },
                ]}>
                <View
                  style={[
                    styles.deviceCore,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}>
                  <LucideIcon
                    color={theme.colors.primary}
                    icon={Sparkles}
                    size={28}
                  />
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.controlBar,
              { backgroundColor: theme.colors.surface },
            ]}>
            <Pressable
              accessibilityRole="button"
              onPress={onCreateAccount}
              style={[
                styles.sideButton,
                { backgroundColor: theme.colors.elevation.level2 },
              ]}>
              <LucideIcon
                color={theme.colors.primary}
                icon={UserRoundPlus}
                size={18}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onStart}
              style={[
                styles.startButton,
                { backgroundColor: theme.colors.primary },
              ]}>
              <View
                style={[
                  styles.startIconWrap,
                  { backgroundColor: theme.colors.onPrimary },
                ]}>
                <LucideIcon
                  color={theme.colors.primary}
                  icon={Play}
                  size={18}
                />
              </View>
              <Text
                variant="titleMedium"
                style={[styles.startLabel, { color: theme.colors.onPrimary }]}>
                Start
              </Text>
            </Pressable>

            <View
              style={[
                styles.sideButton,
                { backgroundColor: theme.colors.elevation.level2 },
              ]}>
              <LucideIcon
                color={theme.colors.onSurfaceVariant}
                icon={ChevronsRight}
                size={18}
              />
            </View>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={onStart}>
          <Text
            variant="labelLarge"
            style={[styles.bottomLink, { color: theme.colors.primary }]}>
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topBarButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  topBarSpacer: {
    height: 40,
    width: 40,
  },
  brand: {
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 40,
    flex: 1,
    marginVertical: 18,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 28,
  },
  heroGlow: {
    borderRadius: 140,
    height: 230,
    opacity: 0.18,
    position: 'absolute',
    right: -70,
    top: 80,
    width: 230,
  },
  heroCopy: {
    gap: 16,
    maxWidth: 280,
    zIndex: 1,
  },
  heroTitle: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroSubtitle: {
    lineHeight: 24,
  },
  deviceStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 22,
  },
  deviceShadow: {
    borderRadius: 160,
    bottom: 50,
    height: 220,
    opacity: 0.22,
    position: 'absolute',
    width: 220,
  },
  deviceOuter: {
    alignItems: 'center',
    borderRadius: 160,
    elevation: 12,
    height: 270,
    justifyContent: 'center',
    width: 270,
  },
  deviceInner: {
    alignItems: 'center',
    borderRadius: 150,
    height: 226,
    justifyContent: 'center',
    width: 226,
  },
  deviceCore: {
    alignItems: 'center',
    borderRadius: 50,
    height: 76,
    justifyContent: 'center',
    marginBottom: 24,
    width: 76,
  },
  controlBar: {
    alignItems: 'center',
    borderRadius: 28,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  sideButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  startIconWrap: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  startLabel: {
    fontWeight: '700',
  },
  bottomLink: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
