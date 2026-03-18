import { NativeModules, Platform } from 'react-native';

type ImageClipboardModuleShape = {
  copyImage: (path: string) => Promise<boolean>;
};

const nativeModule = NativeModules.ImageClipboardModule as
  | ImageClipboardModuleShape
  | undefined;

export async function copyImageToClipboard(path: string) {
  if (!nativeModule?.copyImage) {
    throw new Error(`Image clipboard is not available on ${Platform.OS}.`);
  }

  return nativeModule.copyImage(path);
}
