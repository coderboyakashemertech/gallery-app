export interface Folder {
    folder_name: string;
    folder_path: string;
    file_count: number;
    folder_size_bytes: number;
    latest_mtime: number;
}

export interface GalleryFoldersResponse {
    root: string;
    generated_at: number;
    folders: Folder[];
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
