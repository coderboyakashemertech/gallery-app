import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  BackHandler,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft, Folder, ImageIcon, Plus } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { LucideIcon } from '../components/LucideIcon';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { Screen } from '../components/Screen';
import {
  AlbumSummary,
  useCreateAlbumMutation,
  useGetAlbumImagesQuery,
  useGetAlbumsQuery,
} from '../store/authApi';
import { DirectoryFile } from '../types/folders';
import { showToast } from '../utils/toast';

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
          <Image
            source={{ uri: album.coverImageUrl }}
            style={styles.albumCoverImage}
            resizeMode="cover"
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
        <Text variant="titleMedium" numberOfLines={1} style={styles.albumTitle}>
          {album.name}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.albumMeta, { color: theme.colors.onSurfaceVariant }]}
        >
          {album.imageCount}
        </Text>
      </View>
    </Pressable>
  );
}

function AlbumImageTile({
  item,
  onPress,
}: {
  item: DirectoryFile;
  onPress: () => void;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.tilePressable}>
      {previewFailed ? (
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
      ) : (
        <Image
          source={{ uri: item.url }}
          style={styles.tileImage}
          resizeMode="cover"
          resizeMethod="resize"
          progressiveRenderingEnabled={true}
          fadeDuration={0}
          onError={() => setPreviewFailed(true)}
        />
      )}
    </Pressable>
  );
}

export function AlbumsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { data, isLoading, isFetching } = useGetAlbumsQuery();
  const [createVisible, setCreateVisible] = React.useState(false);
  const [albumName, setAlbumName] = React.useState('');
  const [selectedAlbum, setSelectedAlbum] = React.useState<AlbumSummary | null>(
    null,
  );
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [createAlbum, { isLoading: creatingAlbum }] = useCreateAlbumMutation();

  const {
    data: albumImagesData,
    isLoading: isAlbumImagesLoading,
    isFetching: isAlbumImagesFetching,
  } = useGetAlbumImagesQuery(selectedAlbum?.id ?? 0, {
    skip: !selectedAlbum,
  });

  const albums = data ?? [];
  const albumImages = albumImagesData ?? EMPTY_ALBUM_IMAGES;
  const media = React.useMemo(
    () => albumImages.map(item => ({ path: item.url, name: item.name })),
    [albumImages],
  );

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
  const albumTileGap = 8;
  const imageGridColumns = width >= 900 ? 4 : 3;
  const tileGap = 12;
  const albumTileWidth = Math.floor(
    (width - 32 - albumTileGap * (albumGridColumns - 1)) / albumGridColumns,
  );
  const tileWidth = Math.floor(
    (width - 32 - tileGap * (imageGridColumns - 1)) / imageGridColumns,
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
      style={[styles.screen, styles.darkScreen]}
      scrollable={false}
      noPadding
    >
      <View style={styles.topBar}>
        {selectedAlbum ? (
          <Pressable
            onPress={() => setSelectedAlbum(null)}
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
            {selectedAlbum ? selectedAlbum.name : 'Albums'}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {selectedAlbum
              ? `${albumImages.length} photo${
                  albumImages.length === 1 ? '' : 's'
                }`
              : `${albums.length} album${albums.length === 1 ? '' : 's'}`}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {selectedAlbum ? (
        <FlatList
          data={albumImages}
          key={`album-${imageGridColumns}`}
          numColumns={imageGridColumns}
          keyExtractor={item => item.path}
          renderItem={({ item, index }) => (
            <View
              style={{
                width: tileWidth,
                marginRight: (index + 1) % imageGridColumns === 0 ? 0 : tileGap,
                marginBottom: tileGap,
              }}
            >
              <AlbumImageTile
                item={item}
                onPress={() => {
                  setSelectedIndex(index);
                  setViewerVisible(true);
                }}
              />
            </View>
          )}
          contentContainerStyle={styles.imagesContent}
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
      ) : (
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
          contentContainerStyle={styles.albumContent}
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
      )}

      <Pressable
        onPress={() => setCreateVisible(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <LucideIcon icon={Plus} color={theme.colors.onPrimary} size={22} />
      </Pressable>

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
  headerSpacer: {
    width: 38,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    elevation: 4,
  },
  albumContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  albumColumns: {
    justifyContent: 'flex-start',
  },
  albumColumnItem: {
    paddingHorizontal: 0,
  },
  albumFullWidth: {
    width: '100%',
    marginBottom: 4,
  },
  albumCard: {
    width: '100%',
    paddingHorizontal: 4,
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
    color: '#f5f5f5',
    fontSize: 12,
    lineHeight: 16,
  },
  albumMeta: {
    fontSize: 11,
    lineHeight: 14,
  },
  imagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 6,
  },
  tilePressable: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
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
    marginTop: 6,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
