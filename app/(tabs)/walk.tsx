import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Card, Header, Screen, ui } from "../../src/components/ui";
import { FISH } from "../../src/constants/game";
import { CatchSummary, getCatchStats, getCatchSummaries, getWalkPoints } from "../../src/database/db";
import { syncTodaySteps } from "../../src/services/stepService";
import { colors } from "../../src/constants/theme";
import { getDailyMissions } from "../../src/services/dailyService";

export default function MyPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ count: 0, unique_count: 0, largest: 0 });
  const [rows, setRows] = useState<CatchSummary[]>([]);
  const [steps, setSteps] = useState(0);
  const [points, setPoints] = useState(0);
  const [daily, setDaily] = useState({ completed: 0, total: 3, claimable: 0 });

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchStats(), getCatchSummaries(), syncTodaySteps(), getWalkPoints()]).then(async ([catchStats, catches, today, wallet]) => {
      setStats(catchStats);
      setRows(catches);
      setSteps(today.steps);
      setPoints(wallet);
      const missions = await getDailyMissions();
      setDaily({ completed: missions.filter((mission) => mission.claimed).length, total: missions.length, claimable: missions.filter((mission) => !mission.claimed && mission.current >= mission.target).length });
    });
  }, []));

  const titles = [
    { name: "はじめての一歩", unlocked: steps >= 1000 },
    { name: "魚博士", unlocked: rows.length >= 20 },
    { name: "大物ハンター", unlocked: stats.largest >= 100 },
    { name: "水族館マスター", unlocked: rows.length === FISH.length },
  ];
  const unlockedTitles = titles.filter((title) => title.unlocked).length;

  return (
    <Screen>
      <Header title="My Page" sub="歩数・釣果・称号・設定" />
      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>🎣</Text></View>
        <View style={styles.profileInfo}>
          <Text style={styles.playerName}>Fishing Walker</Text>
          <Text style={ui.muted}>今日 {steps.toLocaleString()}歩 · {points.toLocaleString()}pt</Text>
          <Text style={styles.titleText}>称号 {unlockedTitles}/{titles.length}</Text>
        </View>
      </Card>

      <Card>
        <Text style={ui.h2}>釣り記録</Text>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statLabel}>総釣果</Text><Text style={styles.statValue}>{stats.count.toLocaleString()}匹</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>発見率</Text><Text style={styles.statValue}>{Math.round(rows.length / FISH.length * 100)}%</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>最大サイズ</Text><Text style={styles.statValue}>{stats.largest.toLocaleString()}cm</Text></View>
        </View>
      </Card>

      <View style={styles.menu}>
        <Pressable onPress={() => router.push("/walk-report")} style={styles.menuItem}>
          <View style={styles.menuIcon}><Text style={styles.menuEmoji}>👣</Text></View>
          <View style={styles.menuBody}><Text style={styles.menuTitle}>歩数</Text><Text style={styles.menuSub}>グラフ・カレンダー・再同期</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/daily")} style={[styles.menuItem, daily.claimable > 0 && styles.dailyReady]}>
          <View style={styles.menuIcon}><Text style={styles.menuEmoji}>🎁</Text></View>
          <View style={styles.menuBody}><Text style={styles.menuTitle}>デイリー</Text><Text style={styles.menuSub}>{daily.claimable > 0 ? `${daily.claimable}個の報酬を受け取れます` : `${daily.completed}/${daily.total} 報酬受取済み`}</Text></View>
          {daily.claimable > 0 && <View style={styles.newBadge}><Text style={styles.newBadgeText}>GET</Text></View>}
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/titles")} style={styles.menuItem}>
          <View style={styles.menuIcon}><Text style={styles.menuEmoji}>🏅</Text></View>
          <View style={styles.menuBody}><Text style={styles.menuTitle}>称号</Text><Text style={styles.menuSub}>{unlockedTitles}個の称号を獲得</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/manual")} style={styles.menuItem}>
          <View style={styles.menuIcon}><Text style={styles.menuEmoji}>📖</Text></View>
          <View style={styles.menuBody}><Text style={styles.menuTitle}>図解マニュアル</Text><Text style={styles.menuSub}>エリア・釣り・ヌシ戦の遊び方</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings")} style={styles.menuItem}>
          <View style={styles.menuIcon}><Text style={styles.menuEmoji}>⚙️</Text></View>
          <View style={styles.menuBody}><Text style={styles.menuTitle}>設定</Text><Text style={styles.menuSub}>音・振動・歩数連携・データ管理</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: colors.foam, borderWidth: 2, borderColor: colors.aqua },
  avatarText: { fontSize: 35 },
  profileInfo: { flex: 1 },
  playerName: { color: colors.navy, fontSize: 20, fontWeight: "900" },
  titleText: { color: colors.coral, fontSize: 11, fontWeight: "900", marginTop: 4 },
  stats: { flexDirection: "row", gap: 7, marginTop: 12 },
  stat: { flex: 1, minHeight: 75, alignItems: "center", justifyContent: "center", padding: 7, borderRadius: 13, backgroundColor: colors.foam },
  statLabel: { color: colors.muted, fontSize: 10, textAlign: "center" },
  statValue: { color: colors.navy, fontSize: 16, fontWeight: "900", textAlign: "center", marginTop: 4 },
  menu: { gap: 9 },
  menuItem: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  dailyReady: { borderColor: colors.gold, backgroundColor: "#FFF9E5" },
  newBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: colors.coral },
  newBadgeText: { color: colors.white, fontSize: 8, fontWeight: "900" },
  menuIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.foam },
  menuEmoji: { fontSize: 25 },
  menuBody: { flex: 1 },
  menuTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  menuSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  chevron: { color: colors.ocean, fontSize: 30, fontWeight: "400" },
});
