import { createSlice } from '@reduxjs/toolkit';

type PreferencesState = {
  isDarkMode: boolean;
};

const initialState: PreferencesState = {
  isDarkMode: false,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { toggleDarkMode } = preferencesSlice.actions;
export default preferencesSlice.reducer;
