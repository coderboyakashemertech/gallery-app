import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

const APP_DOWNLOADS_FOLDER = 'Gallery';

type DownloadDestination = {
  directoryPath: string;
  filePath: string;
  successLabel: string;
};

export async function getDownloadDestination(
  fileName: string,
): Promise<DownloadDestination> {
  if (Platform.OS === 'android') {
    const publicDownloadsDir =
      ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir ||
      ReactNativeBlobUtil.fs.dirs.DownloadDir;
    const directoryPath = `${publicDownloadsDir}/${APP_DOWNLOADS_FOLDER}`;

    try {
      await ReactNativeBlobUtil.fs.mkdir(directoryPath);
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();

      if (!message.includes('exist')) {
        throw error;
      }
    }

    return {
      directoryPath,
      filePath: `${directoryPath}/${fileName}`,
      successLabel: `Downloads`,
    };
  }

  return {
    directoryPath: ReactNativeBlobUtil.fs.dirs.DocumentDir,
    filePath: `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`,
    successLabel: 'Documents',
  };
}
