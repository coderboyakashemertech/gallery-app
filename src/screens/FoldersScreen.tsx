import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Copy,
  Download,
  File as FileIcon,
  Grid2x2,
  HardDrive,
  Image as ImageIcon,
  Film,
  List,
  Music,
  FileArchive,
  FileCode,
  FileQuestion,
  FileText,
  Folder,
  Pin,
  Share2,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Clipboard,
  FlatList,
  Image,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
  type ImageErrorEventData,
} from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconButton, Modal, Portal, Text, useTheme } from 'react-native-paper';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { LoadingOverlay } from '../components/LoadingOverlay';
import { LucideIcon } from '../components/LucideIcon';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { VideoViewerModal } from '../components/VideoViewerModal';
import { Screen } from '../components/Screen';
import { FoldersStackParamList } from '../navigation/DrawerNavigator';
import {
  useGetFavoriteImagesQuery,
  useListDirectoryQuery,
  useMoveItemToRecycleBinMutation,
} from '../store/authApi';
import { useAppDispatch, useAppSelector } from '../store';
import { setFolderViewMode, togglePinFolder } from '../store/preferencesSlice';
import { DirectoryFile, DirectoryFolder } from '../types/folders';
import { getDownloadDestination } from '../utils/downloads';
import { ensureAndroidStoragePermission } from '../utils/storagePermissions';
import { showToast } from '../utils/toast';

type ContextMenuItem = DirectoryFolder | DirectoryFile;
type DirectoryEntry = (DirectoryFolder | DirectoryFile) & { id: string };

const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.heic',
  '.heif',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
];
const VIEWER_IMAGE_EXTENSIONS = IMAGE_EXTENSIONS.filter(ext => ext !== '.svg');
const VIDEO_EXTENSIONS = [
  '.mp4',
  '.m4v',
  '.mov',
  '.mkv',
  '.avi',
  '.wmv',
  '.webm',
];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
const IMAGE_DEBUG_PREFIX = '[FoldersScreen:image]';

const isFileItem = (item: ContextMenuItem): item is DirectoryFile =>
  item.type === 'file';

const logImagePreviewError = (
  item: DirectoryFile,
  event: NativeSyntheticEvent<ImageErrorEventData>,
  surface: 'grid' | 'list',
) => {
  const nativeEvent = event.nativeEvent;

  console.error(`${IMAGE_DEBUG_PREFIX} preview failed`, {
    surface,
    name: item.name,
    path: item.path,
    url: item.url,
    extension: item.extension,
    size: item.size,
    platform: Platform.OS,
    error: nativeEvent.error,
    nativeEvent,
  });
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, power)).toFixed(2))} ${
    units[power]
  }`;
};

const getFileIcon = (extension: string | null) => {
  const ext = extension?.toLowerCase();

  if (!ext) return { icon: FileIcon, color: '#a1a1aa' };
  if (IMAGE_EXTENSIONS.includes(ext))
    return { icon: ImageIcon, color: '#22c55e' };
  if (VIDEO_EXTENSIONS.includes(ext)) return { icon: Film, color: '#fb7185' };
  if (AUDIO_EXTENSIONS.includes(ext)) return { icon: Music, color: '#a78bfa' };
  if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext))
    return { icon: FileText, color: '#60a5fa' };
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext))
    return { icon: FileArchive, color: '#34d399' };
  if (
    [
      '.js',
      '.ts',
      '.tsx',
      '.jsx',
      '.html',
      '.css',
      '.json',
      '.sh',
      '.py',
    ].includes(ext)
  )
    return { icon: FileCode, color: '#f472b6' };

  return { icon: FileQuestion, color: '#94a3b8' };
};

const getMimeType = (ext: string) => {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.mp4': 'video/mp4',
    '.m4v': 'video/x-m4v',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.apk': 'application/vnd.android.package-archive',
  };

  return mimeTypes[ext] || '*/*';
};

const sanitizeFileName = (name: string) =>
  name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');

const truncateLabel = (value: string, maxLength = 10) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const isPreviewableImage = (extension: string | null) => {
  const ext = extension?.toLowerCase();
  return Boolean(ext && IMAGE_EXTENSIONS.includes(ext) && ext !== '.svg');
};

const FolderGlyph = React.memo(
  ({
    accent,
    icon,
    size,
  }: {
    accent: string;
    icon?: React.ReactNode;
    size?: number;
  }) => (
    <View style={styles.folderGlyph}>
      <View style={[styles.folderGlyphShell]}>
        <FontAwesome name="folder" size={size ? size : 88} color={accent} />
      </View>
      {icon ? <View style={styles.folderBadge}>{icon}</View> : null}
    </View>
  ),
);

const FolderGridItem = React.memo(
  ({
    item,
    onPress,
    onLongPress,
  }: {
    item: DirectoryFolder;
    onPress: () => void;
    onLongPress: () => void;
  }) => {
    const isPinned = useAppSelector(
      state =>
        state.preferences.pinnedFolders?.some(
          folder => folder.path === item.path,
        ) ?? false,
    );

    return (
      <Pressable
        style={styles.tilePressable}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={styles.gridTile}>
          <FolderGlyph
            accent="#f2cb48"
            icon={
              isPinned ? (
                <LucideIcon icon={Pin} size={16} color="#8a6300" />
              ) : undefined
            }
          />
          <Text variant="titleMedium" style={styles.gridTileTitle}>
            {truncateLabel(item.name)}
          </Text>
        </View>
      </Pressable>
    );
  },
);

const FileGridItem = React.memo(
  ({
    item,
    onPress,
    onLongPress,
  }: {
    item: DirectoryFile;
    onPress: () => void;
    onLongPress: () => void;
  }) => {
    const [previewFailed, setPreviewFailed] = React.useState(false);
    const fileInfo = getFileIcon(item.extension);
    const shouldShowPreview =
      isPreviewableImage(item.extension) && !previewFailed;

    return (
      <Pressable
        style={styles.tilePressable}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={styles.gridTile}>
          <View
            style={[
              styles.fileGlyph,
              { backgroundColor: 'rgba(255,255,255,0.08)' },
            ]}
          >
            {shouldShowPreview ? (
              <Image
                source={{ uri: item.url }}
                style={styles.filePreview}
                resizeMode="cover"
                resizeMethod="resize"
                progressiveRenderingEnabled={true}
                fadeDuration={0}
                onError={err => {
                  logImagePreviewError(item, err, 'grid');
                  setPreviewFailed(true);
                }}
              />
            ) : (
              <LucideIcon
                icon={fileInfo.icon}
                size={34}
                color={fileInfo.color}
              />
            )}
          </View>
          <Text variant="titleMedium" style={styles.gridTileTitle}>
            {truncateLabel(item.name)}
          </Text>
          <Text
            numberOfLines={1}
            variant="bodySmall"
            style={styles.gridTileMeta}
          >
            {formatSize(item.size)}
            {item.extension
              ? `  ${item.extension.replace('.', '').toUpperCase()}`
              : ''}
          </Text>
        </View>
      </Pressable>
    );
  },
);

const FolderListItem = React.memo(
  ({
    item,
    onPress,
    onLongPress,
    onMenuPress,
    isGridView = false,
  }: {
    item: DirectoryFolder;
    onPress: () => void;
    onLongPress: () => void;
    onMenuPress: () => void;
    isGridView?: boolean;
  }) => {
    const theme = useTheme();
    const isPinned = useAppSelector(
      state =>
        state.preferences.pinnedFolders?.some(
          folder => folder.path === item.path,
        ) ?? false,
    );

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.84 }]}
      >
        <View
          style={[
            styles.rowFolderGlyph,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <LucideIcon icon={Folder} size={20} color="#d9d7f2" />
          {isPinned ? (
            <View style={styles.rowFolderPin}>
              <LucideIcon icon={Pin} size={10} color={theme.colors.primary} />
            </View>
          ) : null}
        </View>
        <View style={styles.rowBody}>
          <Text numberOfLines={1} variant="titleLarge" style={styles.rowTitle}>
            {!isGridView ? item.name : truncateLabel(item.name)}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.rowMeta, { color: theme.colors.onSurfaceVariant }]}
          >
            Folder
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onMenuPress}
          style={styles.rowMenuButton}
        >
          <LucideIcon
            icon={EllipsisVertical}
            size={22}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </Pressable>
    );
  },
);

const FavoriteGalleryItem = React.memo(
  ({
    item,
    onPress,
    onLongPress,
  }: {
    item: DirectoryFile;
    onPress: () => void;
    onLongPress: () => void;
  }) => {
    const theme = useTheme();
    const [previewFailed, setPreviewFailed] = React.useState(false);

    return (
      <Pressable
        style={styles.favoriteTilePressable}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View
          style={[
            styles.favoriteCard,
            {
              backgroundColor: theme.dark
                ? 'rgba(255,255,255,0.05)'
                : theme.colors.surface,
            },
          ]}
        >
          <View style={styles.favoriteImageWrap}>
            {!previewFailed ? (
              <Image
                source={{ uri: item.url }}
                style={styles.favoriteImage}
                resizeMode="cover"
                resizeMethod="resize"
                progressiveRenderingEnabled={true}
                fadeDuration={0}
                onError={err => {
                  logImagePreviewError(item, err, 'grid');
                  setPreviewFailed(true);
                }}
              />
            ) : (
              <View
                style={[
                  styles.favoriteFallback,
                  {
                    backgroundColor: theme.dark
                      ? 'rgba(255,255,255,0.04)'
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <LucideIcon icon={ImageIcon} size={32} color="#7c8aa5" />
              </View>
            )}
          </View>
          <View style={styles.favoriteCardBody}>
            <Text
              numberOfLines={1}
              variant="titleSmall"
              style={styles.favoriteCardTitle}
            >
              {item.name}
            </Text>
            <Text
              numberOfLines={1}
              variant="bodySmall"
              style={[
                styles.favoriteCardMeta,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {formatSize(item.size)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  },
);

const FileListItem = React.memo(
  ({
    item,
    onPress,
    onLongPress,
    onMenuPress,
    isGridView = false,
  }: {
    item: DirectoryFile;
    onPress: () => void;
    onLongPress: () => void;
    onMenuPress: () => void;
    isGridView?: boolean;
  }) => {
    const theme = useTheme();
    const [previewFailed, setPreviewFailed] = React.useState(false);
    const fileInfo = getFileIcon(item.extension);
    const shouldShowPreview =
      isPreviewableImage(item.extension) && !previewFailed;

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.rowItem, pressed && { opacity: 0.84 }]}
      >
        <View
          style={[
            styles.rowFileGlyph,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          {shouldShowPreview ? (
            <Image
              source={{ uri: item.url }}
              style={styles.rowFilePreview}
              resizeMode="cover"
              resizeMethod="resize"
              progressiveRenderingEnabled={true}
              fadeDuration={0}
              onError={err => {
                logImagePreviewError(item, err, 'list');
                setPreviewFailed(true);
              }}
            />
          ) : (
            <LucideIcon icon={fileInfo.icon} size={24} color={fileInfo.color} />
          )}
        </View>
        <View style={styles.rowBody}>
          <Text numberOfLines={1} variant="titleLarge" style={styles.rowTitle}>
            {isGridView ? truncateLabel(item.name) : item.name}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.rowMeta, { color: theme.colors.onSurfaceVariant }]}
          >
            {formatSize(item.size)}
            {item.extension
              ? `  ${item.extension.replace('.', '').toUpperCase()}`
              : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onMenuPress}
          style={styles.rowMenuButton}
        >
          <LucideIcon
            icon={EllipsisVertical}
            size={22}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </Pressable>
    );
  },
);

export function FoldersScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<FoldersStackParamList>>();
  const route = useRoute<RouteProp<FoldersStackParamList, 'Folders'>>();
  const { width } = useWindowDimensions();
  const breadcrumbScrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const pinnedFolders = useAppSelector(
    state => state.preferences.pinnedFolders || [],
  );
  const folderViewMode = useAppSelector(
    state => state.preferences.folderViewMode ?? 'list',
  );

  const [viewerVisible, setViewerVisible] = React.useState(false);
  const [mediaList, setMediaList] = React.useState<
    { path: string; name: string }[]
  >([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0);
  const [videoViewerVisible, setVideoViewerVisible] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<{
    path: string;
    name: string;
  } | null>(null);
  const [preparingFile, setPreparingFile] = React.useState(false);
  const [downloadingItem, setDownloadingItem] = React.useState(false);
  const [sharingItem, setSharingItem] = React.useState(false);
  const [movingToRecycleBin, setMovingToRecycleBin] = React.useState(false);
  const [contextMenuItem, setContextMenuItem] =
    React.useState<ContextMenuItem | null>(null);

  const [moveItemToRecycleBin] = useMoveItemToRecycleBinMutation();

  const path = route.params?.path || '';
  const isFavoritesView = route.params?.view === 'favorites';
  const folderName =
    route.params?.name || (isFavoritesView ? 'Favourites' : 'Root');
  const isGridView = isFavoritesView ? true : folderViewMode === 'grid';
  const numColumns = isFavoritesView
    ? width >= 1200
      ? 4
      : width >= 820
      ? 3
      : 2
    : isGridView
    ? width >= 900
      ? 5
      : width >= 700
      ? 4
      : 3
    : 1;

  const {
    data: favoriteImagesData,
    isLoading: isFavoriteImagesLoading,
    isFetching: isFavoriteImagesFetching,
    refetch: refetchFavoriteImages,
    error: favoriteImagesError,
  } = useGetFavoriteImagesQuery(undefined, {
    skip: !isFavoritesView,
  });

  const { data, isLoading, refetch, isFetching } = useListDirectoryQuery(
    { path },
    { skip: !path || isFavoritesView },
  );

  const breadcrumbs = useMemo(() => {
    if (!path || isFavoritesView) return [];

    const parts = decodeURIComponent(path).split('/').filter(Boolean);
    let currentPath = '';
    const isAbsolute = path.startsWith('%2F') || path.startsWith('/');

    return parts.map((part, index) => {
      currentPath += `${index === 0 && isAbsolute ? '/' : '/'}${part}`;
      return {
        name: part,
        path: encodeURIComponent(currentPath),
      };
    });
  }, [isFavoritesView, path]);

  useEffect(() => {
    breadcrumbScrollViewRef.current?.scrollToEnd({ animated: true });
  }, [breadcrumbs]);

  const favoriteImages = useMemo(
    () => favoriteImagesData || [],
    [favoriteImagesData],
  );

  const combinedData = useMemo<DirectoryEntry[]>(() => {
    if (isFavoritesView) {
      return favoriteImages.map(file => ({
        ...file,
        id: `favorite-image-${file.path}`,
      }));
    }

    if (!data) return [];

    return [
      ...data.folders.map(folder => ({
        ...folder,
        id: `folder-${folder.path}`,
      })),
      ...data.files.map(file => ({ ...file, id: `file-${file.path}` })),
    ];
  }, [data, favoriteImages, isFavoritesView]);

  const folderCount = isFavoritesView ? 0 : data?.folders.length ?? 0;
  const fileCount = isFavoritesView
    ? favoriteImages.length
    : data?.files.length ?? 0;

  const handleFolderPress = (folder: DirectoryFolder) => {
    navigation.push('Folders', { path: folder.path, name: folder.name });
  };

  const closeContextMenu = () => {
    setContextMenuItem(null);
  };

  const openFileExternally = async (file: DirectoryFile, ext: string) => {
    setPreparingFile(true);
    const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${file.name}`;

    try {
      const response = await ReactNativeBlobUtil.config({
        path: tempPath,
        fileCache: true,
      }).fetch('GET', file.url);

      const localPath = response.path();

      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.android.actionViewIntent(
          localPath,
          getMimeType(ext),
        );
      } else {
        await ReactNativeBlobUtil.ios.openDocument(localPath);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      showToast('Could not open this file with any supported application.');
    } finally {
      setPreparingFile(false);
    }
  };

  const handleFilePress = async (file: DirectoryFile) => {
    const ext = file.extension?.toLowerCase() || '';
    const isImage = VIEWER_IMAGE_EXTENSIONS.includes(ext);
    const isVideo = VIDEO_EXTENSIONS.includes(ext);

    if (isImage) {
      const availableFiles = isFavoritesView
        ? favoriteImages
        : data?.files || [];
      const media = availableFiles
        .filter(current => {
          const currentExt = current.extension?.toLowerCase() || '';
          return VIEWER_IMAGE_EXTENSIONS.includes(currentExt);
        })
        .map(current => ({ path: current.url, name: current.name }));

      const index = media.findIndex(mediaItem => mediaItem.path === file.url);
      setMediaList(media);
      setSelectedMediaIndex(index >= 0 ? index : 0);
      setViewerVisible(true);
      return;
    }

    if (isVideo) {
      setSelectedVideo({ path: file.url, name: file.name });
      setVideoViewerVisible(true);
      return;
    }

    if (ext === '.svg') {
      await openFileExternally(file, ext);
      return;
    }

    await openFileExternally(file, ext);
  };

  const handleCopyLink = () => {
    if (!contextMenuItem) return;

    Clipboard.setString(
      isFileItem(contextMenuItem)
        ? contextMenuItem.url
        : decodeURIComponent(contextMenuItem.path),
    );
    showToast(`${contextMenuItem.name} copied`);
    closeContextMenu();
  };

  const handleShareItem = async () => {
    if (!contextMenuItem) return;

    const target = contextMenuItem;
    closeContextMenu();

    try {
      if (isFileItem(target)) {
        setSharingItem(true);
        const sanitizedName = sanitizeFileName(target.name || 'file');
        const ext = target.extension?.replace('.', '').toLowerCase() || '';
        const mimeType = getMimeType(target.extension?.toLowerCase() || '');
        const tempPath = `${
          ReactNativeBlobUtil.fs.dirs.CacheDir
        }/${Date.now()}_${sanitizedName}`;
        const response = await ReactNativeBlobUtil.config({
          path: tempPath,
        }).fetch('GET', target.url);
        const localFilePath = response.path();

        await Share.open({
          url: `file://${localFilePath}`,
          type: mimeType === '*/*' && ext ? `application/${ext}` : mimeType,
          title: target.name,
          subject: target.name,
          message: target.name,
          filename: target.name,
        });

        setTimeout(() => {
          ReactNativeBlobUtil.fs.unlink(localFilePath).catch(cleanupError => {
            console.log('Cleanup error:', cleanupError);
          });
        }, 5000);

        return;
      }

      await Share.open({
        title: target.name,
        subject: target.name,
        message: decodeURIComponent(target.path),
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        showToast('Could not open the share menu for this item.');
      }
    } finally {
      if (isFileItem(target)) {
        setSharingItem(false);
      }
    }
  };

  const handleDownloadItem = async () => {
    if (!contextMenuItem) return;

    if (!isFileItem(contextMenuItem)) {
      showToast('Folder downloads are not available yet.');
      closeContextMenu();
      return;
    }

    const file = contextMenuItem;
    const ext = file.extension?.toLowerCase() || '';
    const mimeType = getMimeType(ext);
    const sanitizedName = sanitizeFileName(file.name);

    closeContextMenu();
    setDownloadingItem(true);

    try {
      const hasStoragePermission = await ensureAndroidStoragePermission();

      if (!hasStoragePermission) {
        showToast('Storage permission is required to save downloads.');
        return;
      }

      const downloadTarget = await getDownloadDestination(sanitizedName);
      const configOptions = Platform.select({
        android: {
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            mediaScannable: true,
            path: downloadTarget.filePath,
            title: file.name,
            description: `Downloading ${file.name}`,
            mime: mimeType,
          },
        },
        ios: {
          path: downloadTarget.filePath,
        },
      });

      await ReactNativeBlobUtil.config(configOptions || {}).fetch(
        'GET',
        file.url,
      );

      showToast(`${file.name} was saved to ${downloadTarget.successLabel}.`);
    } catch (error) {
      console.error('Download error:', error);
      showToast('Could not download this file.');
    } finally {
      setDownloadingItem(false);
    }
  };

  const confirmMoveToRecycleBin = () => {
    if (!contextMenuItem) return;

    const target = contextMenuItem;
    const itemLabel = target.type === 'file' ? 'file' : 'folder';

    Alert.alert(
      'Move to Recycle Bin',
      `Move "${target.name}" to the recycle bin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          style: 'destructive',
          onPress: async () => {
            closeContextMenu();
            setMovingToRecycleBin(true);

            try {
              await moveItemToRecycleBin({
                path: target.path,
                currentPath: path,
              }).unwrap();
              showToast(`${target.name} moved to recycle bin`);
              refetch();
            } catch (error: any) {
              console.error('Recycle bin error:', error);
              const message =
                error?.data?.message ||
                `Could not move this ${itemLabel} to the recycle bin.`;
              showToast(message);
            } finally {
              setMovingToRecycleBin(false);
            }
          },
        },
      ],
    );
  };

  const renderItem: ListRenderItem<DirectoryEntry> = ({ item }) => {
    if (isFavoritesView && item.type === 'file') {
      return (
        <View style={[styles.gridColumn, { width: `${100 / numColumns}%` }]}>
          <FavoriteGalleryItem
            item={item}
            onPress={() => handleFilePress(item)}
            onLongPress={() => setContextMenuItem(item)}
          />
        </View>
      );
    }

    if (item.type === 'directory') {
      return isGridView ? (
        <View style={[styles.gridColumn, { width: `${100 / numColumns}%` }]}>
          <FolderGridItem
            item={item}
            onPress={() => handleFolderPress(item)}
            onLongPress={() => setContextMenuItem(item)}
          />
        </View>
      ) : (
        <FolderListItem
          item={item}
          isGridView={isGridView}
          onPress={() => handleFolderPress(item)}
          onLongPress={() => setContextMenuItem(item)}
          onMenuPress={() => setContextMenuItem(item)}
        />
      );
    }

    return isGridView ? (
      <View style={[styles.gridColumn, { width: `${100 / numColumns}%` }]}>
        <FileGridItem
          item={item}
          onPress={() => handleFilePress(item)}
          onLongPress={() => setContextMenuItem(item)}
        />
      </View>
    ) : (
      <FileListItem
        item={item}
        onPress={() => handleFilePress(item)}
        onLongPress={() => setContextMenuItem(item)}
        onMenuPress={() => setContextMenuItem(item)}
      />
    );
  };

  return (
    <>
      <StatusBar backgroundColor="#232329" barStyle="light-content" />
      <Screen
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        scrollable={false}
        noPadding
        edges={['bottom', 'left', 'right']}
      >
        <View
          style={[
          styles.topPanel,
          { paddingTop: insets.top + 8 },
          isFavoritesView && styles.favoritesTopPanel,
        ]}
        >
          <View style={styles.titleRow}>
            <Pressable
              onPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.getParent()?.navigate('Home')
              }
              style={styles.backButton}
            >
              <LucideIcon
                icon={ChevronLeft}
                size={24}
                color={theme.colors.onSurface}
              />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text variant="headlineSmall" style={styles.titleText}>
                {folderName}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.titleMeta,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {isFavoritesView
                  ? `${fileCount} images`
                  : `${folderCount} folders ${fileCount} files`}
              </Text>
            </View>
            {!isFavoritesView && (
              <IconButton
                icon={({ size }) => (
                  <LucideIcon
                    icon={isGridView ? List : Grid2x2}
                    size={size}
                    color={theme.colors.onSurface}
                  />
                )}
                onPress={() =>
                  dispatch(setFolderViewMode(isGridView ? 'list' : 'grid'))
                }
                style={styles.toolbarIconButton}
              />
            )}
            <IconButton
              icon={({ size }) => (
                <LucideIcon
                  icon={EllipsisVertical}
                  size={size}
                  color={theme.colors.onSurface}
                />
              )}
              onPress={isFavoritesView ? refetchFavoriteImages : refetch}
              disabled={
                isFavoritesView ? isFavoriteImagesFetching : isFetching || !path
              }
              style={styles.toolbarIconButton}
            />
          </View>

        </View>

        {!isFavoritesView && (
          <View style={styles.breadcrumbsSection}>
            <ScrollView
              ref={breadcrumbScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.breadcrumbsWrap}
            >
              <Pressable
                style={styles.crumbPill}
                onPress={() => navigation.getParent()?.navigate('Home')}
              >
                <Text variant="titleSmall" style={styles.crumbText}>
                  Internal storage
                </Text>
              </Pressable>
              {breadcrumbs.map((crumb, index) => (
                <View key={crumb.path} style={styles.crumbItem}>
                  <LucideIcon
                    icon={ChevronRight}
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Pressable
                    style={styles.crumbPill}
                    onPress={() =>
                      navigation.push('Folders', {
                        path: crumb.path,
                        name: crumb.name,
                      })
                    }
                  >
                    <Text
                      variant="titleSmall"
                      style={[
                        styles.crumbText,
                        index === breadcrumbs.length - 1 && styles.crumbTextActive,
                      ]}
                    >
                      {crumb.name}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <LoadingOverlay
          visible={
            isFavoritesView
              ? isFavoriteImagesLoading || isFavoriteImagesFetching
              : isLoading || isFetching
          }
          message={isFavoritesView ? 'Loading favourites...' : 'Browsing...'}
        />
        <LoadingOverlay visible={preparingFile} message="Preparing file..." />
        <LoadingOverlay visible={downloadingItem} message="Downloading..." />
        <LoadingOverlay visible={sharingItem} message="Preparing share..." />
        <LoadingOverlay
          visible={movingToRecycleBin}
          message="Moving to recycle bin..."
        />

        {!path && !isFavoritesView ? (
          <View style={styles.centerContent}>
            <LucideIcon
              icon={HardDrive}
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={styles.infoText}>
              Select a drive from the Home screen to start browsing.
            </Text>
          </View>
        ) : (
          <FlatList
            key={`${folderViewMode}-${numColumns}`}
            data={combinedData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              isFavoritesView
                ? styles.favoritesGridContent
                : isGridView
                ? styles.gridContent
                : styles.listModeContent,
            ]}
            columnWrapperStyle={isGridView ? styles.columnWrapper : undefined}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={7}
            updateCellsBatchingPeriod={60}
            ListEmptyComponent={
              !(isFavoritesView ? isFavoriteImagesLoading : isLoading) ? (
                <View style={styles.centerContent}>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    {isFavoritesView
                      ? favoriteImagesError
                        ? 'Could not load favourites.'
                        : 'No favourite images yet.'
                      : 'This folder is empty.'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        <MediaViewerModal
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
          media={mediaList}
          initialIndex={selectedMediaIndex}
        />
        <VideoViewerModal
          visible={videoViewerVisible}
          onClose={() => setVideoViewerVisible(false)}
          video={selectedVideo}
        />

        <Portal>
          <Modal
            visible={Boolean(contextMenuItem)}
            onDismiss={closeContextMenu}
            contentContainerStyle={styles.contextModal}
          >
            <View
              style={[
                styles.contextSheet,
                { backgroundColor: theme.colors.elevation.level3 },
              ]}
            >
              <View style={styles.contextHandle} />
              <View style={styles.contextHeader}>
                <View style={styles.contextTitleWrap}>
                  <Text
                    variant="labelMedium"
                    style={[
                      styles.contextEyebrow,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {contextMenuItem?.type === 'file'
                      ? 'File actions'
                      : 'Folder actions'}
                  </Text>
                  <Text
                    variant="headlineSmall"
                    numberOfLines={1}
                    style={styles.contextTitle}
                  >
                    {contextMenuItem?.name ?? folderName}
                  </Text>
                </View>
                <IconButton
                  icon={({ size }) => (
                    <LucideIcon
                      icon={X}
                      size={size}
                      color={theme.colors.onSurfaceVariant}
                    />
                  )}
                  onPress={closeContextMenu}
                />
              </View>

              {contextMenuItem?.type === 'file' && (
                <>
                  <Pressable
                    style={[
                      styles.contextAction,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={handleDownloadItem}
                  >
                    <View
                      style={[
                        styles.contextIconWrap,
                        {
                          backgroundColor: theme.dark
                            ? 'rgba(31, 111, 91, 0.22)'
                            : 'rgba(31, 111, 91, 0.12)',
                        },
                      ]}
                    >
                      <LucideIcon
                        icon={Download}
                        size={22}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.contextActionText}>
                      <Text variant="titleMedium">Download</Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Save this file on your device
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.contextAction,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={handleCopyLink}
                  >
                    <View
                      style={[
                        styles.contextIconWrap,
                        {
                          backgroundColor: theme.dark
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(59, 130, 246, 0.12)',
                        },
                      ]}
                    >
                      <LucideIcon icon={Copy} size={22} color="#3b82f6" />
                    </View>
                    <View style={styles.contextActionText}>
                      <Text variant="titleMedium">Copy link</Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Copy the direct link or path
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.contextAction,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={handleShareItem}
                  >
                    <View
                      style={[
                        styles.contextIconWrap,
                        {
                          backgroundColor: theme.dark
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(245, 158, 11, 0.12)',
                        },
                      ]}
                    >
                      <LucideIcon icon={Share2} size={22} color="#f59e0b" />
                    </View>
                    <View style={styles.contextActionText}>
                      <Text variant="titleMedium">Share</Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Send it with another app
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.contextAction,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={confirmMoveToRecycleBin}
                  >
                    <View
                      style={[
                        styles.contextIconWrap,
                        {
                          backgroundColor: theme.dark
                            ? 'rgba(239, 68, 68, 0.22)'
                            : 'rgba(239, 68, 68, 0.12)',
                        },
                      ]}
                    >
                      <LucideIcon icon={Trash2} size={22} color="#ef4444" />
                    </View>
                    <View style={styles.contextActionText}>
                      <Text variant="titleMedium">Move to Recycle Bin</Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Remove it from this folder without deleting permanently
                      </Text>
                    </View>
                  </Pressable>
                </>
              )}

              {contextMenuItem?.type === 'directory' && (
                <>
                  <Pressable
                    style={[
                      styles.contextAction,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={confirmMoveToRecycleBin}
                  >
                    <View
                      style={[
                        styles.contextIconWrap,
                        {
                          backgroundColor: theme.dark
                            ? 'rgba(239, 68, 68, 0.22)'
                            : 'rgba(239, 68, 68, 0.12)',
                        },
                      ]}
                    >
                      <LucideIcon icon={Trash2} size={22} color="#ef4444" />
                    </View>
                    <View style={styles.contextActionText}>
                      <Text variant="titleMedium">Move to Recycle Bin</Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Send this folder and its contents to the recycle bin
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.pinAction,
                      { borderColor: theme.colors.outline },
                    ]}
                    onPress={() => {
                      dispatch(
                        togglePinFolder({
                          path: contextMenuItem.path,
                          name: contextMenuItem.name,
                        }),
                      );
                      closeContextMenu();
                    }}
                  >
                    <Text
                      variant="titleSmall"
                      style={{ color: theme.colors.onSurface }}
                    >
                      {pinnedFolders.some(
                        folder => folder.path === contextMenuItem.path,
                      )
                        ? 'Unpin folder from sidebar'
                        : 'Pin folder to sidebar'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </Modal>
        </Portal>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topPanel: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#232329',
  },
  favoritesTopPanel: {
    paddingBottom: 12,
  },
  breadcrumbsSection: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: '#181a20',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  titleBlock: {
    flex: 1,
    paddingLeft: 4,
  },
  titleText: {
    fontWeight: '500',
  },
  titleMeta: {
    marginTop: 2,
  },
  toolbarIconButton: {
    margin: 0,
  },
  breadcrumbsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingRight: 18,
    paddingBottom: 4,
  },
  crumbPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crumbPillActive: {},
  crumbText: {
    fontWeight: '500',
  },
  crumbTextActive: {
    color: '#dbe3ff',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
  },
  filterChip: {
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterLabel: {
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 96,
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  favoritesGridContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 120,
  },
  listModeContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 2,
  },
  columnWrapper: {
    alignItems: 'flex-start',
  },
  gridColumn: {
    flexShrink: 0,
  },
  tilePressable: {
    width: '100%',
  },
  favoriteTilePressable: {
    width: '100%',
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  favoriteCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  favoriteImageWrap: {
    aspectRatio: 0.86,
    overflow: 'hidden',
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
  },
  favoriteFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteCardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  favoriteCardTitle: {
    fontWeight: '700',
  },
  favoriteCardMeta: {
    marginTop: 3,
  },
  gridTile: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 16,
  },
  folderGlyph: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderGlyphShell: {
    width: 88,
    height: 88,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderBadge: {
    position: 'absolute',
    right: 8,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f7d965',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileGlyph: {
    width: 88,
    height: 70,
    borderRadius: 5,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  gridTileTitle: {
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 12,
    marginTop: 5,
  },
  gridTileMeta: {
    textAlign: 'center',
    opacity: 0.72,
    marginTop: 2,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 22,
    paddingVertical: 12,
    marginBottom: 4,
  },
  rowFolderGlyph: {
    width: 62,
    height: 62,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowFolderPin: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#232329',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowFileGlyph: {
    width: 62,
    height: 62,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowFilePreview: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontWeight: '500',
  },
  rowMeta: {
    marginTop: 4,
  },
  rowMenuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    gap: 16,
  },
  infoText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  emptyText: {
    opacity: 0.6,
  },
  contextModal: {
    justifyContent: 'flex-end',
    padding: 12,
  },
  contextSheet: {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 12,
  },
  contextHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.55)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  contextTitleWrap: {
    flex: 1,
    gap: 4,
  },
  contextEyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  contextTitle: {
    fontWeight: '700',
  },
  contextAction: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  contextIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextActionText: {
    flex: 1,
    gap: 2,
  },
  pinAction: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
