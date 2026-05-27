// deviceId — generates and persists a unique ID for this device.
//
// Used as the `user_id` for all user data (saved recipes, pantry, shopping
// lists) before real authentication is in place. When auth is added, the
// sign-in flow can migrate records from the device ID to the authenticated
// user's ID with a single SQL UPDATE.

import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'scran_device_id';

// Simple UUID v4 generator — no external dependency needed.
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Returns the stored device ID, creating and persisting one on first call.
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}
