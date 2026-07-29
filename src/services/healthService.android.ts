import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";
import { getTodaySteps, saveSteps } from "../database/db";
import type { HealthSyncResult } from "./healthService";

const STEP_PERMISSION = { accessType: "read" as const, recordType: "Steps" as const };

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function isGranted() {
  const permissions = await getGrantedPermissions();
  return permissions.some((item) => item.accessType === "read" && item.recordType === "Steps");
}

async function prepare() {
  if (await getSdkStatus() !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
  return initialize();
}

export async function requestHealthAccess() {
  if (!(await prepare())) return false;
  const granted = await requestPermission([STEP_PERMISSION]);
  return granted.some((item) => item.accessType === "read" && item.recordType === "Steps");
}

export async function syncHealthMonth(year: number, month: number): Promise<HealthSyncResult> {
  const fallback = await getTodaySteps(dayKey(new Date()));
  try {
    if (!(await prepare())) {
      return { permission: "unavailable", provider: "Health Connect", status: "Health Connectを利用できません", today: fallback };
    }
    if (!(await isGranted())) {
      return { permission: "required", provider: "Health Connect", status: "Health Connectの歩数連携が必要です", today: fallback };
    }

    const now = new Date();
    const days = new Date(year, month, 0).getDate();
    let today = fallback;
    for (let day = 1; day <= days; day += 1) {
      const start = new Date(year, month - 1, day);
      if (start > now) break;
      const end = new Date(year, month - 1, day + 1);
      const result = await aggregateRecord({
        recordType: "Steps",
        timeRangeFilter: {
          operator: "between",
          startTime: start.toISOString(),
          endTime: (end > now ? now : end).toISOString(),
        },
      });
      const steps = Math.max(0, Math.round(result.COUNT_TOTAL ?? 0));
      await saveSteps(dayKey(start), steps, "health-connect");
      if (dayKey(start) === dayKey(now)) today = steps;
    }
    return { permission: "granted", provider: "Health Connect", status: "Health Connectと同期しました", today };
  } catch {
    return { permission: "required", provider: "Health Connect", status: "Health Connectの権限を確認してください", today: fallback };
  }
}

export async function syncTodaySteps() {
  const now = new Date();
  const result = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
  return { steps: result.today, available: result.permission === "granted" };
}
