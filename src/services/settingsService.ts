import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type AppSettings = {
  soundVolume: number;
  vibration: boolean;
  animationSpeed: number;
  textScale: number;
  locationUpdates: boolean;
  aquariumTheme: "auto" | "day" | "sunset" | "night";
  aquariumDecor: "plants" | "rocks" | "coral";
};

export const DEFAULT_SETTINGS: AppSettings = {
  soundVolume: 0.75,
  vibration: true,
  animationSpeed: 1,
  textScale: 1,
  locationUpdates: true,
  aquariumTheme: "auto",
  aquariumDecor: "plants",
};

const SETTINGS_KEY = "fishing_walk_settings_v1";
const listeners = new Set<(settings: AppSettings) => void>();

export async function getSettings(): Promise<AppSettings> {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  listeners.forEach((listener) => listener(settings));
}

export function useAppSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  useEffect(() => {
    getSettings().then(setSettings);
    listeners.add(setSettings);
    return () => { listeners.delete(setSettings); };
  }, []);
  return settings;
}
