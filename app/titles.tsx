import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Card, Header, Screen, ui } from "../src/components/ui";
import { getCatchStats, getCatchSummaries, getPlayerProgress, getTotalSteps } from "../src/database/db";
import { colors } from "../src/constants/theme";
import { getSelectedTitle, setSelectedTitle } from "../src/services/titleService";
import { isTitleUnlocked, TITLE_DEFINITIONS, TitleValues } from "../src/constants/titles";

export default function TitlesScreen() {
  const router = useRouter();
  const [values, setValues] = useState<TitleValues>({ steps:0,catches:0,unique:0,largest:0,level:1 });
  const [selectedTitle, setSelectedTitleState] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    Promise.all([getTotalSteps(), getCatchStats(), getCatchSummaries(),getPlayerProgress(),getSelectedTitle()]).then(([steps, stats, rows,progress,selected]) => {
      setValues({ steps,catches:stats.count,unique:rows.length,largest:stats.largest,level:progress.level });
      setSelectedTitleState(selected);
    });
  }, []));
  const titles=TITLE_DEFINITIONS.map((title) => ({...title,unlocked:isTitleUnlocked(title,values)}));
  return (
    <Screen>
      <View style={ui.between}><Header title="称号" sub="歩いて、釣って、称号を集めよう" /><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>戻る</Text></Pressable></View>
      {titles.map((title) => (
        <Pressable key={title.name} disabled={!title.unlocked} onPress={async () => { await setSelectedTitle(title.name); setSelectedTitleState(title.name); }}>
        <Card style={selectedTitle === title.name ? styles.selected : title.unlocked ? styles.unlocked : styles.locked}>
          <View style={styles.row}>
            <Text style={styles.icon}>{title.unlocked ? title.icon : "🔒"}</Text>
            <View style={styles.body}><Text style={styles.name}>{title.name}</Text><Text style={styles.condition}>{title.condition}</Text></View>
            <Text style={title.unlocked ? styles.statusUnlocked : styles.statusLocked}>{!title.unlocked ? "未獲得" : selectedTitle === title.name ? "選択中" : "変更する"}</Text>
          </View>
        </Card>
        </Pressable>
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
  selected:{borderWidth:3,borderColor:colors.coral,backgroundColor:"#FFF3ED"},
  locked: { opacity: 0.58 },
});
