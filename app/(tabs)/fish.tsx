import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { AudioPlayer, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Button } from "../../src/components/ui";
import { FishArt, FishingSpotArt } from "../../src/components/GameArt";
import { FISH, HABITAT_NAMES, RANK_INDEX, RANKS, Rank, SHOP, ShopItem } from "../../src/constants/game";
import { FISHING_AREAS, FishingArea } from "../../src/constants/areas";
import { colors, rankColors } from "../../src/constants/theme";
import {
  consumeSelectedBait, getBaitInventory, getEquippedItems, getSelectedBait, getTodayCatchCount,
  getCatchSummaries, getPlayerProgress, saveCatch, selectBait,
} from "../../src/database/db";
import { getSelectedArea } from "../../src/services/areaService";
import { syncTodaySteps } from "../../src/services/stepService";
import { AppSettings, DEFAULT_SETTINGS, getSettings } from "../../src/services/settingsService";
import { calculatePlayerProgress, PlayerProgress } from "../../src/constants/player";

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
  isBoss: boolean;
  unlockedAreaName?: string;
  expGained: number;
  playerLevel: number;
  levelUp: boolean;
};
type BattleConfig = { zone: number; seconds: number; pull: number };
const bossCutin = require("../../assets/game/boss-cutin.png");
const firstPersonRod = require("../../assets/game/first-person-rod.png");
const fishShadowImage = require("../../assets/game/fish-shadow.png");

function startLoopMusic(player: AudioPlayer, volume: number) {
  player.loop = true;
  player.volume = volume;
  void player.seekTo(0).then(() => player.play());
}

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

const RANK_START_DISTANCE: Record<Rank, number> = {
  E:30, D:40, C:50, B:60, A:75, S:90, SS:110, SSS:150,
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

function ReelWindingIndicator({ active, direction }: { active: boolean; direction: -1 | 0 | 1 }) {
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active) { turn.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(turn, { toValue:1, duration:360, easing:Easing.linear, useNativeDriver:true }));
    loop.start();
    return () => loop.stop();
  }, [active, turn]);
  if (!active) return null;
  const handleRotation = turn.interpolate({ inputRange:[0,1], outputRange:direction < 0 ? ["0deg","-360deg"] : ["0deg","360deg"] });
  const spoolRotation = turn.interpolate({ inputRange:[0,1], outputRange:direction < 0 ? ["0deg","720deg"] : ["0deg","-720deg"] });
  return <View style={styles.windingIndicator}>
    <Text style={styles.windingLabel}>{direction < 0 ? "左巻き中" : "右巻き中"}</Text>
    <View style={styles.windingReelBody}>
      <Animated.View style={[styles.windingSpool, { transform:[{ rotate:spoolRotation }] }]}>
        <View style={styles.windingSpoolLine} />
        <View style={[styles.windingSpoolLine, { transform:[{ rotate:"90deg" }] }]} />
        <View style={styles.windingHub} />
      </Animated.View>
      <Animated.View style={[styles.windingHandle, { transform:[{ rotate:handleRotation }] }]}>
        <View style={styles.windingHandleArm} />
        <View style={styles.windingHandleKnob} />
      </Animated.View>
    </View>
    <Text style={styles.windingMotion}>↻ 糸を巻き取っています</Text>
  </View>;
}

function FirstPersonFishingLayer({ active, fishId, discovered, fishDirection, rodDirection, reeling, danger, boss }: {
  active: boolean;
  fishId?: string;
  discovered: boolean;
  fishDirection: -1 | 1;
  rodDirection: -1 | 0 | 1;
  reeling: boolean;
  danger: boolean;
  boss: boolean;
}) {
  const [rodLean] = useState(() => new Animated.Value(0));
  const [jump] = useState(() => new Animated.Value(0));
  const [ripple] = useState(() => new Animated.Value(0));
  const [reelTurn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(rodLean, {
      toValue: active ? rodDirection : 0,
      speed: danger ? 26 : 13,
      bounciness: danger ? 15 : 8,
      useNativeDriver: true,
    }).start();
  }, [active, danger, rodDirection, rodLean]);

  useEffect(() => {
    if (!active) { jump.setValue(0); ripple.setValue(0); return; }
    const jumpLoop = Animated.loop(Animated.sequence([
      Animated.timing(jump, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(jump, { toValue: 0, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(boss ? 10000 : 5000),
    ]));
    const rippleLoop = Animated.loop(Animated.sequence([
      Animated.timing(ripple, { toValue: 1, duration: 1450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ripple, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    jumpLoop.start(); rippleLoop.start();
    return () => { jumpLoop.stop(); rippleLoop.stop(); };
  }, [active, boss, jump, ripple]);

  useEffect(() => {
    if (!active || !reeling) return;
    reelTurn.setValue(0);
    const loop = Animated.loop(Animated.timing(reelTurn, { toValue: 1, duration: 330, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [active, reelTurn, reeling]);

  if (!active) return null;
  const rodX = rodLean.interpolate({ inputRange: [-1, 0, 1], outputRange: [-7, 0, 7] });
  const rodRotate = rodLean.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-22deg", "0deg", "22deg"] });
  const jumpY = jump.interpolate({ inputRange: [0, .52, 1], outputRange: [4, -135, 0] });
  const jumpRotate = jump.interpolate({ inputRange: [0, .5, 1], outputRange: ["-8deg", fishDirection < 0 ? "-28deg" : "28deg", "8deg"] });
  const fishOpacity = jump.interpolate({ inputRange: [0, .08, .9, 1], outputRange: [0, 1, 1, 0] });
  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [.35, 1.8] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, .72, 1], outputRange: [.65, .25, 0] });
  const reelRotate = reelTurn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const spoolRotate = reelTurn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-720deg"] });
  const reelPulse = reelTurn.interpolate({ inputRange: [0, .5, 1], outputRange: [1, 1.06, 1] });
  return (
    <View pointerEvents="none" style={styles.firstPersonLayer}>
      <View style={styles.waterGlint} />
      <Animated.View style={[styles.waterRipple, { opacity: rippleOpacity, transform: [{ scaleX: rippleScale }, { scaleY: rippleScale }] }]} />
      {fishId && (
        <Animated.View style={[styles.jumpingFish, { left: fishDirection < 0 ? "17%" : "58%", opacity: fishOpacity, transform: [{ translateY: jumpY }, { rotate: jumpRotate }, { scaleX: fishDirection }] }]}>
          {discovered
            ? <FishArt fishId={fishId} size={boss ? 118 : 82} />
            : <Image source={fishShadowImage} resizeMode="contain" style={[styles.jumpingShadow, boss && styles.jumpingBossShadow]} />}
          <View style={styles.fishSplash}><Text style={styles.fishSplashText}>💦</Text></View>
        </Animated.View>
      )}
      <Animated.View style={[styles.rodRig, { transform: [{ translateX: rodX }, { rotate: rodRotate }, { scale: danger ? 1.035 : 1 }] }]}>
        <Image source={firstPersonRod} resizeMode="contain" style={styles.rodImage} />
        <Animated.View style={[styles.reelHousing, { transform: [{ scale: reeling ? reelPulse : 1 }] }]}>
          <Animated.View style={[styles.reelSpool, { transform: [{ rotate: spoolRotate }] }]}>
            <View style={styles.reelSpoolLine} />
            <View style={[styles.reelSpoolLine, { transform: [{ rotate: "60deg" }] }]} />
            <View style={[styles.reelSpoolLine, { transform: [{ rotate: "120deg" }] }]} />
            <View style={styles.reelHub} />
          </Animated.View>
          <Animated.View style={[styles.reelHandle, { transform: [{ rotate: reelRotate }] }]}>
            <View style={styles.reelHandleArm} />
            <View style={styles.reelHandleKnob} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      {danger && <View style={styles.tensionFlash}><Text style={styles.tensionFlashText}>!</Text></View>}
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
  const [battleProgress, setBattleProgress] = useState(0);
  const [escapeReason, setEscapeReason] = useState("魚に逃げられました");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [baitStock, setBaitStock] = useState<Record<string, number>>({});
  const [showBaitPicker, setShowBaitPicker] = useState(false);
  const [showBossCutin, setShowBossCutin] = useState(false);
  const [bossStage, setBossStage] = useState(1);
  const [bossRage, setBossRage] = useState(false);
  const [fishAction, setFishAction] = useState("");
  const [fishDirection, setFishDirection] = useState<-1 | 1>(1);
  const [timingFeedback, setTimingFeedback] = useState("");
  const [isReeling, setIsReeling] = useState(false);
  const [rodDirection, setRodDirection] = useState<-1 | 0 | 1>(0);
  const [fishX, setFishX] = useState(50);
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => calculatePlayerProgress(0));
  const reelSound = useAudioPlayer(require("../../assets/audio/reel.wav"));
  const tensionSound = useAudioPlayer(require("../../assets/audio/tension.wav"));
  const splashSound = useAudioPlayer(require("../../assets/audio/splash.wav"));
  const catchSound = useAudioPlayer(require("../../assets/audio/catch.wav"));
  const escapeSound = useAudioPlayer(require("../../assets/audio/escape.wav"));
  const bossMusic = useAudioPlayer(require("../../assets/audio/boss-battle.wav"));
  const fishingMusic = useAudioPlayer(require("../../assets/audio/bgm-fishing.wav"));
  const battleMusic = useAudioPlayer(require("../../assets/audio/bgm-battle.wav"));
  const resultMusic = useAudioPlayer(require("../../assets/audio/bgm-result.wav"));
  const holdingRef = useRef(false);
  const reelDirectionRef = useRef<-1 | 0 | 1>(0);
  const fishDirectionRef = useRef<-1 | 1>(1);
  const fishXRef = useRef(50);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const finishingRef = useRef(false);
  const tensionAtRef = useRef(0);
  const reelAudioAtRef = useRef(0);
  const bossStageRef = useRef(1);
  const bossRageRef = useRef(false);
  const fishActionRef = useRef("");
  const nextDirectionChangeAtRef = useRef(0);
  const [unlockAnimation] = useState(() => new Animated.Value(0));

  const playSound = useCallback((player: typeof reelSound) => {
    if (settings.soundVolume <= 0) return;
    player.volume = settings.soundVolume;
    void player.seekTo(0).then(() => player.play());
  }, [settings.soundVolume]);

  const playBossMusic = useCallback((player: typeof bossMusic) => {
    if (settings.soundVolume <= 0) return;
    player.loop = true;
    player.volume = Math.min(0.75, settings.soundVolume);
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
    const [equipped, selectedArea, todaySteps, selectedBait, catches, savedSettings, baits, progression, catchSummaries] = await Promise.all([
      getEquippedItems(),
      getSelectedArea(),
      syncTodaySteps(),
      getSelectedBait(),
      getTodayCatchCount(new Date().toISOString().slice(0, 10)),
      getSettings(),
      getBaitInventory(),
      getPlayerProgress(),
      getCatchSummaries(),
    ]);
    setGear(equipped);
    setSpot(selectedArea);
    setSteps(todaySteps.steps);
    setBait(SHOP.find((item) => item.id === selectedBait?.item_id) ?? null);
    setTodayCatch(catches);
    setSettings(savedSettings);
    setBaitStock(Object.fromEntries(baits.map((item) => [item.item_id, item.quantity])));
    setPlayerProgress(progression);
    setCaughtIds(new Set(catchSummaries.map((row) => row.fish_id)));
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    return () => { clearTimer(); bossMusic.pause(); };
  }, [bossMusic, load]));
  useEffect(() => clearTimer, []);
  useEffect(() => {
    if (phase !== "result" || !last?.isBoss) return;
    unlockAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(unlockAnimation, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(unlockAnimation, { toValue: .82, duration: 260, useNativeDriver: true }),
      Animated.timing(unlockAnimation, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [last?.isBoss, phase, unlockAnimation]);

  const chooseFish = (usedBait: ShopItem) => {
    const areaFishIds = new Set(spot?.fishIds ?? []);
    const localSpecials = FISH.filter((fish) => areaFishIds.has(fish.id) && fish.isSpecial);
    if (localSpecials.length && Math.random() < localSpecials.length * 0.003) {
      return localSpecials[Math.floor(Math.random() * localSpecials.length)];
    }
    let rank = baitRank(steps, usedBait);
    let pool = FISH.filter((fish) => areaFishIds.has(fish.id) && !fish.isSpecial && fish.rank === rank);
    while (!pool.length && RANK_INDEX[rank] > 0) {
      rank = RANKS[RANK_INDEX[rank] - 1];
      pool = FISH.filter((fish) => areaFishIds.has(fish.id) && !fish.isSpecial && fish.rank === rank);
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
    bossMusic.pause();
    setShowBossCutin(false);
    setBossRage(false);
    setFishAction("");
    setTimingFeedback("");
    reelDirectionRef.current = 0;
    setIsReeling(false);
    fishActionRef.current = "";
    setLast(null);
    setCandidate(null);
    setShadowScale(0);
    setApproachProgress(0);
    setFishX(18);
    fishXRef.current = 18;
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
        const nextX = 18 + progress * .32 + Math.sin(step * .72) * (12 - progress * .06);
        fishXRef.current = nextX;
        setFishX(nextX);
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
    progressRef.current = 0;
    bossStageRef.current = 1;
    bossRageRef.current = false;
    finishingRef.current = false;
    setBattleProgress(0);
    setBossStage(1);
    setBossRage(false);
    setFishAction("");
    setFishDirection(1);
    setTimingFeedback("魚の動きを見て左右を選べ！");
    reelDirectionRef.current = 0;
    fishDirectionRef.current = 1;
    fishXRef.current = 50;
    setFishX(50);
    nextDirectionChangeAtRef.current = Date.now() + 700 + Math.random() * 1300;
    setIsReeling(false);
    setRodDirection(0);
    fishActionRef.current = "";
    vibrate("tap");
    if (candidate.id === spot?.bossFishId) {
      setShowBossCutin(true);
      playBossMusic(bossMusic);
      timeoutRef.current = setTimeout(() => {
        setShowBossCutin(false);
        setPhase("battle");
        vibrate("warning");
      }, 2400 / settings.animationSpeed);
    } else {
      setPhase("battle");
    }
  };

  const finishCatch = useCallback(async () => {
    if (!candidate || !spot || finishingRef.current) return;
    finishingRef.current = true;
    const rankIndex = RANK_INDEX[candidate.rank];
    const isBoss = candidate.id === spot.bossFishId;
    const areaIndex = FISHING_AREAS.findIndex((area) => area.id === spot.id);
    const unlockedAreaName = isBoss ? FISHING_AREAS[areaIndex + 1]?.name : undefined;
    const sizePower = effectPower(gear, "outfit");
    const sizeRoll = Math.min(1, Math.pow(Math.random(), 1 / (1 + sizePower * 0.22)));
    const size = Number((candidate.minCm + (candidate.maxCm - candidate.minCm) * sizeRoll).toFixed(1));
    const sizeRatio = (size - candidate.minCm) / Math.max(1, candidate.maxCm - candidate.minCm);
    const closeCall = Date.now() - tensionAtRef.current < 3000;
    const previousLevel = playerProgress.level;
    const catchSave = await saveCatch({
      fishId: candidate.id,
      size,
      rank: candidate.rank,
      aquarium: candidate.aquarium,
      spotId: spot.id,
      spotName: spot.name,
      habitat: spot.habitat,
      steps,
    });
    setPlayerProgress(catchSave.progression);
    setCaughtIds((current) => new Set(current).add(candidate.id));
    setLast({ ...candidate, size, isPersonalBest:catchSave.isPersonalBest, bigCatch: sizeRatio >= 0.86 || RANK_INDEX[candidate.rank] >= 6, closeCall, isBoss, unlockedAreaName, expGained:catchSave.expGained, playerLevel:catchSave.progression.level, levelUp:catchSave.progression.level > previousLevel });
    setTodayCatch((value) => value + 1);
    setPhase("result");
    setBossRage(false);
    bossMusic.pause();
    playSound(catchSound);
    vibrate("success");
    load();
    void rankIndex;
  }, [bossMusic, candidate, catchSound, gear, load, playSound, playerProgress.level, spot, steps, vibrate]);

  useEffect(() => {
    if (phase !== "battle" || !candidate) return;
    const config = BATTLE_CONFIG[candidate.rank];
    const outfitPower = effectPower(gear, "outfit");
    const reelPower = effectPower(gear, "reel");
    const isBoss = candidate.id === spot?.bossFishId;
    const started = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - started;
      const stage = isBoss ? progressRef.current < 34 ? 1 : progressRef.current < 67 ? 2 : 3 : 1;
      const personalitySeed = [...candidate.id].reduce((sum, value) => sum + value.charCodeAt(0), 0);
      if (Date.now() >= nextDirectionChangeAtRef.current) {
        const previousDirection = fishDirectionRef.current;
        const direction: -1 | 1 = Math.random() < .68 ? previousDirection : previousDirection === 1 ? -1 : 1;
        fishDirectionRef.current = direction;
        setFishDirection(direction);
        nextDirectionChangeAtRef.current = Date.now() + (isBoss ? 480 + Math.random() * 1250 : 700 + Math.random() * 1900);
        if (direction !== previousDirection) {
          setTimingFeedback("！ 方向転換");
          playSound(tensionSound);
          vibrate("warning");
        }
      }
      const direction = fishDirectionRef.current;
      if (stage !== bossStageRef.current) {
        bossStageRef.current = stage;
        setBossStage(stage);
        playSound(splashSound);
        vibrate("warning");
      }
      const rageTick = isBoss && elapsed > 3500 && elapsed % 9000 < 1700;
      if (rageTick !== bossRageRef.current) {
        bossRageRef.current = rageTick;
        setBossRage(rageTick);
        if (rageTick) { playSound(tensionSound); vibrate("warning"); }
      }
      const personality = personalitySeed % 4;
      const actionActive = personality === 0 ? elapsed % 1800 < 480
        : personality === 1 ? elapsed % 3600 > 2850
          : personality === 2 ? elapsed % 4200 < 1050
            : elapsed % 2900 < 560;
      const actionName = actionActive
        ? ["小刻みに暴れる", "急に強く引っ張る", "ゆっくり抵抗する", "不規則に方向を変える"][personality]
        : "";
      if (actionName !== fishActionRef.current) {
        fishActionRef.current = actionName;
        setFishAction(actionName);
        if (actionName) vibrate("warning");
      }
      const rageJolt = rageTick ? direction * .42 : 0;
      const irregular = personality === 3 && actionActive ? Math.sin(elapsed / 75) * .52 : 0;
      let nextX = fishXRef.current + direction * (isBoss ? .16 + stage * .025 : .13) + rageJolt + irregular;
      if (nextX <= 9 || nextX >= 84) {
        const bouncedDirection: -1 | 1 = nextX <= 9 ? 1 : -1;
        fishDirectionRef.current = bouncedDirection;
        setFishDirection(bouncedDirection);
        nextDirectionChangeAtRef.current = Date.now() + 500 + Math.random() * 1100;
        nextX = Math.max(9, Math.min(84, nextX));
      }
      fishXRef.current = nextX;
      setFishX(nextX);
      const selectedDirection = reelDirectionRef.current;
      const matchingDirection = selectedDirection === direction;
      if (holdingRef.current && Date.now() - reelAudioAtRef.current > 320) {
        reelAudioAtRef.current = Date.now();
        playSound(reelSound);
      }
      const rankDifficulty = 1 + RANK_INDEX[candidate.rank] * .12;
      const rodAssist = Math.max(.7, 1 - outfitPower * .012);
      const rodPower = effectPower(gear, "rod");
      const reelGain = (.25 + reelPower * .018 + rodPower * .014) / rankDifficulty * (1 + playerProgress.reelBonusRate);
      const escapeLoss = (.025 + config.pull * .008) * rodAssist * (rageTick ? 3.2 : actionActive ? 1.65 : 1);
      const change = selectedDirection === 0 ? -escapeLoss : matchingDirection ? reelGain : -escapeLoss * 4.2;
      progressRef.current = Math.max(-15, Math.min(100, progressRef.current + change));
      if (selectedDirection !== 0) setTimingFeedback(matchingDirection ? "GOOD! 距離が縮む" : "逆方向！魚が離れる");
      setBattleProgress(progressRef.current);
      if (progressRef.current < 5 && Date.now() - tensionAtRef.current > 900) {
        tensionAtRef.current = Date.now();
        playSound(tensionSound);
        vibrate("warning");
      }
      if (progressRef.current >= 100) {
        clearInterval(interval);
        finishCatch();
      } else if (progressRef.current <= -15 && elapsed > 1800) {
        clearInterval(interval);
        setEscapeReason("魚との距離が開き、糸を切られました");
        playSound(escapeSound);
        vibrate("error");
        bossMusic.pause();
        setPhase("escaped");
      }
    }, 50);
    return () => clearInterval(interval);
  }, [bossMusic, candidate, escapeSound, finishCatch, gear, phase, playSound, playerProgress.reelBonusRate, reelSound, splashSound, spot?.bossFishId, tensionSound, vibrate]);

  const isBossBattle = Boolean(candidate && candidate.id === spot?.bossFishId);
  const startDistance = candidate ? RANK_START_DISTANCE[candidate.rank] : RANK_START_DISTANCE.E;
  const distanceProgress = Math.max(0, Math.min(100, battleProgress));
  const remainingDistance = startDistance * (1 - distanceProgress / 100);
  useEffect(() => {
    const players = [fishingMusic, battleMusic, resultMusic];
    players.forEach((player) => player.pause());
    if (settings.soundVolume <= 0 || (phase === "battle" && isBossBattle)) return;
    const player = phase === "battle" ? battleMusic : phase === "result" ? resultMusic : fishingMusic;
    startLoopMusic(player, Math.min(0.48, settings.soundVolume * 0.55));
    return () => player.pause();
  }, [battleMusic, fishingMusic, isBossBattle, phase, resultMusic, settings.soundVolume]);
  const battleDanger = battleProgress < 5;
  const equippedCooler = gear.find((item) => item.kind === "cooler");
  const dailyCapacity = equippedCooler?.dailyCapacity ?? 10;

  const exitFishing = () => {
    holdingRef.current = false;
    reelDirectionRef.current = 0;
    setIsReeling(false);
    setRodDirection(0);
    clearTimer();
    setShowBaitPicker(false);
    setShowBossCutin(false);
    setBossRage(false);
    setFishAction("");
    bossMusic.pause();
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
        <FirstPersonFishingLayer
          active={["casting", "approach", "bite", "battle"].includes(phase)}
          fishId={phase === "battle" ? candidate?.id : undefined}
          discovered={Boolean(candidate && caughtIds.has(candidate.id))}
          fishDirection={fishDirection}
          rodDirection={rodDirection}
          reeling={phase === "battle" && isReeling}
          danger={phase === "battle" && (battleDanger || bossRage)}
          boss={isBossBattle}
        />
        {phase === "idle" && <View style={styles.topHud}>
          <Text style={styles.hudTitle}>{spot?.emoji ?? "🌿"} {spot?.name ?? "釣り場"}</Text>
          <Text style={styles.hudText}>{HABITAT_NAMES[spot?.habitat ?? "pond"]} ・ 本日 {todayCatch}/{dailyCapacity}匹</Text>
          <Text style={styles.hudText}>{bait ? `${bait.name}／${bait.targetRanks?.join("・")}狙い` : "餌がありません"}</Text>
          {!["casting", "approach", "bite", "battle"].includes(phase) && (
            <Pressable onPress={() => setShowBaitPicker(true)} style={styles.baitChangeButton}>
              <Text style={styles.baitChangeText}>餌を変更</Text>
            </Pressable>
          )}
        </View>}

        {phase === "battle" && candidate && <View style={[styles.distanceHud, isBossBattle && styles.bossDistanceHud]}>
          <View style={styles.distanceHudHeader}><Text style={styles.distanceHudTitle}>{candidate.rank}ランク・開始 {startDistance}m</Text><Text style={styles.distanceMeters}>残り {Math.ceil(remainingDistance)}m</Text></View>
          <View style={styles.distanceGaugeTop}>
            <View style={styles.distanceNear} /><View style={styles.distanceMid} /><View style={styles.distanceFar} />
            <View style={styles.distancePerson}><Text style={styles.distancePersonIcon}>🎣</Text></View>
            <View style={[styles.distanceFish, { left:`${Math.max(7, Math.min(94, 100 - distanceProgress))}%` }]}><Text style={styles.distanceFishIcon}>🐟</Text></View>
          </View>
          <Text style={styles.distanceHint}>{timingFeedback || "魚の方向へ竿を寝かせて巻く"}</Text>
        </View>}

        <View style={styles.waterOverlay}>
          {(phase === "casting" || phase === "approach" || phase === "bite") && <View style={styles.approachMessageBubble}><Text style={styles.approachTitle}>{phase === "casting" ? "仕掛けを投入…" : phase === "bite" ? "魚が食いついた！" : approachProgress < 55 ? "魚影が近づいている…" : "ウキのすぐ近く！"}</Text></View>}
          {(phase === "approach" || phase === "bite" || phase === "battle") && (
            <View style={[styles.shadow, phase === "battle" && styles.battleShadow, { left:`${Math.max(8, Math.min(82, fishX))}%`, transform: [{ scale: phase === "battle" ? (isBossBattle ? 1.65 : 1.18) : 0.45 + shadowScale * 0.7 }, { scaleX:fishDirection }] }]}>
              <Image source={fishShadowImage} resizeMode="contain" style={styles.shadowImage} />
            </View>
          )}
          {(phase === "casting" || phase === "approach" || phase === "bite") && (
            <View style={[styles.float, phase === "bite" && styles.floatDown]}><View style={styles.floatRed} /></View>
          )}
          {phase === "bite" && <Text style={styles.splash}>SPLASH!</Text>}
        </View>

        {phase !== "result" && (
          <View style={[styles.controlPanel, isBossBattle && styles.bossControlPanel]}>
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
                <Text style={[styles.rank, { color: isBossBattle ? "#FFD963" : rankColors[candidate.rank] }]}>{isBossBattle ? `👑 NUSHI PHASE ${bossStage}/3` : `${candidate.rank} RANK BATTLE`}</Text>
                <Text style={styles.muted}>残り {Math.ceil(remainingDistance)}m / {startDistance}m</Text>
              </View>
              {isBossBattle && <View style={styles.bossPhases}>{[1, 2, 3].map((stage) => <View key={stage} style={[styles.bossPhase, bossStage >= stage && styles.bossPhaseActive]}><Text style={styles.bossPhaseText}>{stage}</Text></View>)}</View>}
              {bossRage && <View style={styles.rageBanner}><Text style={styles.rageText}>⚠ ヌシが大暴れしている！</Text></View>}
              {!bossRage && fishAction && <View style={styles.fishActionBanner}><Text style={styles.fishActionText}>！ {fishAction}</Text></View>}
              <View style={styles.reelControls}>
                {([-1, 1] as const).map((direction) => (
                  <Pressable
                    key={direction}
                    onPressIn={() => {
                      holdingRef.current = true;
                      reelDirectionRef.current = direction;
                      setIsReeling(true);
                      setRodDirection(direction);
                      vibrate("tap");
                    }}
                    onPressOut={() => {
                      holdingRef.current = false;
                      reelDirectionRef.current = 0;
                      setIsReeling(false);
                      setRodDirection(0);
                    }}
                    style={({ pressed }) => [styles.reelButton, fishDirection === direction && styles.reelSuggested, pressed && styles.reelPressed]}
                  >
                    <Text style={styles.reelArrow}>{direction < 0 ? "←" : "→"}</Text>
                    <Text style={styles.reelText}>{direction < 0 ? "左へ竿を寝かせて巻く" : "右へ竿を寝かせて巻く"}</Text>
                  </Pressable>
                ))}
              </View>
              <ReelWindingIndicator active={isReeling} direction={rodDirection} />
              <Text style={styles.reelSubText}>魚影と同じ方向なら距離が縮み、逆方向や放置では魚が離れます</Text>
            </>}
          </View>
        )}

        {phase === "result" && last && (
          <View style={styles.resultPanel}>
            {last.isBoss && <Animated.View style={[styles.areaClear, { opacity: unlockAnimation, transform: [{ scale: unlockAnimation }] }]}><Text style={styles.areaClearTitle}>AREA CLEAR!</Text><Text style={styles.areaClearBoss}>👑 ヌシを釣り上げた！</Text>{last.unlockedAreaName ? <Text style={styles.areaUnlock}>🔓 次のエリア「{last.unlockedAreaName}」解放</Text> : <Text style={styles.areaUnlock}>🏆 全エリア制覇！</Text>}</Animated.View>}
            <Text style={styles.caught}>CATCH!</Text>
            {last.bigCatch && <Text style={styles.bigCatch}>✨ BIG CATCH! ✨</Text>}
            {last.closeCall && <Text style={styles.closeCall}>ギリギリの勝利！</Text>}
            {last.isPersonalBest && <Text style={styles.best}>🏆 NEW PERSONAL BEST</Text>}
            <FishArt fishId={last.id} size={130} />
            <Text style={[styles.rank, { color: rankColors[last.rank] }]}>{last.rank} RANK</Text>
            <Text style={styles.name}>{last.name}</Text>
            <Text style={styles.size}>{last.size.toLocaleString()} cm</Text>
            <Text style={styles.expGain}>EXP +{last.expGained}　Lv.{last.playerLevel}</Text>
            {last.levelUp && <Text style={styles.levelUp}>LEVEL UP! 巻き取り性能が上昇</Text>}
            <Text style={styles.muted}>ポイント付与なし ・ {spot?.name}図鑑へ登録</Text>
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
        <Modal visible={showBossCutin} transparent animationType="fade" statusBarTranslucent>
          <ImageBackground source={bossCutin} resizeMode="cover" style={styles.bossCutin}>
            <View style={styles.bossCutinShade} />
            <View style={styles.bossCutinCopy}>
              <Text style={styles.bossWarning}>WARNING</Text>
              <Text style={styles.bossEncounter}>ヌシ、出現。</Text>
              <Text style={styles.bossCandidateName}>{candidate?.name}</Text>
              <View style={styles.bossCutinLine} />
              <Text style={styles.bossCutinHelp}>3段階の激闘に備えろ</Text>
            </View>
          </ImageBackground>
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
  firstPersonLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 2, overflow: "hidden" },
  waterGlint: { position: "absolute", left: -40, right: -40, top: "38%", height: 86, borderTopWidth: 2, borderBottomWidth: 1, borderColor: "rgba(218,252,255,.42)", backgroundColor: "rgba(0,140,164,.10)", transform: [{ rotate: "-2deg" }] },
  waterRipple: { position: "absolute", top: "44%", left: "50%", width: 90, height: 26, marginLeft: -45, borderRadius: 50, borderWidth: 3, borderColor: "rgba(220,255,255,.8)", backgroundColor: "rgba(46,195,211,.12)" },
  jumpingFish: { position: "absolute", top: "42%", zIndex: 4, alignItems: "center", justifyContent: "center" },
  jumpingShadow: { width:112, height:70, opacity:.9 },
  jumpingBossShadow: { width:154, height:96 },
  fishSplash: { position: "absolute", bottom: -22, alignItems: "center" },
  fishSplashText: { fontSize: 42 },
  rodRig: { position: "absolute", left: "4%", right: "4%", top: "6%", bottom: -95, zIndex: 5, transformOrigin: "bottom center" },
  rodImage: { width: "100%", height: "100%" },
  reelHousing: { position:"absolute", bottom:"13%", left:"31%", width:76, height:76, borderRadius:38, backgroundColor:"rgba(3,25,35,.72)", borderWidth:3, borderColor:"rgba(255,214,100,.92)", alignItems:"center", justifyContent:"center", shadowColor:"#00141D", shadowOpacity:.7, shadowRadius:7, elevation:8 },
  reelSpool: { width:52, height:52, borderRadius:26, borderWidth:5, borderColor:"#79DCE2", backgroundColor:"rgba(8,74,88,.9)", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  reelSpoolLine: { position:"absolute", width:46, height:3, borderRadius:2, backgroundColor:"rgba(225,252,255,.86)" },
  reelHub: { width:15, height:15, borderRadius:8, backgroundColor:"#FFD664", borderWidth:3, borderColor:"#FFF4BE", zIndex:2 },
  reelHandle: { position:"absolute", width:72, height:72, alignItems:"center", justifyContent:"center" },
  reelHandleArm: { position:"absolute", width:5, height:34, borderRadius:3, backgroundColor:"#F4B93F", top:3 },
  reelHandleKnob: { position:"absolute", width:17, height:17, borderRadius:9, backgroundColor:"#172D35", borderWidth:3, borderColor:"#FFD664", top:-5 },
  tensionFlash: { position: "absolute", top: "27%", alignSelf: "center", width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: colors.coral, borderWidth: 4, borderColor: colors.white },
  tensionFlashText: { color: colors.white, fontSize: 34, lineHeight: 38, fontWeight: "900" },
  topHud: { position: "absolute", top: 12, left: 12, right: 12, backgroundColor: "rgba(6,59,76,.88)", borderRadius: 17, padding: 12 },
  hudTitle: { color: colors.white, fontSize: 19, fontWeight: "900" },
  hudText: { color: "#D7F5F2", fontSize: 11, fontWeight: "700", marginTop: 2 },
  baitChangeButton: { position: "absolute", right: 10, bottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: colors.coral },
  baitChangeText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  distanceHud: { position:"absolute", top:8, left:10, right:10, zIndex:20, borderRadius:16, padding:10, backgroundColor:"rgba(255,255,255,.96)", borderWidth:2, borderColor:colors.navy, elevation:16 },
  bossDistanceHud: { borderColor:"#E9B949", backgroundColor:"rgba(255,248,222,.97)" },
  distanceHudHeader: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:5 },
  distanceHudTitle: { color:colors.navy, fontSize:12, fontWeight:"900" },
  distanceMeters: { color:colors.coral, fontSize:16, fontWeight:"900" },
  distanceGaugeTop: { height:34, borderRadius:10, overflow:"hidden", borderWidth:2, borderColor:colors.navy, flexDirection:"row", position:"relative" },
  distanceNear: { flex:1, backgroundColor:"#43D94D" }, distanceMid: { flex:1, backgroundColor:"#F4D83D" }, distanceFar: { flex:1, backgroundColor:"#FF654F" },
  distancePerson: { position:"absolute", left:1, top:2, zIndex:3 }, distancePersonIcon: { fontSize:22 },
  distanceFish: { position:"absolute", top:4, marginLeft:-12, zIndex:4 }, distanceFishIcon: { fontSize:19, transform:[{scaleX:-1}] },
  distanceHint: { color:colors.muted, fontSize:9, fontWeight:"800", textAlign:"center", marginTop:4 },
  waterOverlay: { position: "absolute", top: "18%", left: 20, right: 20, height: "42%", alignItems: "center", justifyContent: "center" },
  approachMessageBubble: { position:"absolute", top:0, alignSelf:"center", borderRadius:99, paddingHorizontal:15, paddingVertical:8, backgroundColor:"rgba(255,255,255,.9)", borderWidth:1, borderColor:colors.aqua },
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
  shadow: { width:118, height:70, position:"absolute", top:"49%", marginLeft:-59, opacity:.82 },
  battleShadow: { top:"39%", width:145, height:86, marginLeft:-72, opacity:.9 },
  shadowImage: { width:"100%", height:"100%" },
  float: { width: 15, height: 42, borderRadius: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.ink, position: "absolute", top: "35%" },
  floatRed: { height: 14, backgroundColor: colors.coral, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  floatDown: { top: "54%", height: 18 },
  splash: { color: colors.white, fontWeight: "900", fontSize: 27, textShadowColor: colors.navy, textShadowRadius: 5 },
  controlPanel: { position: "absolute", left: 10, right: 10, bottom: 10, zIndex:30, elevation:24, backgroundColor: "rgba(255,255,255,.98)", borderRadius: 20, padding: 12, gap: 7, borderWidth:1, borderColor:"rgba(4,58,73,.18)" },
  bossControlPanel: { backgroundColor: "rgba(255,248,222,.97)", borderWidth: 2, borderColor: "#E9B949" },
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
  bossPhases: { flexDirection: "row", gap: 6 },
  bossPhase: { flex: 1, height: 7, borderRadius: 99, backgroundColor: "rgba(255,255,255,.18)", alignItems: "center", justifyContent: "center" },
  bossPhaseActive: { backgroundColor: "#F0B83F" },
  bossPhaseText: { color: "transparent", fontSize: 1 },
  rageBanner: { borderRadius: 9, paddingVertical: 6, backgroundColor: "#A9212B" },
  rageText: { color: colors.white, textAlign: "center", fontSize: 11, fontWeight: "900" },
  fishActionBanner: { borderRadius: 9, paddingVertical: 5, backgroundColor: "#FFF0B8", borderWidth: 1, borderColor: "#E9B949" },
  fishActionText: { color: "#8B4A00", textAlign: "center", fontSize: 11, fontWeight: "900" },
  directionCallout: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: colors.navy },
  directionArrow: { width: 42, color: "#FFD963", fontSize: 38, lineHeight: 40, fontWeight: "900", textAlign: "center" },
  directionCopy: { flex: 1 },
  directionTitle: { color: colors.white, fontSize: 14, fontWeight: "900" },
  directionHelp: { color: "#BDE9E4", fontSize: 9, fontWeight: "700", marginTop: 1 },
  timingFeedback: { width: 70, color: colors.gold, fontSize: 12, fontWeight: "900", textAlign: "right" },
  perfectFeedback: { color: "#52E486", fontSize: 15 },
  missFeedback: { color: "#FF7368" },
  distanceLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: -5 },
  distanceLabel: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  distanceTitle: { color: colors.navy, fontSize: 11, fontWeight: "900" },
  gauge: { height: 64, borderRadius: 15, position: "relative", overflow: "hidden", borderWidth: 3, borderColor: colors.navy, flexDirection: "row" },
  bossGauge: { height: 70, borderColor: "#F0B83F", shadowColor: "#FF4D45", shadowOpacity: .8, shadowRadius: 9 },
  distanceGreen: { flex: 1, backgroundColor: "#42D96B" },
  distanceYellow: { flex: 1, backgroundColor: "#F5D94B" },
  distanceRed: { flex: 1, backgroundColor: "#FF6858" },
  targetZone: { position: "absolute", top: 3, bottom: 3, backgroundColor: "rgba(255,255,255,.3)", borderWidth: 3, borderColor: "#058C62", borderRadius: 9 },
  bossTargetZone: { borderColor: "#FFF3A6", backgroundColor: "rgba(255,215,80,.25)" },
  anglerCursor: { position: "absolute", left: 2, top: 14, zIndex: 4 },
  anglerIcon: { fontSize: 24 },
  fishCursor: { position: "absolute", top: 16, marginLeft: -13, zIndex: 5 },
  battleFishIcon: { fontSize: 22, transform: [{ scaleX: -1 }] },
  exclamationBubble: { position: "absolute", top: 1, width: 22, height: 22, marginLeft: -11, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.coral, borderWidth: 2, borderColor: colors.white, zIndex: 8 },
  exclamationText: { color: colors.white, fontSize: 14, lineHeight: 15, fontWeight: "900" },
  progressTrack: { height: 13, backgroundColor: colors.line, borderRadius: 8, marginTop: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.gold },
  progressText: { textAlign: "center", fontWeight: "900", color: colors.navy, marginTop: 4 },
  bossProgressText: { color: "#8B2B24" },
  reelControls: { flexDirection: "row", gap: 9 },
  reelButton: { flex: 1, minHeight: 62, backgroundColor: colors.ocean, borderRadius: 16, paddingVertical: 7, paddingHorizontal:5, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  reelSuggested: { borderColor: "#FFD963", backgroundColor: "#087C88" },
  reelPressed: { backgroundColor: colors.coral, transform: [{ scale: 0.98 }] },
  reelArrow: { color: "#FFD963", fontSize: 22, lineHeight: 23, fontWeight: "900" },
  reelText: { color: colors.white, fontWeight: "900", fontSize: 11, textAlign:"center" },
  windingIndicator: { minHeight:82, borderRadius:15, paddingHorizontal:12, paddingVertical:7, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:12, backgroundColor:"#E3F8F6", borderWidth:2, borderColor:colors.aqua },
  windingLabel: { width:55, color:colors.ocean, fontSize:11, fontWeight:"900", textAlign:"center" },
  windingReelBody: { width:66, height:66, borderRadius:33, alignItems:"center", justifyContent:"center", backgroundColor:"#073947", borderWidth:4, borderColor:"#F2B93B", shadowColor:"#002832", shadowOpacity:.5, shadowRadius:5, elevation:5 },
  windingSpool: { width:45, height:45, borderRadius:23, alignItems:"center", justifyContent:"center", overflow:"hidden", backgroundColor:"#087B89", borderWidth:4, borderColor:"#7CE1E4" },
  windingSpoolLine: { position:"absolute", width:40, height:3, borderRadius:2, backgroundColor:"rgba(235,255,255,.9)" },
  windingHub: { width:13, height:13, borderRadius:7, backgroundColor:"#FFD963", borderWidth:2, borderColor:"#FFF4B8", zIndex:2 },
  windingHandle: { position:"absolute", width:70, height:70, alignItems:"center" },
  windingHandleArm: { width:5, height:28, borderRadius:3, backgroundColor:"#F2B93B", marginTop:3 },
  windingHandleKnob: { position:"absolute", top:-4, width:16, height:16, borderRadius:8, backgroundColor:colors.navy, borderWidth:3, borderColor:"#FFD963" },
  windingMotion: { flex:1, color:colors.navy, fontSize:10, fontWeight:"900", textAlign:"center" },
  reelSubText: { color: colors.muted, fontWeight: "700", fontSize: 9, textAlign: "center" },
  resultPanel: { position: "absolute", left: 18, right: 18, top: "12%", backgroundColor: "rgba(255,255,255,.96)", borderRadius: 24, padding: 17, alignItems: "center", gap: 6 },
  areaClear: { alignSelf: "stretch", borderRadius: 16, padding: 11, alignItems: "center", backgroundColor: "#122F48", borderWidth: 2, borderColor: "#F0B83F" },
  areaClearTitle: { color: "#FFD963", fontSize: 23, fontWeight: "900", letterSpacing: 1.2 },
  areaClearBoss: { color: colors.white, fontSize: 13, fontWeight: "900", marginTop: 2 },
  areaUnlock: { color: "#9AF0E5", fontSize: 10, fontWeight: "800", marginTop: 4, textAlign: "center" },
  resultActions: { flexDirection: "row", gap: 8, alignSelf: "stretch", marginTop: 4 },
  resultAction: { flex: 1 },
  caught: { color: colors.coral, fontSize: 28, fontWeight: "900" },
  best: { color: colors.gold, fontWeight: "900" },
  bigCatch: { color: "#C88900", fontSize: 18, fontWeight: "900", textShadowColor: "#FFF0A8", textShadowRadius: 8 },
  closeCall: { color: colors.coral, fontSize: 13, fontWeight: "900" },
  rank: { fontWeight: "900", fontSize: 14 },
  name: { fontSize: 27, fontWeight: "900", color: colors.ink },
  size: { fontSize: 20, fontWeight: "900", color: colors.ocean },
  expGain: { color:colors.navy, fontSize:14, fontWeight:"900" },
  levelUp: { color:colors.coral, fontSize:13, fontWeight:"900", paddingHorizontal:12, paddingVertical:5, borderRadius:99, backgroundColor:"#FFF0EA" },
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
  bossCutin: { flex: 1, justifyContent: "flex-end" },
  bossCutinShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,8,20,.22)" },
  bossCutinCopy: { margin: 18, marginBottom: 70, borderLeftWidth: 5, borderColor: colors.coral, padding: 16, backgroundColor: "rgba(2,16,30,.88)" },
  bossWarning: { color: colors.coral, fontSize: 16, fontWeight: "900", letterSpacing: 4 },
  bossEncounter: { color: colors.white, fontSize: 36, fontWeight: "900", marginTop: 4 },
  bossCandidateName: { color: "#FFD963", fontSize: 21, fontWeight: "900" },
  bossCutinLine: { width: 90, height: 4, backgroundColor: colors.coral, marginVertical: 9 },
  bossCutinHelp: { color: "#CDE9EF", fontSize: 12, fontWeight: "800" },
});
