import { Rank } from "./game";

export const MAX_PLAYER_LEVEL = 100;

export type PlayerProgress = {
  level: number;
  totalExp: number;
  currentLevelExp: number;
  nextLevelExp: number;
  reelBonusRate: number;
};

export const CATCH_EXP: Record<Rank, number> = {
  E:10, D:15, C:22, B:32, A:46, S:65, SS:90, SSS:140,
};

export function expRequiredForNextLevel(level: number) {
  if (level >= MAX_PLAYER_LEVEL) return 0;
  return Math.round(60 + Math.pow(level, 1.55) * 18);
}

export function reelBonusForLevel(level: number) {
  let bonus = 0;
  for (let reached = 2; reached <= Math.min(MAX_PLAYER_LEVEL, level); reached += 1) {
    bonus += reached % 5 === 0 ? .005 : .001;
  }
  return bonus;
}

export function calculatePlayerProgress(totalExp: number): PlayerProgress {
  const safeTotal = Math.max(0, Math.floor(totalExp));
  let level = 1;
  let usedExp = 0;
  while (level < MAX_PLAYER_LEVEL) {
    const required = expRequiredForNextLevel(level);
    if (safeTotal - usedExp < required) break;
    usedExp += required;
    level += 1;
  }
  return {
    level,
    totalExp:safeTotal,
    currentLevelExp:level >= MAX_PLAYER_LEVEL ? 0 : safeTotal - usedExp,
    nextLevelExp:expRequiredForNextLevel(level),
    reelBonusRate:reelBonusForLevel(level),
  };
}
