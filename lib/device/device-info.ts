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

export async function getDeviceInfo(): Promise<DeviceInfoPayload> {
  let stableId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  // Try native persistent IDs first
  if (!stableId) {
    if (Platform.OS === "android") {
      stableId = Application.getAndroidId(); // stable across reinstalls
    } else if (Platform.OS === "ios") {
      stableId = await Application.getIosIdForVendorAsync(); // stable per vendor
    }
  }

  // fallback if still null (very rare)
  if (!stableId) {
    stableId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // persist fallback if used
  await SecureStore.setItemAsync(DEVICE_ID_KEY, stableId);

  const name =
    Device.deviceName ||
    `${Device.brand ?? "Unknown"} ${Device.modelName ?? "Device"}`;

  return {
    id: stableId,
    name: name,
    brand: Device.brand ?? "unknown",
    model: Device.modelName ?? "unknown",
    os: `${Device.osName} ${Device.osVersion}`,
  };
}
