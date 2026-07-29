import { getTodaySteps } from "../database/db";

export type HealthPermission = "granted" | "required" | "unavailable";
export type HealthSyncResult = {
  permission: HealthPermission;
  provider: string;
  status: string;
  today: number;
};

export async function requestHealthAccess() {
  return false;
}

export async function syncHealthMonth(_year: number, _month: number): Promise<HealthSyncResult> {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    permission: "unavailable",
    provider: "歩数データ",
    status: "この端末ではヘルスケア連携を利用できません",
    today: await getTodaySteps(todayKey),
  };
}

export async function syncTodaySteps() {
  const now = new Date();
  const result = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
  return { steps: result.today, available: result.permission === "granted" };
}
