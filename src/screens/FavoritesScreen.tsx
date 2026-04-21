import React from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MediaViewerModal } from '../components/MediaViewerModal';
import { Screen } from '../components/Screen';
import { getApiBaseUrl, resolveApiEnvironment } from '../config/api';
import { useAppSelector } from '../store';
import { useGetFavoriteImagesQuery } from '../store/authApi';
import { DirectoryFile } from '../types/folders';

import { MemoizedGalleryImageTile } from './gallery/components/GalleryImageTile';
import { GalleryTopBar } from './gallery/components/GalleryTopBar';

const EMPTY_FAVORITE_IMAGES: DirectoryFile[] = [];

export function FavoritesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { data, isLoading, isFetching, refetch } = useGetFavoriteImagesQuery();
  const token = useAppSelector(state => state.auth.token);
  const apiEnvironment = useAppSelector(
    state => state.preferences.apiEnvironment,
  );
  const apiBaseUrl = React.useMemo(
    () => getApiBaseUrl(resolveApiEnvironment(apiEnvironment)),
    [apiEnvironment],
  );

  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const favoriteImages = data ?? EMPTY_FAVORITE_IMAGES;

  const imageGridColumns = 3;
  const tileGap = 1;
  const tileWidth = Math.floor(
    (width - tileGap * (imageGridColumns - 1)) / imageGridColumns,
  );

  const imageRows = React.useMemo(() => {
    const rows: DirectoryFile[][] = [];
    for (let index = 0; index < favoriteImages.length; index += imageGridColumns) {
      rows.push(favoriteImages.slice(index, index + imageGridColumns));
    }
    return rows;
  }, [favoriteImages, imageGridColumns]);

  const media = React.useMemo(
    () => favoriteImages.map(item => ({ path: item.url, name: item.name })),
    [favoriteImages],
  );

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      scrollable={false}
      noPadding
      edges={['bottom', 'left', 'right']}
    >
      <GalleryTopBar
        title="Favourites"
        subtitle={`${favoriteImages.length} item${favoriteImages.length === 1 ? '' : 's'}`}
        isRefreshing={isFetching}
        onRefresh={() => {
          refetch();
        }}
        onMenu={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      />

      <FlatList
        data={imageRows}
        key={`favorites-gallery-${imageGridColumns}`}
        keyExtractor={(row, index) => row[0]?.path ?? `favorites-row-${index}`}
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
                const mediaIndex = favoriteImages.findIndex(
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
          !isLoading && !isFetching ? (
            <View style={styles.emptyState}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                No favourite images yet.
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
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
