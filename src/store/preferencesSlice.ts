import { createSlice } from '@reduxjs/toolkit';

import {
  DEFAULT_API_ENVIRONMENT,
  type ApiEnvironment,
} from '../config/api';

export type SavedFolder = {
  path: string;
  name: string;
};

export type PinnedFolder = SavedFolder;
export type FavoriteFolder = SavedFolder;

export type FolderViewMode = 'grid' | 'list';

type PreferencesState = {
  apiEnvironment: ApiEnvironment;
  isDarkMode: boolean;
  pinnedFolders: PinnedFolder[];
  favoriteFolders: FavoriteFolder[];
  folderViewMode: FolderViewMode;
};

const initialState: PreferencesState = {
  apiEnvironment: DEFAULT_API_ENVIRONMENT,
  isDarkMode: false,
  pinnedFolders: [],
  favoriteFolders: [],
  folderViewMode: 'list',
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setApiEnvironment(state, action: { payload: ApiEnvironment }) {
      state.apiEnvironment = action.payload;
    },
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
    setFolderViewMode(state, action: { payload: FolderViewMode }) {
      state.folderViewMode = action.payload;
    },
    togglePinFolder(state, action: { payload: PinnedFolder }) {
      if (!state.pinnedFolders) {
        state.pinnedFolders = [];
      }
      const folder = action.payload;
      const index = state.pinnedFolders.findIndex(f => f.path === folder.path);
      if (index >= 0) {
        state.pinnedFolders.splice(index, 1);
      } else {
        state.pinnedFolders.push(folder);
      }
    },
    toggleFavoriteFolder(state, action: { payload: FavoriteFolder }) {
      if (!state.favoriteFolders) {
        state.favoriteFolders = [];
      }
      const folder = action.payload;
      const index = state.favoriteFolders.findIndex(f => f.path === folder.path);
      if (index >= 0) {
        state.favoriteFolders.splice(index, 1);
      } else {
        state.favoriteFolders.push(folder);
      }
    },
  },
});

export const {
  setApiEnvironment,
  toggleDarkMode,
  setFolderViewMode,
  togglePinFolder,
  toggleFavoriteFolder,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
