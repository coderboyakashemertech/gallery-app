import React from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Folder } from 'lucide-react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../../components/LucideIcon';
import { Screen } from '../../components/Screen';
import { getApiBaseUrl, resolveApiEnvironment } from '../../config/api';
import type { GalleryStackParamList } from '../../navigation/DrawerNavigator';
import { apiRequest } from '../../services/api';
import { useAppSelector } from '../../store';
import {
  Folder as GalleryFolder,
  GalleryFoldersResponse,
  RawGalleryFoldersResponse,
  normalizeGalleryFoldersResponse,
} from '../../types/folders';
import { readGalleryCache, writeGalleryCache } from '../../utils/galleryCache';

import { MemoizedGalleryFolderCard } from './components/GalleryFolderCard';
import { GalleryTopBar } from './components/GalleryTopBar';

const EMPTY_GALLERY_FOLDERS: GalleryFolder[] = [];

export function GalleryFoldersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation =
    useNavigation<NativeStackNavigationProp<GalleryStackParamList>>();
  const token = useAppSelector(state => state.auth.token);
  const username = useAppSelector(state => state.auth.user?.username);
  const apiEnvironment = useAppSelector(
    state => state.preferences.apiEnvironment,
  );
  const apiBaseUrl = React.useMemo(
    () => getApiBaseUrl(resolveApiEnvironment(apiEnvironment)),
    [apiEnvironment],
  );
  const [galleryData, setGalleryData] =
    React.useState<GalleryFoldersResponse | null>(null);
  const [galleryError, setGalleryError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const hasHydratedCacheRef = React.useRef(false);
  const hasGalleryDataRef = React.useRef(false);

  const folderGridColumns = 3;
  const folderTileGap = 12;
  const folderTileWidth = Math.floor(
    (width - 32 - folderTileGap * (folderGridColumns - 1)) / folderGridColumns,
  );
  const folders = React.useMemo(
    () => galleryData?.folders ?? EMPTY_GALLERY_FOLDERS,
    [galleryData],
  );

  React.useEffect(() => {
    hasGalleryDataRef.current = Boolean(galleryData);
  }, [galleryData]);

  React.useEffect(() => {
    hasHydratedCacheRef.current = false;
    setGalleryData(null);
    setGalleryError(null);
    setIsLoading(true);
  }, [apiEnvironment, username]);

  const persistGalleryCache = React.useCallback(
    async (nextGalleryData: GalleryFoldersResponse) => {
      await writeGalleryCache(apiEnvironment, nextGalleryData, username);
    },
    [apiEnvironment, username],
  );

  const fetchGalleryData = React.useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      if (!token) {
        setGalleryData(null);
        setGalleryError(null);
        setIsLoading(false);
        return;
      }

      const forceRefresh = options?.forceRefresh ?? false;

      if (!forceRefresh && !hasHydratedCacheRef.current) {
        const cached = await readGalleryCache(apiEnvironment, username);

        if (cached) {
          hasHydratedCacheRef.current = true;
          setGalleryData(cached.galleryData);
          setGalleryError(null);
          setIsLoading(false);
          setIsFetching(false);
          return;
        }
      }

      hasHydratedCacheRef.current = true;
      setGalleryError(null);
      setIsFetching(true);

      if (!hasGalleryDataRef.current) {
        setIsLoading(true);
      }

      try {
        const response = await apiRequest<RawGalleryFoldersResponse>(
          '/api/gallery/folders',
          { apiEnvironment, token },
        );
        const normalizedGalleryData = normalizeGalleryFoldersResponse(
          response.data,
        );

        setGalleryData(normalizedGalleryData);
        persistGalleryCache(normalizedGalleryData).catch(() => { });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load the gallery right now.';
        setGalleryError(message);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [apiEnvironment, persistGalleryCache, token, username],
  );

  React.useEffect(() => {
    fetchGalleryData().catch(() => { });
  }, [fetchGalleryData]);

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      scrollable={false}
      noPadding
      edges={['bottom', 'left', 'right']}
    >
      <GalleryTopBar
        title="Gallery"
        subtitle={`${folders.length} folder${folders.length === 1 ? '' : 's'}`}
        isRefreshing={isFetching}
        onRefresh={() => {
          fetchGalleryData({ forceRefresh: true }).catch(() => { });
        }}
        onMenu={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />

      <FlatList
        data={folders}
        key={`gallery-${folderGridColumns}`}
        keyExtractor={item => item.folder_path}
        numColumns={folderGridColumns}
        initialNumToRender={12}
        maxToRenderPerBatch={18}
        windowSize={7}
        removeClippedSubviews={false}
        columnWrapperStyle={styles.folderColumns}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.folderColumnItem,
              {
                width: folderTileWidth,
                marginRight:
                  (index + 1) % folderGridColumns === 0 ? 0 : folderTileGap,
                marginBottom: folderTileGap,
              },
            ]}
          >
            <MemoizedGalleryFolderCard
              folder={item}
              previewUrl={item.previewUrl}
              onPress={() => navigation.navigate('GalleryImages', { folder: item })}
              token={token}
              apiBaseUrl={apiBaseUrl}
            />
          </View>
        )}
        contentContainerStyle={[styles.folderContent, { paddingBottom: insets.bottom + 48 }]}
        ListEmptyComponent={
          !isLoading && !isFetching ? (
            <View style={styles.emptyState}>
              <LucideIcon
                icon={Folder}
                color={theme.colors.onSurfaceVariant}
                size={34}
              />
              <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                {galleryError ? 'Gallery failed to load' : 'No gallery folders yet'}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {galleryError ?? 'Your gallery API did not return any folders.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading || isFetching ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  folderContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  folderColumns: {
    justifyContent: 'flex-start',
  },
  folderColumnItem: {
    paddingHorizontal: 0,
  },
  emptyState: {
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
