import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../src/database/db";
import { colors } from "../src/constants/theme";
import { syncTodaySteps } from "../src/services/stepService";

const teaImage = require("../assets/game/startup-tea.png");

export default function RootLayout() {
  const [showGreeting, setShowGreeting] = useState(true);
  const [todaySteps, setTodaySteps] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    db()
      .then(() => syncTodaySteps())
      .then((result) => { if (active) setTodaySteps(result.steps); })
      .catch((error) => {
        console.error(error);
        if (active) setTodaySteps(0);
      });
    return () => { active = false; };
  }, []);

  const earnedPoints = Math.floor((todaySteps ?? 0) / 100);

  return <>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false }} />
    <Modal visible={showGreeting} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowGreeting(false)}>
      <View style={styles.backdrop}>
        <View style={styles.popup}>
          <View style={styles.imageFrame}><Image source={teaImage} resizeMode="cover" style={styles.teaImage} /></View>
          <Text style={styles.greeting}>お疲れ様です</Text>
          <Text style={styles.greetingSub}>今日も一緒に、のんびり歩きましょう。</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>★ 本日の結果</Text>
            {todaySteps === null ? (
              <View style={styles.loading}><ActivityIndicator color={colors.ocean} /><Text style={styles.loadingText}>歩数を確認しています…</Text></View>
            ) : <>
              <View style={styles.resultRow}>
                <View style={styles.resultIcon}><Text style={styles.resultEmoji}>👣</Text></View>
                <Text style={styles.resultLabel}>歩いた歩数</Text>
                <Text style={styles.resultValue}>{todaySteps.toLocaleString()}<Text style={styles.resultUnit}> 歩</Text></Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <View style={styles.resultIcon}><Text style={styles.resultEmoji}>✨</Text></View>
                <Text style={styles.resultLabel}>獲得ポイント</Text>
                <Text style={styles.resultValue}>{earnedPoints.toLocaleString()}<Text style={styles.resultUnit}> pt</Text></Text>
              </View>
            </>}
          </View>

          <Text style={styles.pointRule}>100歩 ＝ 1ポイント</Text>
          <Pressable disabled={todaySteps === null} onPress={() => setShowGreeting(false)} style={({ pressed }) => [styles.closeButton, (pressed || todaySteps === null) && styles.closeButtonDim]}>
            <Text style={styles.closeButtonText}>今日も釣りに行く</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(2,25,35,.68)" },
  popup: { width: "100%", maxWidth: 390, borderRadius: 30, padding: 18, alignItems: "center", backgroundColor: "#FBFFFC", borderWidth: 1, borderColor: "rgba(255,255,255,.9)", shadowColor: "#001A23", shadowOpacity: .28, shadowRadius: 25, elevation: 24 },
  imageFrame: { width: 154, height: 132, borderRadius: 26, overflow: "hidden", marginTop: -4, backgroundColor: colors.foam },
  teaImage: { width: "100%", height: "100%" },
  greeting: { color: colors.navy, fontSize: 27, fontWeight: "900", marginTop: 13 },
  greetingSub: { color: colors.muted, fontSize: 11, marginTop: 3, marginBottom: 14 },
  resultCard: { alignSelf: "stretch", borderRadius: 20, padding: 14, backgroundColor: "#EAF7F3", borderWidth: 1, borderColor: "#C9E8DF" },
  resultTitle: { color: colors.navy, fontSize: 16, fontWeight: "900", marginBottom: 9 },
  resultRow: { minHeight: 47, flexDirection: "row", alignItems: "center", gap: 9 },
  resultIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  resultEmoji: { fontSize: 20 },
  resultLabel: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "800" },
  resultValue: { color: colors.ocean, fontSize: 22, fontWeight: "900" },
  resultUnit: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  divider: { height: 1, marginVertical: 3, backgroundColor: "#C9E2DC" },
  loading: { minHeight: 94, alignItems: "center", justifyContent: "center", gap: 8 },
  loadingText: { color: colors.muted, fontSize: 11 },
  pointRule: { color: colors.muted, fontSize: 10, marginVertical: 10 },
  closeButton: { alignSelf: "stretch", borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: colors.coral },
  closeButtonDim: { opacity: .5 },
  closeButtonText: { color: colors.white, fontSize: 15, fontWeight: "900" },
});
