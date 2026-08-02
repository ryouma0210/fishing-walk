import { getState, getTodayCatchProgress, getTodaySteps, grantBait, setState } from "../database/db";

export type DailyMission = {
  id: "walk" | "catch" | "rank";
  title: string;
  description: string;
  current: number;
  target: number;
  rewardItemId: "bait1" | "bait2" | "bait3";
  rewardName: string;
  claimed: boolean;
};

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function getDailyMissions(): Promise<DailyMission[]> {
  const day = todayKey();
  const [steps, catches, claims] = await Promise.all([
    getTodaySteps(day),
    getTodayCatchProgress(day),
    getState<string[]>(`daily_claims_${day}`),
  ]);
  const claimed = new Set(claims ?? []);
  return [
    { id: "walk", title: "今日の散歩", description: "1,000歩あるく", current: steps, target: 1000, rewardItemId: "bait1", rewardName: "ミミズ餌（E・D）", claimed: claimed.has("walk") },
    { id: "catch", title: "今日の釣果", description: "魚を3匹釣る", current: catches.count, target: 3, rewardItemId: "bait2", rewardName: "練り餌（C・B）", claimed: claimed.has("catch") },
    { id: "rank", title: "強敵への挑戦", description: "Bランク以上を1匹釣る", current: catches.high_rank_count, target: 1, rewardItemId: "bait3", rewardName: "活き餌（A・S）", claimed: claimed.has("rank") },
  ];
}

export async function claimDailyMission(id: DailyMission["id"]) {
  const missions = await getDailyMissions();
  const mission = missions.find((entry) => entry.id === id);
  if (!mission || mission.claimed || mission.current < mission.target) return false;
  const day = todayKey();
  const claims = await getState<string[]>(`daily_claims_${day}`) ?? [];
  if (claims.includes(id)) return false;
  await grantBait(mission.rewardItemId, 1);
  await setState(`daily_claims_${day}`, [...claims, id]);
  return true;
}
