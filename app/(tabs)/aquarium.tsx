import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Screen, ui } from "../../src/components/ui";
import { AquariumHero, FishArt } from "../../src/components/GameArt";
import { FISH, RANKS } from "../../src/constants/game";
import { CatchSummary, getCatchStats, getCatchSummaries } from "../../src/database/db";
import { colors, rankColors } from "../../src/constants/theme";

type ViewMode = "tank" | "catalog";

function SwimmingFish({ fishId, index, width, height }: {
  fishId: string;
  index: number;
  width: number;
  height: number;
}) {
  const [travel] = useState(() => new Animated.Value(-100));
  const [bob] = useState(() => new Animated.Value(0));
  const [direction] = useState(() => new Animated.Value(1));
  const size = 82 - (index % 4) * 7;

  useEffect(() => {
    const duration = 11500 + (index % 5) * 1700;
    const swim = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(travel, {
          toValue: Math.max(40, width - size + 10), duration,
          easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(direction, { toValue: 1, duration: 1, useNativeDriver: true }),
      ]),
      Animated.timing(direction, { toValue: -1, duration: 180, useNativeDriver: true }),
      Animated.timing(travel, {
        toValue: -size, duration,
        easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(direction, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]));
    const floating = Animated.loop(Animated.sequence([
      Animated.timing(bob, {
        toValue: 13, duration: 1500 + index * 80,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
      }),
      Animated.timing(bob, {
        toValue: -10, duration: 1500 + index * 80,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
      }),
    ]));
    swim.start();
    floating.start();
    return () => {
      swim.stop();
      floating.stop();
    };
  }, [bob, direction, index, size, travel, width]);

  const lanes = Math.max(1, Math.floor((height - size - 30) / 72));
  return (
    <Animated.View style={[styles.swimmer, {
      top: 42 + (index % lanes) * 70 + ((index * 17) % 22),
      transform: [{ translateX: travel }, { translateY: bob }, { scaleX: direction }],
      opacity: 0.76 + (index % 3) * 0.1,
    }]}>
      <FishArt fishId={fishId} size={size} />
    </Animated.View>
  );
}

function Bubble({ left, top, size }: { left: `${number}%`; top: `${number}%`; size: number }) {
  return <View style={[styles.bubble, { left, top, width: size, height: size, borderRadius: size / 2 }]} />;
}

export default function Aquarium() {
  const [rows, setRows] = useState<CatchSummary[]>([]);
  const [stats, setStats] = useState({ count: 0, unique_count: 0, largest: 0 });
  const [selectedAquarium, setSelectedAquarium] = useState("");
  const [mode, setMode] = useState<ViewMode>("tank");
  const [showLocked, setShowLocked] = useState(true);
  const { width, height } = useWindowDimensions();

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getCatchStats()]).then(([summaries, totals]) => {
      setRows(summaries);
      setStats(totals);
    });
  }, []));

  const aquariums = useMemo(() => [...new Set(FISH.map((fish) => fish.aquarium))], []);
  const aquarium = selectedAquarium || aquariums[0];
  const master = FISH.filter((fish) => fish.aquarium === aquarium);
  const caught = rows.filter((row) => row.aquarium === aquarium);
  const swimmers = caught.slice(0, 12);
  const tankHeight = Math.max(440, height - 260);
  const display = showLocked ? master : master.filter((fish) => rows.some((row) => row.fish_id === fish.id));

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aquariumTabs}>
        {aquariums.map((name) => (
          <Pressable
            key={name}
            onPress={() => setSelectedAquarium(name)}
            style={[styles.aquariumTab, aquarium === name && styles.activeAquariumTab]}
          >
            <Text style={[styles.aquariumTabText, aquarium === name && styles.activeAquariumTabText]}>{name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {mode === "tank" ? (
        <>
          <View style={[styles.liveTank, { height: tankHeight }]}>
            <AquariumHero height={tankHeight} />
            <View pointerEvents="none" style={styles.waterLight} />
            <View pointerEvents="none" style={styles.swimLayer}>
              {swimmers.map((row, index) => (
                <SwimmingFish
                  key={row.fish_id}
                  fishId={row.fish_id}
                  index={index}
                  width={width - 32}
                  height={tankHeight}
                />
              ))}
              <Bubble left="12%" top="21%" size={10} />
              <Bubble left="18%" top="36%" size={6} />
              <Bubble left="75%" top="18%" size={8} />
              <Bubble left="82%" top="48%" size={12} />
              <Bubble left="58%" top="67%" size={7} />
              {!swimmers.length && <Text style={styles.emptyTank}>この水族館の生き物を釣ると、ここで泳ぎ始めます</Text>}
            </View>
            <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE · {aquarium}</Text></View>
            <View style={styles.tankCounter}><Text style={styles.tankCounterText}>{swimmers.length} creatures</Text></View>
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
                const total = master.filter((fish) => fish.rank === rank).length;
                const found = master.filter((fish) => fish.rank === rank && rows.some((row) => row.fish_id === fish.id)).length;
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
              return (
                <View key={fish.id} style={[styles.fishCard, !record && styles.locked]}>
                  <FishArt fishId={fish.id} size={110} locked={!record} />
                  <Text style={styles.fishName}>{record ? fish.name : "未発見"}</Text>
                  <Text style={[styles.rank, { color: record ? rankColors[fish.rank] : colors.muted }]}>{fish.rank} RANK</Text>
                  {record
                    ? <Text style={styles.record}>🏆 {record.max_size.toLocaleString()}cm · {record.count}匹</Text>
                    : <Text style={ui.muted}>釣り上げると詳細が解放</Text>}
                  <Text numberOfLines={2} style={styles.description}>{record ? fish.description : "？？？"}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  swimLayer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  waterLight: { position: "absolute", top: -40, left: "38%", width: 90, height: "115%", backgroundColor: "rgba(255,255,255,.08)", transform: [{ rotate: "8deg" }] },
  swimmer: { position: "absolute", left: 0 },
  bubble: { position: "absolute", borderWidth: 1.5, borderColor: "rgba(255,255,255,.52)", backgroundColor: "rgba(255,255,255,.08)" },
  emptyTank: { color: colors.white, fontWeight: "900", textAlign: "center", marginTop: 190, paddingHorizontal: 30, textShadowColor: colors.navy, textShadowRadius: 5 },
  liveBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(6,59,76,.82)", borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
  liveBadgeText: { color: colors.white, fontSize: 10, fontWeight: "900" },
  tankCounter: { position: "absolute", right: 12, bottom: 12, backgroundColor: "rgba(6,59,76,.72)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  tankCounterText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  statsBar: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center", backgroundColor: colors.white, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.line },
  statLabel: { fontSize: 10, color: colors.muted },
  statValue: { fontSize: 17, fontWeight: "900", color: colors.navy },
  rankProgress: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  rankDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  rankText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  lockToggle: { color: colors.ocean, fontWeight: "800", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fishCard: { width: "48%", minHeight: 210, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 10, alignItems: "center" },
  locked: { opacity: 0.45 },
  fishName: { fontWeight: "900", color: colors.ink, marginTop: 4, textAlign: "center" },
  rank: { fontSize: 11, fontWeight: "900", marginTop: 2 },
  record: { fontSize: 11, fontWeight: "800", color: colors.coral, marginTop: 3 },
  description: { fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 5, lineHeight: 14 },
});
