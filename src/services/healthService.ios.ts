import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isHealthDataAvailableAsync,
  queryStatisticsForQuantity,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";
import { getTodaySteps, saveSteps } from "../database/db";
import type { HealthSyncResult } from "./healthService";

const AUTHORIZED_KEY = "fishing-walk-healthkit-requested";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function requestHealthAccess() {
  if (!(await isHealthDataAvailableAsync())) return false;
  const completed = await requestAuthorization({
    toRead: ["HKQuantityTypeIdentifierStepCount"],
  });
  if (completed) await AsyncStorage.setItem(AUTHORIZED_KEY, "1");
  return completed;
}

export async function syncHealthMonth(year: number, month: number): Promise<HealthSyncResult> {
  const fallback = await getTodaySteps(dayKey(new Date()));
  try {
    if (!(await isHealthDataAvailableAsync())) {
      return { permission: "unavailable", provider: "Appleヘルスケア", status: "この端末ではヘルスケアを利用できません", today: fallback };
    }
    if (!(await AsyncStorage.getItem(AUTHORIZED_KEY))) {
      return { permission: "required", provider: "Appleヘルスケア", status: "ヘルスケアの歩数連携が必要です", today: fallback };
    }

    const now = new Date();
    const days = new Date(year, month, 0).getDate();
    let today = fallback;
    for (let day = 1; day <= days; day += 1) {
      const start = new Date(year, month - 1, day);
      if (start > now) break;
      const end = new Date(year, month - 1, day + 1);
      const stats = await queryStatisticsForQuantity(
        "HKQuantityTypeIdentifierStepCount",
        ["cumulativeSum"],
        { filter: { date: { startDate: start, endDate: end > now ? now : end } }, unit: "count" },
      );
      const steps = Math.max(0, Math.round(stats.sumQuantity?.quantity ?? 0));
      await saveSteps(dayKey(start), steps, "healthkit");
      if (dayKey(start) === dayKey(now)) today = steps;
    }
    return { permission: "granted", provider: "Appleヘルスケア", status: "ヘルスケアと同期しました", today };
  } catch {
    return { permission: "required", provider: "Appleヘルスケア", status: "ヘルスケアの権限を確認してください", today: fallback };
  }
}

export async function syncTodaySteps() {
  const now = new Date();
  const result = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
  return { steps: result.today, available: result.permission === "granted" };
}
