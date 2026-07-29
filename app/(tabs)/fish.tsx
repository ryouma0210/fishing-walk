import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { FISH, FishingSpot, HABITAT_NAMES, RANK_INDEX, RANKS, Rank, ShopItem } from "../../src/constants/game";
import { colors, rankColors } from "../../src/constants/theme";
import { getCoins, getEquippedItems, saveCatch } from "../../src/database/db";
import { getSelectedSpot } from "../../src/services/locationService";
import { syncTodaySteps } from "../../src/services/stepService";

type Phase = "idle" | "waiting" | "bite" | "result" | "escaped";
type CatchResult = {
  id: string;
  name: string;
  emoji: string;
  rank: Rank;
  size: number;
  reward: number;
  isPersonalBest: boolean;
  aquarium: string;
};

function effectPower(items: ShopItem[], effect: ShopItem["effect"]) {
  return items.filter((item) => item.effect === effect).reduce((sum, item) => sum + item.power, 0);
}

function weightedRank(steps: number, gear: ShopItem[]) {
  const stepPower = Math.min(8, Math.floor(steps / 1000) * (1 + effectPower(gear, "steps") * 0.1));
  const luck = effectPower(gear, "luck") + effectPower(gear, "bait") + stepPower;
  const rod = effectPower(gear, "rod");
  const weights = [46, 27, 15, 7, 3.5, 1.2, 0.27, 0.03].map((weight, index) =>
    weight * (1 + luck * index * 0.065),
  );
  const maxRank = Math.min(7, rod === 0 ? 4 : rod <= 2 ? 5 : rod <= 4 ? 6 : 7);
  const allowed = weights.slice(0, maxRank + 1);
  let roll = Math.random() * allowed.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < allowed.length; index += 1) {
    roll -= allowed[index];
    if (roll <= 0) return RANKS[index];
  }
  return RANKS[0];
}

export default function FishScreen() {
  const [coins, setCoins] = useState(0);
  const [steps, setSteps] = useState(0);
  const [spot, setSpot] = useState<FishingSpot | null>(null);
  const [gear, setGear] = useState<ShopItem[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hookWindow, setHookWindow] = useState(0);
  const [candidate, setCandidate] = useState<(typeof FISH)[number] | null>(null);
  const [last, setLast] = useState<CatchResult | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const load = useCallback(async () => {
    const [wallet, equipped, selectedSpot, todaySteps] = await Promise.all([
      getCoins(),
      getEquippedItems(),
      getSelectedSpot(),
      syncTodaySteps(),
    ]);
    setCoins(wallet);
    setGear(equipped);
    setSpot(selectedSpot);
    setSteps(todaySteps.steps);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    return clearTimer;
  }, [load]));
  useEffect(() => clearTimer, []);

  const chooseFish = () => {
    const habitat = spot?.habitat ?? "pond";
    let rank = weightedRank(steps, gear);
    let pool = FISH.filter((fish) => fish.habitats.includes(habitat) && fish.rank === rank);
    while (!pool.length && RANK_INDEX[rank] > 0) {
      rank = RANKS[RANK_INDEX[rank] - 1];
      pool = FISH.filter((fish) => fish.habitats.includes(habitat) && fish.rank === rank);
    }
    return pool[Math.floor(Math.random() * pool.length)] ?? FISH[0];
  };

  const cast = () => {
    clearTimer();
    setLast(null);
    setCandidate(null);
    setPhase("waiting");
    timeoutRef.current = setTimeout(() => {
      const fish = chooseFish();
      setCandidate(fish);
      setHookWindow(3);
      setPhase("bite");
      timeoutRef.current = setTimeout(() => {
        setHookWindow(0);
        setPhase("escaped");
      }, 3200);
    }, 900 + Math.floor(Math.random() * 1700));
  };

  useEffect(() => {
    if (phase !== "bite") return;
    const interval = setInterval(() => setHookWindow((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const hook = async () => {
    if (phase !== "bite" || !candidate || !spot) return;
    clearTimer();
    const rankIndex = RANK_INDEX[candidate.rank];
    const fightBonus = effectPower(gear, "fight") * 0.04 + effectPower(gear, "rod") * 0.025;
    const quickBonus = hookWindow * 0.08;
    const successRate = Math.max(0.18, Math.min(0.98, 0.94 - rankIndex * 0.1 + fightBonus + quickBonus));
    if (Math.random() > successRate) {
      setPhase("escaped");
      return;
    }
    const sizePower = effectPower(gear, "size");
    const sizeRoll = Math.min(1, Math.pow(Math.random(), 1 / (1 + sizePower * 0.22)));
    const size = Number((candidate.minCm + (candidate.maxCm - candidate.minCm) * sizeRoll).toFixed(1));
    const coinPower = effectPower(gear, "coins");
    const baseReward = 10 + rankIndex * 25 + Math.round(size / 8);
    const reward = Math.round(baseReward * (1 + coinPower * 0.1));
    const isPersonalBest = await saveCatch({
      fishId: candidate.id,
      size,
      rank: candidate.rank,
      aquarium: candidate.aquarium,
      coins: reward,
      spotId: spot.id,
      spotName: spot.name,
      habitat: spot.habitat,
      steps,
    });
    setLast({ ...candidate, size, reward, isPersonalBest });
    setCoins(await getCoins());
    setPhase("result");
  };

  const phaseText: Record<Phase, string> = {
    idle: "キャストして魚を待とう",
    waiting: "ウキを見ながら待っています…",
    bite: `ヒット！ あと${hookWindow}秒`,
    result: "釣り上げ成功！",
    escaped: "逃げられました…もう一度挑戦！",
  };
  const luckScore = Math.floor(steps / 1000) + effectPower(gear, "luck") + effectPower(gear, "bait");

  return (
    <Screen>
      <Header title="Fishing Game" sub={`所持コイン ${coins.toLocaleString()} 🪙`} />
      <Card>
        <View style={ui.between}>
          <View>
            <Text style={ui.muted}>現在の釣り場</Text>
            <Text style={styles.spot}>{spot?.emoji} {spot?.name ?? "みずべ公園"}</Text>
          </View>
          <View style={styles.habitatChip}>
            <Text style={styles.habitatText}>{HABITAT_NAMES[spot?.habitat ?? "pond"]}</Text>
          </View>
        </View>
        <Text style={ui.muted}>今日 {steps.toLocaleString()}歩 ・ レア補正 {luckScore}</Text>
      </Card>

      <Card style={styles.hero}>
        <Text style={styles.water}>
          {phase === "bite" ? "💥 〰️ 🎣 〰️ 💥" : phase === "waiting" ? "🌊  〰️  ◉  〰️  🌊" : "🌊  〜  🎣  〜  🌊"}
        </Text>
        <Text style={[styles.phase, phase === "bite" && styles.bite]}>{phaseText[phase]}</Text>
        {phase === "bite"
          ? <Button title="今だ！ 引き上げる" onPress={hook} />
          : <Button title={phase === "waiting" ? "待っています…" : "釣り糸を投げる"} onPress={cast} disabled={phase === "waiting"} />}
      </Card>

      {last && (
        <Card>
          {last.isPersonalBest && <Text style={styles.best}>🏆 NEW PERSONAL BEST</Text>}
          <View style={styles.catch}>
            <Text style={styles.fish}>{last.emoji}</Text>
            <View style={styles.catchInfo}>
              <Text style={[styles.rank, { color: rankColors[last.rank] }]}>{last.rank} RANK</Text>
              <Text style={styles.name}>{last.name}</Text>
              <Text style={ui.body}>{last.size.toLocaleString()} cm　+{last.reward.toLocaleString()} 🪙</Text>
            </View>
          </View>
          <Text style={ui.muted}>{spot?.name}から{last.aquarium}へ格納しました</Text>
        </Card>
      )}

      <Card>
        <Text style={ui.h2}>装備効果</Text>
        <Text style={ui.body}>{gear.length ? gear.map((item) => `${item.emoji}${item.name}`).join("　") : "ビギナー装備"}</Text>
        <View style={styles.ranks}>
          {RANKS.map((rank) => (
            <View key={rank} style={[styles.rankPill, { backgroundColor: rankColors[rank] }]}>
              <Text style={styles.rankText}>{rank}</Text>
            </View>
          ))}
        </View>
        <Text style={ui.muted}>場所によって出会える生き物が変わります。高ランクほどヒット後の成功率が低くなります。</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spot: { fontSize: 19, fontWeight: "900", color: colors.ink },
  habitatChip: { backgroundColor: colors.foam, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99 },
  habitatText: { color: colors.ocean, fontWeight: "900" },
  hero: { gap: 18, alignItems: "stretch", paddingVertical: 26 },
  water: { fontSize: 32, textAlign: "center" },
  phase: { textAlign: "center", color: colors.muted, fontWeight: "800", fontSize: 16 },
  bite: { color: colors.coral, fontSize: 20 },
  best: { textAlign: "center", color: colors.gold, fontWeight: "900", marginBottom: 8 },
  catch: { flexDirection: "row", gap: 18, alignItems: "center", marginBottom: 12 },
  catchInfo: { flex: 1 },
  fish: { fontSize: 62 },
  rank: { fontWeight: "900", fontSize: 13 },
  name: { fontSize: 25, fontWeight: "900", color: colors.ink },
  ranks: { flexDirection: "row", gap: 5, marginVertical: 12, flexWrap: "wrap" },
  rankPill: { borderRadius: 9, minWidth: 34, padding: 7, alignItems: "center" },
  rankText: { color: "white", fontWeight: "900" },
});
