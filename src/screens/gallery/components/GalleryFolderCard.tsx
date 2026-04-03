import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Folder } from 'lucide-react-native';
import { Text, useTheme } from 'react-native-paper';

import { LucideIcon } from '../../../components/LucideIcon';
import type { Folder as GalleryFolder } from '../../../types/folders';

export function GalleryFolderCard({
  folder,
  previewUrl,
  onPress,
  token,
  apiBaseUrl,
}: {
  folder: GalleryFolder;
  previewUrl?: string | null;
  onPress: () => void;
  token?: string | null;
  apiBaseUrl?: string | null;
}) {
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const theme = useTheme();

  const fullUrl = React.useMemo(() => {
    if (!previewUrl) return null;
    if (previewUrl.startsWith('http')) return previewUrl;

    // If the database gives us a raw, encoded filesystem path without the API route:
    if (previewUrl.startsWith('%2F') || previewUrl.startsWith('/mnt/')) {
      const safePath = previewUrl.startsWith('%2F')
        ? previewUrl
        : encodeURIComponent(previewUrl);
      return apiBaseUrl ? `${apiBaseUrl}/drives/file?path=${safePath}` : previewUrl;
    }

    const separator = previewUrl.startsWith('/') ? '' : '/';
    return apiBaseUrl ? `${apiBaseUrl}${separator}${previewUrl}` : previewUrl;
  }, [previewUrl, apiBaseUrl]);

  console.log(fullUrl)

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
          !fullUrl || previewFailed
            ? { backgroundColor: theme.colors.surfaceVariant }
            : null,
        ]}
      >
        {fullUrl && !previewFailed ? (
          <FastImage
            source={{
              uri: fullUrl,
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }}
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
          style={[styles.folderTitle, { color: theme.colors.onSurface }]}
        >
          {folder.folder_name}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.folderMeta, { color: theme.colors.onSurfaceVariant }]}
        >
          {folder.file_count} item{folder.file_count === 1 ? '' : 's'}
        </Text>
      </View>
    </Pressable>
  );
}

export const MemoizedGalleryFolderCard = React.memo(GalleryFolderCard);

const styles = StyleSheet.create({
  folderCard: {
    width: '100%',
    marginBottom: 8,
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
    paddingTop: 10,
    paddingHorizontal: 4,
    gap: 2,
  },
  folderTitle: {
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  folderMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
