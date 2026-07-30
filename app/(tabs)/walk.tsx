import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { colors } from "../../src/constants/theme";
import { getStepsForMonth, getWalkPoints } from "../../src/database/db";
import { requestHealthAccess, syncHealthMonth } from "../../src/services/healthService";

export default function WalkScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [today, setToday] = useState(0);
  const [days, setDays] = useState<{ day: string; steps: number }[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState("歩数データを確認中");
  const [points, setPoints] = useState(0);

  const loadMonth = useCallback(async () => {
    setDays(await getStepsForMonth(year, month));
    setPoints(await getWalkPoints());
  }, [month, year]);

  const syncSteps = useCallback(async () => {
    setStatus("ヘルスケアの歩数を同期中");
    const result = await syncHealthMonth(year, month);
    setAvailable(result.permission === "granted");
    setStatus(result.status);
    const current = new Date();
    if (year === current.getFullYear() && month === current.getMonth() + 1) setToday(result.today);
    await loadMonth();
  }, [loadMonth, month, year]);

  useFocusEffect(useCallback(() => {
    syncSteps();
  }, [syncSteps]));

  const connectHealth = async () => {
    setStatus("歩数の読み取り権限を確認中");
    try {
      const granted = await requestHealthAccess();
      if (granted) {
        await syncSteps();
        return;
      }
      setAvailable(false);
      setStatus("ヘルスケアを利用できないか、歩数の読み取りが許可されませんでした");
    } catch {
      setAvailable(false);
      setStatus("歩数連携を開始できませんでした。アプリを再起動してお試しください");
    }
  };

  const changeMonth = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };
  const dayCount = new Date(year, month, 0).getDate();
  const values = Array.from({ length: dayCount }, (_, index) => {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
    return { day: index + 1, steps: days.find((entry) => entry.day === key)?.steps ?? 0 };
  });
  const total = values.reduce((sum, item) => sum + item.steps, 0);
  const activeDays = values.filter((item) => item.steps > 0).length;
  const average = activeDays ? Math.round(total / activeDays) : 0;
  const best = values.reduce((highest, item) => item.steps > highest.steps ? item : highest, { day: 0, steps: 0 });
  const max = Math.max(10000, ...values.map((item) => item.steps));
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...values,
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);
  const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  return (
    <Screen>
      <Header title="Walk Report" sub={status} />
      <Card>
        <View style={ui.between}>
          <View>
            <Text style={ui.muted}>今日の歩数</Text>
            <Text style={ui.metric}>{today.toLocaleString()} <Text style={styles.unit}>歩</Text></Text>
          </View>
          <View style={[styles.sensorBadge, { backgroundColor: available ? colors.foam : "#FDECEC" }]}>
            <Text style={{ color: available ? colors.ocean : colors.danger, fontWeight: "800" }}>
              {available ? "センサー接続" : "未接続"}
            </Text>
          </View>
        </View>
        <View style={styles.track}><View style={[styles.progress, { width: `${Math.min(100, today / 100)}%` }]} /></View>
        <Text style={ui.muted}>目標 10,000歩 ・ 達成率 {Math.min(100, Math.round(today / 100))}%</Text>
        {!available && (
          <View style={styles.connect}>
            <Text style={ui.body}>アプリを開く前に歩いた分も、端末のヘルスケアから取得します。</Text>
            <Button title="歩数データを連携" onPress={connectHealth} />
          </View>
        )}
        <View style={styles.pointBox}>
          <Text style={styles.pointLabel}>交換に使える歩数ポイント</Text>
          <Text style={styles.pointValue}>{points.toLocaleString()} pt</Text>
        </View>
      </Card>

      <Card>
        <View style={ui.between}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.monthButton}><Text>‹</Text></Pressable>
          <Text style={ui.h2}>{year}年 {month}月</Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.monthButton}><Text>›</Text></Pressable>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={ui.muted}>合計</Text><Text style={styles.statValue}>{total.toLocaleString()}</Text></View>
          <View style={styles.stat}><Text style={ui.muted}>平均</Text><Text style={styles.statValue}>{average.toLocaleString()}</Text></View>
          <View style={styles.stat}><Text style={ui.muted}>最高</Text><Text style={styles.statValue}>{best.steps.toLocaleString()}</Text></View>
        </View>
        <Text style={styles.sectionLabel}>日別歩数グラフ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
          {values.map((item) => (
            <View key={item.day} style={styles.barCell}>
              <Text style={styles.barValue}>{item.steps >= 1000 ? `${(item.steps / 1000).toFixed(1)}k` : item.steps}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: Math.max(3, 100 * item.steps / max) }]} />
              </View>
              <Text style={styles.label}>{item.day}日</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={ui.muted}>最高記録: {best.day ? `${best.day}日 ${best.steps.toLocaleString()}歩` : "データなし"}</Text>
      </Card>

      <Card>
        <Text style={ui.h2}>{year}年 {month}月 カレンダー</Text>
        <View style={styles.weekHeader}>
          {["日", "月", "火", "水", "木", "金", "土"].map((label, weekday) => (
            <Text key={label} style={[styles.weekLabel, weekday === 0 && styles.sunday, weekday === 6 && styles.saturday]}>{label}</Text>
          ))}
        </View>
        <View style={styles.calendar}>
          {calendarCells.map((item, index) => {
            const weekday = index % 7;
            const isToday = item
              ? `${year}-${month}-${item.day}` === todayKey
              : false;
            return (
              <View key={`${index}-${item?.day ?? "empty"}`} style={[styles.calendarCell, isToday && styles.todayCell]}>
                {item && (
                  <>
                    <Text style={[styles.calendarDay, weekday === 0 && styles.sunday, weekday === 6 && styles.saturday]}>{item.day}</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={styles.calendarSteps}>{item.steps.toLocaleString()}歩</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={ui.h2}>歩数ボーナス</Text>
        <Text style={ui.body}>1,000歩ごとにレア抽選が強化され、釣り場も順番に解放されます。最大8,000歩で海へ到達します。</Text>
        <View style={styles.milestones}>
          {[0, 1500, 4000, 8000].map((step) => (
            <View key={step} style={[styles.milestone, today >= step && styles.reached]}>
              <Text style={styles.milestoneText}>{step.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  unit: { fontSize: 16 },
  sensorBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  track: { height: 10, borderRadius: 8, backgroundColor: colors.line, overflow: "hidden", marginVertical: 8 },
  progress: { height: "100%", backgroundColor: colors.aqua },
  monthButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.foam, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", gap: 8, marginTop: 14 },
  stat: { flex: 1, alignItems: "center", backgroundColor: colors.foam, padding: 9, borderRadius: 12 },
  statValue: { fontWeight: "900", color: colors.navy, fontSize: 15 },
  sectionLabel: { fontSize: 12, fontWeight: "800", color: colors.navy, marginTop: 16 },
  chart: { height: 150, flexDirection: "row", alignItems: "flex-end", gap: 5, paddingTop: 8, paddingRight: 8 },
  barCell: { width: 34, height: 140, alignItems: "center", justifyContent: "flex-end" },
  barValue: { fontSize: 8, color: colors.muted, height: 14 },
  barTrack: { width: 22, height: 102, borderRadius: 5, backgroundColor: colors.foam, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", backgroundColor: colors.aqua, borderRadius: 5 },
  label: { fontSize: 9, color: colors.ink, height: 16, marginTop: 4 },
  weekHeader: { flexDirection: "row", marginTop: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  weekLabel: { width: "14.285%", textAlign: "center", paddingVertical: 7, fontSize: 12, fontWeight: "900", color: colors.ink },
  calendar: { flexDirection: "row", flexWrap: "wrap" },
  calendarCell: { width: "14.285%", minHeight: 58, alignItems: "center", paddingTop: 7, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  todayCell: { backgroundColor: "#FFF3D4", borderRadius: 8 },
  calendarDay: { fontSize: 13, fontWeight: "900", color: colors.ink },
  calendarSteps: { width: "94%", textAlign: "center", marginTop: 6, fontSize: 9, color: colors.muted },
  sunday: { color: "#D64B4B" },
  saturday: { color: "#3478C7" },
  milestones: { flexDirection: "row", gap: 6, marginTop: 12 },
  milestone: { flex: 1, paddingVertical: 7, borderRadius: 9, backgroundColor: colors.line, alignItems: "center" },
  reached: { backgroundColor: colors.gold },
  milestoneText: { fontSize: 11, fontWeight: "800", color: colors.ink },
  pointBox: { marginTop: 12, backgroundColor: colors.navy, borderRadius: 13, padding: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pointLabel: { color: colors.white, fontSize: 12, fontWeight: "700" },
  pointValue: { color: colors.gold, fontSize: 18, fontWeight: "900" },
  connect: { marginTop: 12, gap: 9 },
});
