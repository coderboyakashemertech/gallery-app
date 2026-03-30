import type { ReactNode } from 'react';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../../components/LucideIcon';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  onSettings?: () => void;
  subtitle?: string;
  title: string;
};

export function AuthLayout({
  children,
  footer,
  onBack,
  onSettings,
  subtitle,
  title,
}: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.glowTop,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          />
          <View
            style={[
              styles.glowBottom,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          />

          <View style={styles.topBar}>
            {onBack ? (
              <Pressable
                accessibilityLabel="Go back"
                accessibilityRole="button"
                hitSlop={12}
                onPress={onBack}
                style={[
                  styles.backButton,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <LucideIcon
                  color={theme.colors.onSurface}
                  icon={ArrowLeft}
                  size={18}
                />
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}

            <Text
              variant="headlineMedium"
              style={[styles.brand, { color: theme.colors.primary }]}
            >
              Gallery
            </Text>

            {onSettings ? (
              <Pressable
                accessibilityLabel="Open settings"
                accessibilityRole="button"
                hitSlop={12}
                onPress={onSettings}
                style={[
                  styles.backButton,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <LucideIcon
                  color={theme.colors.onSurface}
                  icon={Settings}
                  size={18}
                />
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}
          </View>

          <Surface
            elevation={1}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.headerBlock}>
              <Text
                variant="headlineSmall"
                style={[styles.title, { color: theme.colors.onSurface }]}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.subtitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.body}>{children}</View>
            {footer}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  scrollView: {
    flex: 1,
  },
  glowTop: {
    borderRadius: 140,
    height: 220,
    opacity: 0.45,
    position: 'absolute',
    right: -70,
    top: 0,
    width: 220,
  },
  glowBottom: {
    borderRadius: 120,
    bottom: 70,
    height: 180,
    left: -60,
    opacity: 0.32,
    position: 'absolute',
    width: 180,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backSpacer: {
    height: 40,
    width: 40,
  },
  brand: {
    fontWeight: '800',
  },
  card: {
    alignSelf: 'center',
    borderRadius: 34,
    borderWidth: 1,
    maxWidth: 430,
    paddingHorizontal: 18,
    paddingVertical: 22,
    width: '100%',
  },
  headerBlock: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  body: {
    gap: 14,
  },
});
