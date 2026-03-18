declare module '@env' {
  export const APP_ENV: string;
  export const API_BASE_URL_ANDROID: string;
  export const API_BASE_URL_IOS: string;
  export const API_BASE_URL_DEFAULT: string;
}

declare module 'react-native-vector-icons/FontAwesome' {
  import type { ComponentType } from 'react';

  type IconProps = {
    name: string;
    size?: number;
    color?: string;
    style?: unknown;
  };

  const FontAwesome: ComponentType<IconProps>;
  export default FontAwesome;
}
