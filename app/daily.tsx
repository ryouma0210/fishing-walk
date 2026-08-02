import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Header, Screen } from "../src/components/ui";
import { SHOP } from "../src/constants/game";
import { colors } from "../src/constants/theme";
import { claimDailyMission, DailyMission, getDailyMissions } from "../src/services/dailyService";

export default function DailyScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(() => { getDailyMissions().then(setMissions); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const claim = async (mission: DailyMission) => {
    if (!await claimDailyMission(mission.id)) return;
    const bait = SHOP.find((item) => item.id === mission.rewardItemId);
    setMessage(`${bait?.emoji ?? "🎁"} ${mission.rewardName}を1個受け取りました`);
    load();
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.headerBody}><Header title="Daily Mission" sub="毎日挑戦してE〜S対応の餌を獲得" /></View>
      </View>
      {message ? <View style={styles.notice}><Text style={styles.noticeText}>{message}</Text></View> : null}
      <Card style={styles.summary}>
        <Text style={styles.summaryEmoji}>🎁</Text>
        <View style={styles.summaryBody}>
          <Text style={styles.summaryTitle}>本日の達成状況</Text>
          <Text style={styles.summaryText}>{missions.filter((mission) => mission.claimed).length} / {missions.length} 報酬受取済み</Text>
        </View>
      </Card>
      {missions.map((mission) => {
        const complete = mission.current >= mission.target;
        const progress = Math.min(100, mission.current / mission.target * 100);
        const bait = SHOP.find((item) => item.id === mission.rewardItemId);
        return (
          <Card key={mission.id} style={mission.claimed ? { ...styles.mission, ...styles.claimedMission } : styles.mission}>
            <View style={styles.missionHead}>
              <View style={styles.missionIcon}><Text style={styles.missionEmoji}>{mission.id === "walk" ? "👣" : mission.id === "catch" ? "🎣" : "⚔️"}</Text></View>
              <View style={styles.missionBody}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDescription}>{mission.description}</Text>
              </View>
              <Text style={styles.missionCount}>{Math.min(mission.current, mission.target).toLocaleString()} / {mission.target.toLocaleString()}</Text>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
            <View style={styles.rewardRow}>
              <Text style={styles.reward}>{bait?.emoji} 報酬：{mission.rewardName} ×1</Text>
              <View style={styles.claimButton}><Button title={mission.claimed ? "受取済み" : complete ? "受け取る" : "未達成"} disabled={mission.claimed || !complete} onPress={() => claim(mission)} /></View>
            </View>
          </Card>
        );
      })}
      <Text style={styles.reset}>ミッションと受取状況は毎日0時に更新されます</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start" },
  back: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 3, backgroundColor: colors.foam },
  backText: { color: colors.navy, fontSize: 31, lineHeight: 32 },
  headerBody: { flex: 1 },
  notice: { borderRadius: 15, padding: 12, backgroundColor: "#E5F8E9", borderWidth: 1, borderColor: "#82D996" },
  noticeText: { color: "#14783A", fontWeight: "900", textAlign: "center" },
  summary: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FFF8DE" },
  summaryEmoji: { fontSize: 38 },
  summaryBody: { flex: 1 },
  summaryTitle: { color: colors.navy, fontSize: 17, fontWeight: "900" },
  summaryText: { color: colors.muted, fontSize: 11, marginTop: 3 },
  mission: { gap: 11 },
  claimedMission: { opacity: .7, backgroundColor: "#F1F6F5" },
  missionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  missionIcon: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.foam },
  missionEmoji: { fontSize: 24 },
  missionBody: { flex: 1 },
  missionTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  missionDescription: { color: colors.muted, fontSize: 11, marginTop: 2 },
  missionCount: { color: colors.ocean, fontSize: 12, fontWeight: "900" },
  track: { height: 9, overflow: "hidden", borderRadius: 99, backgroundColor: colors.line },
  fill: { height: "100%", borderRadius: 99, backgroundColor: colors.aqua },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reward: { flex: 1, color: colors.navy, fontSize: 11, fontWeight: "800" },
  claimButton: { width: 105 },
  reset: { color: colors.muted, fontSize: 10, textAlign: "center", paddingBottom: 8 },
});
