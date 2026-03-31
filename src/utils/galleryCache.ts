import type { ApiEnvironment } from '../config/api';
import {
  normalizeGalleryFoldersResponse,
  type GalleryFoldersResponse,
  type RawGalleryFoldersResponse,
} from '../types/folders';
import { getStoredString, setStoredString } from './storage';

type GalleryCacheRecord = {
  galleryData: RawGalleryFoldersResponse;
  previewUrls?: Record<string, string | null>;
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
    const raw = await getStoredString(getGalleryCacheKey(apiEnvironment, userKey));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as GalleryCacheRecord;
    const normalizedGalleryData = normalizeGalleryFoldersResponse(
      parsed.galleryData,
    );

    if (
      !parsed ||
      !parsed.galleryData ||
      !Array.isArray(normalizedGalleryData.folders)
    ) {
      return null;
    }

    if (parsed.previewUrls) {
      normalizedGalleryData.folders = normalizedGalleryData.folders.map(folder =>
        folder.previewUrl !== undefined && folder.previewUrl !== null
          ? folder
          : {
              ...folder,
              previewUrl: parsed.previewUrls?.[folder.folder_path] ?? null,
            },
      );
    }

    return {
      galleryData: normalizedGalleryData,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export async function writeGalleryCache(
  apiEnvironment: ApiEnvironment,
  galleryData: GalleryFoldersResponse,
  userKey?: string,
) {
  const payload: GalleryCacheRecord = {
    galleryData,
    savedAt: Date.now(),
  };

  await setStoredString(
    getGalleryCacheKey(apiEnvironment, userKey),
    JSON.stringify(payload),
  );
}
