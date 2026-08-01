import { useCallback, useMemo, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, ui } from "../../src/components/ui";
import { FISHING_AREAS, FishingArea } from "../../src/constants/areas";
import { FISH } from "../../src/constants/game";
import { getCatchSummaries } from "../../src/database/db";
import { getSelectedArea, selectArea } from "../../src/services/areaService";
import { colors, rankColors } from "../../src/constants/theme";

const worldBackground = require("../../assets/game/fishing-area-world.png");

export default function AreaScreen() {
  const router = useRouter();
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<FishingArea>(FISHING_AREAS[0]);

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getSelectedArea()]).then(([rows, savedArea]) => {
      setCaughtIds(new Set(rows.map((row) => row.fish_id)));
      setSelected(savedArea);
    });
  }, []));

  const states = useMemo(() => FISHING_AREAS.map((area, index) => {
    const previous = FISHING_AREAS[index - 1];
    return {
      area,
      unlocked: index === 0 || caughtIds.has(previous.bossFishId),
      cleared: caughtIds.has(area.bossFishId),
      discovered: FISH.filter((fish) => fish.habitats.includes(area.habitat) && caughtIds.has(fish.id)).length,
      total: FISH.filter((fish) => fish.habitats.includes(area.habitat)).length,
    };
  }), [caughtIds]);
  const selectedState = states.find((state) => state.area.id === selected.id) ?? states[0];

  const enterArea = async () => {
    if (!selectedState.unlocked) return;
    await selectArea(selected);
    router.push("/(tabs)/fish");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ImageBackground source={worldBackground} resizeMode="cover" style={styles.world}>
        <View style={styles.header}>
          <Text style={styles.title}>Fishing Areas</Text>
          <Text style={styles.sub}>ヌシを釣り上げて、次のエリアへ進もう</Text>
          <View style={styles.progressRow}>
            {states.map((state) => <View key={state.area.id} style={[styles.progressDot, state.unlocked && styles.progressUnlocked, state.cleared && styles.progressCleared]} />)}
          </View>
        </View>

        {states.map((state, index) => {
          const active = selected.id === state.area.id;
          return (
            <Pressable
              key={state.area.id}
              disabled={!state.unlocked}
              onPress={() => setSelected(state.area)}
              style={[styles.areaNode, { left: state.area.node.left, top: state.area.node.top }, !state.unlocked && styles.lockedNode]}
            >
              {index < states.length - 1 && <View style={[styles.routeStub, state.cleared && styles.routeCleared]} />}
              <View style={[styles.nodeCircle, state.unlocked && styles.nodeUnlocked, state.cleared && styles.nodeCleared, active && styles.nodeActive]}>
                <Text style={styles.nodeEmoji}>{state.unlocked ? state.area.emoji : "🔒"}</Text>
              </View>
              <View style={[styles.nodeLabel, active && styles.nodeLabelActive]}>
                <Text numberOfLines={1} style={[styles.nodeName, active && styles.nodeNameActive]}>{index + 1}. {state.area.name}</Text>
                <Text style={[styles.nodeStatus, active && styles.nodeNameActive]}>{state.cleared ? "★ CLEAR" : state.unlocked ? `${state.discovered}/${state.total}種` : "LOCKED"}</Text>
              </View>
            </Pressable>
          );
        })}

        <Card style={styles.areaCard}>
          <View style={ui.between}>
            <View style={styles.areaInfo}>
              <Text style={styles.areaName}>{selected.emoji} {selected.name}</Text>
              <Text style={styles.areaSubtitle}>{selected.subtitle}</Text>
            </View>
            <Text style={[styles.areaState, { color: selectedState.cleared ? colors.gold : selectedState.unlocked ? colors.ocean : colors.muted }]}>
              {selectedState.cleared ? "CLEAR" : selectedState.unlocked ? "挑戦可能" : "未解放"}
            </Text>
          </View>
          <View style={styles.bossBox}>
            <Text style={styles.bossLabel}>AREA BOSS</Text>
            <Text style={styles.bossName}>👑 {selected.bossName}</Text>
            <Text style={styles.bossHint}>{selectedState.cleared ? "釣り上げ済み。次のエリアが解放されています" : "SSSランク対応の餌でヌシに挑戦"}</Text>
          </View>
          <Button title={selectedState.unlocked ? "このエリアで釣る" : "前のエリアのヌシを釣ると解放"} disabled={!selectedState.unlocked} onPress={enterArea} />
        </Card>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#DDF6F6" },
  world: { flex: 1, position: "relative", overflow: "hidden" },
  header: { position: "absolute", top: 8, left: 12, right: 12, borderRadius: 18, padding: 12, backgroundColor: "rgba(255,255,255,.94)", shadowColor: colors.navy, shadowOpacity: .18, shadowRadius: 8 },
  title: { color: colors.navy, fontSize: 23, fontWeight: "900" },
  sub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: "row", gap: 7, marginTop: 8 },
  progressDot: { flex: 1, height: 5, borderRadius: 99, backgroundColor: "#C9D4D5" },
  progressUnlocked: { backgroundColor: colors.aqua },
  progressCleared: { backgroundColor: colors.gold },
  areaNode: { position: "absolute", width: 132, marginLeft: -66, alignItems: "center", zIndex: 3 },
  lockedNode: { opacity: .68 },
  routeStub: { position: "absolute", width: 6, height: 78, top: -55, left: 63, borderRadius: 6, backgroundColor: "rgba(255,255,255,.72)", transform: [{ rotate: "-17deg" }] },
  routeCleared: { backgroundColor: "rgba(245,185,66,.92)" },
  nodeCircle: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#9BA9A9", backgroundColor: "rgba(255,255,255,.94)", shadowColor: colors.navy, shadowOpacity: .28, shadowRadius: 7 },
  nodeUnlocked: { borderColor: colors.aqua },
  nodeCleared: { borderColor: colors.gold, backgroundColor: "#FFF7D7" },
  nodeActive: { borderColor: colors.coral, transform: [{ scale: 1.14 }] },
  nodeEmoji: { fontSize: 27 },
  nodeLabel: { minWidth: 120, maxWidth: 145, marginTop: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: "rgba(6,59,76,.86)", alignItems: "center" },
  nodeLabelActive: { backgroundColor: "rgba(255,107,94,.94)" },
  nodeName: { color: colors.white, fontSize: 10, fontWeight: "900" },
  nodeNameActive: { color: colors.white },
  nodeStatus: { color: "#B9F5EF", fontSize: 8, fontWeight: "800", marginTop: 1 },
  areaCard: { position: "absolute", left: 12, right: 12, bottom: 12, padding: 13, gap: 9 },
  areaInfo: { flex: 1, paddingRight: 8 },
  areaName: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  areaSubtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  areaState: { fontSize: 11, fontWeight: "900" },
  bossBox: { borderRadius: 12, padding: 9, backgroundColor: colors.foam },
  bossLabel: { color: rankColors.SSS, fontSize: 9, fontWeight: "900" },
  bossName: { color: colors.navy, fontSize: 14, fontWeight: "900", marginTop: 2 },
  bossHint: { color: colors.muted, fontSize: 9, marginTop: 2 },
});
