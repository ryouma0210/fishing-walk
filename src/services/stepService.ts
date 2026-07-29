import { Pedometer } from "expo-sensors";
import { getTodaySteps, saveSteps } from "../database/db";

export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function syncTodaySteps() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return { steps: await getTodaySteps(localDayKey(now)), available: false };
    const result = await Pedometer.getStepCountAsync(start, now);
    await saveSteps(localDayKey(now), result.steps);
    return { steps: result.steps, available: true };
  } catch {
    return { steps: await getTodaySteps(localDayKey(now)), available: false };
  }
}
