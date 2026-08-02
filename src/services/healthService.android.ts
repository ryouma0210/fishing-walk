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

type HealthConnectState = "ready" | "install-required" | "update-required" | "native-error";

async function prepare(): Promise<HealthConnectState> {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return "update-required";
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return "install-required";
    return await initialize() ? "ready" : "native-error";
  } catch {
    return "native-error";
  }
}

export async function requestHealthAccess() {
  try {
    if (await prepare() !== "ready") return false;
    const granted = await requestPermission([STEP_PERMISSION]);
    return granted.some((item) => item.accessType === "read" && item.recordType === "Steps");
  } catch {
    return false;
  }
}

export async function syncHealthMonth(year: number, month: number): Promise<HealthSyncResult> {
  const fallback = await getTodaySteps(dayKey(new Date()));
  try {
    const state = await prepare();
    if (state !== "ready") {
      const status = state === "install-required"
        ? "Health Connectが未インストールです。Google Playからインストールしてください"
        : state === "update-required"
          ? "Health Connectの更新が必要です。Google Playで更新してください"
          : "Health Connectを初期化できません。アプリを再起動してください";
      return { permission: "unavailable", provider: "Health Connect", status, today: fallback };
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
    return { permission: "required", provider: "Health Connect", status: "歩数の読み取りが拒否されました。端末設定から許可できます（保存済み歩数を表示中）", today: fallback };
  }
}

export async function syncTodaySteps() {
  const now = new Date();
  const result = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
  return { steps: result.today, available: result.permission === "granted" };
}
