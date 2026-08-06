import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { AnglerArt, GearArt } from "../../src/components/GameArt";
import { FISHING_AREAS } from "../../src/constants/areas";
import { GearKind, SHOP } from "../../src/constants/game";
import { CatchSummary, equipItem, equipOutfitSet, getCatchStats, getCatchSummaries, getInventory, getPlayerProgress, getWalkPoints, InventoryRow, unequipKind, unequipOutfit } from "../../src/database/db";
import { syncTodaySteps } from "../../src/services/stepService";
import { colors } from "../../src/constants/theme";
import { getDailyMissions } from "../../src/services/dailyService";
import { calculatePlayerProgress, PlayerProgress } from "../../src/constants/player";

export default function MyPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ count: 0, unique_count: 0, largest: 0 });
  const [rows, setRows] = useState<CatchSummary[]>([]);
  const [steps, setSteps] = useState(0);
  const [points, setPoints] = useState(0);
  const [daily, setDaily] = useState({ completed: 0, total: 3, claimable: 0 });
  const [outfitStage, setOutfitStage] = useState(0);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => calculatePlayerProgress(0));

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchStats(), getCatchSummaries(), syncTodaySteps(), getWalkPoints(), getInventory(), getPlayerProgress()]).then(async ([catchStats, catches, today, wallet, inventory, progression]) => {
      setStats(catchStats);
      setRows(catches);
      setSteps(today.steps);
      setPoints(wallet);
      setInventory(inventory);
      setPlayerProgress(progression);
      setOutfitStage([1, 2, 3, 4].find((level) => ["hat", "top", "bottom", "shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${level}` && row.equipped === 1))) ?? 0);
      const missions = await getDailyMissions();
      setDaily({ completed: missions.filter((mission) => mission.claimed).length, total: missions.length, claimable: missions.filter((mission) => !mission.claimed && mission.current >= mission.target).length });
    });
  }, []));

  const titles = [
    { name: "はじめての一歩", unlocked: steps >= 1000 },
    { name: "魚博士", unlocked: rows.length >= 20 },
    { name: "大物ハンター", unlocked: stats.largest >= 100 },
    { name: "全国図鑑マスター", unlocked: rows.length === FISHING_AREAS.flatMap((area) => area.fishIds).length },
  ];
  const unlockedTitles = titles.filter((title) => title.unlocked).length;
  const equipmentKinds: { kind: GearKind; label: string; icon: string }[] = [
    { kind: "rod", label: "ロッド", icon: "🎣" },
    { kind: "reel", label: "リール", icon: "⚙️" },
    { kind: "cooler", label: "クーラー", icon: "🧊" },
  ];
  const reloadEquipment = async () => {
    const next = await getInventory();
    setInventory(next);
    setOutfitStage([1, 2, 3, 4].find((level) => ["hat", "top", "bottom", "shoes"].every((kind) => next.some((row) => row.item_id === `${kind}${level}` && row.equipped === 1))) ?? 0);
  };

  return (
    <Screen>
      <Header title="My Page" sub="歩数・釣果・称号・設定" />
      <Card style={styles.profile}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>🎣</Text></View>
          <View style={styles.profileInfo}>
            <Text style={styles.playerName}>Fishing Walker</Text>
            <Text style={styles.playerLevel}>LEVEL {playerProgress.level}</Text>
            <Text style={ui.muted}>今日 {steps.toLocaleString()}歩 · {points.toLocaleString()}pt</Text>
            <Text style={styles.titleText}>称号 {unlockedTitles}/{titles.length}</Text>
          </View>
        </View>
        <View style={styles.expBlock}>
          <View style={ui.between}><Text style={styles.expLabel}>{playerProgress.level >= 100 ? "MAX LEVEL" : `次のレベルまで ${Math.max(0, playerProgress.nextLevelExp-playerProgress.currentLevelExp).toLocaleString()} EXP`}</Text><Text style={styles.reelBonus}>巻き取り +{(playerProgress.reelBonusRate*100).toFixed(1)}%</Text></View>
          <View style={styles.expTrack}><View style={[styles.expFill,{width:`${playerProgress.level >= 100 ? 100 : Math.min(100,playerProgress.currentLevelExp/Math.max(1,playerProgress.nextLevelExp)*100)}%`}]} /></View>
        </View>
        <View style={styles.currentOutfit}><AnglerArt stage={outfitStage} height={170} /><View style={styles.outfitCopy}><Text style={styles.outfitLabel}>現在の衣装</Text><Text style={styles.outfitName}>{["普段着","ライトアングラー","ウォータープルーフ","ストームフィッシャー","海王スタイル"][outfitStage]}</Text><Text style={ui.muted}>エリア移動時もこの衣装で表示されます</Text></View></View>
      </Card>

      <Card>
        <Text style={ui.h2}>装備変更</Text>
        <Text style={ui.body}>交換済みの一式・ロッド・リール・クーラーを選んで変更できます。</Text>

        <Text style={styles.gearHeading}>一式</Text>
        <View style={styles.choiceGrid}>
          <Pressable onPress={async () => { await unequipOutfit(); await reloadEquipment(); }} style={[styles.choice, outfitStage === 0 && styles.activeChoice]}>
            <AnglerArt stage={0} height={96} /><Text style={styles.choiceName}>普段着</Text><Text style={styles.choiceState}>{outfitStage === 0 ? "着用中" : "着替える"}</Text>
          </Pressable>
          {[1, 2, 3, 4].filter((stage) => ["hat", "top", "bottom", "shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${stage}`))).map((stage) => (
            <Pressable key={stage} onPress={async () => { await equipOutfitSet(stage); await reloadEquipment(); }} style={[styles.choice, outfitStage === stage && styles.activeChoice]}>
              <AnglerArt stage={stage} height={96} /><Text numberOfLines={1} style={styles.choiceName}>{["ライトアングラー", "ウォータープルーフ", "ストームフィッシャー", "海王スタイル"][stage - 1]}</Text><Text style={styles.choiceState}>{outfitStage === stage ? "着用中" : "着替える"}</Text>
            </Pressable>
          ))}
        </View>

        {equipmentKinds.map(({ kind, label, icon }) => {
          const ownedItems = SHOP.filter((item) => item.kind === kind && inventory.some((row) => row.item_id === item.id));
          const activeId = inventory.find((row) => row.equipped === 1 && SHOP.some((item) => item.id === row.item_id && item.kind === kind))?.item_id;
          return <View key={kind} style={styles.gearSection}>
            <Text style={styles.gearHeading}>{icon} {label}</Text>
            <View style={styles.gearChoices}>
              <View style={styles.defaultGear}><Text style={styles.defaultGearName}>初期装備</Text><Button title={!activeId ? "装備中" : "戻す"} disabled={!activeId} kind="secondary" onPress={async () => { await unequipKind(kind); await reloadEquipment(); }} /></View>
              {ownedItems.map((item) => {
                const active = activeId === item.id;
                return <View key={item.id} style={[styles.gearChoice, active && styles.activeChoice]}><GearArt itemId={item.id} size={55} /><Text numberOfLines={1} style={styles.gearChoiceName}>{item.name}</Text><Button title={active ? "装備中" : "装備"} disabled={active} kind="secondary" onPress={async () => { await equipItem(item.id, kind); await reloadEquipment(); }} /></View>;
              })}
            </View>
          </View>;
        })}
      </Card>

      <Card>
        <Text style={ui.h2}>釣り記録</Text>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statLabel}>総釣果</Text><Text style={styles.statValue}>{stats.count.toLocaleString()}匹</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>発見率</Text><Text style={styles.statValue}>{Math.round(rows.filter((row) => row.fish_id.startsWith("jp_")).length / 1470 * 100)}%</Text></View>
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
        <Pressable onPress={() => router.push("/boss-dex")} style={styles.menuItem}>
          <View style={styles.menuIcon}><Text style={styles.menuEmoji}>👑</Text></View>
          <View style={styles.menuBody}><Text style={styles.menuTitle}>ヌシ図鑑</Text><Text style={styles.menuSub}>全身イラスト・捕獲日・最大捕獲サイズ</Text></View>
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
  profile: { gap: 12 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: colors.foam, borderWidth: 2, borderColor: colors.aqua },
  avatarText: { fontSize: 35 },
  profileInfo: { flex: 1 },
  playerName: { color: colors.navy, fontSize: 20, fontWeight: "900" },
  playerLevel: { alignSelf:"flex-start", color:colors.white, fontSize:11, fontWeight:"900", marginVertical:3, paddingHorizontal:9, paddingVertical:3, borderRadius:99, backgroundColor:colors.ocean },
  titleText: { color: colors.coral, fontSize: 11, fontWeight: "900", marginTop: 4 },
  expBlock: { gap:5 }, expLabel: { color:colors.muted, fontSize:9, fontWeight:"800" }, reelBonus: { color:colors.coral, fontSize:10, fontWeight:"900" }, expTrack: { height:9, borderRadius:9, overflow:"hidden", backgroundColor:colors.line }, expFill: { height:"100%", borderRadius:9, backgroundColor:colors.gold },
  currentOutfit: { flexDirection: "row", alignItems: "center", minHeight: 170, borderRadius: 17, overflow: "hidden", backgroundColor: colors.foam },
  outfitCopy: { flex: 1, paddingRight: 12 },
  outfitLabel: { color: colors.ocean, fontSize: 10, fontWeight: "900" },
  outfitName: { color: colors.navy, fontSize: 17, fontWeight: "900", marginVertical: 4 },
  gearHeading: { color: colors.navy, fontSize: 15, fontWeight: "900", marginTop: 15, marginBottom: 7 },
  choiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { width: "48.5%", minHeight: 140, alignItems: "center", justifyContent: "flex-end", padding: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.foam, overflow: "hidden" },
  activeChoice: { borderWidth: 2, borderColor: colors.coral, backgroundColor: "#FFF5F1" },
  choiceName: { color: colors.ink, fontSize: 11, fontWeight: "900", maxWidth: "100%" },
  choiceState: { color: colors.ocean, fontSize: 9, fontWeight: "900", marginTop: 2 },
  gearSection: { gap: 4 },
  gearChoices: { gap: 7 },
  defaultGear: { flexDirection: "row", alignItems: "center", gap: 9, padding: 9, borderRadius: 13, backgroundColor: colors.foam },
  defaultGearName: { flex: 1, color: colors.ink, fontWeight: "900" },
  gearChoice: { flexDirection: "row", alignItems: "center", gap: 9, padding: 8, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  gearChoiceName: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: "900" },
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
