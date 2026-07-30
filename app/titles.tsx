import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Card, Header, Screen, ui } from "../src/components/ui";
import { FISH } from "../src/constants/game";
import { getCatchStats, getCatchSummaries } from "../src/database/db";
import { syncTodaySteps } from "../src/services/stepService";
import { colors } from "../src/constants/theme";

export default function TitlesScreen() {
  const router = useRouter();
  const [values, setValues] = useState({ steps: 0, count: 0, unique: 0, largest: 0 });
  useFocusEffect(useCallback(() => {
    Promise.all([syncTodaySteps(), getCatchStats(), getCatchSummaries()]).then(([today, stats, rows]) => {
      setValues({ steps: today.steps, count: stats.count, unique: rows.length, largest: stats.largest });
    });
  }, []));
  const titles = [
    { icon: "👣", name: "はじめての一歩", condition: "1日に1,000歩", unlocked: values.steps >= 1000 },
    { icon: "🥾", name: "ウォーキング名人", condition: "1日に10,000歩", unlocked: values.steps >= 10000 },
    { icon: "🎣", name: "新人アングラー", condition: "魚を1匹釣る", unlocked: values.count >= 1 },
    { icon: "🐟", name: "魚博士", condition: "20種類発見", unlocked: values.unique >= 20 },
    { icon: "🐋", name: "大物ハンター", condition: "100cm以上を捕獲", unlocked: values.largest >= 100 },
    { icon: "🏆", name: "伝説の釣り人", condition: "80種類すべて発見", unlocked: values.unique === FISH.length },
  ];
  return (
    <Screen>
      <View style={ui.between}><Header title="称号" sub="歩いて、釣って、称号を集めよう" /><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>戻る</Text></Pressable></View>
      {titles.map((title) => (
        <Card key={title.name} style={title.unlocked ? styles.unlocked : styles.locked}>
          <View style={styles.row}>
            <Text style={styles.icon}>{title.unlocked ? title.icon : "🔒"}</Text>
            <View style={styles.body}><Text style={styles.name}>{title.name}</Text><Text style={styles.condition}>{title.condition}</Text></View>
            <Text style={title.unlocked ? styles.statusUnlocked : styles.statusLocked}>{title.unlocked ? "獲得済み" : "未獲得"}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.foam },
  backText: { color: colors.navy, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 34 },
  body: { flex: 1 },
  name: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  condition: { color: colors.muted, fontSize: 11, marginTop: 3 },
  statusUnlocked: { color: colors.ocean, fontSize: 11, fontWeight: "900" },
  statusLocked: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  unlocked: { borderColor: colors.gold, backgroundColor: "#FFFBEE" },
  locked: { opacity: 0.58 },
});
