import type { SerializedError } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import type { TwoFactorSetup, User } from '../types/auth';
import { authApi } from './authApi';

type PendingLogin = {
  password: string;
  username: string;
};

type AuthState = {
  error: string | null;
  pendingLogin: PendingLogin | null;
  requestStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  token: string | null;
  twoFactorLoginRequired: boolean;
  twoFactorSetup: TwoFactorSetup | null;
  user: User | null;
};

const initialState: AuthState = {
  error: null,
  pendingLogin: null,
  requestStatus: 'idle',
  token: null,
  twoFactorLoginRequired: false,
  twoFactorSetup: null,
  user: null,
};

function getErrorMessage(error: FetchBaseQueryError | SerializedError | undefined) {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  if ('status' in error && error.status === 'FETCH_ERROR') {
    return 'Unable to reach the selected API. Check the Local or Prod setting and make sure that backend is reachable.';
  }

  if ('status' in error && error.status === 'PARSING_ERROR') {
    return 'The API returned an unexpected response. Check that the backend is running the expected auth routes.';
  }

  if ('error' in error && typeof error.error === 'string') {
    return error.error;
  }

  if ('data' in error && error.data && typeof error.data === 'object') {
    const message = (error.data as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    logout(state) {
      state.error = null;
      state.pendingLogin = null;
      state.requestStatus = 'idle';
      state.token = null;
      state.twoFactorLoginRequired = false;
      state.twoFactorSetup = null;
      state.user = null;
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(authApi.endpoints.register.matchPending, state => {
        state.error = null;
        state.requestStatus = 'loading';
      })
      .addMatcher(authApi.endpoints.register.matchFulfilled, (state, action) => {
        state.pendingLogin = null;
        state.requestStatus = 'succeeded';
        state.token = action.payload.token;
        state.twoFactorLoginRequired = false;
        state.user = action.payload.user;
      })
      .addMatcher(authApi.endpoints.register.matchRejected, (state, action) => {
        state.error = getErrorMessage(action.error);
        state.requestStatus = 'failed';
      })
      .addMatcher(authApi.endpoints.login.matchPending, state => {
        state.error = null;
        state.requestStatus = 'loading';
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        state.requestStatus = 'succeeded';
        state.user = action.payload.user;

        if (action.payload.requiresTwoFactor) {
          state.pendingLogin = {
            password: action.meta.arg.originalArgs.password,
            username: action.meta.arg.originalArgs.username,
          };
          state.twoFactorLoginRequired = true;
          state.token = null;
          return;
        }

        state.pendingLogin = null;
        state.token = action.payload.token;
        state.twoFactorLoginRequired = false;
      })
      .addMatcher(authApi.endpoints.login.matchRejected, (state, action) => {
        state.error = getErrorMessage(action.error);
        state.requestStatus = 'failed';
      })
      .addMatcher(authApi.endpoints.getProfile.matchPending, state => {
        state.error = null;
        state.requestStatus = 'loading';
      })
      .addMatcher(authApi.endpoints.getProfile.matchFulfilled, (state, action) => {
        state.requestStatus = 'succeeded';
        state.user = action.payload;
      })
      .addMatcher(authApi.endpoints.getProfile.matchRejected, (state, action) => {
        state.error = getErrorMessage(action.error);
        state.requestStatus = 'failed';
      })
      .addMatcher(authApi.endpoints.beginTwoFactorSetup.matchPending, state => {
        state.error = null;
        state.requestStatus = 'loading';
      })
      .addMatcher(
        authApi.endpoints.beginTwoFactorSetup.matchFulfilled,
        (state, action) => {
          state.requestStatus = 'succeeded';
          state.twoFactorSetup = action.payload;
        },
      )
      .addMatcher(
        authApi.endpoints.beginTwoFactorSetup.matchRejected,
        (state, action) => {
          state.error = getErrorMessage(action.error);
          state.requestStatus = 'failed';
        },
      )
      .addMatcher(authApi.endpoints.verifyTwoFactorSetup.matchPending, state => {
        state.error = null;
        state.requestStatus = 'loading';
      })
      .addMatcher(
        authApi.endpoints.verifyTwoFactorSetup.matchFulfilled,
        (state, action) => {
          state.requestStatus = 'succeeded';
          state.twoFactorSetup = null;
          state.user = action.payload;
        },
      )
      .addMatcher(
        authApi.endpoints.verifyTwoFactorSetup.matchRejected,
        (state, action) => {
          state.error = getErrorMessage(action.error);
          state.requestStatus = 'failed';
        },
      )
      .addMatcher(authApi.endpoints.disableTwoFactor.matchPending, state => {
        state.error = null;
        state.requestStatus = 'loading';
      })
      .addMatcher(
        authApi.endpoints.disableTwoFactor.matchFulfilled,
        (state, action) => {
          state.requestStatus = 'succeeded';
          state.twoFactorSetup = null;
          state.user = action.payload;
        },
      )
      .addMatcher(
        authApi.endpoints.disableTwoFactor.matchRejected,
        (state, action) => {
          state.error = getErrorMessage(action.error);
          state.requestStatus = 'failed';
        },
      );
  },
});

export const { clearAuthError, logout } = authSlice.actions;
export default authSlice.reducer;
