import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '../config/api';
import type {
  ApiSuccessResponse,
  AuthPayload,
  LoginPayload,
  TwoFactorSetup,
  User,
} from '../types/auth';
import type { Drive } from '../types/drives';
import type {
  DirectoryContentsResponse,
  DirectoryFile,
  GalleryFoldersResponse,
} from '../types/folders';

type RecycleBinResponse = {
  name: string;
  path: string;
} | null;

type FavoriteImageResponse = {
  id: string;
  imageUrl: string;
  createdAt: string;
};

type AuthStateWithToken = { auth: { token?: string | null } };

const getImageExtension = (imageUrl: string) => {
  const match = imageUrl.match(/(\.[a-z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : null;
};

const mapFavoriteImageToDirectoryFile = (
  favoriteImage: FavoriteImageResponse,
): DirectoryFile => {
  const fallbackName = decodeURIComponent(
    favoriteImage.imageUrl.split('/').pop() || 'Favourite image',
  );

  return {
    type: 'file',
    path: favoriteImage.id,
    url: favoriteImage.imageUrl,
    name: fallbackName,
    size: 0,
    extension: getImageExtension(favoriteImage.imageUrl),
  };
};

console.log('🚀 ~ API_BASE_URL:', API_BASE_URL);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthStateWithToken).auth.token;
    console.log("🚀 ~ token:", token)

    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    return result;
  }

  const body = result.data as ApiSuccessResponse<unknown>;
  return { data: body.data };
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Profile', 'Directory', 'Favorites'],
  endpoints: builder => ({
    register: builder.mutation<
      AuthPayload,
      { name: string; password: string; username: string }
    >({
      query: body => ({
        url: '/api/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<
      LoginPayload,
      { otp?: string; password: string; username: string }
    >({
      query: body => ({
        url: '/api/login',
        method: 'POST',
        body,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => '/api/auth/me',
      transformResponse: (response: { user: User }) => response.user,
      providesTags: ['Profile'],
    }),
    beginTwoFactorSetup: builder.mutation<TwoFactorSetup, void>({
      query: () => ({
        url: '/api/auth/2fa/setup',
        method: 'POST',
      }),
    }),
    verifyTwoFactorSetup: builder.mutation<User, { otp: string }>({
      query: body => ({
        url: '/api/auth/2fa/verify',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { user: User }) => response.user,
      invalidatesTags: ['Profile'],
    }),
    disableTwoFactor: builder.mutation<User, { otp: string }>({
      query: body => ({
        url: '/api/auth/2fa/disable',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { user: User }) => response.user,
      invalidatesTags: ['Profile'],
    }),
    getDrives: builder.query<Drive[], void>({
      query: () => '/api/drives',
    }),
    getRecycleBin: builder.query<RecycleBinResponse, void>({
      query: () => '/api/drives/recycle-bin',
    }),
    getGalleryFolders: builder.query<GalleryFoldersResponse, void>({
      query: () => '/api/gallery/folders',
    }),
    getFavoriteImages: builder.query<DirectoryFile[], void>({
      query: () => '/api/favorites/images',
      transformResponse: (response: FavoriteImageResponse[]) =>
        response.map(mapFavoriteImageToDirectoryFile),
      providesTags: ['Favorites'],
    }),
    saveFavoriteImage: builder.mutation<
      FavoriteImageResponse,
      { imageUrl: string }
    >({
      query: body => ({
        url: '/api/favorites/images',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Favorites'],
    }),
    listDirectory: builder.query<DirectoryContentsResponse, { path: string }>({
      query: ({ path }) => `/api/drives/list?path=${path}`,
      providesTags: (_result, _error, { path }) => [{ type: 'Directory', id: path || 'root' }],
    }),
    moveItemToRecycleBin: builder.mutation<
      { moved: boolean; name: string; path: string; recyclePath: string; type: 'directory' | 'file' },
      { path: string; currentPath?: string }
    >({
      query: body => ({
        url: '/api/drives/recycle',
        method: 'POST',
        body: { path: body.path },
      }),
      invalidatesTags: (_result, _error, { currentPath }) => [{ type: 'Directory', id: currentPath || 'root' }],
    }),
  }),
});

export const {
  useBeginTwoFactorSetupMutation,
  useDisableTwoFactorMutation,
  useGetDrivesQuery,
  useGetRecycleBinQuery,
  useGetGalleryFoldersQuery,
  useGetFavoriteImagesQuery,
  useListDirectoryQuery,
  useSaveFavoriteImageMutation,
  useMoveItemToRecycleBinMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useLoginMutation,
  useRegisterMutation,
  useVerifyTwoFactorSetupMutation,
} = authApi;
