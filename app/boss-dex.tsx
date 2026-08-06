import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../src/components/ui";
import { FishArt } from "../src/components/GameArt";
import { FISHING_AREAS } from "../src/constants/areas";
import { FISH } from "../src/constants/game";
import { colors } from "../src/constants/theme";
import { CatchSummary, getCatchSummaries, getTotalSteps } from "../src/database/db";
import { ChapterId } from "../src/constants/expansionData";

export default function BossDexScreen() {
  const router = useRouter();
  const [catches, setCatches] = useState<CatchSummary[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [story, setStory] = useState<ChapterId>("japan");

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getTotalSteps()]).then(([rows, steps]) => { setCatches(rows); setTotalSteps(steps); }).catch(() => setCatches([]));
  }, []));

  const catchByFish = useMemo(() => new Map(catches.map((row) => [row.fish_id, row])), [catches]);
  const japanClear = catchByFish.has("jp_okinawa_sss");
  const worldFinalBoss = FISHING_AREAS.filter((area) => area.story === "world").at(-1)?.bossFishId;
  const worldClear = Boolean(worldFinalBoss && catchByFish.has(worldFinalBoss));
  const chapterIsOpen = story === "japan" || (story === "world" && japanClear) || (story === "space" && worldClear);
  const chapterAreas = FISHING_AREAS.filter((area) => area.story === story);
  const bosses = chapterAreas.map((area) => ({ area, fish: FISH.find((fish) => fish.id === area.bossFishId)! }));
  const caughtCount = bosses.filter(({ fish }) => catchByFish.has(fish.id)).length;

  return (
    <Screen>
      <View style={ui.between}>
        <Header title="ヌシ・全国図鑑" sub={`ヌシ ${caughtCount} / ${bosses.length}体 捕獲`} />
        <Button title="閉じる" kind="secondary" onPress={() => router.back()} />
      </View>
      <View style={styles.chapterTabs}>{(["japan","world","space"] as ChapterId[]).map((id) => <Pressable key={id} onPress={() => { setStory(id); setExpandedArea(null); }} style={[styles.chapterTab, story === id && styles.activeChapterTab]}><Text style={[styles.chapterTabText, story === id && styles.activeChapterTabText]}>{id === "japan" ? "日本編 47" : id === "world" ? "世界編 50" : "宇宙編 50"}</Text></Pressable>)}</View>
      <Text style={styles.sectionTitle}>ヌシ図鑑</Text>
      {bosses.map(({ area, fish }, index) => {
        const caught = catchByFish.get(fish.id);
        const unlocked = chapterIsOpen && totalSteps >= area.requiredSteps;
        return (
          <Card key={fish.id} style={{ ...styles.card, ...(!caught ? styles.uncaughtCard : {}) }}>
            <View style={styles.artFrame}>
              {caught ? <FishArt fishId={fish.id} size={150} /> : <View style={styles.question}><Text style={styles.questionText}>?</Text></View>}
            </View>
            <View style={styles.details}>
              <Text style={styles.area}>AREA {index + 1} · {unlocked ? area.name : "？？？"}</Text>
              <Text style={styles.name}>{caught ? fish.name : "？？？"}</Text>
              <Text style={styles.rank}>SSS RANK BOSS</Text>
              <View style={styles.record}>
                <Text style={styles.recordLabel}>捕獲日</Text>
                <Text style={styles.recordValue}>{caught ? new Date(caught.last_caught_at).toLocaleDateString("ja-JP") : "未捕獲"}</Text>
              </View>
              <View style={styles.record}>
                <Text style={styles.recordLabel}>捕獲サイズ</Text>
                <Text style={styles.recordValue}>{caught ? `${caught.max_size.toFixed(1)} cm` : "---"}</Text>
              </View>
            </View>
          </Card>
        );
      })}
      <Text style={styles.sectionTitle}>{story === "japan" ? "都道府県図鑑" : story === "world" ? "世界エリア図鑑" : "宇宙エリア図鑑"}</Text>
      {chapterAreas.map((area, index) => {
        const unlocked = chapterIsOpen && totalSteps >= area.requiredSteps;
        const discovered = area.fishIds.filter((id) => catchByFish.has(id)).length;
        const expanded = expandedArea === area.id;
        return <Card key={`dex-${area.id}`}>
          <Pressable onPress={() => unlocked && setExpandedArea(expanded ? null : area.id)} style={styles.areaHeader}>
            <View><Text style={styles.prefectureIndex}>{index + 1}/{chapterAreas.length}</Text><Text style={styles.prefectureName}>{unlocked ? area.name : "？？？"}</Text></View>
            <View style={styles.areaProgress}><Text style={styles.areaProgressText}>{unlocked ? `${discovered}/10` : "🔒"}</Text><Text style={styles.openText}>{unlocked ? expanded ? "閉じる" : "図鑑を見る" : `${area.requiredSteps.toLocaleString()}歩`}</Text></View>
          </Pressable>
          {expanded && <View style={styles.fishGrid}>{area.fishIds.map((fishId) => {
            const fish = FISH.find((entry) => entry.id === fishId)!;
            const caught = catchByFish.get(fishId);
            return <View key={fishId} style={styles.fishCell}>
              <View style={styles.miniArt}>{caught ? <FishArt fishId={fishId} size={58} /> : <Text style={styles.miniQuestion}>?</Text>}</View>
              <Text numberOfLines={2} style={styles.fishName}>{caught ? fish.name : "？？？"}</Text>
              <Text style={styles.fishRank}>{fish.isSpecial ? "名産物 0.3%" : `${fish.rank} RANK`}</Text>
            </View>;
          })}</View>}
        </Card>;
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 13, overflow: "hidden" },
  uncaughtCard: { backgroundColor: "#EDF2F2" },
  artFrame: { width: 150, height: 150, alignItems: "center", justifyContent: "center", borderRadius: 18, overflow: "hidden", backgroundColor: colors.foam },
  question: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  questionText: { color: colors.navy, fontSize: 58, fontWeight: "900", opacity: .7 },
  details: { flex: 1, gap: 4 },
  area: { color: colors.ocean, fontSize: 9, fontWeight: "900", letterSpacing: .7 },
  name: { color: colors.navy, fontSize: 18, fontWeight: "900" },
  rank: { alignSelf: "flex-start", color: colors.white, backgroundColor: colors.coral, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, fontSize: 9, fontWeight: "900" },
  record: { marginTop: 3 },
  recordLabel: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  recordValue: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  sectionTitle: { color: colors.navy, fontSize: 21, fontWeight: "900", marginTop: 8 },
  chapterTabs: { flexDirection: "row", gap: 6 },
  chapterTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 13, backgroundColor: colors.foam },
  activeChapterTab: { backgroundColor: colors.ocean },
  chapterTabText: { color: colors.navy, fontSize: 10, fontWeight: "900" },
  activeChapterTabText: { color: colors.white },
  areaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prefectureIndex: { color: colors.ocean, fontSize: 9, fontWeight: "900" },
  prefectureName: { color: colors.navy, fontSize: 20, fontWeight: "900" },
  areaProgress: { alignItems: "flex-end" },
  areaProgressText: { color: colors.coral, fontSize: 18, fontWeight: "900" },
  openText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  fishGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 13 },
  fishCell: { width: "31.5%", minHeight: 112, alignItems: "center", padding: 6, borderRadius: 12, backgroundColor: colors.foam },
  miniArt: { width: 58, height: 58, alignItems: "center", justifyContent: "center" },
  miniQuestion: { color: colors.navy, fontSize: 35, fontWeight: "900", opacity: .7 },
  fishName: { color: colors.ink, fontSize: 10, fontWeight: "900", textAlign: "center" },
  fishRank: { color: colors.muted, fontSize: 8, fontWeight: "800", marginTop: 2 },
});
