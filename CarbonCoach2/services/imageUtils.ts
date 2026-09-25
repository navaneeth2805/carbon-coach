import { File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Safely convert an image URI to a pure base64 string across:
 * - Web (fetch + FileReader)
 * - Modern Expo File API (File.base64)
 * - Legacy Expo FileSystem API (expo-file-system/legacy readAsStringAsync)
 * - React Native local file fetch blob fallback
 */
export async function getBase64FromUri(uri: string): Promise<string> {
  if (!uri) {
    throw new Error('Image URI is required');
  }

  // If already a base64 data URI
  if (uri.startsWith('data:image')) {
    const commaIndex = uri.indexOf(',');
    return uri.slice(commaIndex + 1);
  }

  // Web platform uses fetch + FileReader
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const commaIndex = result.indexOf(',');
        resolve(commaIndex !== -1 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 1. Try modern Expo File API (new File(uri).base64())
  try {
    const file = new File(uri);
    if (typeof (file as any).base64 === 'function') {
      const b64 = await (file as any).base64();
      if (b64 && typeof b64 === 'string') {
        return b64;
      }
    }
  } catch (fileErr) {
    // Continue to legacy fallback
  }

  // 2. Try official legacy FileSystem API (expo-file-system/legacy)
  try {
    const b64 = await LegacyFileSystem.readAsStringAsync(uri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    if (b64 && typeof b64 === 'string') {
      return b64;
    }
  } catch (legacyErr) {
    // Continue to fetch fallback
  }

  // 3. Last-resort fallback: Fetch local blob and convert via FileReader
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(',');
      resolve(commaIndex !== -1 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
