import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Screen, ui } from "../../src/components/ui";
import { AquariumHero, FishArt } from "../../src/components/GameArt";
import { FISH, HABITAT_NAMES, RANKS, SHOP } from "../../src/constants/game";
import {
  AquariumPreference, CatchHistoryRow, CatchSummary, getAquariumPreferences, getCatchHistory,
  getCatchStats, getCatchSummaries, setAquariumFavorite, setAquariumVisible,
} from "../../src/database/db";
import { colors, rankColors } from "../../src/constants/theme";
import { AppSettings, DEFAULT_SETTINGS, getSettings, saveSettings } from "../../src/services/settingsService";

type ViewMode = "tank" | "catalog";
type SwimBehavior = "school" | "glide" | "dart" | "bottom" | "dive";

const RANK_SIZE: Record<string, number> = {
  E: 47, D: 53, C: 61, B: 69, A: 78, S: 88, SS: 98, SSS: 108,
};

function hashText(value: string) {
  return [...value].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function behaviorFor(fishId: string): SwimBehavior {
  if (/(crab|crayfish|beetle|lobster|octopus)/.test(fishId)) return "bottom";
  if (/(turtle|frog|tadpole|salamander|crocodile|axolotl|softshell)/.test(fishId)) return "dive";
  if (/(squid|sardine|mackerel|bonito|ayu|smelt|dace|bitterling)/.test(fishId)) return "dart";
  const fish = FISH.find((entry) => entry.id === fishId);
  if (fish?.rank === "E" || fish?.rank === "D") return "school";
  return "glide";
}

function SwimmingFish({ fishId, index, copy, width, height, onSelect, feeding, focusFishId }: {
  fishId: string;
  index: number;
  copy: number;
  width: number;
  height: number;
  onSelect: (fishId: string) => void;
  feeding: boolean;
  focusFishId: string | null;
}) {
  const fish = FISH.find((entry) => entry.id === fishId) ?? FISH[0];
  const behavior = behaviorFor(fishId);
  const size = Math.round((RANK_SIZE[fish.rank] ?? 68) * (copy ? 0.78 + copy * 0.06 : 1));
  const seed = hashText(`${fishId}-${index}-${copy}`);
  const maxX = Math.max(20, width - size);
  const maxY = Math.max(60, height - size - 24);
  const path = useMemo(() => Array.from({ length: 8 }, (_, waypoint) => {
    const randomX = seeded(seed + waypoint * 13);
    const randomY = seeded(seed + waypoint * 29 + 7);
    const depth = 0.18 + seeded(seed + waypoint * 41 + 3) * 0.82;
    let y = 32 + randomY * Math.max(30, maxY - 48);
    if (behavior === "bottom") y = maxY - 6 - randomY * 22;
    if (behavior === "school") y = 55 + ((index * 53 + copy * 18) % Math.max(80, maxY - 85)) + (randomY - 0.5) * 35;
    if (behavior === "dive") y = 34 + (waypoint % 2 === 0 ? randomY * maxY * 0.25 : maxY * (0.58 + randomY * 0.34));
    let x = -18 + randomX * (maxX + 26);
    if (feeding) {
      x = maxX * 0.5 + (randomX - 0.5) * Math.min(130, maxX * 0.38);
      y = height * 0.5 + (randomY - 0.5) * 115;
    }
    if (focusFishId === fishId) {
      x = maxX * 0.48 + (randomX - 0.5) * 85;
      y = height * 0.42 + (randomY - 0.5) * 100;
    }
    return {
      x,
      y: Math.max(25, Math.min(maxY, y)),
      depth: focusFishId === fishId ? 0.98 : behavior === "bottom" ? 0.72 : depth,
      tilt: (randomY - 0.5) * (behavior === "dart" ? 1.7 : 0.9),
    };
  }), [behavior, copy, feeding, fishId, focusFishId, height, index, maxX, maxY, seed]);

  const [x] = useState(() => new Animated.Value(path[0].x));
  const [y] = useState(() => new Animated.Value(path[0].y));
  const [direction] = useState(() => new Animated.Value(1));
  const [depth] = useState(() => new Animated.Value(path[0].depth));
  const [tilt] = useState(() => new Animated.Value(0));
  const [bodyMotion] = useState(() => new Animated.Value(-1));
  const [startle] = useState(() => new Animated.Value(0));

  useEffect(() => {
    x.setValue(path[0].x);
    y.setValue(path[0].y);
    depth.setValue(path[0].depth);
    const baseDuration = behavior === "dart" ? 1800
      : behavior === "school" ? 3900
        : behavior === "bottom" ? 7200
          : behavior === "dive" ? 5600
            : 8500;
    const targets = [...path.slice(1), path[0]];
    const movements = targets.map((point, waypoint) => {
      const previous = path[waypoint];
      const nextDirection = point.x >= previous.x ? 1 : -1;
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      const duration = Math.max(900, baseDuration * (0.55 + distance / Math.max(width, height)));
      const pause = behavior === "dart"
        ? (waypoint % 3 === 0 ? 850 : 80)
        : behavior === "bottom"
          ? 650
          : behavior === "dive"
            ? (waypoint % 2 === 0 ? 950 : 260)
            : 120;
      return Animated.sequence([
        Animated.parallel([
          Animated.timing(direction, { toValue: nextDirection * 0.08, duration: 190, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(tilt, { toValue: point.tilt, duration: 190, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(direction, { toValue: nextDirection, duration: 180, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
          Animated.timing(x, { toValue: point.x, duration, easing: behavior === "dart" ? Easing.out(Easing.cubic) : Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(y, { toValue: point.y, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(depth, { toValue: point.depth, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(tilt, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.delay(pause),
      ]);
    });
    const swim = Animated.loop(Animated.sequence(movements));
    const body = Animated.loop(Animated.sequence([
      Animated.timing(bodyMotion, {
        toValue: 1,
        duration: behavior === "dart" ? 240 : behavior === "bottom" ? 900 : 520,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(bodyMotion, {
        toValue: -1,
        duration: behavior === "dart" ? 240 : behavior === "bottom" ? 900 : 520,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]));
    swim.start();
    body.start();
    return () => {
      swim.stop();
      body.stop();
    };
  }, [behavior, bodyMotion, depth, direction, height, path, tilt, width, x, y]);

  const scale = depth.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1.08] });
  const opacity = focusFishId && focusFishId !== fishId
    ? 0.2
    : depth.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.98] });
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ["-9deg", "9deg"] });
  const bodyRotate = bodyMotion.interpolate({
    inputRange: [-1, 1],
    outputRange: behavior === "bottom" ? ["-0.7deg", "0.7deg"] : ["-2.2deg", "2.2deg"],
  });
  const bodyScaleY = bodyMotion.interpolate({ inputRange: [-1, 1], outputRange: [0.965, 1.035] });
  const startleY = startle.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  const reactToTap = () => {
    startle.stopAnimation();
    startle.setValue(0);
    Animated.sequence([
      Animated.spring(startle, { toValue: 1, speed: 34, bounciness: 9, useNativeDriver: true }),
      Animated.spring(startle, { toValue: 0, speed: 18, bounciness: 5, useNativeDriver: true }),
    ]).start();
    onSelect(fishId);
  };

  return (
    <Animated.View style={[styles.swimmer, {
      width: size,
      height: size,
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { scale }, { scaleX: direction }, { rotate }],
    }]}>
      <View style={[styles.fishShadow, behavior === "bottom" && styles.bottomShadow]} />
      <Pressable onPress={reactToTap} hitSlop={8}>
        <Animated.View style={{ transform: [{ translateY: startleY }, { rotate: bodyRotate }, { scaleY: bodyScaleY }] }}>
          <FishArt fishId={fishId} size={size} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function RisingBubble({ left, size, height, delay }: {
  left: `${number}%`;
  size: number;
  height: number;
  delay: number;
}) {
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(rise, {
        toValue: 1,
        duration: 5200 + delay * 0.7,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rise, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, rise]);
  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.88] });
  const translateX = rise.interpolate({ inputRange: [0, 0.35, 0.7, 1], outputRange: [0, 7, -5, 4] });
  const opacity = rise.interpolate({ inputRange: [0, 0.08, 0.82, 1], outputRange: [0, 0.65, 0.5, 0] });
  return (
    <Animated.View style={[styles.bubble, {
      left, bottom: 10, width: size, height: size, borderRadius: size / 2,
      opacity, transform: [{ translateY }, { translateX }],
    }]} />
  );
}

function WaterShimmer({ height }: { height: number }) {
  const [drift] = useState(() => new Animated.Value(-1));
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 4800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(drift, { toValue: -1, duration: 4800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift]);
  const translateX = drift.interpolate({ inputRange: [-1, 1], outputRange: [-55, 70] });
  const opacity = drift.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.04, 0.14, 0.05] });
  return (
    <Animated.View pointerEvents="none" style={[styles.waterLight, {
      height: height * 1.15, opacity, transform: [{ translateX }, { rotate: "8deg" }],
    }]} />
  );
}

export default function Aquarium() {
  const router = useRouter();
  const [rows, setRows] = useState<CatchSummary[]>([]);
  const [stats, setStats] = useState({ count: 0, unique_count: 0, largest: 0 });
  const [selectedAquarium, setSelectedAquarium] = useState("");
  const [mode, setMode] = useState<ViewMode>("tank");
  const [showLocked, setShowLocked] = useState(true);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [history, setHistory] = useState<CatchHistoryRow[]>([]);
  const [preferences, setPreferences] = useState<AquariumPreference[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [feeding, setFeeding] = useState(false);
  const [showAquariumPicker, setShowAquariumPicker] = useState(false);
  const { width, height } = useWindowDimensions();

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getCatchStats(), getCatchHistory(), getAquariumPreferences(), getSettings()]).then(([summaries, totals, catches, prefs, savedSettings]) => {
      setRows(summaries);
      setStats(totals);
      setHistory(catches);
      setPreferences(prefs);
      setSettings(savedSettings);
    });
  }, []));

  const aquariums = useMemo(() => [...new Set(FISH.map((fish) => fish.aquarium))], []);
  const aquarium = selectedAquarium || aquariums[0];
  const master = FISH.filter((fish) => fish.aquarium === aquarium);
  const habitat = master[0]?.habitats[0] ?? "pond";
  const deepSea = aquarium.includes("深海");
  const caughtAll = rows.filter((row) => row.aquarium === aquarium);
  const caught = caughtAll.filter((row) => preferences.find((pref) => pref.fish_id === row.fish_id)?.visible !== 0);
  const swimmers = useMemo(() => caught.flatMap((row) => {
    const copies = behaviorFor(row.fish_id) === "school" ? Math.min(3, Math.max(1, row.count)) : 1;
    return Array.from({ length: copies }, (_, copy) => ({ row, copy }));
  }).slice(0, 20), [caught]);
  const tankHeight = Math.max(440, height - 260);
  const display = showLocked ? master : master.filter((fish) => rows.some((row) => row.fish_id === fish.id));
  const selectedFish = FISH.find((fish) => fish.id === selectedFishId);
  const selectedRecord = rows.find((row) => row.fish_id === selectedFishId);
  const selectedPreference = preferences.find((pref) => pref.fish_id === selectedFishId);
  const currentHour = new Date().getHours();
  const effectiveTheme = deepSea ? "night" : settings.aquariumTheme === "auto"
    ? (currentHour < 6 || currentHour >= 19 ? "night" : currentHour >= 16 ? "sunset" : "day")
    : settings.aquariumTheme;
  const habitatDecor = deepSea
    ? "🪨       ✨  🪨       💠"
    : habitat === "pond"
      ? settings.aquariumDecor === "rocks" ? "🪨  🌿      🪨   🌱" : "🪷  🌿      🌱   🪷"
      : habitat === "river"
        ? settings.aquariumDecor === "plants" ? "🌱   🌿       🌱" : "🪨   🪨  〰️   🪨"
        : habitat === "lake"
          ? settings.aquariumDecor === "rocks" ? "🪨      🪵   🪨" : "🌿    🪵      🌱"
          : settings.aquariumDecor === "rocks" ? "🪨    🪨  🐚     🪨" : "🪸  🪸     🌿  🐚";

  const reloadPreferences = async () => setPreferences(await getAquariumPreferences());
  const feedFish = () => {
    setFeeding(true);
    setSelectedFishId(null);
    setTimeout(() => setFeeding(false), 9000);
  };
  const updateAquariumSetting = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const aquariumPicker = (
    <Modal visible={showAquariumPicker} transparent animationType="fade" onRequestClose={() => setShowAquariumPicker(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setShowAquariumPicker(false)}>
        <Pressable style={styles.pickerModal} onPress={() => undefined}>
          <Text style={styles.pickerTitle}>水族館を選択</Text>
          <Text style={styles.pickerHelp}>色付きは生き物を展示できる水族館です</Text>
          <ScrollView contentContainerStyle={styles.pickerList}>
            {aquariums.map((name) => {
              const count = rows.filter((row) => row.aquarium === name).length;
              const active = aquarium === name;
              return (
                <Pressable
                  key={name}
                  onPress={() => { setSelectedAquarium(name); setSelectedFishId(null); setShowAquariumPicker(false); }}
                  style={[styles.pickerItem, count > 0 && styles.pickerHasFish, active && styles.pickerActive]}
                >
                  <View>
                    <Text style={[styles.pickerItemName, active && styles.pickerActiveText]}>{name}</Text>
                    <Text style={[styles.pickerItemCount, active && styles.pickerActiveText]}>{count > 0 ? `${count}種類を展示可能` : "まだ生き物がいません"}</Text>
                  </View>
                  <Text style={[styles.pickerMark, active && styles.pickerActiveText]}>{active ? "選択中" : count > 0 ? "●" : "○"}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button title="閉じる" kind="secondary" onPress={() => setShowAquariumPicker(false)} />
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (String(mode) === "tank") {
    return (
      <SafeAreaView style={styles.fullScreen} edges={["top", "bottom"]}>
        <View style={[styles.fullTank, styles[`theme_${effectiveTheme}`]]}>
          <AquariumHero habitat={habitat} deepSea={deepSea} height={height} rounded={false} />
          <View pointerEvents="none" style={[styles.themeOverlay, styles[`overlay_${effectiveTheme}`]]} />
          <WaterShimmer height={height} />
          <View style={styles.swimLayer}>
            {swimmers.map(({ row, copy }, index) => (
              <SwimmingFish
                key={`${row.fish_id}-${copy}`}
                fishId={row.fish_id}
                index={index}
                copy={copy}
                width={width}
                height={height}
                onSelect={setSelectedFishId}
                feeding={feeding}
                focusFishId={selectedFishId}
              />
            ))}
            <View pointerEvents="none" style={styles.effectLayer}>
              <RisingBubble left="12%" size={10} height={height} delay={0} />
              <RisingBubble left="18%" size={6} height={height} delay={1100} />
              <RisingBubble left="75%" size={8} height={height} delay={1800} />
              <RisingBubble left="82%" size={12} height={height} delay={700} />
              <RisingBubble left="58%" size={7} height={height} delay={2600} />
            </View>
            {!swimmers.length && <Text style={styles.emptyTank}>この水族館の生き物を釣ると、ここで泳ぎ始めます</Text>}
          </View>
          <View pointerEvents="none" style={styles.decorLayer}>
            <Text style={styles.decorText}>{habitatDecor}</Text>
          </View>

          <View style={styles.fullHeader}>
            <Pressable onPress={() => router.navigate("/(tabs)/map")} style={styles.fullHeaderButton}><Text style={styles.fullHeaderButtonText}>← 戻る</Text></Pressable>
            <Pressable onPress={() => setShowAquariumPicker(true)} style={styles.aquariumSelectButton}>
              <Text numberOfLines={1} style={styles.aquariumSelectName}>{aquarium}</Text>
              <Text style={styles.aquariumSelectSub}>水族館を切り替える ▼</Text>
            </Pressable>
            <Pressable onPress={() => setMode("catalog")} style={styles.fullHeaderButton}><Text style={styles.fullHeaderButtonText}>📖 図鑑</Text></Pressable>
          </View>
          <View style={styles.tankTools}>
            <Pressable onPress={feedFish} disabled={feeding} style={[styles.tankTool, feeding && styles.toolActive]}><Text style={styles.tankToolText}>{feeding ? "集合中…" : "無料で餌やり"}</Text></Pressable>
            <Pressable disabled={deepSea} onPress={() => updateAquariumSetting({ aquariumTheme: settings.aquariumTheme === "auto" ? "day" : settings.aquariumTheme === "day" ? "sunset" : settings.aquariumTheme === "sunset" ? "night" : "auto" })} style={[styles.tankTool, deepSea && styles.toolActive]}><Text style={styles.tankToolText}>{deepSea ? "深海照明" : "照明"}</Text></Pressable>
            <Pressable onPress={() => updateAquariumSetting({ aquariumDecor: settings.aquariumDecor === "plants" ? "rocks" : settings.aquariumDecor === "rocks" ? "coral" : "plants" })} style={styles.tankTool}><Text style={styles.tankToolText}>装飾</Text></Pressable>
          </View>
          <View style={styles.fullCounter}><Text style={styles.tankCounterText}>{caught.length} species · {swimmers.length} creatures</Text></View>
          {selectedFish && selectedRecord && (
            <Pressable onPress={() => setSelectedFishId(null)} style={styles.fishInfo}>
              <FishArt fishId={selectedFish.id} size={54} />
              <View style={styles.fishInfoBody}>
                <Text style={styles.fishInfoName}>{selectedFish.name}</Text>
                <Text style={styles.fishInfoRecord}>{selectedFish.rank} RANK · 最大 {selectedRecord.max_size.toLocaleString()}cm</Text>
                <Text numberOfLines={1} style={styles.fishInfoDescription}>{selectedFish.description}</Text>
                <View style={styles.fishInfoActions}>
                  <Pressable onPress={async () => { await setAquariumFavorite(selectedFish.id, selectedPreference?.favorite !== 1); await reloadPreferences(); }} style={styles.fishInfoAction}><Text style={styles.fishInfoActionText}>{selectedPreference?.favorite === 1 ? "★ お気に入り" : "☆ お気に入り"}</Text></Pressable>
                  <Pressable onPress={async () => { await setAquariumVisible(selectedFish.id, false); setSelectedFishId(null); await reloadPreferences(); }} style={styles.fishInfoAction}><Text style={styles.fishInfoActionText}>展示から外す</Text></Pressable>
                </View>
              </View>
              <Text style={styles.fishInfoClose}>×</Text>
            </Pressable>
          )}
        </View>
        {aquariumPicker}
      </SafeAreaView>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{aquarium}</Text>
          <Text style={styles.subtitle}>{caught.length} / {master.length} 種を展示中</Text>
        </View>
        <Pressable onPress={() => setMode((value) => value === "tank" ? "catalog" : "tank")} style={styles.catalogButton}>
          <Text style={styles.catalogIcon}>{mode === "tank" ? "📖" : "🐠"}</Text>
          <Text style={styles.catalogButtonText}>{mode === "tank" ? "図鑑" : "水槽"}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setShowAquariumPicker(true)} style={styles.catalogSelector}>
        <Text style={styles.catalogSelectorText}>{aquarium}</Text><Text style={styles.catalogSelectorSub}>水族館を切り替える ▼</Text>
      </Pressable>

      {mode === "tank" ? (
        <>
          <View style={[styles.liveTank, styles[`theme_${effectiveTheme}`], { height: tankHeight }]}>
            <AquariumHero habitat={habitat} deepSea={deepSea} height={tankHeight} />
            <View pointerEvents="none" style={[styles.themeOverlay, styles[`overlay_${effectiveTheme}`]]} />
            <WaterShimmer height={tankHeight} />
            <View style={styles.swimLayer}>
              {swimmers.map(({ row, copy }, index) => (
                <SwimmingFish
                  key={`${row.fish_id}-${copy}`}
                  fishId={row.fish_id}
                  index={index}
                  copy={copy}
                  width={width - 32}
                  height={tankHeight}
                  onSelect={setSelectedFishId}
                  feeding={feeding}
                  focusFishId={selectedFishId}
                />
              ))}
              <View pointerEvents="none" style={styles.effectLayer}>
                <RisingBubble left="12%" size={10} height={tankHeight} delay={0} />
                <RisingBubble left="18%" size={6} height={tankHeight} delay={1100} />
                <RisingBubble left="75%" size={8} height={tankHeight} delay={1800} />
                <RisingBubble left="82%" size={12} height={tankHeight} delay={700} />
                <RisingBubble left="58%" size={7} height={tankHeight} delay={2600} />
                <RisingBubble left="36%" size={5} height={tankHeight} delay={3400} />
              </View>
              {!swimmers.length && <Text style={styles.emptyTank}>この水族館の生き物を釣ると、ここで泳ぎ始めます</Text>}
            </View>
            <View pointerEvents="none" style={styles.decorLayer}>
              <Text style={styles.decorText}>
                {habitatDecor}
              </Text>
            </View>
            <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE · {aquarium}</Text></View>
            <View style={styles.tankTools}>
              <Pressable onPress={feedFish} disabled={feeding} style={[styles.tankTool, feeding && styles.toolActive]}><Text style={styles.tankToolText}>{feeding ? "集まっています…" : "無料で餌やり"}</Text></Pressable>
              <Pressable disabled={deepSea} onPress={() => updateAquariumSetting({ aquariumTheme: settings.aquariumTheme === "auto" ? "day" : settings.aquariumTheme === "day" ? "sunset" : settings.aquariumTheme === "sunset" ? "night" : "auto" })} style={[styles.tankTool, deepSea && styles.toolActive]}><Text style={styles.tankToolText}>照明：{deepSea ? "深海固定" : settings.aquariumTheme === "auto" ? "自動" : settings.aquariumTheme === "day" ? "昼" : settings.aquariumTheme === "sunset" ? "夕" : "夜"}</Text></Pressable>
              <Pressable onPress={() => updateAquariumSetting({ aquariumDecor: settings.aquariumDecor === "plants" ? "rocks" : settings.aquariumDecor === "rocks" ? "coral" : "plants" })} style={styles.tankTool}><Text style={styles.tankToolText}>水草・岩</Text></Pressable>
            </View>
            <View style={styles.tankCounter}><Text style={styles.tankCounterText}>{caught.length} species · {swimmers.length} creatures</Text></View>
            {selectedFish && selectedRecord && (
              <Pressable onPress={() => setSelectedFishId(null)} style={styles.fishInfo}>
                <FishArt fishId={selectedFish.id} size={54} />
                <View style={styles.fishInfoBody}>
                  <Text style={styles.fishInfoName}>{selectedFish.name}</Text>
                  <Text style={styles.fishInfoRecord}>{selectedFish.rank} RANK · 最大 {selectedRecord.max_size.toLocaleString()}cm</Text>
                  <Text numberOfLines={1} style={styles.fishInfoDescription}>{selectedFish.description}</Text>
                  <View style={styles.fishInfoActions}>
                    <Pressable onPress={async () => { await setAquariumFavorite(selectedFish.id, selectedPreference?.favorite !== 1); await reloadPreferences(); }} style={styles.fishInfoAction}>
                      <Text style={styles.fishInfoActionText}>{selectedPreference?.favorite === 1 ? "★ お気に入り" : "☆ お気に入り"}</Text>
                    </Pressable>
                    <Pressable onPress={async () => { await setAquariumVisible(selectedFish.id, false); setSelectedFishId(null); await reloadPreferences(); }} style={styles.fishInfoAction}>
                      <Text style={styles.fishInfoActionText}>展示から外す</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.fishInfoClose}>×</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.statsBar}>
            <View style={styles.stat}><Text style={styles.statLabel}>総釣果</Text><Text style={styles.statValue}>{stats.count}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>発見率</Text><Text style={styles.statValue}>{Math.round(rows.length / FISH.length * 100)}%</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>最大</Text><Text style={styles.statValue}>{stats.largest.toLocaleString()}cm</Text></View>
          </View>
        </>
      ) : (
        <>
          <Card>
            <View style={ui.between}>
              <View>
                <Text style={ui.h2}>{aquarium} 図鑑</Text>
                <Text style={ui.muted}>{caught.length}/{master.length} 種を発見</Text>
              </View>
              <Pressable onPress={() => setShowLocked((value) => !value)}>
                <Text style={styles.lockToggle}>{showLocked ? "未発見を隠す" : "未発見も表示"}</Text>
              </Pressable>
            </View>
            <View style={styles.rankProgress}>
              {RANKS.map((rank) => {
                const total = FISH.filter((fish) => fish.rank === rank).length;
                const found = FISH.filter((fish) => fish.rank === rank && rows.some((row) => row.fish_id === fish.id)).length;
                return (
                  <View key={rank} style={[styles.rankDot, { backgroundColor: rankColors[rank], opacity: total > 0 && found === total ? 1 : 0.35 }]}>
                    <Text style={styles.rankText}>{rank}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
          <View style={styles.grid}>
            {display.map((fish) => {
              const record = rows.find((row) => row.fish_id === fish.id);
              const catches = history.filter((entry) => entry.fish_id === fish.id);
              const firstCatch = catches[catches.length - 1];
              const bestHistory = catches.filter((entry) => entry.is_personal_best === 1).slice(0, 3);
              const baitNames = SHOP.filter((item) => item.kind === "bait" && item.targetRanks?.includes(fish.rank)).map((item) => item.name);
              const preference = preferences.find((pref) => pref.fish_id === fish.id);
              return (
                <View key={fish.id} style={[styles.fishCard, !record && styles.locked]}>
                  <FishArt fishId={fish.id} size={110} locked={!record} />
                  <Text style={styles.fishName}>{record ? `${preference?.favorite === 1 ? "★ " : ""}${fish.name}` : "未発見"}</Text>
                  <Text style={[styles.rank, { color: record ? rankColors[fish.rank] : colors.muted }]}>{fish.rank} RANK</Text>
                  {record
                    ? <Text style={styles.record}>🏆 {record.max_size.toLocaleString()}cm · {record.count}匹</Text>
                    : <Text style={ui.muted}>釣り上げると詳細が解放</Text>}
                  <Text numberOfLines={2} style={styles.description}>{record ? fish.description : "？？？"}</Text>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailText}>生息地：{fish.habitats.map((habitat) => HABITAT_NAMES[habitat]).join("・")}</Text>
                    <Text style={styles.detailText}>狙いやすい餌：{baitNames.join("・") || "ランク対応餌"}</Text>
                    <Text style={styles.detailText}>サイズ：{fish.minCm.toLocaleString()}〜{fish.maxCm.toLocaleString()}cm</Text>
                    {record ? (
                      <>
                        <Text style={styles.detailText}>初回：{firstCatch ? new Date(firstCatch.caught_at).toLocaleDateString("ja-JP") : "不明"}</Text>
                        <Text style={styles.detailText}>場所：{catches[0]?.spot_name ?? "記録なし"}</Text>
                        <Text style={styles.detailText}>自己ベスト履歴：{bestHistory.length ? bestHistory.map((item) => `${item.size_cm}cm`).join(" → ") : `${record.max_size}cm`}</Text>
                        {preference?.visible === 0 && (
                          <Pressable onPress={async () => { await setAquariumVisible(fish.id, true); await reloadPreferences(); }} style={styles.restoreDisplay}>
                            <Text style={styles.restoreDisplayText}>水槽へ再展示</Text>
                          </Pressable>
                        )}
                      </>
                    ) : <Text style={styles.hint}>ヒント：{HABITAT_NAMES[fish.habitats[0]]}で{fish.rank}ランク対応の餌を使う</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
      {aquariumPicker}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fullScreen: { flex: 1, backgroundColor: "#031D3D" },
  fullTank: { flex: 1, position: "relative", overflow: "hidden" },
  fullHeader: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
  fullHeaderButton: { paddingHorizontal: 11, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(6,59,76,.86)" },
  fullHeaderButtonText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  aquariumSelectButton: { flex: 1, minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, backgroundColor: "rgba(255,255,255,.94)" },
  aquariumSelectName: { color: colors.navy, fontSize: 15, fontWeight: "900", maxWidth: "100%" },
  aquariumSelectSub: { color: colors.ocean, fontSize: 9, fontWeight: "800", marginTop: 2 },
  fullCounter: { position: "absolute", right: 12, bottom: 12, backgroundColor: "rgba(6,59,76,.72)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  catalogSelector: { borderRadius: 16, padding: 12, backgroundColor: colors.ocean, alignItems: "center" },
  catalogSelectorText: { color: colors.white, fontSize: 16, fontWeight: "900" },
  catalogSelectorSub: { color: "#CFF8F3", fontSize: 10, marginTop: 2 },
  title: { fontSize: 27, fontWeight: "900", color: colors.navy },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  catalogButton: { minWidth: 70, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 15, backgroundColor: colors.ocean, alignItems: "center" },
  catalogIcon: { fontSize: 18 },
  catalogButtonText: { color: colors.white, fontWeight: "900", fontSize: 12 },
  aquariumTabs: { gap: 8, paddingRight: 16 },
  aquariumTab: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  activeAquariumTab: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  aquariumTabText: { fontSize: 12, fontWeight: "800", color: colors.ink },
  activeAquariumTabText: { color: colors.white },
  liveTank: { borderRadius: 20, overflow: "hidden", position: "relative", backgroundColor: "#063B4C" },
  theme_day: { backgroundColor: "#2B8797" },
  theme_sunset: { backgroundColor: "#9A553A" },
  theme_night: { backgroundColor: "#031D3D" },
  themeOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  overlay_day: { backgroundColor: "rgba(47,211,218,.03)" },
  overlay_sunset: { backgroundColor: "rgba(255,111,62,.30)" },
  overlay_night: { backgroundColor: "rgba(0,20,70,.52)" },
  swimLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  waterLight: { position: "absolute", top: -40, left: "38%", width: 90, backgroundColor: "rgba(255,255,255,.8)" },
  swimmer: { position: "absolute", left: 0, top: 0, alignItems: "center", justifyContent: "center" },
  fishShadow: { position: "absolute", width: "68%", height: 8, bottom: 7, borderRadius: 99, backgroundColor: "rgba(1,20,28,.24)", transform: [{ scaleX: 1.25 }] },
  bottomShadow: { bottom: 1, height: 10, backgroundColor: "rgba(1,20,28,.38)" },
  bubble: { position: "absolute", borderWidth: 1.5, borderColor: "rgba(255,255,255,.52)", backgroundColor: "rgba(255,255,255,.08)" },
  effectLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  decorLayer: { position: "absolute", left: 0, right: 0, bottom: -3, alignItems: "center" },
  decorText: { fontSize: 36, opacity: 0.82, letterSpacing: 8 },
  emptyTank: { color: colors.white, fontWeight: "900", textAlign: "center", marginTop: 190, paddingHorizontal: 30, textShadowColor: colors.navy, textShadowRadius: 5 },
  liveBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(6,59,76,.82)", borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
  liveBadgeText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  tankCounter: { position: "absolute", right: 12, bottom: 12, backgroundColor: "rgba(6,59,76,.72)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  tankCounterText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  tankTools: { position: "absolute", top: 70, left: 10, right: 10, flexDirection: "row", gap: 6 },
  tankTool: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99, backgroundColor: "rgba(6,59,76,.76)" },
  toolActive: { backgroundColor: "rgba(255,107,94,.88)" },
  tankToolText: { color: colors.white, fontSize: 9, fontWeight: "900" },
  fishInfo: { position: "absolute", left: 12, right: 12, bottom: 12, minHeight: 74, borderRadius: 17, padding: 9, paddingRight: 30, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,.94)", borderWidth: 1, borderColor: "rgba(255,255,255,.75)" },
  fishInfoBody: { flex: 1 },
  fishInfoName: { color: colors.navy, fontSize: 15, fontWeight: "900" },
  fishInfoRecord: { color: colors.coral, fontSize: 10, fontWeight: "900", marginTop: 2 },
  fishInfoDescription: { color: colors.muted, fontSize: 10, marginTop: 3 },
  fishInfoActions: { flexDirection: "row", gap: 5, marginTop: 5 },
  fishInfoAction: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: colors.foam },
  fishInfoActionText: { color: colors.ocean, fontSize: 9, fontWeight: "900" },
  fishInfoClose: { position: "absolute", top: 5, right: 10, color: colors.muted, fontSize: 18, fontWeight: "700" },
  statsBar: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center", backgroundColor: colors.white, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  statLabel: { fontSize: 10, color: colors.muted },
  statValue: { fontSize: 17, fontWeight: "900", color: colors.navy },
  rankProgress: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  rankDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  rankText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  lockToggle: { color: colors.ocean, fontWeight: "800", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fishCard: { width: "48%", minHeight: 300, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 10, alignItems: "center" },
  locked: { opacity: 0.45 },
  fishName: { fontWeight: "900", color: colors.ink, marginTop: 4, textAlign: "center" },
  rank: { fontSize: 11, fontWeight: "900", marginTop: 2 },
  record: { fontSize: 11, fontWeight: "800", color: colors.coral, marginTop: 3 },
  description: { fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 5, lineHeight: 14 },
  detailBox: { width: "100%", marginTop: 8, paddingTop: 7, borderTopWidth: 1, borderTopColor: colors.line, gap: 3 },
  detailText: { color: colors.muted, fontSize: 9, lineHeight: 13 },
  hint: { color: colors.ocean, fontSize: 9, fontWeight: "800", lineHeight: 13 },
  restoreDisplay: { marginTop: 5, padding: 6, borderRadius: 8, backgroundColor: colors.foam, alignItems: "center" },
  restoreDisplayText: { color: colors.ocean, fontSize: 9, fontWeight: "900" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 18, backgroundColor: "rgba(1,19,28,.78)" },
  pickerModal: { maxHeight: "82%", borderRadius: 24, padding: 16, gap: 10, backgroundColor: colors.white },
  pickerTitle: { color: colors.navy, fontSize: 22, fontWeight: "900", textAlign: "center" },
  pickerHelp: { color: colors.muted, fontSize: 11, textAlign: "center" },
  pickerList: { gap: 7, paddingVertical: 4 },
  pickerItem: { minHeight: 57, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: "#F2F4F4", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pickerHasFish: { borderColor: colors.aqua, backgroundColor: colors.foam },
  pickerActive: { borderColor: colors.coral, backgroundColor: "#FFF0EC", borderWidth: 2 },
  pickerItemName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  pickerItemCount: { color: colors.muted, fontSize: 10, marginTop: 2 },
  pickerMark: { color: colors.aqua, fontSize: 11, fontWeight: "900" },
  pickerActiveText: { color: colors.coral },
});
