import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { FishArt, FishingSpotArt } from "../../src/components/GameArt";
import { FISH, FishingSpot, HABITAT_NAMES, RANK_INDEX, RANKS, Rank, SHOP, ShopItem } from "../../src/constants/game";
import { colors, rankColors } from "../../src/constants/theme";
import {
  consumeSelectedBait, getEquippedItems, getSelectedBait, getTodayCatchCount, saveCatch,
} from "../../src/database/db";
import { getSelectedSpot } from "../../src/services/locationService";
import { syncTodaySteps } from "../../src/services/stepService";

type Phase = "idle" | "casting" | "approach" | "bite" | "battle" | "result" | "escaped";
type CatchResult = {
  id: string;
  name: string;
  rank: Rank;
  size: number;
  isPersonalBest: boolean;
  aquarium: string;
};
type BattleConfig = { zone: number; seconds: number; pull: number };

const BATTLE_CONFIG: Record<Rank, BattleConfig> = {
  E: { zone: 58, seconds: 2, pull: 0.35 },
  D: { zone: 50, seconds: 2.5, pull: 0.45 },
  C: { zone: 43, seconds: 3.2, pull: 0.58 },
  B: { zone: 36, seconds: 4, pull: 0.72 },
  A: { zone: 29, seconds: 5, pull: 0.88 },
  S: { zone: 23, seconds: 6.5, pull: 1.05 },
  SS: { zone: 17, seconds: 8, pull: 1.25 },
  SSS: { zone: 12, seconds: 10, pull: 1.5 },
};

function effectPower(items: ShopItem[], effect: ShopItem["effect"]) {
  if (effect === "outfit") {
    const stage = [1, 2, 3, 4].find((level) =>
      ["hat", "top", "bottom", "shoes"].every((kind) => items.some((item) => item.id === `${kind}${level}`)),
    );
    return stage ? stage * 4 : 0;
  }
  return items.filter((item) => item.effect === effect).reduce((sum, item) => sum + item.power, 0);
}

function baitRank(steps: number, bait: ShopItem) {
  const ranks = bait.targetRanks ?? ["E"];
  if (ranks.length === 1) return ranks[0];
  const highChance = Math.min(0.82, 0.25 + steps / 20000);
  return Math.random() < highChance ? ranks[ranks.length - 1] : ranks[0];
}

export default function FishScreen() {
  const [steps, setSteps] = useState(0);
  const [spot, setSpot] = useState<FishingSpot | null>(null);
  const [gear, setGear] = useState<ShopItem[]>([]);
  const [bait, setBait] = useState<ShopItem | null>(null);
  const [todayCatch, setTodayCatch] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [candidate, setCandidate] = useState<(typeof FISH)[number] | null>(null);
  const [last, setLast] = useState<CatchResult | null>(null);
  const [shadowScale, setShadowScale] = useState(0);
  const [cursor, setCursor] = useState(50);
  const [targetCenter, setTargetCenter] = useState(50);
  const [battleProgress, setBattleProgress] = useState(0);
  const holdingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef(50);
  const progressRef = useRef(0);
  const targetRef = useRef(50);
  const finishingRef = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const load = useCallback(async () => {
    const [equipped, selectedSpot, todaySteps, selectedBait, catches] = await Promise.all([
      getEquippedItems(),
      getSelectedSpot(),
      syncTodaySteps(),
      getSelectedBait(),
      getTodayCatchCount(new Date().toISOString().slice(0, 10)),
    ]);
    setGear(equipped);
    setSpot(selectedSpot);
    setSteps(todaySteps.steps);
    setBait(SHOP.find((item) => item.id === selectedBait?.item_id) ?? null);
    setTodayCatch(catches);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    return clearTimer;
  }, [load]));
  useEffect(() => clearTimer, []);

  const chooseFish = (usedBait: ShopItem) => {
    const habitat = spot?.habitat ?? "pond";
    let rank = baitRank(steps, usedBait);
    let pool = FISH.filter((fish) => fish.habitats.includes(habitat) && fish.rank === rank);
    while (!pool.length && RANK_INDEX[rank] > 0) {
      rank = RANKS[RANK_INDEX[rank] - 1];
      pool = FISH.filter((fish) => fish.habitats.includes(habitat) && fish.rank === rank);
    }
    return pool[Math.floor(Math.random() * pool.length)] ?? FISH[0];
  };

  const cast = async () => {
    if (!bait || todayCatch >= dailyCapacity) return;
    const consumed = await consumeSelectedBait();
    if (!consumed) {
      setBait(null);
      return;
    }
    const usedBait = SHOP.find((item) => item.id === consumed) ?? bait;
    clearTimer();
    setLast(null);
    setCandidate(null);
    setShadowScale(0);
    setPhase("casting");
    timeoutRef.current = setTimeout(() => {
      setPhase("approach");
      const fish = chooseFish(usedBait);
      setCandidate(fish);
      let step = 0;
      const approach = setInterval(() => {
        step += 1;
        setShadowScale(step / 10);
        if (step >= 10) {
          clearInterval(approach);
          setPhase("bite");
          timeoutRef.current = setTimeout(() => setPhase("escaped"), 2300);
        }
      }, 130);
    }, 700);
  };

  const startBattle = () => {
    if (!candidate || phase !== "bite") return;
    clearTimer();
    cursorRef.current = 50;
    targetRef.current = 50;
    progressRef.current = 0;
    finishingRef.current = false;
    setCursor(50);
    setTargetCenter(50);
    setBattleProgress(0);
    setPhase("battle");
  };

  const finishCatch = useCallback(async () => {
    if (!candidate || !spot || finishingRef.current) return;
    finishingRef.current = true;
    const rankIndex = RANK_INDEX[candidate.rank];
    const sizePower = gear.filter((item) => item.effect === "outfit").reduce((sum, item) => sum + item.power, 0);
    const sizeRoll = Math.min(1, Math.pow(Math.random(), 1 / (1 + sizePower * 0.22)));
    const size = Number((candidate.minCm + (candidate.maxCm - candidate.minCm) * sizeRoll).toFixed(1));
    const isPersonalBest = await saveCatch({
      fishId: candidate.id,
      size,
      rank: candidate.rank,
      aquarium: candidate.aquarium,
      spotId: spot.id,
      spotName: spot.name,
      habitat: spot.habitat,
      steps,
    });
    setLast({ ...candidate, size, isPersonalBest });
    setTodayCatch((value) => value + 1);
    setPhase("result");
    load();
    void rankIndex;
  }, [candidate, gear, load, spot, steps]);

  useEffect(() => {
    if (phase !== "battle" || !candidate) return;
    const config = BATTLE_CONFIG[candidate.rank];
    const outfitPower = gear.filter((item) => item.effect === "outfit").reduce((sum, item) => sum + item.power, 0);
    const reelPower = effectPower(gear, "reel");
    const effectiveZone = Math.min(72, config.zone + reelPower * 3);
    const effectiveSeconds = config.seconds * (1 - effectPower(gear, "rod") * 0.05);
    const started = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - started;
      const target = 50 + Math.sin(elapsed / (760 - RANK_INDEX[candidate.rank] * 45)) * (9 + RANK_INDEX[candidate.rank] * 1.7);
      targetRef.current = target;
      const adjustedPull = config.pull * Math.max(0.5, 1 - outfitPower * 0.03);
      const fishPull = Math.sin(elapsed / (240 - RANK_INDEX[candidate.rank] * 12)) * adjustedPull
        + (Math.random() - 0.5) * adjustedPull;
      const reel = holdingRef.current ? 1.25 + reelPower * 0.035 : -0.9;
      const nextCursor = Math.max(0, Math.min(100, cursorRef.current + reel + fishPull));
      cursorRef.current = nextCursor;
      const inside = Math.abs(nextCursor - target) <= effectiveZone / 2;
      const gain = 50 / (effectiveSeconds * 1000) * 100;
      progressRef.current = Math.max(0, Math.min(100, progressRef.current + (inside ? gain : -gain * 0.65)));
      setCursor(nextCursor);
      setTargetCenter(target);
      setBattleProgress(progressRef.current);
      if (progressRef.current >= 100) {
        clearInterval(interval);
        finishCatch();
      } else if ((nextCursor <= 0 || nextCursor >= 100) && elapsed > 1800) {
        clearInterval(interval);
        setPhase("escaped");
      }
    }, 50);
    return () => clearInterval(interval);
  }, [candidate, finishCatch, gear, phase]);

  const config = candidate ? BATTLE_CONFIG[candidate.rank] : BATTLE_CONFIG.E;
  const effectiveZone = Math.min(72, config.zone + effectPower(gear, "reel") * 3);
  const effectiveSeconds = config.seconds * (1 - effectPower(gear, "rod") * 0.05);
  const zoneLeft = Math.max(0, Math.min(100 - effectiveZone, targetCenter - effectiveZone / 2));
  const equippedCooler = gear.find((item) => item.kind === "cooler");
  const dailyCapacity = equippedCooler?.dailyCapacity ?? 10;

  return (
    <Screen>
      <Header title="Fishing Game" sub={`${spot?.emoji ?? "🌿"} ${spot?.name ?? "みずべ公園"} ・ 本日${todayCatch}/${dailyCapacity}匹`} />
      <Card>
        <View style={ui.between}>
          <View>
            <Text style={ui.muted}>現在の釣り場</Text>
            <Text style={styles.spot}>{HABITAT_NAMES[spot?.habitat ?? "pond"]}</Text>
          </View>
          <Text style={ui.muted}>{bait ? `${bait.name}：${bait.targetRanks?.join("・")}狙い` : "餌がありません"}</Text>
        </View>
      </Card>

      <Card style={styles.hero}>
        <FishingSpotArt habitat={spot?.habitat ?? "pond"} height={175} />
        <View style={styles.waterOverlay}>
          {(phase === "approach" || phase === "bite") && (
            <View style={[styles.shadow, { transform: [{ scale: 0.45 + shadowScale * 0.7 }] }]} />
          )}
          {(phase === "casting" || phase === "approach" || phase === "bite") && (
            <View style={[styles.float, phase === "bite" && styles.floatDown]}><View style={styles.floatRed} /></View>
          )}
          {phase === "bite" && <Text style={styles.splash}>SPLASH!</Text>}
        </View>

        {phase === "idle" && <>
          <Text style={styles.phase}>{todayCatch >= dailyCapacity ? "クーラーが満杯です" : bait ? "水面の好きな場所へ投げよう" : "交換画面で餌を購入してください"}</Text>
          <Button title="キャストする（餌を1個消費）" onPress={cast} disabled={!bait || todayCatch >= dailyCapacity} />
        </>}
        {phase === "casting" && <Text style={styles.phase}>仕掛けを投げました…</Text>}
        {phase === "approach" && <Text style={styles.phase}>魚影がウキへ近づいている…</Text>}
        {phase === "bite" && <><Text style={styles.bite}>ウキが沈んだ！</Text><Button title="今だ！ 合わせる" onPress={startBattle} /></>}
        {phase === "escaped" && <><Text style={styles.escape}>魚に逃げられました</Text><Button title="もう一度投げる" onPress={cast} /></>}
      </Card>

      {phase === "battle" && candidate && (
        <Card>
          <View style={ui.between}>
            <Text style={[styles.rank, { color: rankColors[candidate.rank] }]}>{candidate.rank} RANK BATTLE</Text>
            <Text style={ui.muted}>維持目標 {effectiveSeconds.toFixed(1)}秒</Text>
          </View>
          <Text style={styles.battleHelp}>長押しで巻く・離して緩める。魚マーカーを水色の範囲内に維持！</Text>
          <View style={styles.gauge}>
            <View style={[styles.targetZone, { left: `${zoneLeft}%`, width: `${effectiveZone}%` }]} />
            <View style={[styles.fishCursor, { left: `${Math.max(1, Math.min(97, cursor))}%` }]}><Text>🐟</Text></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${battleProgress}%` }]} /></View>
          <Text style={styles.progressText}>捕獲 {Math.round(battleProgress)}%</Text>
          <Pressable
            onPressIn={() => { holdingRef.current = true; }}
            onPressOut={() => { holdingRef.current = false; }}
            style={({ pressed }) => [styles.reelButton, pressed && styles.reelPressed]}
          >
            <Text style={styles.reelText}>長押しでリールを巻く</Text>
          </Pressable>
        </Card>
      )}

      {phase === "result" && last && (
        <Card style={styles.resultCard}>
          <Text style={styles.caught}>CATCH!</Text>
          {last.isPersonalBest && <Text style={styles.best}>🏆 NEW PERSONAL BEST</Text>}
          <FishArt fishId={last.id} size={150} />
          <Text style={[styles.rank, { color: rankColors[last.rank] }]}>{last.rank} RANK</Text>
          <Text style={styles.name}>{last.name}</Text>
          <Text style={styles.size}>{last.size.toLocaleString()} cm</Text>
          <Text style={ui.muted}>ポイント付与なし ・ {last.aquarium}へ格納しました</Text>
          <Button title="続けて釣る" onPress={cast} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spot: { fontSize: 19, fontWeight: "900", color: colors.ink },
  hero: { gap: 14, paddingVertical: 18 },
  waterOverlay: { position: "absolute", top: 26, left: 20, right: 20, height: 160, alignItems: "center", justifyContent: "center" },
  shadow: { width: 62, height: 22, borderRadius: 50, backgroundColor: "rgba(3,43,62,.58)", position: "absolute", top: 86 },
  float: { width: 13, height: 35, borderRadius: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink, position: "absolute", top: 55 },
  floatRed: { height: 14, backgroundColor: colors.coral, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  floatDown: { top: 82, height: 17 },
  splash: { color: colors.white, fontWeight: "900", fontSize: 20, textShadowColor: colors.navy, textShadowRadius: 5 },
  phase: { textAlign: "center", color: colors.muted, fontWeight: "800", fontSize: 16 },
  bite: { textAlign: "center", color: colors.coral, fontSize: 22, fontWeight: "900" },
  escape: { textAlign: "center", color: colors.danger, fontSize: 18, fontWeight: "900" },
  battleHelp: { color: colors.ink, lineHeight: 20, marginVertical: 12 },
  gauge: { height: 58, backgroundColor: "#D9E6E7", borderRadius: 14, position: "relative", overflow: "hidden", borderWidth: 2, borderColor: colors.navy },
  targetZone: { position: "absolute", top: 0, bottom: 0, backgroundColor: "rgba(33,182,168,.55)", borderLeftWidth: 2, borderRightWidth: 2, borderColor: colors.aqua },
  fishCursor: { position: "absolute", top: 15, marginLeft: -12 },
  progressTrack: { height: 13, backgroundColor: colors.line, borderRadius: 8, marginTop: 14, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.gold },
  progressText: { textAlign: "center", fontWeight: "900", color: colors.navy, marginTop: 4 },
  reelButton: { backgroundColor: colors.ocean, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 12 },
  reelPressed: { backgroundColor: colors.coral, transform: [{ scale: 0.98 }] },
  reelText: { color: colors.white, fontWeight: "900", fontSize: 16 },
  resultCard: { alignItems: "center", gap: 7 },
  caught: { color: colors.coral, fontSize: 28, fontWeight: "900" },
  best: { color: colors.gold, fontWeight: "900" },
  rank: { fontWeight: "900", fontSize: 14 },
  name: { fontSize: 27, fontWeight: "900", color: colors.ink },
  size: { fontSize: 20, fontWeight: "900", color: colors.ocean },
});
