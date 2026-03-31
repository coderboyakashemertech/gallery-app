import {
  APP_ENV,
  LOCAL_API_BASE_URL_ANDROID,
  LOCAL_API_BASE_URL_DEFAULT,
  LOCAL_API_BASE_URL_IOS,
  PROD_API_BASE_URL_ANDROID,
  PROD_API_BASE_URL_DEFAULT,
  PROD_API_BASE_URL_IOS,
} from '@env';
import { Platform } from 'react-native';

export type ApiEnvironment = 'local' | 'prod';

type PlatformBaseUrls = {
  android: string;
  default: string;
  ios: string;
};

const baseUrlsByEnvironment: Record<ApiEnvironment, PlatformBaseUrls> = {
  local: {
    android: LOCAL_API_BASE_URL_ANDROID,
    ios: LOCAL_API_BASE_URL_IOS,
    default: LOCAL_API_BASE_URL_DEFAULT,
  },
  prod: {
    android: PROD_API_BASE_URL_ANDROID,
    ios: PROD_API_BASE_URL_IOS,
    default: PROD_API_BASE_URL_DEFAULT,
  },
};

export const APP_RUNTIME_ENV = APP_ENV;
export const DEFAULT_API_ENVIRONMENT: ApiEnvironment =
  APP_ENV === 'production' ? 'prod' : 'local';

export function resolveApiEnvironment(
  apiEnvironment?: ApiEnvironment | null,
): ApiEnvironment {
  return apiEnvironment === 'prod' ? 'prod' : 'local';
}

export function getApiBaseUrl(apiEnvironment?: ApiEnvironment | null) {
  const resolvedEnvironment = resolveApiEnvironment(apiEnvironment);
  const urls = baseUrlsByEnvironment[resolvedEnvironment];
  const selectedUrl = Platform.select({
    android: urls.android,
    ios: urls.ios,
    default: urls.default,
  });

  return selectedUrl || urls.default;
}

export function getApiEnvironmentLabel(apiEnvironment?: ApiEnvironment | null) {
  return resolveApiEnvironment(apiEnvironment) === 'prod' ? 'Prod' : 'Local';
}
