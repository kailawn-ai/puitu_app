// lib/device/device-info.ts

import * as Application from "expo-application";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface DeviceInfoPayload {
  id: string;
  name: string;
  brand: string;
  model: string;
  os: string;
}

const DEVICE_ID_KEY = "secure_device_id";
let cachedDeviceInfo: DeviceInfoPayload | null = null;
let cachedDeviceInfoPromise: Promise<DeviceInfoPayload> | null = null;

export async function getDeviceInfo(): Promise<DeviceInfoPayload> {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  if (cachedDeviceInfoPromise) {
    return cachedDeviceInfoPromise;
  }

  cachedDeviceInfoPromise = (async () => {
    let stableId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    let shouldPersistId = false;

    // Try native persistent IDs first
    if (!stableId) {
      if (Platform.OS === "android") {
        stableId = Application.getAndroidId(); // stable across reinstalls
      } else if (Platform.OS === "ios") {
        stableId = await Application.getIosIdForVendorAsync(); // stable per vendor
      }

      if (stableId) {
        shouldPersistId = true;
      }
    }

    // fallback if still null (very rare)
    if (!stableId) {
      stableId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      shouldPersistId = true;
    }

    if (shouldPersistId) {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, stableId);
    }

    const name =
      Device.deviceName ||
      `${Device.brand ?? "Unknown"} ${Device.modelName ?? "Device"}`;

    const payload: DeviceInfoPayload = {
      id: stableId,
      name: name,
      brand: Device.brand ?? "unknown",
      model: Device.modelName ?? "unknown",
      os: `${Device.osName} ${Device.osVersion}`,
    };

    cachedDeviceInfo = payload;
    return payload;
  })();

  try {
    return await cachedDeviceInfoPromise;
  } finally {
    cachedDeviceInfoPromise = null;
  }
}
