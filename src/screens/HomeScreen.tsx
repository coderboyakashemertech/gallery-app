import { FolderOpen, HardDrive, Pin, RefreshCcw } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, IconButton, Surface, Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { Screen } from '../components/Screen';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useGetDrivesQuery } from '../store/authApi';
import { useAppSelector } from '../store';
import { Drive } from '../types/drives';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/DrawerNavigator';
import convertSize from 'convert-size';

const DriveCard = React.memo(
  ({ drive, onPress }: { drive: Drive; onPress: () => void }) => {
    const theme = useTheme();

    return (
      <Card
        mode="contained"
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={onPress}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.driveTextContainer}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
              {drive.name}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              Size: {convertSize(Number(drive.size) ?? 0, { accuracy: -1 })}
            </Text>
          </View>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <LucideIcon
              icon={HardDrive}
              color={theme.colors.primary}
              size={22}
            />
          </View>
        </Card.Content>
      </Card>
    );
  },
);

const PinnedFolderCard = React.memo(
  ({ name, onPress }: { name: string; onPress: () => void }) => {
    const theme = useTheme();

    return (
      <Card
        mode="contained"
        style={[
          styles.card,
          styles.pinnedCard,
          {
            backgroundColor: theme.dark
              ? 'rgba(31, 111, 91, 0.14)'
              : 'rgba(31, 111, 91, 0.08)',
          },
        ]}
        onPress={onPress}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.driveTextContainer}>
            <Text variant="titleMedium" style={styles.pinnedName}>
              {name}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              Quick access to your pinned folder
            </Text>
          </View>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: theme.dark
                  ? 'rgba(31, 111, 91, 0.22)'
                  : theme.colors.primaryContainer,
              },
            ]}
          >
            <LucideIcon
              icon={FolderOpen}
              color={theme.colors.primary}
              size={22}
            />
          </View>
        </Card.Content>
      </Card>
    );
  },
);

export function HomeScreen() {
  const user = useAppSelector(state => state.auth.user);
  const pinnedFolders = useAppSelector(
    state => state.preferences.pinnedFolders || [],
  );
  const {
    data: drives,
    isLoading: isLoadingDrives,
    refetch,
    isFetching: isRefreshing,
  } = useGetDrivesQuery();
  const theme = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

  const handleDrivePress = (drive: Drive) => {
    navigation.navigate('FoldersStack', {
      screen: 'Folders',
      params: { path: drive.path, name: drive.name },
    });
  };

  const handlePinnedFolderPress = (folder: { path: string; name: string }) => {
    navigation.navigate('FoldersStack', {
      screen: 'Folders',
      params: { path: folder.path, name: folder.name },
    });
  };

  return (
    <Screen style={{ backgroundColor: theme.colors.background }}>
      <LoadingOverlay
        visible={isLoadingDrives}
        message="Connecting to drives..."
      />
      <View style={styles.heroContainer}>
        <Surface
          style={[
            styles.hero,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          elevation={5}
        >
          <View style={styles.heroContent}>
            <Text
              variant="headlineSmall"
              style={[styles.greeting, { color: theme.colors.primary }]}
            >
              Hello,
            </Text>
            <Text
              variant="headlineLarge"
              style={[
                styles.userName,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {user?.name ?? 'Guest'}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.heroSubtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Your connected storage is ready.
            </Text>
          </View>
        </Surface>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                CONNECTED DRIVES
              </Text>
            </View>
            <IconButton
              icon={({ size }) => (
                <LucideIcon
                  icon={RefreshCcw}
                  size={size}
                  color={theme.colors.primary}
                />
              )}
              size={24}
              onPress={refetch}
              disabled={isRefreshing}
              style={{ margin: 0 }}
            />
          </View>

          {drives && drives.length > 0 ? (
            <View style={styles.driveList}>
              {drives.map(drive => (
                <DriveCard
                  key={drive.path}
                  drive={drive}
                  onPress={() => handleDrivePress(drive)}
                />
              ))}
            </View>
          ) : (
            !isLoadingDrives && (
              <View style={styles.centerContent}>
                <LucideIcon
                  icon={HardDrive}
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text variant="bodyLarge" style={styles.infoText}>
                  No connected drives found.
                </Text>
              </View>
            )
          )}
        </View>
        {pinnedFolders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <LucideIcon icon={Pin} size={14} color={theme.colors.primary} />
                <Text
                  variant="titleMedium"
                  style={[styles.sectionTitle, { color: theme.colors.primary }]}
                >
                  PINNED FOLDERS
                </Text>
              </View>
            </View>

            <View style={styles.driveList}>
              {pinnedFolders.map(folder => (
                <PinnedFolderCard
                  key={folder.path}
                  name={folder.name}
                  onPress={() => handlePinnedFolderPress(folder)}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    marginBottom: 24,
  },
  hero: {
    borderRadius: 32,
    overflow: 'hidden',
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  heroContent: {
    gap: 4,
  },
  greeting: {
    fontWeight: '400',
    letterSpacing: -0.5,
    marginBottom: -4,
  },
  userName: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 18,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
  },
  pinnedCard: {
    borderWidth: 1,
    borderColor: 'rgba(31, 111, 91, 0.18)',
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 1.2,
    fontSize: 11,
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driveList: {
    gap: 8,
  },
  loadingText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  infoText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  driveTextContainer: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  pinnedName: {
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
