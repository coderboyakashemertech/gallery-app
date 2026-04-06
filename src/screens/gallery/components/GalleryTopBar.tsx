import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft, Menu, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LucideIcon } from '../../../components/LucideIcon';

export function GalleryTopBar({
  title,
  subtitle,
  isRefreshing,
  onRefresh,
  onBack,
  onMenu,
}: {
  title: string;
  subtitle: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onBack?: () => void;
  onMenu?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.topBar,
        {
          paddingTop: insets.top + 12,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: theme.colors.surfaceVariant,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <LucideIcon
            icon={ArrowLeft}
            color={theme.colors.onSurface}
            size={18}
          />
        </Pressable>
      ) : onMenu ? (
        <Pressable
          accessibilityLabel="Open navigation menu"
          accessibilityRole="button"
          onPress={onMenu}
          hitSlop={12}
          style={({ pressed }) => [
            styles.menuButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <LucideIcon icon={Menu} color={theme.colors.onSurface} size={24} />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}

      <View style={styles.topBarCopy}>
        <Text variant="titleSmall" numberOfLines={1}>
          {title}
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {subtitle}
        </Text>
      </View>

      <Pressable
        onPress={onRefresh}
        style={({ pressed }) => [
          styles.refreshButton,
          {
            backgroundColor: theme.colors.surfaceVariant,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {isRefreshing ? (
          <ActivityIndicator size={16} />
        ) : (
          <LucideIcon
            icon={RefreshCw}
            color={theme.colors.onSurface}
            size={16}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  headerSpacer: {
    width: 38,
    height: 38,
    marginRight: 5,
  },
  topBarCopy: {
    flex: 1,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
