import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ApiEnvironment } from '../config/api';
import type { GalleryFoldersResponse } from '../types/folders';

type GalleryCacheRecord = {
  galleryData: GalleryFoldersResponse;
  previewUrls: Record<string, string | null>;
  savedAt: number;
};

function getGalleryCacheKey(
  apiEnvironment: ApiEnvironment,
  userKey: string | undefined,
) {
  return `gallery-cache:${apiEnvironment}:${userKey ?? 'anonymous'}`;
}

export async function readGalleryCache(
  apiEnvironment: ApiEnvironment,
  userKey?: string,
) {
  try {
    const raw = await AsyncStorage.getItem(
      getGalleryCacheKey(apiEnvironment, userKey),
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as GalleryCacheRecord;

    if (
      !parsed ||
      !parsed.galleryData ||
      !Array.isArray(parsed.galleryData.folders) ||
      typeof parsed.previewUrls !== 'object' ||
      !parsed.previewUrls
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function writeGalleryCache(
  apiEnvironment: ApiEnvironment,
  galleryData: GalleryFoldersResponse,
  previewUrls: Record<string, string | null>,
  userKey?: string,
) {
  const payload: GalleryCacheRecord = {
    galleryData,
    previewUrls,
    savedAt: Date.now(),
  };

  await AsyncStorage.setItem(
    getGalleryCacheKey(apiEnvironment, userKey),
    JSON.stringify(payload),
  );
}
