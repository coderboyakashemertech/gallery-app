import {
  API_BASE_URL_ANDROID,
  API_BASE_URL_DEFAULT,
  API_BASE_URL_IOS,
  APP_ENV,
} from '@env';
import { Platform } from 'react-native';

const baseUrl = Platform.select({
  android: API_BASE_URL_ANDROID,
  ios: API_BASE_URL_IOS,
  default: API_BASE_URL_DEFAULT,
});

export const API_BASE_URL = baseUrl ?? API_BASE_URL_DEFAULT;
export const APP_RUNTIME_ENV = APP_ENV;
