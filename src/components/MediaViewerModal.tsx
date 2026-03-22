import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Copy,
  ImageIcon,
  Download,
  Folder,
  MoreVertical,
  Share2,
  Star,
  SquareArrowOutUpRight,
  X,
} from 'lucide-react-native';

import { LucideIcon } from './LucideIcon';
import { copyImageToClipboard } from '../native/imageClipboard';
import { getDownloadDestination } from '../utils/downloads';
import { ensureAndroidStoragePermission } from '../utils/storagePermissions';
import {
  useCreateAlbumMutation,
  useGetAlbumsQuery,
  useSaveAlbumImageMutation,
  useSaveFavoriteImageMutation,
} from '../store/authApi';
import { showToast } from '../utils/toast';

type MediaItem = {
  path: string;
  name: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex: number;
};

type ZoomableImageProps = {
  item: MediaItem;
  width: number;
  height: number;
  isActive: boolean;
  isZoomed: boolean;
  onZoomChange: (isZoomed: boolean) => void;
  onSingleTap: () => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function getMaxOffset(size: number, scale: number) {
  'worklet';
  return ((scale - 1) * size) / 2;
}

function getAnchoredTranslation(
  tapOffset: number,
  currentScale: number,
  nextScale: number,
  currentTranslate: number,
  size: number,
) {
  'worklet';

  const safeCurrentScale = currentScale <= 0 ? 1 : currentScale;
  const nextTranslate =
    currentTranslate + tapOffset * (1 - nextScale / safeCurrentScale);
  const maxOffset = getMaxOffset(size, nextScale);

  return clamp(nextTranslate, -maxOffset, maxOffset);
}

const ZOOM_TIMING_CONFIG = {
  duration: 140,
};
const DOUBLE_TAP_ZOOM_LEVELS = [2, 3, 4];

function ZoomableImage({
  item,
  width,
  height,
  isActive,
  isZoomed,
  onZoomChange,
  onSingleTap,
}: ZoomableImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const scale = useSharedValue(1);
  const scaleOffset = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const notifyZoomChange = useCallback(
    (nextZoomed: boolean) => {
      onZoomChange(nextZoomed);
    },
    [onZoomChange],
  );

  const reset = useCallback(() => {
    scale.value = withTiming(1, ZOOM_TIMING_CONFIG);
    scaleOffset.value = 1;
    translateX.value = withTiming(0, ZOOM_TIMING_CONFIG);
    translateY.value = withTiming(0, ZOOM_TIMING_CONFIG);
    onZoomChange(false);
  }, [onZoomChange, scale, scaleOffset, translateX, translateY]);

  useEffect(() => {
    if (!isActive) {
      reset();
    }
  }, [isActive, reset]);

  useEffect(() => {
    setIsLoading(true);
  }, [item.path]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      scaleOffset.value = scale.value;
    })
    .onUpdate(event => {
      const nextScale = clamp(scaleOffset.value * event.scale, 1, 4);
      scale.value = nextScale;
    })
    .onEnd(() => {
      if (scale.value <= 1.02) {
        scale.value = withTiming(1, ZOOM_TIMING_CONFIG);
        scaleOffset.value = 1;
        translateX.value = withTiming(0, ZOOM_TIMING_CONFIG);
        translateY.value = withTiming(0, ZOOM_TIMING_CONFIG);
        runOnJS(notifyZoomChange)(false);
        return;
      }

      const nextScale = clamp(scale.value, 1, 4);
      const maxOffsetX = getMaxOffset(width, nextScale);
      const maxOffsetY = getMaxOffset(height, nextScale);

      scale.value = withTiming(nextScale, ZOOM_TIMING_CONFIG);
      translateX.value = withTiming(
        clamp(translateX.value, -maxOffsetX, maxOffsetX),
        ZOOM_TIMING_CONFIG,
      );
      translateY.value = withTiming(
        clamp(translateY.value, -maxOffsetY, maxOffsetY),
        ZOOM_TIMING_CONFIG,
      );
      scaleOffset.value = nextScale;
      runOnJS(notifyZoomChange)(true);
    });

  const panGesture = Gesture.Pan()
    .enabled(isActive && isZoomed)
    .onStart(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    })
    .onUpdate(event => {
      if (scale.value <= 1) {
        return;
      }

      const maxOffsetX = ((scale.value - 1) * width) / 2;
      const maxOffsetY = ((scale.value - 1) * height) / 2;

      translateX.value = clamp(
        panStartX.value + event.translationX,
        -maxOffsetX,
        maxOffsetX,
      );
      translateY.value = clamp(
        panStartY.value + event.translationY,
        -maxOffsetY,
        maxOffsetY,
      );
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(event => {
      if (
        scale.value >=
        DOUBLE_TAP_ZOOM_LEVELS[DOUBLE_TAP_ZOOM_LEVELS.length - 1] - 0.1
      ) {
        scale.value = withTiming(1, ZOOM_TIMING_CONFIG);
        scaleOffset.value = 1;
        translateX.value = withTiming(0, ZOOM_TIMING_CONFIG);
        translateY.value = withTiming(0, ZOOM_TIMING_CONFIG);
        runOnJS(notifyZoomChange)(false);
        return;
      }

      const nextScale =
        DOUBLE_TAP_ZOOM_LEVELS.find(level => scale.value < level - 0.1) ??
        DOUBLE_TAP_ZOOM_LEVELS[0];
      const tapOffsetX = event.x - width / 2;
      const tapOffsetY = event.y - height / 2;
      const nextTranslateX = getAnchoredTranslation(
        tapOffsetX,
        scale.value,
        nextScale,
        translateX.value,
        width,
      );
      const nextTranslateY = getAnchoredTranslation(
        tapOffsetY,
        scale.value,
        nextScale,
        translateY.value,
        height,
      );

      scale.value = withTiming(nextScale, ZOOM_TIMING_CONFIG);
      scaleOffset.value = nextScale;
      translateX.value = withTiming(nextTranslateX, ZOOM_TIMING_CONFIG);
      translateY.value = withTiming(nextTranslateY, ZOOM_TIMING_CONFIG);
      runOnJS(notifyZoomChange)(true);
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(220)
    .onEnd(() => {
      runOnJS(onSingleTap)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const tapGesture = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    tapGesture,
  );

  return (
    <View style={[styles.page, { width, height }]}>
      {isLoading ? (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <Image
            source={{ uri: item.path }}
            style={[styles.image, { width, height }]}
            resizeMode="contain"
            onLoadStart={() => {
              setIsLoading(true);
            }}
            onLoadEnd={() => {
              setIsLoading(false);
            }}
            onError={() => {
              setIsLoading(false);
            }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type HeaderProps = {
  imageIndex: number;
  media: MediaItem[];
  onClose: () => void;
  onAddToFavorite: () => void;
  onAddToAlbum: () => void;
  onOpenMenu: () => void;
  menuVisible: boolean;
  onCopyImage: () => void;
  onOpenWith: () => void;
  onShare: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  topInset: number;
};

function ViewerHeader({
  imageIndex,
  media,
  onClose,
  onAddToFavorite,
  onAddToAlbum,
  onOpenMenu,
  menuVisible,
  onCopyImage,
  onOpenWith,
  onShare,
  onDownload,
  onCopyLink,
  topInset,
}: HeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: topInset, height: topInset + 56 }]}>
      <Pressable onPress={onClose} style={styles.backButton}>
        <LucideIcon icon={X} color="#fff" size={24} />
      </Pressable>
      <View style={styles.titleContainer}>
        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
          {truncateFileName(media[imageIndex]?.name ?? '')}
        </Text>
        <Text variant="labelSmall" style={styles.subtitle}>
          {imageIndex + 1} of {media.length}
        </Text>
      </View>
      <View style={styles.menuWrap}>
        <View style={styles.headerActions}>
          <Pressable
            onPress={onAddToFavorite}
            style={styles.menuButton}
            hitSlop={10}
          >
            <LucideIcon icon={Star} color="#fff" size={20} />
          </Pressable>
          <Pressable
            onPress={onOpenMenu}
            style={styles.menuButton}
            hitSlop={10}
          >
            <LucideIcon icon={MoreVertical} color="#fff" size={22} />
          </Pressable>
        </View>
        {menuVisible ? (
          <View style={styles.dropdownMenu}>
            <Pressable onPress={onAddToAlbum} style={styles.dropdownItem}>
              <LucideIcon icon={Folder} color="#fff" size={16} />
              <Text style={styles.dropdownText}>Add To Album</Text>
            </Pressable>
            <Pressable onPress={onCopyImage} style={styles.dropdownItem}>
              <LucideIcon icon={ImageIcon} color="#fff" size={16} />
              <Text style={styles.dropdownText}>Copy Image</Text>
            </Pressable>
            <Pressable onPress={onCopyLink} style={styles.dropdownItem}>
              <LucideIcon icon={Copy} color="#fff" size={16} />
              <Text style={styles.dropdownText}>Copy Link</Text>
            </Pressable>
            <Pressable onPress={onOpenWith} style={styles.dropdownItem}>
              <LucideIcon icon={SquareArrowOutUpRight} color="#fff" size={16} />
              <Text style={styles.dropdownText}>Open With</Text>
            </Pressable>
            <Pressable onPress={onShare} style={styles.dropdownItem}>
              <LucideIcon icon={Share2} color="#fff" size={16} />
              <Text style={styles.dropdownText}>Share</Text>
            </Pressable>
            <Pressable onPress={onDownload} style={styles.dropdownItem}>
              <LucideIcon icon={Download} color="#fff" size={16} />
              <Text style={styles.dropdownText}>Download</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function sanitizeFileName(name: string) {
  return name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
}

function truncateFileName(name: string, maxLength = 15) {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength)}...`;
}

function getMimeType(name: string) {
  const extension = name.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export function MediaViewerModal({
  visible,
  onClose,
  media,
  initialIndex,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [sharingItem, setSharingItem] = useState(false);
  const [downloadingItem, setDownloadingItem] = useState(false);
  const [openingExternally, setOpeningExternally] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [albumSheetVisible, setAlbumSheetVisible] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [savingAlbumImage, setSavingAlbumImage] = useState(false);
  const [saveFavoriteImage] = useSaveFavoriteImageMutation();
  const [createAlbum] = useCreateAlbumMutation();
  const [saveAlbumImage] = useSaveAlbumImageMutation();
  const { data: albumsData, isLoading: loadingAlbums } = useGetAlbumsQuery(
    undefined,
    { skip: !visible },
  );
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MediaItem>>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setChromeVisible(true);
      setMenuVisible(false);
      setAlbumSheetVisible(false);
      setNewAlbumName('');
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    });
  }, [initialIndex, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: currentIndex * width,
        animated: false,
      });
    });
  }, [currentIndex, visible, width, height]);

  const handleToggleChrome = useCallback(() => {
    setChromeVisible(previousValue => !previousValue);
    setMenuVisible(false);
  }, []);

  if (!visible || !media.length) {
    return null;
  }

  const currentMedia = media[currentIndex];
  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, 8)
      : Math.max(insets.top, 12);
  const bottomInset = Math.max(insets.bottom, 16);

  const handleCopyLink = () => {
    if (!currentMedia) {
      return;
    }

    Clipboard.setString(currentMedia.path);
    setMenuVisible(false);
    showToast(`${currentMedia.name} link copied`);
  };

  const closeAlbumSheet = () => {
    setAlbumSheetVisible(false);
    setNewAlbumName('');
  };

  const openAlbumSheet = () => {
    setMenuVisible(false);
    setAlbumSheetVisible(true);
  };

  const handleAddToFavorite = async () => {
    if (!currentMedia || savingFavorite) {
      return;
    }

    setMenuVisible(false);
    setSavingFavorite(true);

    try {
      await saveFavoriteImage({
        imageUrl: currentMedia.path,
        name: currentMedia.name,
      }).unwrap();
      showToast('Added to favourites');
    } catch (error: any) {
      const message =
        error?.data?.message ||
        (typeof error?.data === 'string' ? error.data : null) ||
        'Could not save this image to favourites.';
      showToast(message);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleAddToAlbum = async (albumId: number, albumName: string) => {
    if (!currentMedia || savingAlbumImage || creatingAlbum) {
      return;
    }

    setSavingAlbumImage(true);

    try {
      await saveAlbumImage({
        albumId,
        imageUrl: currentMedia.path,
        name: currentMedia.name,
      }).unwrap();
      closeAlbumSheet();
      showToast(`Added to ${albumName}`);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        (typeof error?.data === 'string' ? error.data : null) ||
        'Could not save this image to the album.';
      showToast(message);
    } finally {
      setSavingAlbumImage(false);
    }
  };

  const handleCreateAlbumAndAdd = async () => {
    const trimmedName = newAlbumName.trim();

    if (!currentMedia || !trimmedName || creatingAlbum || savingAlbumImage) {
      if (!trimmedName) {
        showToast('Album name is required.');
      }
      return;
    }

    setCreatingAlbum(true);

    try {
      const album = await createAlbum({ name: trimmedName }).unwrap();
      await saveAlbumImage({
        albumId: album.id,
        imageUrl: currentMedia.path,
        name: currentMedia.name,
      }).unwrap();
      closeAlbumSheet();
      showToast(`Added to ${album.name}`);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        (typeof error?.data === 'string' ? error.data : null) ||
        'Could not create this album.';
      showToast(message);
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleCopyImage = async () => {
    if (!currentMedia) {
      return;
    }

    setMenuVisible(false);
    setCopyingImage(true);

    const sanitizedName = sanitizeFileName(currentMedia.name || 'file');
    const tempPath = `${
      ReactNativeBlobUtil.fs.dirs.CacheDir
    }/${Date.now()}_${sanitizedName}`;

    try {
      const response = await ReactNativeBlobUtil.config({
        path: tempPath,
        fileCache: true,
      }).fetch('GET', currentMedia.path);

      await copyImageToClipboard(response.path());
      showToast(`${currentMedia.name} image copied`);
    } catch {
      showToast('Could not copy this image.');
    } finally {
      setCopyingImage(false);
    }
  };

  const handleOpenWith = async () => {
    if (!currentMedia) {
      return;
    }

    setMenuVisible(false);
    setOpeningExternally(true);

    const tempPath = `${
      ReactNativeBlobUtil.fs.dirs.CacheDir
    }/${sanitizeFileName(currentMedia.name || 'file')}`;

    try {
      const response = await ReactNativeBlobUtil.config({
        path: tempPath,
        fileCache: true,
      }).fetch('GET', currentMedia.path);

      const localPath = response.path();

      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.android.actionViewIntent(
          localPath,
          getMimeType(currentMedia.name),
        );
      } else {
        await ReactNativeBlobUtil.ios.openDocument(localPath);
      }
    } catch {
      showToast('Could not open this file with any supported application.');
    } finally {
      setOpeningExternally(false);
    }
  };

  const handleShare = async () => {
    if (!currentMedia) {
      return;
    }

    setMenuVisible(false);
    setSharingItem(true);

    const sanitizedName = sanitizeFileName(currentMedia.name || 'file');
    const tempPath = `${
      ReactNativeBlobUtil.fs.dirs.CacheDir
    }/${Date.now()}_${sanitizedName}`;

    try {
      const response = await ReactNativeBlobUtil.config({
        path: tempPath,
      }).fetch('GET', currentMedia.path);
      const localFilePath = response.path();

      await Share.open({
        url: `file://${localFilePath}`,
        type: getMimeType(currentMedia.name),
        title: currentMedia.name,
        subject: currentMedia.name,
        message: currentMedia.name,
        filename: currentMedia.name,
      });

      setTimeout(() => {
        ReactNativeBlobUtil.fs.unlink(localFilePath).catch(() => {});
      }, 5000);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        showToast('Could not share this image.');
      }
    } finally {
      setSharingItem(false);
    }
  };

  const handleDownload = async () => {
    if (!currentMedia) {
      return;
    }

    setMenuVisible(false);
    setDownloadingItem(true);

    const sanitizedName = sanitizeFileName(currentMedia.name || 'file');

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
            title: currentMedia.name,
            description: `Downloading ${currentMedia.name}`,
            mime: getMimeType(currentMedia.name),
          },
        },
        ios: {
          path: downloadTarget.filePath,
        },
      });

      await ReactNativeBlobUtil.config(configOptions || {}).fetch(
        'GET',
        currentMedia.path,
      );

      showToast(
        `${currentMedia.name} was saved to ${downloadTarget.successLabel}.`,
      );
    } catch {
      showToast('Could not download this image.');
    } finally {
      setDownloadingItem(false);
    }
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<MediaItem>) => (
    <ZoomableImage
      item={item}
      width={width}
      height={height}
      isActive={index === currentIndex}
      isZoomed={index === currentIndex && isZoomed}
      onZoomChange={setIsZoomed}
      onSingleTap={handleToggleChrome}
    />
  );

  const handleMomentumEnd = (offsetX: number) => {
    const nextIndex = Math.round(offsetX / width);

    if (
      nextIndex !== currentIndex &&
      nextIndex >= 0 &&
      nextIndex < media.length
    ) {
      setCurrentIndex(nextIndex);
      setIsZoomed(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000"
        translucent={true}
        hidden={true}
      />
      <GestureHandlerRootView style={styles.container}>
        {menuVisible ? (
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
        ) : null}
        {sharingItem || downloadingItem || openingExternally || copyingImage || savingFavorite || creatingAlbum || savingAlbumImage ? (
          <View style={styles.actionOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
        {albumSheetVisible ? (
          <>
            <Pressable style={styles.albumBackdrop} onPress={closeAlbumSheet} />
            <View style={[styles.albumSheet, { paddingBottom: bottomInset + 12 }]}>
              <Text variant="titleMedium" style={styles.albumSheetTitle}>
                Save To Album
              </Text>
              <Text variant="bodySmall" style={styles.albumSheetSubtitle}>
                Create a new album or choose an existing one for this photo.
              </Text>
              <TextInput
                mode="outlined"
                label="New album name"
                value={newAlbumName}
                onChangeText={setNewAlbumName}
                style={styles.albumInput}
                theme={{ colors: { primary: '#fff', outline: '#4b5563' } }}
                textColor="#fff"
              />
              <Pressable
                onPress={handleCreateAlbumAndAdd}
                style={({ pressed }) => [
                  styles.albumPrimaryAction,
                  pressed ? styles.albumPrimaryActionPressed : null,
                ]}
              >
                <Text style={styles.albumPrimaryActionText}>
                  {creatingAlbum ? 'Creating Album...' : 'Create And Add Photo'}
                </Text>
              </Pressable>
              <Text variant="labelMedium" style={styles.albumSectionLabel}>
                Existing albums
              </Text>
              {loadingAlbums ? (
                <View style={styles.albumLoadingWrap}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <ScrollView
                  style={styles.albumList}
                  contentContainerStyle={styles.albumListContent}
                >
                  {(albumsData || []).length ? (albumsData || []).map(album => (
                    <Pressable
                      key={album.id}
                      onPress={() => handleAddToAlbum(album.id, album.name)}
                      style={({ pressed }) => [
                        styles.albumRow,
                        pressed ? styles.albumRowPressed : null,
                      ]}
                    >
                      <View style={styles.albumRowIcon}>
                        <LucideIcon icon={Folder} color="#fff" size={18} />
                      </View>
                      <View style={styles.albumRowCopy}>
                        <Text style={styles.albumRowTitle}>{album.name}</Text>
                        <Text style={styles.albumRowMeta}>
                          {album.imageCount} photo{album.imageCount === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </Pressable>
                  )) : (
                    <Text style={styles.albumEmptyText}>No albums yet.</Text>
                  )}
                </ScrollView>
              )}
            </View>
          </>
        ) : null}

        <FlatList
          key={`${width}-${height}`}
          ref={listRef}
          data={media}
          renderItem={renderItem}
          keyExtractor={item => item.path}
          horizontal={true}
          pagingEnabled={true}
          initialScrollIndex={currentIndex}
          scrollEnabled={!isZoomed}
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={event => {
            handleMomentumEnd(event.nativeEvent.contentOffset.x);
          }}
        />

        {chromeVisible ? (
          <>
            <ViewerHeader
              imageIndex={currentIndex}
              media={media}
              onClose={onClose}
              onAddToFavorite={handleAddToFavorite}
              onAddToAlbum={openAlbumSheet}
              onOpenMenu={() => setMenuVisible(true)}
              menuVisible={menuVisible}
              onCopyImage={handleCopyImage}
              onOpenWith={handleOpenWith}
              onShare={handleShare}
              onDownload={handleDownload}
              onCopyLink={handleCopyLink}
              topInset={topInset}
            />
            <Pressable
              onPress={handleShare}
              style={[styles.shareShortcut, { bottom: bottomInset }]}
            >
              <LucideIcon icon={Share2} color="#fff" size={20} />
            </Pressable>
          </>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gallery: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loaderOverlay: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
  menuWrap: {
    position: 'relative',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  subtitle: {
    color: '#ccc',
    textAlign: 'center',
    fontSize: 10,
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  albumBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  albumSheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: 7,
    borderRadius: 24,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '70%',
  },
  albumSheetTitle: {
    color: '#fff',
  },
  albumSheetSubtitle: {
    color: '#cbd5e1',
    marginTop: 4,
    marginBottom: 12,
  },
  albumInput: {
    backgroundColor: '#111827',
  },
  albumPrimaryAction: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumPrimaryActionPressed: {
    opacity: 0.82,
  },
  albumPrimaryActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  albumSectionLabel: {
    color: '#cbd5e1',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  albumLoadingWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumList: {
    flexGrow: 0,
  },
  albumListContent: {
    paddingBottom: 6,
    gap: 8,
  },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  albumRowPressed: {
    opacity: 0.82,
  },
  albumRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  albumRowCopy: {
    flex: 1,
  },
  albumRowTitle: {
    color: '#fff',
  },
  albumRowMeta: {
    color: '#9ca3af',
    marginTop: 2,
    fontSize: 12,
  },
  albumEmptyText: {
    color: '#9ca3af',
    paddingVertical: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 140,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    overflow: 'hidden',
    zIndex: 6,
    elevation: 6,
    paddingVertical: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  dropdownText: {
    color: '#fff',
  },
  shareShortcut: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 5,
    elevation: 5,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
});
