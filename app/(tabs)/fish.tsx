import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Button } from "../../src/components/ui";
import { FishArt, FishingSpotArt } from "../../src/components/GameArt";
import { FISH, HABITAT_NAMES, RANK_INDEX, RANKS, Rank, SHOP, ShopItem } from "../../src/constants/game";
import { FishingArea } from "../../src/constants/areas";
import { colors, rankColors } from "../../src/constants/theme";
import {
  consumeSelectedBait, getBaitInventory, getEquippedItems, getSelectedBait, getTodayCatchCount,
  saveCatch, selectBait,
} from "../../src/database/db";
import { getSelectedArea } from "../../src/services/areaService";
import { syncTodaySteps } from "../../src/services/stepService";
import { AppSettings, DEFAULT_SETTINGS, getSettings } from "../../src/services/settingsService";

type Phase = "idle" | "casting" | "approach" | "bite" | "battle" | "result" | "escaped";
type CatchResult = {
  id: string;
  name: string;
  rank: Rank;
  size: number;
  isPersonalBest: boolean;
  aquarium: string;
  bigCatch: boolean;
  closeCall: boolean;
};
type BattleConfig = { zone: number; seconds: number; pull: number };

const BATTLE_CONFIG: Record<Rank, BattleConfig> = {
  E: { zone: 30, seconds: 15, pull: 0.65 },
  D: { zone: 27, seconds: 30, pull: 0.78 },
  C: { zone: 24, seconds: 45, pull: 0.92 },
  B: { zone: 21, seconds: 60, pull: 1.08 },
  A: { zone: 18, seconds: 90, pull: 1.28 },
  S: { zone: 14, seconds: 120, pull: 1.52 },
  SS: { zone: 10, seconds: 150, pull: 1.82 },
  SSS: { zone: 6, seconds: 180, pull: 2.2 },
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

function battleSeconds(rank: Rank, items: ShopItem[]) {
  const base = BATTLE_CONFIG[rank].seconds;
  const rodRate = effectPower(items, "rod") * 0.05;
  const reelRate = effectPower(items, "reel") * 0.04;
  return base * (1 - rodRate) * (1 - reelRate);
}

function baitRank(steps: number, bait: ShopItem) {
  const ranks = bait.targetRanks ?? ["E"];
  if (ranks.length === 1) return ranks[0];
  const highChance = Math.min(0.82, 0.25 + steps / 20000);
  return Math.random() < highChance ? ranks[ranks.length - 1] : ranks[0];
}

function WeatherEffects({ speed }: { speed: number }) {
  const [wave] = useState(() => new Animated.Value(0));
  const [rain] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const waves = Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 2400 / speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0, duration: 2400 / speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const rainfall = Animated.loop(Animated.sequence([
      Animated.timing(rain, { toValue: 1, duration: 1100 / speed, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(rain, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    waves.start();
    rainfall.start();
    return () => { waves.stop(); rainfall.stop(); };
  }, [rain, speed, wave]);
  const waveX = wave.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] });
  const rainY = rain.interpolate({ inputRange: [0, 1], outputRange: [-120, 520] });
  return (
    <View pointerEvents="none" style={styles.weatherLayer}>
      <Animated.View style={[styles.waveBand, { transform: [{ translateX: waveX }] }]} />
      <Animated.View style={[styles.rainLayer, { transform: [{ translateY: rainY }] }]}>
        {Array.from({ length: 18 }, (_, index) => <View key={index} style={[styles.rainDrop, { left: `${(index * 17) % 100}%`, top: (index % 5) * 72 }]} />)}
      </Animated.View>
    </View>
  );
}

export default function FishScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [steps, setSteps] = useState(0);
  const [spot, setSpot] = useState<FishingArea | null>(null);
  const [gear, setGear] = useState<ShopItem[]>([]);
  const [bait, setBait] = useState<ShopItem | null>(null);
  const [todayCatch, setTodayCatch] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [candidate, setCandidate] = useState<(typeof FISH)[number] | null>(null);
  const [last, setLast] = useState<CatchResult | null>(null);
  const [shadowScale, setShadowScale] = useState(0);
  const [approachProgress, setApproachProgress] = useState(0);
  const [cursor, setCursor] = useState(50);
  const [targetCenter, setTargetCenter] = useState(50);
  const [battleProgress, setBattleProgress] = useState(0);
  const [escapeReason, setEscapeReason] = useState("魚に逃げられました");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [baitStock, setBaitStock] = useState<Record<string, number>>({});
  const [showBaitPicker, setShowBaitPicker] = useState(false);
  const reelSound = useAudioPlayer(require("../../assets/audio/reel.wav"));
  const tensionSound = useAudioPlayer(require("../../assets/audio/tension.wav"));
  const splashSound = useAudioPlayer(require("../../assets/audio/splash.wav"));
  const catchSound = useAudioPlayer(require("../../assets/audio/catch.wav"));
  const escapeSound = useAudioPlayer(require("../../assets/audio/escape.wav"));
  const holdingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef(50);
  const progressRef = useRef(0);
  const targetRef = useRef(50);
  const finishingRef = useRef(false);
  const tensionAtRef = useRef(0);
  const reelAudioAtRef = useRef(0);

  const playSound = useCallback((player: typeof reelSound) => {
    if (settings.soundVolume <= 0) return;
    player.volume = settings.soundVolume;
    void player.seekTo(0).then(() => player.play());
  }, [settings.soundVolume]);

  const vibrate = useCallback((kind: "tap" | "warning" | "success" | "error") => {
    if (!settings.vibration) return;
    if (kind === "tap") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else void Haptics.notificationAsync(
      kind === "success" ? Haptics.NotificationFeedbackType.Success
        : kind === "error" ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning,
    );
  }, [settings.vibration]);

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const load = useCallback(async () => {
    const [equipped, selectedArea, todaySteps, selectedBait, catches, savedSettings, baits] = await Promise.all([
      getEquippedItems(),
      getSelectedArea(),
      syncTodaySteps(),
      getSelectedBait(),
      getTodayCatchCount(new Date().toISOString().slice(0, 10)),
      getSettings(),
      getBaitInventory(),
    ]);
    setGear(equipped);
    setSpot(selectedArea);
    setSteps(todaySteps.steps);
    setBait(SHOP.find((item) => item.id === selectedBait?.item_id) ?? null);
    setTodayCatch(catches);
    setSettings(savedSettings);
    setBaitStock(Object.fromEntries(baits.map((item) => [item.item_id, item.quantity])));
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
    setApproachProgress(0);
    setPhase("casting");
    vibrate("tap");
    timeoutRef.current = setTimeout(() => {
      setPhase("approach");
      const fish = chooseFish(usedBait);
      setCandidate(fish);
      let step = 0;
      const approachSteps = 25;
      const approachTick = Math.max(120, 5200 / settings.animationSpeed / approachSteps);
      const approach = setInterval(() => {
        step += 1;
        const progress = Math.min(100, step / approachSteps * 100);
        setApproachProgress(progress);
        setShadowScale(progress / 100);
        if (step >= approachSteps) {
          clearInterval(approach);
          setApproachProgress(100);
          setPhase("bite");
          playSound(splashSound);
          vibrate("warning");
          timeoutRef.current = setTimeout(() => {
            setEscapeReason("合わせるのが遅く、魚が逃げました");
            playSound(escapeSound);
            setPhase("escaped");
          }, 2300 / settings.animationSpeed);
        }
      }, approachTick);
    }, 700 / settings.animationSpeed);
  };

  const startBattle = () => {
    if (!candidate || phase !== "bite") return;
    clearTimer();
    cursorRef.current = 82;
    targetRef.current = 34;
    progressRef.current = 0;
    finishingRef.current = false;
    setCursor(82);
    setTargetCenter(34);
    setBattleProgress(0);
    setPhase("battle");
    vibrate("tap");
  };

  const finishCatch = useCallback(async () => {
    if (!candidate || !spot || finishingRef.current) return;
    finishingRef.current = true;
    const rankIndex = RANK_INDEX[candidate.rank];
    const sizePower = effectPower(gear, "outfit");
    const sizeRoll = Math.min(1, Math.pow(Math.random(), 1 / (1 + sizePower * 0.22)));
    const size = Number((candidate.minCm + (candidate.maxCm - candidate.minCm) * sizeRoll).toFixed(1));
    const sizeRatio = (size - candidate.minCm) / Math.max(1, candidate.maxCm - candidate.minCm);
    const closeCall = progressRef.current >= 96 && Math.abs(cursorRef.current - targetRef.current) > BATTLE_CONFIG[candidate.rank].zone * 0.38;
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
    setLast({ ...candidate, size, isPersonalBest, bigCatch: sizeRatio >= 0.86 || RANK_INDEX[candidate.rank] >= 6, closeCall });
    setTodayCatch((value) => value + 1);
    setPhase("result");
    playSound(catchSound);
    vibrate("success");
    load();
    void rankIndex;
  }, [candidate, catchSound, gear, load, playSound, spot, steps, vibrate]);

  useEffect(() => {
    if (phase !== "battle" || !candidate) return;
    const config = BATTLE_CONFIG[candidate.rank];
    const outfitPower = effectPower(gear, "outfit");
    const reelPower = effectPower(gear, "reel");
    const effectiveZone = Math.min(72, config.zone + reelPower * 3);
    const effectiveSeconds = battleSeconds(candidate.rank, gear);
    const started = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - started;
      const target = 34;
      const personality = [...candidate.id].reduce((sum, value) => sum + value.charCodeAt(0), 0) % 4;
      const burst = personality === 0 ? Math.sin(elapsed / 93) * (elapsed % 2400 < 430 ? 2.2 : 0)
        : personality === 1 ? Math.cos(elapsed / 150) * 0.75
          : personality === 2 ? (elapsed % 3100 < 260 ? 2.8 : -0.25)
            : Math.sin(elapsed / 420) * 0.5;
      targetRef.current = target;
      const adjustedPull = config.pull * Math.max(0.5, 1 - outfitPower * 0.03);
      const fishEscape = 0.3 + adjustedPull * 0.13
        + Math.max(-0.12, burst * 0.1)
        + (Math.random() - 0.5) * adjustedPull * 0.08;
      const reel = holdingRef.current ? -(0.66 + reelPower * 0.04) : 0;
      if (holdingRef.current && Date.now() - reelAudioAtRef.current > 320) {
        reelAudioAtRef.current = Date.now();
        playSound(reelSound);
      }
      const rawCursor = cursorRef.current + reel + fishEscape;
      const nextCursor = Math.max(0, Math.min(100, rawCursor));
      cursorRef.current = nextCursor;
      const inside = Math.abs(nextCursor - target) <= effectiveZone / 2;
      const gain = 50 / (effectiveSeconds * 1000) * 100;
      progressRef.current = Math.max(0, Math.min(100, progressRef.current + (inside ? gain : -gain * 0.85)));
      setCursor(nextCursor);
      setTargetCenter(target);
      setBattleProgress(progressRef.current);
      if ((nextCursor < 9 || nextCursor > 91) && Date.now() - tensionAtRef.current > 900) {
        tensionAtRef.current = Date.now();
        playSound(tensionSound);
        vibrate("warning");
      }
      if (progressRef.current >= 100) {
        clearInterval(interval);
        finishCatch();
      } else if ((rawCursor <= 0 || rawCursor >= 100) && elapsed > 1800) {
        clearInterval(interval);
        setEscapeReason(rawCursor <= 0 ? "巻きすぎて糸が切れました" : "魚がゲージ外へ逃げ、糸が切れました");
        playSound(escapeSound);
        vibrate("error");
        setPhase("escaped");
      }
    }, 50);
    return () => clearInterval(interval);
  }, [candidate, escapeSound, finishCatch, gear, phase, playSound, reelSound, tensionSound, vibrate]);

  const config = candidate ? BATTLE_CONFIG[candidate.rank] : BATTLE_CONFIG.E;
  const effectiveZone = Math.min(72, config.zone + effectPower(gear, "reel") * 3);
  const effectiveSeconds = candidate ? battleSeconds(candidate.rank, gear) : config.seconds;
  const zoneLeft = Math.max(0, Math.min(100 - effectiveZone, targetCenter - effectiveZone / 2));
  const inTargetZone = Math.abs(cursor - targetCenter) <= effectiveZone / 2;
  const battleDanger = cursor < 10 || cursor > 90;
  const captureColor = battleProgress >= 70 ? "#36C96B" : battleProgress >= 35 ? colors.gold : colors.coral;
  const equippedCooler = gear.find((item) => item.kind === "cooler");
  const dailyCapacity = equippedCooler?.dailyCapacity ?? 10;

  const exitFishing = () => {
    holdingRef.current = false;
    clearTimer();
    setShowBaitPicker(false);
    setPhase("idle");
    router.navigate("/(tabs)/map");
  };

  const changeBait = async (itemId: string) => {
    await selectBait(itemId);
    await load();
    setShowBaitPicker(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.scene}>
        <FishingSpotArt habitat={spot?.habitat ?? "pond"} height={Math.max(520, height)} />
        <View style={styles.sceneShade} />
        <WeatherEffects speed={settings.animationSpeed} />
        <View style={styles.topHud}>
          <Text style={styles.hudTitle}>{spot?.emoji ?? "🌿"} {spot?.name ?? "釣り場"}</Text>
          <Text style={styles.hudText}>{HABITAT_NAMES[spot?.habitat ?? "pond"]} ・ 本日 {todayCatch}/{dailyCapacity}匹</Text>
          <Text style={styles.hudText}>{bait ? `${bait.name}／${bait.targetRanks?.join("・")}狙い` : "餌がありません"}</Text>
          {!["casting", "approach", "bite", "battle"].includes(phase) && (
            <Pressable onPress={() => setShowBaitPicker(true)} style={styles.baitChangeButton}>
              <Text style={styles.baitChangeText}>餌を変更</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.waterOverlay}>
          {(phase === "casting" || phase === "approach" || phase === "bite") && (
            <View style={styles.approachPanel}>
              <View style={styles.approachHeader}>
                <Text style={styles.approachTitle}>{phase === "casting" ? "仕掛けを投入中" : phase === "bite" ? "魚が食いついた！" : "魚が近づいています"}</Text>
                <Text style={styles.approachPercent}>{Math.round(approachProgress)}%</Text>
              </View>
              <View style={styles.approachGauge}>
                <View style={styles.approachGreen} /><View style={styles.approachYellow} /><View style={styles.approachRed} />
                <View style={[styles.approachFish, { left: `${Math.max(2, Math.min(94, approachProgress))}%` }]}><Text style={styles.approachFishIcon}>🐟</Text></View>
                <View style={styles.approachHook}><Text style={styles.approachHookIcon}>🪝</Text></View>
              </View>
              <Text style={styles.approachMessage}>{approachProgress < 35 ? "魚影がこちらへ向かっています" : approachProgress < 75 ? "ウキの近くまで来ました" : approachProgress < 100 ? "もうすぐ食いつきます！" : "今すぐ合わせてください！"}</Text>
            </View>
          )}
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
              <Text style={styles.escape}>{escapeReason}</Text>
              <View style={styles.choiceActions}>
                <View style={styles.choiceAction}><Button title="終了する" kind="secondary" onPress={exitFishing} /></View>
                <View style={styles.choiceAction}><Button title="もう一度投げる" onPress={cast} /></View>
              </View>
            </>}
            {phase === "battle" && candidate && <>
              <View style={styles.between}>
                <Text style={[styles.rank, { color: rankColors[candidate.rank] }]}>{candidate.rank} RANK BATTLE</Text>
                <Text style={styles.muted}>基準 {config.seconds}秒 → 装備後 {effectiveSeconds.toFixed(1)}秒</Text>
              </View>
              <View style={styles.battleStatusRow}>
                <Text style={styles.battleHelp}>魚を緑の枠まで巻き寄せて維持</Text>
                <Text style={[styles.battleStatus, inTargetZone && styles.battleStatusSafe, battleDanger && styles.battleStatusDanger]}>
                  {battleDanger ? "糸切れ注意" : inTargetZone ? "捕獲中！" : cursor > targetCenter ? "魚が逃走中" : "巻きすぎ注意"}
                </Text>
              </View>
              <View style={styles.distanceLabels}>
                <Text style={styles.distanceLabel}>近い</Text><Text style={styles.distanceTitle}>魚との距離</Text><Text style={styles.distanceLabel}>遠い</Text>
              </View>
              <View style={styles.gauge}>
                <View style={styles.distanceGreen} />
                <View style={styles.distanceYellow} />
                <View style={styles.distanceRed} />
                <View style={[styles.targetZone, { left: `${zoneLeft}%`, width: `${effectiveZone}%` }]} />
                <View style={styles.anglerCursor}><Text style={styles.anglerIcon}>🧍</Text></View>
                <View style={[styles.fishCursor, { left: `${Math.max(4, Math.min(96, cursor))}%` }]}><Text style={styles.battleFishIcon}>🐟</Text></View>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${battleProgress}%`, backgroundColor: captureColor }]} /></View>
              <Text style={styles.progressText}>捕獲 {Math.round(battleProgress)}%</Text>
              <Pressable
                onPressIn={() => {
                  holdingRef.current = true;
                  vibrate("tap");
                }}
                onPressOut={() => {
                  holdingRef.current = false;
                }}
                style={({ pressed }) => [styles.reelButton, pressed && styles.reelPressed]}
              >
                <Text style={styles.reelText}>長押しして左へ巻き寄せる</Text>
                <Text style={styles.reelSubText}>離すと魚は右へ逃げます</Text>
              </Pressable>
            </>}
          </View>
        )}

        {phase === "result" && last && (
          <View style={styles.resultPanel}>
            <Text style={styles.caught}>CATCH!</Text>
            {last.bigCatch && <Text style={styles.bigCatch}>✨ BIG CATCH! ✨</Text>}
            {last.closeCall && <Text style={styles.closeCall}>ギリギリの勝利！</Text>}
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
        <Modal visible={showBaitPicker} transparent animationType="fade" onRequestClose={() => setShowBaitPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBaitPicker(false)}>
            <Pressable style={styles.baitModal} onPress={() => undefined}>
              <Text style={styles.baitModalTitle}>使用する餌を選択</Text>
              <Text style={styles.baitModalHelp}>餌によって狙える魚のランクが変わります</Text>
              {SHOP.filter((item) => item.kind === "bait").map((item) => {
                const quantity = baitStock[item.id] ?? 0;
                const selected = bait?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    disabled={quantity <= 0}
                    onPress={() => changeBait(item.id)}
                    style={[styles.baitOption, selected && styles.selectedBaitOption, quantity <= 0 && styles.emptyBaitOption]}
                  >
                    <Text style={styles.baitOptionEmoji}>{item.emoji}</Text>
                    <View style={styles.baitOptionInfo}>
                      <Text style={styles.baitOptionName}>{item.name}</Text>
                      <Text style={styles.baitOptionRanks}>{item.targetRanks?.join("・")}ランク狙い</Text>
                    </View>
                    <View style={styles.baitOptionRight}>
                      <Text style={styles.baitQuantity}>残り {quantity}個</Text>
                      <Text style={selected ? styles.baitSelected : styles.baitSelect}>{selected ? "選択中" : quantity > 0 ? "使う" : "在庫なし"}</Text>
                    </View>
                  </Pressable>
                );
              })}
              <Button title="閉じる" kind="secondary" onPress={() => setShowBaitPicker(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  scene: { flex: 1, position: "relative", overflow: "hidden" },
  sceneShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(2,31,43,.12)" },
  weatherLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  waveBand: { position: "absolute", top: "35%", left: -35, right: -35, height: 24, borderTopWidth: 3, borderBottomWidth: 1, borderColor: "rgba(255,255,255,.36)", borderRadius: 50, backgroundColor: "rgba(33,182,168,.13)" },
  rainLayer: { position: "absolute", top: -520, right: 0, left: 0, height: 620 },
  rainDrop: { position: "absolute", width: 1.5, height: 24, borderRadius: 2, backgroundColor: "rgba(220,247,255,.38)", transform: [{ rotate: "12deg" }] },
  topHud: { position: "absolute", top: 12, left: 12, right: 12, backgroundColor: "rgba(6,59,76,.88)", borderRadius: 17, padding: 12 },
  hudTitle: { color: colors.white, fontSize: 19, fontWeight: "900" },
  hudText: { color: "#D7F5F2", fontSize: 11, fontWeight: "700", marginTop: 2 },
  baitChangeButton: { position: "absolute", right: 10, bottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: colors.coral },
  baitChangeText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  waterOverlay: { position: "absolute", top: "18%", left: 20, right: 20, height: "42%", alignItems: "center", justifyContent: "center" },
  approachPanel: { position: "absolute", top: 0, left: 0, right: 0, borderRadius: 16, padding: 10, backgroundColor: "rgba(255,255,255,.94)", borderWidth: 2, borderColor: colors.navy },
  approachHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  approachTitle: { color: colors.navy, fontSize: 13, fontWeight: "900" },
  approachPercent: { color: colors.coral, fontSize: 13, fontWeight: "900" },
  approachGauge: { height: 28, marginTop: 7, borderRadius: 7, overflow: "hidden", flexDirection: "row", borderWidth: 2, borderColor: colors.navy, position: "relative" },
  approachGreen: { flex: 1, backgroundColor: "#43D94D" },
  approachYellow: { flex: 1, backgroundColor: "#F4D83D" },
  approachRed: { flex: 1, backgroundColor: "#FF654F" },
  approachFish: { position: "absolute", top: 1, marginLeft: -12, zIndex: 3 },
  approachFishIcon: { fontSize: 18, transform: [{ scaleX: -1 }] },
  approachHook: { position: "absolute", right: 2, top: 0, zIndex: 4 },
  approachHookIcon: { fontSize: 18 },
  approachMessage: { color: colors.muted, fontSize: 10, fontWeight: "800", textAlign: "center", marginTop: 5 },
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
  battleStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  battleHelp: { color: colors.ink, fontSize: 11, fontWeight: "700", flex: 1 },
  battleStatus: { color: colors.gold, fontSize: 11, fontWeight: "900" },
  battleStatusSafe: { color: "#179653" },
  battleStatusDanger: { color: colors.danger },
  distanceLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: -5 },
  distanceLabel: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  distanceTitle: { color: colors.navy, fontSize: 11, fontWeight: "900" },
  gauge: { height: 64, borderRadius: 15, position: "relative", overflow: "hidden", borderWidth: 3, borderColor: colors.navy, flexDirection: "row" },
  distanceGreen: { flex: 1, backgroundColor: "#42D96B" },
  distanceYellow: { flex: 1, backgroundColor: "#F5D94B" },
  distanceRed: { flex: 1, backgroundColor: "#FF6858" },
  targetZone: { position: "absolute", top: 3, bottom: 3, backgroundColor: "rgba(255,255,255,.3)", borderWidth: 3, borderColor: "#058C62", borderRadius: 9 },
  anglerCursor: { position: "absolute", left: 2, top: 14, zIndex: 4 },
  anglerIcon: { fontSize: 24 },
  fishCursor: { position: "absolute", top: 16, marginLeft: -13, zIndex: 5 },
  battleFishIcon: { fontSize: 22, transform: [{ scaleX: -1 }] },
  progressTrack: { height: 13, backgroundColor: colors.line, borderRadius: 8, marginTop: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.gold },
  progressText: { textAlign: "center", fontWeight: "900", color: colors.navy, marginTop: 4 },
  reelButton: { backgroundColor: colors.ocean, borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 2 },
  reelPressed: { backgroundColor: colors.coral, transform: [{ scale: 0.98 }] },
  reelText: { color: colors.white, fontWeight: "900", fontSize: 16 },
  reelSubText: { color: "rgba(255,255,255,.8)", fontWeight: "700", fontSize: 10, marginTop: 2 },
  resultPanel: { position: "absolute", left: 18, right: 18, top: "12%", backgroundColor: "rgba(255,255,255,.96)", borderRadius: 24, padding: 17, alignItems: "center", gap: 6 },
  resultActions: { flexDirection: "row", gap: 8, alignSelf: "stretch", marginTop: 4 },
  resultAction: { flex: 1 },
  caught: { color: colors.coral, fontSize: 28, fontWeight: "900" },
  best: { color: colors.gold, fontWeight: "900" },
  bigCatch: { color: "#C88900", fontSize: 18, fontWeight: "900", textShadowColor: "#FFF0A8", textShadowRadius: 8 },
  closeCall: { color: colors.coral, fontSize: 13, fontWeight: "900" },
  rank: { fontWeight: "900", fontSize: 14 },
  name: { fontSize: 27, fontWeight: "900", color: colors.ink },
  size: { fontSize: 20, fontWeight: "900", color: colors.ocean },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 18, backgroundColor: "rgba(1,19,28,.78)" },
  baitModal: { borderRadius: 23, padding: 16, gap: 9, backgroundColor: colors.white },
  baitModalTitle: { color: colors.navy, fontSize: 21, fontWeight: "900", textAlign: "center" },
  baitModalHelp: { color: colors.muted, fontSize: 11, textAlign: "center", marginBottom: 3 },
  baitOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.foam },
  selectedBaitOption: { borderWidth: 2, borderColor: colors.coral, backgroundColor: "#FFF3EF" },
  emptyBaitOption: { opacity: 0.42 },
  baitOptionEmoji: { fontSize: 28 },
  baitOptionInfo: { flex: 1 },
  baitOptionName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  baitOptionRanks: { color: colors.muted, fontSize: 10, marginTop: 2 },
  baitOptionRight: { alignItems: "flex-end", gap: 3 },
  baitQuantity: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  baitSelected: { color: colors.coral, fontSize: 10, fontWeight: "900" },
  baitSelect: { color: colors.ocean, fontSize: 10, fontWeight: "900" },
});
