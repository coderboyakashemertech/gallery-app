import { createSlice } from '@reduxjs/toolkit';

type GalleryState = {
  featuredCount: number;
  welcomeMessage: string;
};

const initialState: GalleryState = {
  featuredCount: 12,
  welcomeMessage: 'Discover curated collections, trending artists, and your next favorite frame.',
};

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {},
});

export default gallerySlice.reducer;
