import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

import { MediaViewerModal } from '../../components/MediaViewerModal';
import { Screen } from '../../components/Screen';
import { getApiBaseUrl, resolveApiEnvironment } from '../../config/api';
import type { GalleryStackParamList } from '../../navigation/DrawerNavigator';
import { useListDirectoryQuery } from '../../store/authApi';
import { useAppSelector } from '../../store';
import { DirectoryFile } from '../../types/folders';

import {
  MemoizedGalleryImageTile,
  VIEWER_IMAGE_EXTENSIONS,
} from './components/GalleryImageTile';
import { GalleryTopBar } from './components/GalleryTopBar';

const EMPTY_FILES: DirectoryFile[] = [];

const IMAGE_ONLY_EXTENSIONS = new Set([
  // Common raster
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif',
  // Modern / HDR
  '.heic', '.heif', '.avif', '.jxl',
  // Raw camera formats
  '.raw', '.cr2', '.cr3', '.nef', '.nrw', '.arw', '.srf', '.sr2',
  '.orf', '.rw2', '.dng', '.pef', '.raf', '.erf', '.mrw', '.3fr',
  '.mef', '.mos', '.rwl', '.srw',
  // Other raster
  '.ico', '.svg', '.svgz', '.xbm', '.xpm', '.psd', '.xcf',
  '.wbmp', '.pnm', '.pbm', '.pgm', '.ppm',
]);

export function GalleryImagesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<GalleryStackParamList>>();
  const route = useRoute<RouteProp<GalleryStackParamList, 'GalleryImages'>>();
  const { width } = useWindowDimensions();
  const folder = route.params.folder;
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

  const imageGridColumns = 3;
  const tileGap = 1;
  const tileWidth = Math.floor(
    (width - tileGap * (imageGridColumns - 1)) / imageGridColumns,
  );

  const {
    currentData: selectedFolderContents,
    isLoading,
    isFetching,
    refetch,
  } = useListDirectoryQuery({ path: folder.folder_path });

  const folderFiles = React.useMemo(
    () =>
      (selectedFolderContents?.files ?? EMPTY_FILES).filter(
        file =>
          file.extension &&
          IMAGE_ONLY_EXTENSIONS.has(file.extension.toLowerCase()),
      ),
    [selectedFolderContents],
  );

  const imageRows = React.useMemo(() => {
    const rows: DirectoryFile[][] = [];

    for (let index = 0; index < folderFiles.length; index += imageGridColumns) {
      rows.push(folderFiles.slice(index, index + imageGridColumns));
    }

    return rows;
  }, [folderFiles, imageGridColumns]);
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

  return (
    <Screen
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      scrollable={false}
      noPadding
      edges={['bottom', 'left', 'right']}
    >
      <GalleryTopBar
        title={folder.folder_name}
        subtitle={`${folderFiles.length} item${folderFiles.length === 1 ? '' : 's'}`}
        isRefreshing={isFetching}
        onRefresh={() => {
          refetch();
        }}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={imageRows}
        key={`gallery-folder-${folder.folder_path}-${imageGridColumns}`}
        keyExtractor={(row, index) => row[0]?.path ?? `gallery-row-${index}`}
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
                const mediaIndex = viewerFiles.findIndex(
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
        contentContainerStyle={[styles.imagesContent, { paddingBottom: insets.bottom + 48 }]}
        ListEmptyComponent={
          !isLoading && !isFetching ? (
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
