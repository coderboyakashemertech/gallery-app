import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ImageIcon } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';

import { LucideIcon } from '../../../components/LucideIcon';
import type { DirectoryFile } from '../../../types/folders';

export const VIEWER_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.heic',
  '.heif',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
];

export function GalleryImageTile({
  item,
  onPress,
  token,
  apiBaseUrl,
}: {
  item: DirectoryFile;
  onPress: () => void;
  token?: string | null;
  apiBaseUrl?: string | null;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const theme = useTheme();
  const isImage = Boolean(
    item.extension &&
    VIEWER_IMAGE_EXTENSIONS.includes(item.extension.toLowerCase()),
  );

  const fullUrl = React.useMemo(() => {
    if (!item.url) return null;
    if (item.url.startsWith('http')) return item.url;
    return apiBaseUrl ? `${apiBaseUrl}${item.url}` : item.url;
  }, [item.url, apiBaseUrl]);

  console.log(fullUrl)

  return (
    <Pressable onPress={onPress} style={styles.tilePressable}>
      {!previewFailed && isImage && fullUrl ? (
        <FastImage
          source={{
            uri: fullUrl,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
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

export const MemoizedGalleryImageTile = React.memo(GalleryImageTile);

const styles = StyleSheet.create({
  tilePressable: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0,
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
});
