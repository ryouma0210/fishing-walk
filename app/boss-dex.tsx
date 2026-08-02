import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../src/components/ui";
import { FishArt } from "../src/components/GameArt";
import { FISHING_AREAS } from "../src/constants/areas";
import { FISH } from "../src/constants/game";
import { colors } from "../src/constants/theme";
import { CatchSummary, getCatchSummaries } from "../src/database/db";

export default function BossDexScreen() {
  const router = useRouter();
  const [catches, setCatches] = useState<CatchSummary[]>([]);

  useFocusEffect(useCallback(() => {
    getCatchSummaries().then(setCatches).catch(() => setCatches([]));
  }, []));

  const catchByFish = useMemo(() => new Map(catches.map((row) => [row.fish_id, row])), [catches]);
  const bosses = FISHING_AREAS.map((area) => ({ area, fish: FISH.find((fish) => fish.id === area.bossFishId)! }));
  const caughtCount = bosses.filter(({ fish }) => catchByFish.has(fish.id)).length;

  return (
    <Screen>
      <View style={ui.between}>
        <Header title="ヌシ図鑑" sub={`${caughtCount} / ${bosses.length}体 捕獲`} />
        <Button title="閉じる" kind="secondary" onPress={() => router.back()} />
      </View>
      {bosses.map(({ area, fish }, index) => {
        const caught = catchByFish.get(fish.id);
        return (
          <Card key={fish.id} style={{ ...styles.card, ...(!caught ? styles.uncaughtCard : {}) }}>
            <View style={styles.artFrame}>
              <FishArt fishId={fish.id} size={150} locked={!caught} />
              {!caught && <View style={styles.question}><Text style={styles.questionText}>?</Text></View>}
            </View>
            <View style={styles.details}>
              <Text style={styles.area}>AREA {index + 1} · {area.name}</Text>
              <Text style={styles.name}>{caught ? fish.name : "未発見のヌシ"}</Text>
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
});
