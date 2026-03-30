import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import {
  getApiBaseUrl,
  resolveApiEnvironment,
  type ApiEnvironment,
} from '../config/api';
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
  id: number;
  imageUrl: string;
  name?: string | null;
  createdAt: string;
};

export type AlbumSummary = {
  id: number;
  name: string;
  imageCount: number;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AlbumImageResponse = {
  id: number;
  albumId: number;
  imageUrl: string;
  name?: string | null;
  createdAt: string;
};

type AuthStateWithToken = { auth: { token?: string | null } };
type StateWithPreferences = AuthStateWithToken & {
  preferences?: { apiEnvironment?: ApiEnvironment };
};

const getImageExtension = (imageUrl: string) => {
  const match = imageUrl.match(/(\.[a-z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : null;
};

const getImageFallbackName = (imageUrl: string) =>
  decodeURIComponent(imageUrl.split('/').pop() || 'Favourite image');

const mapImageResponseToDirectoryFile = (
  image: FavoriteImageResponse | AlbumImageResponse,
): DirectoryFile => {
  const fallbackName = getImageFallbackName(image.imageUrl);

  return {
    type: 'file',
    path: String(image.id),
    url: image.imageUrl,
    name: image.name || fallbackName,
    size: 0,
    extension: getImageExtension(image.imageUrl),
  };
};

const rawBaseQuery = fetchBaseQuery({
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthStateWithToken).auth.token;

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
  const state = api.getState() as StateWithPreferences;
  const apiEnvironment = resolveApiEnvironment(
    state.preferences?.apiEnvironment,
  );
  const baseUrl = getApiBaseUrl(apiEnvironment);
  const request =
    typeof args === 'string'
      ? { url: `${baseUrl}${args}` }
      : { ...args, url: `${baseUrl}${args.url}` };
  const result = await rawBaseQuery(request, api, extraOptions);

  if (result.error) {
    return result;
  }

  const body = result.data as ApiSuccessResponse<unknown>;
  return { data: body.data };
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Profile', 'Directory', 'Favorites', 'Albums'],
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
        response.map(mapImageResponseToDirectoryFile),
      providesTags: ['Favorites'],
    }),
    saveFavoriteImage: builder.mutation<
      FavoriteImageResponse,
      { imageUrl: string; name: string }
    >({
      query: body => ({
        url: '/api/favorites/images',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Favorites'],
    }),
    getAlbums: builder.query<AlbumSummary[], void>({
      query: () => '/api/albums',
      providesTags: ['Albums'],
    }),
    createAlbum: builder.mutation<AlbumSummary, { name: string }>({
      query: body => ({
        url: '/api/albums',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Albums'],
    }),
    getAlbumImages: builder.query<DirectoryFile[], number>({
      query: albumId => `/api/albums/${albumId}/images`,
      transformResponse: (response: AlbumImageResponse[]) =>
        response.map(mapImageResponseToDirectoryFile),
      providesTags: ['Albums'],
    }),
    saveAlbumImage: builder.mutation<
      AlbumImageResponse,
      { albumId: number; imageUrl: string; name: string }
    >({
      query: ({ albumId, ...body }) => ({
        url: `/api/albums/${albumId}/images`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Albums'],
    }),
    listDirectory: builder.query<DirectoryContentsResponse, { path: string }>({
      query: ({ path }) => `/api/drives/list?path=${path}`,
      providesTags: (_result, _error, { path }) => [
        { type: 'Directory', id: path || 'root' },
      ],
    }),
    moveItemToRecycleBin: builder.mutation<
      {
        moved: boolean;
        name: string;
        path: string;
        recyclePath: string;
        type: 'directory' | 'file';
      },
      { path: string; currentPath?: string }
    >({
      query: body => ({
        url: '/api/drives/recycle',
        method: 'POST',
        body: { path: body.path },
      }),
      invalidatesTags: (_result, _error, { currentPath }) => [
        { type: 'Directory', id: currentPath || 'root' },
      ],
    }),
  }),
});

export const {
  useBeginTwoFactorSetupMutation,
  useCreateAlbumMutation,
  useDisableTwoFactorMutation,
  useGetAlbumImagesQuery,
  useGetAlbumsQuery,
  useGetDrivesQuery,
  useGetFavoriteImagesQuery,
  useGetGalleryFoldersQuery,
  useGetProfileQuery,
  useGetRecycleBinQuery,
  useLazyGetProfileQuery,
  useListDirectoryQuery,
  useLoginMutation,
  useMoveItemToRecycleBinMutation,
  useRegisterMutation,
  useSaveAlbumImageMutation,
  useSaveFavoriteImageMutation,
  useVerifyTwoFactorSetupMutation,
} = authApi;
