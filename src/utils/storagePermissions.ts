import { PermissionsAndroid, Platform } from 'react-native';

const isGranted = (status: string) => status === PermissionsAndroid.RESULTS.GRANTED;

export async function ensureAndroidStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version >= 33) {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
    ];

    const result = await PermissionsAndroid.requestMultiple(permissions);

    return permissions.every(permission => isGranted(result[permission]));
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  );

  return isGranted(result);
}
