export interface Folder {
    folder_name: string;
    folder_path: string;
    file_count: number;
    folder_size_bytes: number;
    latest_mtime: number;
    previewUrl?: string | null;
}

export interface GalleryFoldersResponse {
    root: string;
    generated_at: number;
    folders: Folder[];
}

export type RawGalleryFolder = Partial<Folder> & {
    album_name?: string;
    folder?: string;
    item_count?: number;
    last_updated?: number;
};

export type RawGalleryFoldersResponse =
    | GalleryFoldersResponse
    | RawGalleryFolder[];

export function normalizeGalleryFolder(folder: RawGalleryFolder): Folder {
    return {
        folder_name: folder.folder_name ?? folder.album_name ?? 'Untitled',
        folder_path: folder.folder_path ?? folder.folder ?? '',
        file_count: folder.file_count ?? folder.item_count ?? 0,
        folder_size_bytes: folder.folder_size_bytes ?? 0,
        latest_mtime: folder.latest_mtime ?? folder.last_updated ?? 0,
        previewUrl: folder.previewUrl ?? null,
    };
}

export function normalizeGalleryFoldersResponse(
    response: RawGalleryFoldersResponse,
): GalleryFoldersResponse {
    if (Array.isArray(response)) {
        return {
            root: '',
            generated_at: Date.now(),
            folders: response.map(normalizeGalleryFolder),
        };
    }

    return {
        root: response.root ?? '',
        generated_at: response.generated_at ?? Date.now(),
        folders: Array.isArray(response.folders)
            ? response.folders.map(normalizeGalleryFolder)
            : [],
    };
}

export interface DirectoryItem {
    name: string;
    path: string;
    type: 'directory' | 'file';
}

export interface DirectoryFolder extends DirectoryItem {
    type: 'directory';
}

export interface DirectoryFile extends DirectoryItem {
    type: 'file';
    size: number;
    extension: string | null;
    url: string;
}

export interface DirectoryContentsResponse {
    name: string;
    path: string;
    folders: DirectoryFolder[];
    files: DirectoryFile[];
}
