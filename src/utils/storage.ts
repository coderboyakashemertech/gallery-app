import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'gallery-storage',
});

// Copy legacy values into MMKV on first access so existing sessions survive the upgrade.
async function readLegacyItem(key: string) {
  const legacyValue = await AsyncStorage.getItem(key);

  if (legacyValue !== null) {
    storage.set(key, legacyValue);
    AsyncStorage.removeItem(key).catch(() => undefined);
  }

  return legacyValue;
}

export const persistStorage = {
  async getItem(key: string) {
    const value = storage.getString(key);

    if (value !== undefined) {
      return value;
    }

    return readLegacyItem(key);
  },
  async removeItem(key: string) {
    storage.remove(key);
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },
  async setItem(key: string, value: string) {
    storage.set(key, value);
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },
};

export async function getStoredString(key: string) {
  const value = storage.getString(key);

  if (value !== undefined) {
    return value;
  }

  return readLegacyItem(key);
}

export async function removeStoredItem(key: string) {
  storage.remove(key);
  await AsyncStorage.removeItem(key).catch(() => undefined);
}

export async function setStoredString(key: string, value: string) {
  storage.set(key, value);
  await AsyncStorage.removeItem(key).catch(() => undefined);
}
