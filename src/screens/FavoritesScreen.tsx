import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { ImageIcon } from 'lucide-react-native';
import { Text } from 'react-native-paper';
import FastImage from 'react-native-fast-image';

import { LucideIcon } from '../components/LucideIcon';

import { MediaViewerModal } from '../components/MediaViewerModal';
import { Screen } from '../components/Screen';
import { useGetFavoriteImagesQuery } from '../store/authApi';
import { DirectoryFile } from '../types/folders';

const EMPTY_FAVORITE_IMAGES: DirectoryFile[] = [];

function FavoriteTile({
  item,
  onPress,
}: {
  item: DirectoryFile;
  onPress: () => void;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);

  return (
    <Pressable onPress={onPress} style={styles.tilePressable}>
      {previewFailed ? (
        <View style={styles.tileFallback}>
          <LucideIcon icon={ImageIcon} color="#9aa0a6" size={28} />
        </View>
      ) : (
        <FastImage
          source={{ uri: item.url }}
          style={styles.tileImage}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => {
            console.error('[FavoritesScreen:image] preview failed', {
              name: item.name,
              path: item.path,
              url: item.url,
              extension: item.extension,
            });
            setPreviewFailed(true);
          }}
        />
      )}
    </Pressable>
  );
}

export function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const { data, isLoading, isFetching } = useGetFavoriteImagesQuery();
  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const favoriteImages = data ?? EMPTY_FAVORITE_IMAGES;
  const media = React.useMemo(
    () => favoriteImages.map(item => ({ path: item.url, name: item.name })),
    [favoriteImages],
  );

  const numColumns = width >= 900 ? 4 : 3;
  const tileGap = 2;
  const tileWidth = Math.floor(
    (width - tileGap * (numColumns - 1)) / numColumns,
  );

  return (
    <Screen
      style={[styles.screen, { backgroundColor: '#202124' }]}
      scrollable={false}
      noPadding
    >
      <FlatList
        data={favoriteImages}
        key={`${numColumns}`}
        keyExtractor={item => item.path}
        numColumns={numColumns}
        renderItem={({ item, index }) => (
          <View
            style={{
              width: tileWidth,
              marginRight: (index + 1) % numColumns === 0 ? 0 : tileGap,
              marginBottom: tileGap,
            }}
          >
            <FavoriteTile
              item={item}
              onPress={() => {
                setSelectedIndex(index);
                setViewerVisible(true);
              }}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && !isFetching ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium" style={{ color: '#d1d5db' }}>
                No favourite images yet.
              </Text>
            </View>
          ) : null
        }
      />

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
  listContent: {
    paddingTop: 2,
    paddingBottom: 12,
  },
  tilePressable: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2b2c2f',
    overflow: 'hidden',
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
    paddingTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
