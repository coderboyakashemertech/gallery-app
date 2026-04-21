import React from 'react';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Folder, ImageIcon, Plus } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import {
  ActivityIndicator,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LucideIcon } from '../components/LucideIcon';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { Screen } from '../components/Screen';
import { getApiBaseUrl, resolveApiEnvironment } from '../config/api';
import { useAppSelector } from '../store';
import {
  AlbumSummary,
  useCreateAlbumMutation,
  useGetAlbumImagesQuery,
  useGetAlbumsQuery,
} from '../store/authApi';
import { DirectoryFile } from '../types/folders';
import { showToast } from '../utils/toast';

import { GalleryTopBar } from './gallery/components/GalleryTopBar';
import { MemoizedGalleryImageTile } from './gallery/components/GalleryImageTile';

const EMPTY_ALBUM_IMAGES: DirectoryFile[] = [];

function AlbumCard({
  album,
  onPress,
}: {
  album: AlbumSummary;
  onPress: () => void;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.albumCard,
        pressed ? styles.albumCardPressed : null,
      ]}
    >
      <View
        style={[
          styles.albumCover,
          !album.coverImageUrl || previewFailed
            ? { backgroundColor: theme.colors.surfaceVariant }
            : null,
        ]}
      >
        {album.coverImageUrl && !previewFailed ? (
          <FastImage
            source={{ uri: album.coverImageUrl }}
            style={styles.albumCoverImage}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <View
            style={[
              styles.albumFallback,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <LucideIcon
              icon={ImageIcon}
              color={theme.colors.onSurfaceVariant}
              size={28}
            />
          </View>
        )}
      </View>
      <View style={styles.albumCopy}>
        <Text
          variant="titleMedium"
          numberOfLines={1}
          style={[styles.albumTitle, { color: theme.colors.onSurface }]}
        >
          {album.name}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.albumMeta, { color: theme.colors.onSurfaceVariant }]}
        >
          {album.imageCount} object{album.imageCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export function AlbumsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { data, isLoading, isFetching, refetch } = useGetAlbumsQuery();
  const [createVisible, setCreateVisible] = React.useState(false);
  const [albumName, setAlbumName] = React.useState('');
  const [selectedAlbum, setSelectedAlbum] = React.useState<AlbumSummary | null>(
    null,
  );
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [createAlbum, { isLoading: creatingAlbum }] = useCreateAlbumMutation();

  const token = useAppSelector(state => state.auth.token);
  const apiEnvironment = useAppSelector(
    state => state.preferences.apiEnvironment,
  );
  const apiBaseUrl = React.useMemo(
    () => getApiBaseUrl(resolveApiEnvironment(apiEnvironment)),
    [apiEnvironment],
  );

  const {
    data: albumImagesData,
    isLoading: isAlbumImagesLoading,
    isFetching: isAlbumImagesFetching,
    refetch: refetchAlbumImages,
  } = useGetAlbumImagesQuery(selectedAlbum?.id ?? 0, {
    skip: !selectedAlbum,
  });

  const albums = data ?? [];
  const albumImages = albumImagesData ?? EMPTY_ALBUM_IMAGES;

  React.useEffect(() => {
    if (!selectedAlbum) {
      return;
    }

    const nextAlbum = albums.find(album => album.id === selectedAlbum.id);

    if (!nextAlbum) {
      setSelectedAlbum(null);
      return;
    }

    setSelectedAlbum(nextAlbum);
  }, [albums, selectedAlbum]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!selectedAlbum) {
          return false;
        }

        setSelectedAlbum(null);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, [selectedAlbum]),
  );

  const albumGridColumns = 3;
  const albumTileGap = 12;
  const albumTileWidth = Math.floor(
    (width - 32 - albumTileGap * (albumGridColumns - 1)) / albumGridColumns,
  );

  const imageGridColumns = 3;
  const tileGap = 1;
  const tileWidth = Math.floor(
    (width - tileGap * (imageGridColumns - 1)) / imageGridColumns,
  );

  const imageRows = React.useMemo(() => {
    const rows: DirectoryFile[][] = [];
    for (let index = 0; index < albumImages.length; index += imageGridColumns) {
      rows.push(albumImages.slice(index, index + imageGridColumns));
    }
    return rows;
  }, [albumImages, imageGridColumns]);

  const media = React.useMemo(
    () => albumImages.map(item => ({ path: item.url, name: item.name })),
    [albumImages],
  );

  const closeCreateModal = () => {
    setCreateVisible(false);
    setAlbumName('');
  };

  const handleCreateAlbum = async () => {
    const trimmedName = albumName.trim();

    if (!trimmedName) {
      showToast('Album name is required.');
      return;
    }

    try {
      const album = await createAlbum({ name: trimmedName }).unwrap();
      setSelectedAlbum(album);
      closeCreateModal();
      showToast(`Album ${trimmedName} is ready.`);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        (typeof error?.data === 'string' ? error.data : null) ||
        'Could not create this album.';
      showToast(message);
    }
  };

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      scrollable={false}
      noPadding
      edges={['bottom', 'left', 'right']}
    >
      {selectedAlbum ? (
        <>
          <GalleryTopBar
            title={selectedAlbum.name}
            subtitle={`${albumImages.length} photo${
              albumImages.length === 1 ? '' : 's'
            }`}
            isRefreshing={isAlbumImagesFetching}
            onRefresh={() => {
              refetchAlbumImages();
            }}
            onBack={() => setSelectedAlbum(null)}
          />

          <FlatList
            data={imageRows}
            key={`album-gallery-${imageGridColumns}`}
            keyExtractor={(row, index) => row[0]?.path ?? `album-row-${index}`}
            initialNumToRender={18}
            maxToRenderPerBatch={24}
            windowSize={9}
            removeClippedSubviews={false}
            renderItem={({ item: row }) => {
              return (
                <View
                  style={[
                    styles.imageRow,
                    row.length < imageGridColumns ? styles.imageRowCentered : null,
                  ]}
                >
                  {row.map((file, index) => {
                    const mediaIndex = albumImages.findIndex(
                      item => item.path === file.path,
                    );

                    return (
                      <View
                        key={file.path}
                        style={{
                          width: tileWidth,
                          marginRight: index === row.length - 1 ? 0 : tileGap,
                          marginBottom: tileGap,
                        }}
                      >
                        <MemoizedGalleryImageTile
                          item={file}
                          token={token}
                          apiBaseUrl={apiBaseUrl}
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
                  })}
                </View>
              );
            }}
            contentContainerStyle={[
              styles.imagesContent,
              { paddingBottom: insets.bottom + 48 },
            ]}
            ListEmptyComponent={
              !isAlbumImagesLoading && !isAlbumImagesFetching ? (
                <View style={styles.emptyState}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    No photos in this album yet.
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              isAlbumImagesLoading || isAlbumImagesFetching ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        </>
      ) : (
        <>
          <GalleryTopBar
            title="Albums"
            subtitle={`${albums.length} album${albums.length === 1 ? '' : 's'}`}
            isRefreshing={isFetching}
            onRefresh={() => {
              refetch();
            }}
            onMenu={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          />

          <FlatList
            data={albums}
            key={`albums-${albumGridColumns}`}
            keyExtractor={item => String(item.id)}
            numColumns={albumGridColumns}
            columnWrapperStyle={styles.albumColumns}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.albumColumnItem,
                  {
                    width: albumTileWidth,
                    marginRight:
                      (index + 1) % albumGridColumns === 0 ? 0 : albumTileGap,
                    marginBottom: albumTileGap,
                  },
                ]}
              >
                <AlbumCard album={item} onPress={() => setSelectedAlbum(item)} />
              </View>
            )}
            contentContainerStyle={[
              styles.albumContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            ListEmptyComponent={
              !isLoading && !isFetching ? (
                <View style={styles.emptyState}>
                  <LucideIcon
                    icon={Folder}
                    color={theme.colors.onSurfaceVariant}
                    size={34}
                  />
                  <Text variant="titleMedium" style={styles.emptyTitle}>
                    No albums yet
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Create an album and start saving photos into it.
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

          <Pressable
            onPress={() => setCreateVisible(true)}
            style={({ pressed }) => [
              styles.fab,
              {
                backgroundColor: theme.colors.primary,
                bottom: insets.bottom + 22,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <LucideIcon icon={Plus} color={theme.colors.onPrimary} size={22} />
          </Pressable>
        </>
      )}

      <MediaViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        media={media}
        initialIndex={selectedIndex}
      />

      <Portal>
        <Modal
          visible={createVisible}
          onDismiss={closeCreateModal}
          contentContainerStyle={[
            styles.createModal,
            { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          <Text variant="headlineSmall">Create album</Text>
          <Text
            variant="bodyMedium"
            style={[styles.modalCopy, { color: theme.colors.onSurfaceVariant }]}
          >
            Give this album a name. You can add photos to it from the image
            viewer.
          </Text>
          <TextInput
            mode="outlined"
            label="Album name"
            value={albumName}
            onChangeText={setAlbumName}
            autoFocus={true}
          />
          <View style={styles.modalActions}>
            <Pressable
              onPress={closeCreateModal}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: theme.colors.outline,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text variant="labelLarge">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateAlbum}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.onPrimary }}
              >
                {creatingAlbum ? 'Creating...' : 'Create'}
              </Text>
            </Pressable>
          </View>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  albumContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  albumColumns: {
    justifyContent: 'flex-start',
  },
  albumColumnItem: {
    paddingHorizontal: 0,
  },
  albumCard: {
    width: '100%',
    marginBottom: 4,
  },
  albumCardPressed: {
    opacity: 0.82,
  },
  albumCover: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  albumCoverImage: {
    width: '100%',
    height: '100%',
  },
  albumFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCopy: {
    paddingTop: 4,
    gap: 0,
  },
  albumTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  albumMeta: {
    fontSize: 11,
    lineHeight: 14,
  },
  imagesContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  imageRowCentered: {
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
    marginTop: 6,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    elevation: 4,
  },
  createModal: {
    marginHorizontal: 18,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  modalCopy: {
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
});
