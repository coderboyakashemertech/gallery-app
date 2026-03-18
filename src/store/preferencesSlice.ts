import { createSlice } from '@reduxjs/toolkit';

export type PinnedFolder = {
  path: string;
  name: string;
};

export type FolderViewMode = 'grid' | 'list';

type PreferencesState = {
  isDarkMode: boolean;
  pinnedFolders: PinnedFolder[];
  folderViewMode: FolderViewMode;
};

const initialState: PreferencesState = {
  isDarkMode: false,
  pinnedFolders: [],
  folderViewMode: 'grid',
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
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
  },
});

export const { toggleDarkMode, setFolderViewMode, togglePinFolder } = preferencesSlice.actions;
export default preferencesSlice.reducer;
