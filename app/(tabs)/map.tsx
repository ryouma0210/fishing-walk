import { useCallback, useMemo, useRef, useState } from "react";
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Button } from "../../src/components/ui";
import { FISHING_AREAS, FishingArea } from "../../src/constants/areas";
import { FISH } from "../../src/constants/game";
import { getCatchSummaries } from "../../src/database/db";
import { selectArea } from "../../src/services/areaService";
import { colors, rankColors } from "../../src/constants/theme";

const worldBackground = require("../../assets/game/fishing-area-world.png");
const advancedWorldBackground = require("../../assets/game/fishing-area-world-2.png");

export default function AreaScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<FishingArea | null>(null);
  const [compactHeader, setCompactHeader] = useState(false);
  const pageHeight = Math.max(820, height + 120);

  useFocusEffect(useCallback(() => {
    getCatchSummaries().then((rows) => {
      setCaughtIds(new Set(rows.map((row) => row.fish_id)));
      setSelected(null);
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
  const selectedState = selected ? states.find((state) => state.area.id === selected.id) ?? null : null;

  const enterArea = async () => {
    if (!selected || !selectedState?.unlocked) return;
    await selectArea(selected);
    router.push("/(tabs)/fish");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        style={styles.worldScroll}
        showsVerticalScrollIndicator
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        scrollEventThrottle={32}
        onScroll={(event) => setCompactHeader(event.nativeEvent.contentOffset.y < pageHeight * 0.72)}
      >
        {[2, 1].map((chapter) => {
          const chapterStates = states.filter((state) => state.area.chapter === chapter);
          return (
          <ImageBackground
            key={chapter}
            source={chapter === 1 ? worldBackground : advancedWorldBackground}
            resizeMode="cover"
            style={[styles.world, { height: pageHeight }]}
          >
            <View style={styles.chapterBadge}>
              <Text style={styles.chapterNumber}>CHAPTER {chapter}</Text>
              <Text style={styles.chapterName}>{chapter === 1 ? "水辺のはじまり" : "幻境への挑戦"}</Text>
            </View>

            {chapterStates.slice(0, -1).map((state, routeIndex) => {
              const next = chapterStates[routeIndex + 1];
              const x1 = parseFloat(state.area.node.left) / 100 * width;
              const y1 = parseFloat(state.area.node.top) / 100 * pageHeight + 29;
              const x2 = parseFloat(next.area.node.left) / 100 * width;
              const y2 = parseFloat(next.area.node.top) / 100 * pageHeight + 29;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              return <View key={`route-${state.area.id}`} style={[styles.areaRoute, state.cleared && styles.routeCleared, {
                left: (x1 + x2 - length) / 2,
                top: (y1 + y2) / 2 - 4,
                width: length,
                transform: [{ rotate: `${angle}deg` }],
              }]} />;
            })}

            {chapterStates.map((state) => {
              const index = FISHING_AREAS.findIndex((area) => area.id === state.area.id);
              const active = selected?.id === state.area.id;
              return (
                <Pressable
                  key={state.area.id}
                  onPress={() => setSelected(state.area)}
                  style={[styles.areaNode, { left: state.area.node.left, top: state.area.node.top }, !state.unlocked && styles.lockedNode]}
                >
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
          </ImageBackground>
        );})}
        {(() => {
          const upper = states[4];
          const lower = states[3];
          if (!upper || !lower) return null;
          const x1 = parseFloat(upper.area.node.left) / 100 * width;
          const y1 = parseFloat(upper.area.node.top) / 100 * pageHeight + 29;
          const x2 = parseFloat(lower.area.node.left) / 100 * width;
          const y2 = pageHeight + parseFloat(lower.area.node.top) / 100 * pageHeight + 29;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return <View pointerEvents="none" style={[styles.areaRoute, styles.chapterRoute, lower.cleared && styles.routeCleared, {
            left: (x1 + x2 - length) / 2,
            top: (y1 + y2) / 2 - 4,
            width: length,
            transform: [{ rotate: `${angle}deg` }],
          }]} />;
        })()}
      </ScrollView>

      <View style={[styles.header, compactHeader && styles.compactHeader]}>
        <View style={compactHeader && styles.compactTitleRow}>
          <Text style={[styles.title, compactHeader && styles.compactTitle]} maxFontSizeMultiplier={1.15}>Fishing Areas</Text>
          {!compactHeader && <Text style={styles.sub} maxFontSizeMultiplier={1.15}>上へ進み、8つのエリアのヌシに挑もう</Text>}
        </View>
        <View style={[styles.progressRow, compactHeader && styles.compactProgress]}>
          {states.map((state) => <View key={state.area.id} style={[styles.progressDot, state.unlocked && styles.progressUnlocked, state.cleared && styles.progressCleared]} />)}
        </View>
      </View>

      <Modal visible={selected !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          {selected && selectedState && (
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHero}>
                <View style={[styles.modalIcon, !selectedState.unlocked && styles.modalIconLocked]}>
                  <Text style={styles.modalEmoji}>{selectedState.unlocked ? selected.emoji : "🔒"}</Text>
                </View>
                <View style={styles.areaInfo}>
                  <Text style={styles.modalEyebrow}>FISHING AREA</Text>
                  <Text style={styles.areaName}>{selected.name}</Text>
                  <Text style={styles.areaSubtitle}>{selected.subtitle}</Text>
                </View>
                <View style={[styles.statePill, selectedState.cleared && styles.statePillCleared, !selectedState.unlocked && styles.statePillLocked]}>
                  <Text style={styles.statePillText}>{selectedState.cleared ? "CLEAR" : selectedState.unlocked ? "挑戦可能" : "LOCKED"}</Text>
                </View>
              </View>

              <View style={styles.discoveryRow}>
                <Text style={styles.discoveryLabel}>このエリアの発見数</Text>
                <Text style={styles.discoveryValue}>{selectedState.discovered}<Text style={styles.discoveryTotal}> / {selectedState.total}種</Text></Text>
              </View>
              <View style={styles.bossBox}>
                <View>
                  <Text style={styles.bossLabel}>AREA BOSS</Text>
                  <Text style={styles.bossName}>👑 {selected.bossName}</Text>
                </View>
                <Text style={styles.bossHint}>{selectedState.cleared ? "ヌシ捕獲済み・何度でも挑戦できます" : selectedState.unlocked ? "SSSランク対応の餌でヌシに挑戦" : "前のエリアのヌシを釣ると解放されます"}</Text>
              </View>
              <Button title={selectedState.unlocked ? "このエリアで釣る" : "まだこのエリアには入れません"} disabled={!selectedState.unlocked} onPress={enterArea} />
              <Pressable onPress={() => setSelected(null)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#DDF6F6" },
  worldScroll: { flex: 1, backgroundColor: "#071D38" },
  world: { position: "relative", overflow: "hidden" },
  header: { position: "absolute", zIndex: 20, top: 8, left: 12, right: 12, borderRadius: 18, padding: 12, backgroundColor: "rgba(255,255,255,.94)", shadowColor: colors.navy, shadowOpacity: .18, shadowRadius: 8, elevation: 10 },
  compactHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 15 },
  compactTitleRow: { flexShrink: 0 },
  compactTitle: { fontSize: 16 },
  compactProgress: { flex: 1, marginTop: 0, marginLeft: 10 },
  title: { color: colors.navy, fontSize: 23, fontWeight: "900" },
  sub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: "row", gap: 7, marginTop: 8 },
  progressDot: { flex: 1, height: 5, borderRadius: 99, backgroundColor: "#C9D4D5" },
  progressUnlocked: { backgroundColor: colors.aqua },
  progressCleared: { backgroundColor: colors.gold },
  chapterBadge: { position: "absolute", left: 12, top: 112, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(5,42,57,.82)" },
  chapterNumber: { color: colors.aqua, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  chapterName: { color: colors.white, fontSize: 15, fontWeight: "900", marginTop: 1 },
  areaNode: { position: "absolute", width: 132, marginLeft: -66, alignItems: "center", zIndex: 3 },
  lockedNode: { opacity: .68 },
  areaRoute: { position: "absolute", zIndex: 1, height: 8, borderRadius: 99, backgroundColor: "rgba(255,255,255,.82)", borderWidth: 1, borderColor: "rgba(6,59,76,.22)", shadowColor: "#FFFFFF", shadowOpacity: .7, shadowRadius: 5 },
  chapterRoute: { zIndex: 2, height: 10, backgroundColor: "rgba(255,255,255,.9)" },
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
  areaInfo: { flex: 1, paddingRight: 8 },
  areaName: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  areaSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,24,35,.58)" },
  modalSheet: { margin: 10, padding: 18, paddingBottom: 14, borderRadius: 28, gap: 13, backgroundColor: "rgba(255,255,255,.98)", shadowColor: "#000", shadowOpacity: .28, shadowRadius: 24, elevation: 24 },
  modalHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 99, backgroundColor: "#D1DEDF", marginBottom: 2 },
  modalHero: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIcon: { width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#DDF8F4", borderWidth: 1, borderColor: "#B8E9E2" },
  modalIconLocked: { backgroundColor: "#EDF0F1", borderColor: "#D3DADB" },
  modalEmoji: { fontSize: 29 },
  modalEyebrow: { color: colors.ocean, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  statePill: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.ocean },
  statePillCleared: { backgroundColor: colors.gold },
  statePillLocked: { backgroundColor: "#879899" },
  statePillText: { color: colors.white, fontSize: 9, fontWeight: "900" },
  discoveryRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderRadius: 15, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: "#F3F8F8" },
  discoveryLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  discoveryValue: { color: colors.navy, fontSize: 21, fontWeight: "900" },
  discoveryTotal: { color: colors.muted, fontSize: 11 },
  bossBox: { borderRadius: 16, padding: 13, backgroundColor: colors.foam, borderWidth: 1, borderColor: "#D5EEEB" },
  bossLabel: { color: rankColors.SSS, fontSize: 9, fontWeight: "900" },
  bossName: { color: colors.navy, fontSize: 14, fontWeight: "900", marginTop: 2 },
  bossHint: { color: colors.muted, fontSize: 9, marginTop: 2 },
  cancelButton: { alignItems: "center", paddingVertical: 5 },
  cancelText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
});
