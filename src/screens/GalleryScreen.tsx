import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft, Folder, ImageIcon, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import FastImage from 'react-native-fast-image';

import { LucideIcon } from '../components/LucideIcon';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { Screen } from '../components/Screen';
import { apiRequest } from '../services/api';
import { useListDirectoryQuery } from '../store/authApi';
import { useAppSelector } from '../store';
import {
  DirectoryContentsResponse,
  DirectoryFile,
  Folder as GalleryFolder,
  GalleryFoldersResponse,
} from '../types/folders';
import { readGalleryCache, writeGalleryCache } from '../utils/galleryCache';

const EMPTY_FILES: DirectoryFile[] = [];
const EMPTY_GALLERY_FOLDERS: GalleryFolder[] = [];
const VIEWER_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.heic',
  '.heif',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
];

function GalleryFolderCard({
  folder,
  previewUrl,
  onPress,
}: {
  folder: GalleryFolder;
  previewUrl?: string | null;
  onPress: () => void;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.folderCard,
        pressed ? styles.folderCardPressed : null,
      ]}
    >
      <View
        style={[
          styles.folderCover,
          !previewUrl || previewFailed
            ? { backgroundColor: theme.colors.surfaceVariant }
            : null,
        ]}
      >
        {previewUrl && !previewFailed ? (
          <FastImage
            source={{ uri: previewUrl }}
            style={styles.folderCoverImage}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <LucideIcon
            icon={Folder}
            color={theme.colors.onSurfaceVariant}
            size={30}
          />
        )}
      </View>
      <View style={styles.folderCopy}>
        <Text
          variant="titleMedium"
          numberOfLines={1}
          style={styles.folderTitle}
        >
          {folder.folder_name}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.folderMeta, { color: theme.colors.onSurfaceVariant }]}
        >
          {folder.file_count} item{folder.file_count === 1 ? '' : 's'}
        </Text>
      </View>
    </Pressable>
  );
}
const MemoizedGalleryFolderCard = React.memo(GalleryFolderCard);

function GalleryImageTile({
  item,
  onPress,
}: {
  item: DirectoryFile;
  onPress: () => void;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const theme = useTheme();
  const isImage = Boolean(
    item.extension &&
      VIEWER_IMAGE_EXTENSIONS.includes(item.extension.toLowerCase()),
  );

  return (
    <Pressable onPress={onPress} style={styles.tilePressable}>
      {!previewFailed && isImage ? (
        <FastImage
          source={{ uri: item.url }}
          style={styles.tileImage}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => setPreviewFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.tileFallback,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <LucideIcon
            icon={ImageIcon}
            color={theme.colors.onSurfaceVariant}
            size={26}
          />
        </View>
      )}
    </Pressable>
  );
}
const MemoizedGalleryImageTile = React.memo(GalleryImageTile);

export function GalleryScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const token = useAppSelector(state => state.auth.token);
  const username = useAppSelector(state => state.auth.user?.username);
  const apiEnvironment = useAppSelector(
    state => state.preferences.apiEnvironment,
  );
  const [galleryData, setGalleryData] =
    React.useState<GalleryFoldersResponse | null>(null);
  const [galleryError, setGalleryError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [selectedFolder, setSelectedFolder] =
    React.useState<GalleryFolder | null>(null);
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [folderPreviewUrls, setFolderPreviewUrls] = React.useState<
    Record<string, string | null>
  >({});
  const hasHydratedCacheRef = React.useRef(false);
  const hasGalleryDataRef = React.useRef(false);

  const selectedFolderPath = selectedFolder?.folder_path ?? '';

  const {
    currentData: selectedFolderContents,
    isLoading: isFolderLoading,
    isFetching: isFolderFetching,
    refetch: refetchFolder,
  } = useListDirectoryQuery(
    { path: selectedFolderPath },
    { skip: !selectedFolderPath },
  );

  const folders = React.useMemo(
    () => galleryData?.folders ?? EMPTY_GALLERY_FOLDERS,
    [galleryData],
  );
  const folderFiles = selectedFolderContents?.files ?? EMPTY_FILES;
  const viewerFiles = React.useMemo(
    () =>
      folderFiles.filter(file =>
        file.extension
          ? VIEWER_IMAGE_EXTENSIONS.includes(file.extension.toLowerCase())
          : false,
      ),
    [folderFiles],
  );
  const media = React.useMemo(
    () => viewerFiles.map(item => ({ path: item.url, name: item.name })),
    [viewerFiles],
  );

  React.useEffect(() => {
    hasGalleryDataRef.current = Boolean(galleryData);
  }, [galleryData]);

  React.useEffect(() => {
    hasHydratedCacheRef.current = false;
    setGalleryData(null);
    setFolderPreviewUrls({});
    setGalleryError(null);
    setIsLoading(true);
    setSelectedFolder(null);
  }, [apiEnvironment, username]);

  const persistGalleryCache = React.useCallback(
    async (
      nextGalleryData: GalleryFoldersResponse,
      nextPreviewUrls: Record<string, string | null>,
    ) => {
      await writeGalleryCache(
        apiEnvironment,
        nextGalleryData,
        nextPreviewUrls,
        username,
      );
    },
    [apiEnvironment, username],
  );

  const fetchGalleryData = React.useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      if (!token) {
        setGalleryData(null);
        setFolderPreviewUrls({});
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
          setFolderPreviewUrls(cached.previewUrls);
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
        const response = await apiRequest<GalleryFoldersResponse>(
          '/api/gallery/folders',
          { apiEnvironment, token },
        );

        setGalleryData(response.data);
        setFolderPreviewUrls(current => {
          const nextPreviews = forceRefresh ? {} : current;
          persistGalleryCache(response.data, nextPreviews).catch(() => {});
          return nextPreviews;
        });
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
    fetchGalleryData().catch(() => {});
  }, [fetchGalleryData]);

  React.useEffect(() => {
    if (!selectedFolder) {
      return;
    }

    const nextFolder = folders.find(
      item => item.folder_path === selectedFolder.folder_path,
    );

    if (!nextFolder) {
      setSelectedFolder(null);
      return;
    }

    setSelectedFolder(nextFolder);
  }, [folders, selectedFolder]);

  React.useEffect(() => {
    let cancelled = false;

    const foldersToPrefetch = folders.filter(
      folder =>
        folder.file_count > 0 &&
        folderPreviewUrls[folder.folder_path] === undefined,
    );

    if (!foldersToPrefetch.length || !token || !galleryData) {
      return;
    }

    const loadPreviews = async () => {
      const previewEntries: Array<readonly [string, string | null]> = [];

      for (const folder of foldersToPrefetch) {
        try {
          const result = await apiRequest<DirectoryContentsResponse>(
            `/api/drives/list?path=${folder.folder_path}`,
            {
              apiEnvironment,
              token,
            },
          );

          const previewFile =
            result.data.files.find(file => Boolean(file.url)) ??
            result.data.files.find(file =>
              file.extension
                ? VIEWER_IMAGE_EXTENSIONS.includes(file.extension.toLowerCase())
                : false,
            ) ??
            null;

          previewEntries.push([folder.folder_path, previewFile?.url ?? null]);
        } catch {
          previewEntries.push([folder.folder_path, null]);
        }

        if (cancelled) {
          return;
        }
      }

      if (cancelled || !previewEntries.length) {
        return;
      }

      let mergedPreviewUrls: Record<string, string | null> | null = null;

      setFolderPreviewUrls(current => {
        mergedPreviewUrls = { ...current };

        previewEntries.forEach(([path, url]) => {
          mergedPreviewUrls![path] = url;
        });

        return mergedPreviewUrls!;
      });

      if (mergedPreviewUrls) {
        await persistGalleryCache(galleryData, mergedPreviewUrls);
      }
    };

    loadPreviews().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [
    apiEnvironment,
    folderPreviewUrls,
    folders,
    galleryData,
    persistGalleryCache,
    token,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!selectedFolder) {
          return false;
        }

        setSelectedFolder(null);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, [selectedFolder]),
  );

  const folderGridColumns = 3;
  const folderTileGap = 8;
  const imageGridColumns = width >= 900 ? 4 : 3;
  const tileGap = 2;
  const folderTileWidth = Math.floor(
    (width - 32 - folderTileGap * (folderGridColumns - 1)) / folderGridColumns,
  );
  const tileWidth = Math.floor(
    (width - tileGap * (imageGridColumns - 1)) / imageGridColumns,
  );

  const handleRefresh = () => {
    if (selectedFolder) {
      refetchFolder();
      return;
    }

    fetchGalleryData({ forceRefresh: true }).catch(() => {});
  };

  return (
    <Screen
      style={[styles.screen, styles.darkScreen]}
      scrollable={false}
      noPadding
    >
      <View style={styles.topBar}>
        {selectedFolder ? (
          <Pressable
            onPress={() => setSelectedFolder(null)}
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
        ) : (
          <View />
        )}

        <View style={styles.topBarCopy}>
          <Text variant="titleSmall" numberOfLines={1}>
            {selectedFolder ? selectedFolder.folder_name : 'Gallery'}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {selectedFolder
              ? `${folderFiles.length} item${
                  folderFiles.length === 1 ? '' : 's'
                }`
              : `${folders.length} folder${folders.length === 1 ? '' : 's'}`}
          </Text>
        </View>

        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: theme.colors.surfaceVariant,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {isFetching || isFolderFetching ? (
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

      {selectedFolder ? (
        <FlatList
          data={folderFiles}
          key={`gallery-folder-${imageGridColumns}`}
          numColumns={imageGridColumns}
          keyExtractor={item => item.path}
          initialNumToRender={18}
          maxToRenderPerBatch={24}
          windowSize={9}
          removeClippedSubviews={false}
          renderItem={({ item, index }) => {
            const mediaIndex = viewerFiles.findIndex(
              file => file.path === item.path,
            );

            return (
              <View
                style={{
                  width: tileWidth,
                  marginRight:
                    (index + 1) % imageGridColumns === 0 ? 0 : tileGap,
                  marginBottom: tileGap,
                }}
              >
                <MemoizedGalleryImageTile
                  item={item}
                  onPress={() => {
                    if (mediaIndex < 0) {
                      return;
                    }

                    setSelectedIndex(mediaIndex);
                    setViewerVisible(true);
                  }}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.imagesContent}
          ListEmptyComponent={
            !isFolderLoading && !isFolderFetching ? (
              <View style={styles.emptyState}>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  No files found in this gallery folder.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFolderLoading || isFolderFetching ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      ) : (
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
                previewUrl={folderPreviewUrls[item.folder_path]}
                onPress={() => setSelectedFolder(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.folderContent}
          ListEmptyComponent={
            !isLoading && !isFetching ? (
              <View style={styles.emptyState}>
                <LucideIcon
                  icon={Folder}
                  color={theme.colors.onSurfaceVariant}
                  size={34}
                />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  {galleryError ? 'Gallery failed to load' : 'No gallery folders yet'}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {galleryError ??
                    'Your gallery API did not return any folders.'}
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
      )}

      <MediaViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        media={media}
        initialIndex={selectedIndex}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  darkScreen: {
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
  folderContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  folderColumns: {
    justifyContent: 'flex-start',
  },
  folderColumnItem: {
    paddingHorizontal: 0,
  },
  folderCard: {
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  folderCardPressed: {
    opacity: 0.82,
  },
  folderCover: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderCoverImage: {
    width: '100%',
    height: '100%',
  },
  folderCopy: {
    paddingTop: 4,
    gap: 0,
  },
  folderTitle: {
    color: '#f5f5f5',
    fontSize: 12,
    lineHeight: 16,
  },
  folderMeta: {
    fontSize: 11,
    lineHeight: 14,
  },
  imagesContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tilePressable: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#2b2c2f',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#f5f5f5',
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
