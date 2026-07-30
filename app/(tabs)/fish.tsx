import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Button } from "../../src/components/ui";
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
  E: { zone: 30, seconds: 38, pull: 0.65 },
  D: { zone: 27, seconds: 45, pull: 0.78 },
  C: { zone: 24, seconds: 52, pull: 0.92 },
  B: { zone: 21, seconds: 60, pull: 1.08 },
  A: { zone: 18, seconds: 70, pull: 1.28 },
  S: { zone: 14, seconds: 82, pull: 1.52 },
  SS: { zone: 10, seconds: 96, pull: 1.82 },
  SSS: { zone: 6, seconds: 115, pull: 2.2 },
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
  const router = useRouter();
  const { height } = useWindowDimensions();
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
    const sizePower = effectPower(gear, "outfit");
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
    const outfitPower = effectPower(gear, "outfit");
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

  const exitFishing = () => router.replace("/(tabs)/map");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.scene}>
        <FishingSpotArt habitat={spot?.habitat ?? "pond"} height={Math.max(520, height)} />
        <View style={styles.sceneShade} />
        <View style={styles.topHud}>
          <Text style={styles.hudTitle}>{spot?.emoji ?? "🌿"} {spot?.name ?? "釣り場"}</Text>
          <Text style={styles.hudText}>{HABITAT_NAMES[spot?.habitat ?? "pond"]} ・ 本日 {todayCatch}/{dailyCapacity}匹</Text>
          <Text style={styles.hudText}>{bait ? `${bait.name}／${bait.targetRanks?.join("・")}狙い` : "餌がありません"}</Text>
        </View>

        <View style={styles.waterOverlay}>
          {(phase === "approach" || phase === "bite") && (
            <View style={[styles.shadow, { transform: [{ scale: 0.45 + shadowScale * 0.7 }] }]} />
          )}
          {(phase === "casting" || phase === "approach" || phase === "bite") && (
            <View style={[styles.float, phase === "bite" && styles.floatDown]}><View style={styles.floatRed} /></View>
          )}
          {phase === "bite" && <Text style={styles.splash}>SPLASH!</Text>}
        </View>

        {phase !== "result" && (
          <View style={styles.controlPanel}>
            {phase === "idle" && <>
              <Text style={styles.panelTitle}>この場所で釣りますか？</Text>
              <Text style={styles.panelHelp}>{todayCatch >= dailyCapacity ? "クーラーが満杯です" : bait ? "投げると餌を1個消費します" : "交換画面で餌を購入してください"}</Text>
              <View style={styles.choiceActions}>
                <View style={styles.choiceAction}><Button title="終了する" kind="secondary" onPress={exitFishing} /></View>
                <View style={styles.choiceAction}><Button title="投げる" onPress={cast} disabled={!bait || todayCatch >= dailyCapacity} /></View>
              </View>
            </>}
            {phase === "casting" && <Text style={styles.phase}>仕掛けを投げました…</Text>}
            {phase === "approach" && <Text style={styles.phase}>魚影がウキへ近づいている…</Text>}
            {phase === "bite" && <>
              <Text style={styles.bite}>ウキが沈んだ！</Text>
              <Button title="今だ！ 合わせる" onPress={startBattle} />
            </>}
            {phase === "escaped" && <>
              <Text style={styles.escape}>魚に逃げられました</Text>
              <View style={styles.choiceActions}>
                <View style={styles.choiceAction}><Button title="終了する" kind="secondary" onPress={exitFishing} /></View>
                <View style={styles.choiceAction}><Button title="もう一度投げる" onPress={cast} /></View>
              </View>
            </>}
            {phase === "battle" && candidate && <>
              <View style={styles.between}>
                <Text style={[styles.rank, { color: rankColors[candidate.rank] }]}>{candidate.rank} RANK BATTLE</Text>
                <Text style={styles.muted}>維持目標 {effectiveSeconds.toFixed(1)}秒</Text>
              </View>
              <Text style={styles.battleHelp}>魚を水色の範囲内に維持</Text>
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
            </>}
          </View>
        )}

        {phase === "result" && last && (
          <View style={styles.resultPanel}>
            <Text style={styles.caught}>CATCH!</Text>
            {last.isPersonalBest && <Text style={styles.best}>🏆 NEW PERSONAL BEST</Text>}
            <FishArt fishId={last.id} size={130} />
            <Text style={[styles.rank, { color: rankColors[last.rank] }]}>{last.rank} RANK</Text>
            <Text style={styles.name}>{last.name}</Text>
            <Text style={styles.size}>{last.size.toLocaleString()} cm</Text>
            <Text style={styles.muted}>ポイント付与なし ・ {last.aquarium}へ格納</Text>
            <View style={styles.resultActions}>
              <View style={styles.resultAction}><Button title="釣りをやめる" kind="secondary" onPress={exitFishing} /></View>
              <View style={styles.resultAction}><Button title="続けて釣る" onPress={cast} /></View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  scene: { flex: 1, position: "relative", overflow: "hidden" },
  sceneShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(2,31,43,.12)" },
  topHud: { position: "absolute", top: 12, left: 12, right: 12, backgroundColor: "rgba(6,59,76,.88)", borderRadius: 17, padding: 12 },
  hudTitle: { color: colors.white, fontSize: 19, fontWeight: "900" },
  hudText: { color: "#D7F5F2", fontSize: 11, fontWeight: "700", marginTop: 2 },
  waterOverlay: { position: "absolute", top: "18%", left: 20, right: 20, height: "42%", alignItems: "center", justifyContent: "center" },
  shadow: { width: 82, height: 28, borderRadius: 50, backgroundColor: "rgba(3,43,62,.58)", position: "absolute", top: "52%" },
  float: { width: 15, height: 42, borderRadius: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink, position: "absolute", top: "35%" },
  floatRed: { height: 14, backgroundColor: colors.coral, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  floatDown: { top: "54%", height: 18 },
  splash: { color: colors.white, fontWeight: "900", fontSize: 27, textShadowColor: colors.navy, textShadowRadius: 5 },
  controlPanel: { position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: "rgba(255,255,255,.95)", borderRadius: 22, padding: 15, gap: 9 },
  panelTitle: { textAlign: "center", color: colors.navy, fontWeight: "900", fontSize: 20 },
  panelHelp: { textAlign: "center", color: colors.muted, fontWeight: "700", fontSize: 12 },
  choiceActions: { flexDirection: "row", gap: 8 },
  choiceAction: { flex: 1 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { fontSize: 11, color: colors.muted, textAlign: "center" },
  phase: { textAlign: "center", color: colors.navy, fontWeight: "900", fontSize: 18, paddingVertical: 12 },
  bite: { textAlign: "center", color: colors.coral, fontSize: 22, fontWeight: "900" },
  escape: { textAlign: "center", color: colors.danger, fontSize: 18, fontWeight: "900" },
  battleHelp: { color: colors.ink, textAlign: "center", fontSize: 12 },
  gauge: { height: 58, backgroundColor: "#D9E6E7", borderRadius: 14, position: "relative", overflow: "hidden", borderWidth: 2, borderColor: colors.navy },
  targetZone: { position: "absolute", top: 0, bottom: 0, backgroundColor: "rgba(33,182,168,.55)", borderLeftWidth: 2, borderRightWidth: 2, borderColor: colors.aqua },
  fishCursor: { position: "absolute", top: 15, marginLeft: -12 },
  progressTrack: { height: 13, backgroundColor: colors.line, borderRadius: 8, marginTop: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.gold },
  progressText: { textAlign: "center", fontWeight: "900", color: colors.navy, marginTop: 4 },
  reelButton: { backgroundColor: colors.ocean, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 2 },
  reelPressed: { backgroundColor: colors.coral, transform: [{ scale: 0.98 }] },
  reelText: { color: colors.white, fontWeight: "900", fontSize: 16 },
  resultPanel: { position: "absolute", left: 18, right: 18, top: "12%", backgroundColor: "rgba(255,255,255,.96)", borderRadius: 24, padding: 17, alignItems: "center", gap: 6 },
  resultActions: { flexDirection: "row", gap: 8, alignSelf: "stretch", marginTop: 4 },
  resultAction: { flex: 1 },
  caught: { color: colors.coral, fontSize: 28, fontWeight: "900" },
  best: { color: colors.gold, fontWeight: "900" },
  rank: { fontWeight: "900", fontSize: 14 },
  name: { fontSize: 27, fontWeight: "900", color: colors.ink },
  size: { fontSize: 20, fontWeight: "900", color: colors.ocean },
});
