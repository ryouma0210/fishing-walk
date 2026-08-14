import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { AnglerArt, GearArt } from "../../src/components/GameArt";
import { GearKind, SHOP } from "../../src/constants/game";
import { CatchSummary, equipItem, equipOutfitSet, getCatchStats, getCatchSummaries, getInventory, getPlayerProgress, getTotalSteps, getWalkPoints, InventoryRow, unequipKind, unequipOutfit } from "../../src/database/db";
import { syncTodaySteps } from "../../src/services/stepService";
import { colors } from "../../src/constants/theme";
import { getDailyMissions } from "../../src/services/dailyService";
import { calculatePlayerProgress, PlayerProgress } from "../../src/constants/player";
import { getSelectedTitle } from "../../src/services/titleService";
import { isTitleUnlocked, TITLE_DEFINITIONS, TitleValues } from "../../src/constants/titles";

type EquipmentStats = { windingPercent:number; windingPerformance:number; resistance:number; size:number; capacity:number };
function equipmentStats(levelBonus:number,outfitStage:number,rodPower:number,reelPower:number,capacity:number): EquipmentStats {
  const windingPerformance=(.25+reelPower*.018+rodPower*.014)/.25*(1+levelBonus)*100;
  return { windingPercent:windingPerformance-100,windingPerformance,resistance:outfitStage*4*.012*100,size:outfitStage*4*.22*100,capacity };
}
function EffectChange({label,before,after,suffix="%"}:{label:string;before:number;after:number;suffix?:string}) {
  const difference=after-before;
  const format=(value:number) => suffix === "匹" ? Math.round(value).toLocaleString() : value.toFixed(1);
  return <View style={styles.effectChange}><Text style={styles.effectChangeLabel}>{label}</Text><Text style={styles.effectValues}>{format(before)}{suffix} → {format(after)}{suffix}</Text><Text style={[styles.effectDelta,difference>0 ? styles.effectUp : difference<0 ? styles.effectDown : styles.effectSame]}>{difference>0 ? `▲ ${format(Math.abs(difference))}${suffix} アップ` : difference<0 ? `▼ ${format(Math.abs(difference))}${suffix} ダウン` : "変更なし"}</Text></View>;
}

export default function MyPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ count: 0, unique_count: 0, largest: 0 });
  const [rows, setRows] = useState<CatchSummary[]>([]);
  const [steps, setSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [points, setPoints] = useState(0);
  const [daily, setDaily] = useState({ completed: 0, total: 3, claimable: 0 });
  const [outfitStage, setOutfitStage] = useState(0);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => calculatePlayerProgress(0));
  const [equipmentModal, setEquipmentModal] = useState<"outfit" | GearKind | null>(null);
  const [selectedTitle, setSelectedTitleState] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchStats(), getCatchSummaries(), syncTodaySteps(), getTotalSteps(), getWalkPoints(), getInventory(), getPlayerProgress(),getSelectedTitle()]).then(async ([catchStats, catches, today, allSteps, wallet, inventory, progression,savedTitle]) => {
      setStats(catchStats);
      setRows(catches);
      setSteps(today.steps);
      setTotalSteps(allSteps);
      setPoints(wallet);
      setInventory(inventory);
      setPlayerProgress(progression);
      setSelectedTitleState(savedTitle);
      setOutfitStage([1, 2, 3, 4].find((level) => ["hat", "top", "bottom", "shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${level}` && row.equipped === 1))) ?? 0);
      const missions = await getDailyMissions();
      setDaily({ completed: missions.filter((mission) => mission.claimed).length, total: missions.length, claimable: missions.filter((mission) => !mission.claimed && mission.current >= mission.target).length });
    });
  }, []));

  const titleValues:TitleValues={steps:totalSteps,catches:stats.count,unique:rows.length,largest:stats.largest,level:playerProgress.level};
  const titles=TITLE_DEFINITIONS.map((title) => ({...title,unlocked:isTitleUnlocked(title,titleValues)}));
  const unlockedTitles = titles.filter((title) => title.unlocked).length;
  const currentTitle = titles.some((title) => title.name === selectedTitle && title.unlocked) ? selectedTitle! : titles.filter((title) => title.unlocked).at(-1)?.name ?? "未獲得";
  const todayEarnedPoints = Math.floor(steps / 100);
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
  const outfitNames = ["普段着", "ライトアングラー", "ウォータープルーフ", "ストームフィッシャー", "海王スタイル"];
  const currentGear = (kind: GearKind) => {
    const id = inventory.find((row) => row.equipped === 1 && SHOP.some((item) => item.id === row.item_id && item.kind === kind))?.item_id;
    return SHOP.find((item) => item.id === id);
  };
  const rodPower=currentGear("rod")?.power ?? 0;
  const reelPower=currentGear("reel")?.power ?? 0;
  const coolerCapacity=currentGear("cooler")?.dailyCapacity ?? 10;
  const currentEquipmentStats=equipmentStats(playerProgress.reelBonusRate,outfitStage,rodPower,reelPower,coolerCapacity);
  const candidateStats=(kind:"outfit"|GearKind,value:number) => equipmentStats(
    playerProgress.reelBonusRate,
    kind === "outfit" ? value : outfitStage,
    kind === "rod" ? value : rodPower,
    kind === "reel" ? value : reelPower,
    kind === "cooler" ? value : coolerCapacity,
  );

  return (
    <Screen>
      <Header title="My Page" sub="歩数・釣果・称号・設定" />
      <Card style={styles.statusCard}>
        <Text style={styles.statusHeading}>PLAYER STATUS</Text>
        <View style={styles.statusRow}><Text style={styles.statusLabel}>称号：</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statusValue, styles.statusTitle]}>{currentTitle}</Text></View>
        <View style={styles.statusRow}><Text style={styles.statusLabel}>所持pt：</Text><Text style={styles.statusValue}>{points.toLocaleString()}pt</Text></View>
        <View style={styles.statusRow}><Text style={styles.statusLabel}>累計歩数：</Text><Text style={styles.statusValue}>{totalSteps.toLocaleString()}歩</Text></View>
        <View style={styles.statusRow}><Text style={styles.statusLabel}>プレイヤーレベル：</Text><Text style={styles.statusValue}>Lv.{playerProgress.level}</Text></View>
        <View style={styles.expBlock}>
          <Text style={styles.expLabel}>{playerProgress.level >= 100 ? "MAX LEVEL" : `次のレベルまで ${Math.max(0, playerProgress.nextLevelExp-playerProgress.currentLevelExp).toLocaleString()} EXP`}</Text>
          <View style={styles.expTrack}><View style={[styles.expFill,{width:`${playerProgress.level >= 100 ? 100 : Math.min(100,playerProgress.currentLevelExp/Math.max(1,playerProgress.nextLevelExp)*100)}%`}]} /></View>
        </View>
        <View style={styles.statusBlank} />
        <View style={[styles.statusRow, styles.todayStatusRow]}><Text style={styles.todayStatusLabel}>本日の歩数：</Text><Text style={styles.todayStatusValue}>{steps.toLocaleString()}歩</Text></View>
        <View style={[styles.statusRow, styles.todayStatusRow]}><Text style={styles.todayStatusLabel}>本日獲得pt：</Text><Text style={styles.todayStatusValue}>{todayEarnedPoints.toLocaleString()}pt</Text></View>
        <View style={styles.statusBlank} />
        <Text style={styles.performanceHeading}>FISHING PERFORMANCE</Text>
        <View style={styles.performanceRow}><Text style={styles.performanceLabel}>総巻き取り(%)</Text><Text style={styles.performanceValue}>+{currentEquipmentStats.windingPercent.toFixed(1)}%</Text></View>
        <View style={styles.performanceRow}><Text style={styles.performanceLabel}>総巻き取り性能</Text><Text style={styles.performanceValue}>{currentEquipmentStats.windingPerformance.toFixed(1)}</Text></View>
        <View style={styles.performanceRow}><Text style={styles.performanceLabel}>魚の抵抗軽減</Text><Text style={styles.performanceValue}>{currentEquipmentStats.resistance.toFixed(1)}%</Text></View>
        <View style={styles.performanceRow}><Text style={styles.performanceLabel}>サイズ補正</Text><Text style={styles.performanceValue}>+{currentEquipmentStats.size.toFixed(0)}%</Text></View>
        <View style={styles.performanceRow}><Text style={styles.performanceLabel}>1日の釣獲上限</Text><Text style={styles.performanceValue}>{currentEquipmentStats.capacity.toLocaleString()}匹</Text></View>
      </Card>

      <Card style={styles.profile}>
        <View style={styles.equipmentBoard}>
          <View style={styles.slotColumn}>
            {[{kind:"outfit" as const,label:"一式"},{kind:"rod" as const,label:"ロッド"},{kind:"reel" as const,label:"リール"},{kind:"cooler" as const,label:"クーラー"}].map(({kind,label}) => {
              const gear = kind === "outfit" ? null : currentGear(kind);
              return <Pressable key={kind} onPress={() => setEquipmentModal(kind)} style={styles.slotButton}>
                {kind === "outfit" ? <AnglerArt stage={outfitStage} height={52} /> : gear ? <GearArt itemId={gear.id} size={43} /> : <Text style={styles.slotIcon}>{kind === "rod" ? "🎣" : kind === "reel" ? "⚙️" : "🧊"}</Text>}
                <Text style={styles.slotLabel}>{label}</Text>
              </Pressable>;
            })}
          </View>
          <View style={styles.outfitStage}>
            <AnglerArt stage={outfitStage} height={245} />
            <Text style={styles.outfitStageName}>{outfitNames[outfitStage]}</Text>
            <Text style={styles.outfitStageHint}>左の装備をタップして変更</Text>
          </View>
        </View>
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

      <Modal visible={equipmentModal !== null} transparent animationType="fade" onRequestClose={() => setEquipmentModal(null)}>
        <View style={styles.modalBackdrop}><View style={styles.equipmentSheet}>
          <Text style={styles.modalEyebrow}>EQUIPMENT</Text>
          <Text style={styles.modalTitle}>{equipmentModal === "outfit" ? "一式を変更" : `${equipmentKinds.find((item) => item.kind === equipmentModal)?.label ?? "装備"}を変更`}</Text>
          <ScrollView contentContainerStyle={styles.modalChoices}>
            {equipmentModal === "outfit" ? <>
              {[0,1,2,3,4].filter((stage) => stage === 0 || ["hat","top","bottom","shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${stage}`))).map((stage) => { const next=candidateStats("outfit",stage); return <Pressable key={stage} onPress={async () => { if (stage === 0) await unequipOutfit(); else await equipOutfitSet(stage); await reloadEquipment(); setEquipmentModal(null); }} style={[styles.modalChoice,outfitStage === stage && styles.activeChoice]}><AnglerArt stage={stage} height={112} /><View style={styles.modalChoiceBody}><Text style={styles.modalChoiceName}>{outfitNames[stage]}</Text><Text style={styles.choiceState}>{outfitStage === stage ? "現在着用中" : "タップして着替える"}</Text><EffectChange label="魚の抵抗軽減" before={currentEquipmentStats.resistance} after={next.resistance} /><EffectChange label="サイズ補正" before={currentEquipmentStats.size} after={next.size} /></View></Pressable>;})}
            </> : equipmentModal ? <>
              {(() => { const kind=equipmentModal; const active=currentGear(kind); return <>
                <Pressable onPress={async () => { await unequipKind(kind); await reloadEquipment(); setEquipmentModal(null); }} style={[styles.modalChoice,!active && styles.activeChoice]}><Text style={styles.modalDefaultIcon}>初期</Text><View style={styles.modalChoiceBody}><Text style={styles.modalChoiceName}>初期装備</Text><Text style={styles.choiceState}>{!active ? "現在装備中" : "タップして戻す"}</Text>{(() => { const next=candidateStats(kind,kind === "cooler" ? 10 : 0); return kind === "cooler" ? <EffectChange label="1日の釣獲上限" before={currentEquipmentStats.capacity} after={next.capacity} suffix="匹" /> : <EffectChange label="総巻き取り性能" before={currentEquipmentStats.windingPerformance} after={next.windingPerformance} />; })()}</View></Pressable>
                {SHOP.filter((item) => item.kind === kind && inventory.some((row) => row.item_id === item.id)).map((item) => { const next=candidateStats(kind,kind === "cooler" ? item.dailyCapacity ?? 10 : item.power); return <Pressable key={item.id} onPress={async () => { await equipItem(item.id,kind); await reloadEquipment(); setEquipmentModal(null); }} style={[styles.modalChoice,active?.id === item.id && styles.activeChoice]}><GearArt itemId={item.id} size={70} /><View style={styles.modalChoiceBody}><Text style={styles.modalChoiceName}>{item.name}</Text><Text style={styles.choiceState}>{active?.id === item.id ? "現在装備中" : "タップして装備"}</Text><Text style={styles.itemEffect}>{item.description}</Text>{kind === "cooler" ? <EffectChange label="1日の釣獲上限" before={currentEquipmentStats.capacity} after={next.capacity} suffix="匹" /> : <EffectChange label="総巻き取り性能" before={currentEquipmentStats.windingPerformance} after={next.windingPerformance} />}</View></Pressable>;})}
              </>; })()}
            </> : null}
          </ScrollView>
          <Button title="閉じる" kind="secondary" onPress={() => setEquipmentModal(null)} />
        </View></View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: { gap:8, padding:17, borderWidth:2, borderColor:colors.aqua, backgroundColor:"#F7FFFF" },
  statusHeading: { color:colors.ocean, fontSize:12, fontWeight:"900", letterSpacing:1.5, marginBottom:3 },
  statusRow: { minHeight:37, flexDirection:"row", alignItems:"center", justifyContent:"space-between", gap:8 },
  statusLabel: { flex:1, color:colors.ink, fontSize:15, fontWeight:"900" },
  statusValue: { maxWidth:"57%", color:colors.navy, fontSize:22, fontWeight:"900", textAlign:"right" },
  statusTitle: { color:colors.coral, fontSize:18 },
  statusBlank: { height:17, marginTop:3, borderTopWidth:1, borderTopColor:colors.line },
  todayStatusRow: { minHeight:43, borderRadius:12, paddingHorizontal:11, backgroundColor:colors.foam },
  todayStatusLabel: { flex:1, color:colors.ocean, fontSize:15, fontWeight:"900" },
  todayStatusValue: { color:colors.coral, fontSize:23, fontWeight:"900", textAlign:"right" },
  performanceHeading:{color:colors.ocean,fontSize:11,fontWeight:"900",letterSpacing:1.2},performanceRow:{minHeight:35,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:10,borderRadius:10,backgroundColor:"#EAF7F5"},performanceLabel:{color:colors.ink,fontSize:12,fontWeight:"800"},performanceValue:{color:colors.navy,fontSize:17,fontWeight:"900"},
  profile: { gap: 12 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: colors.foam, borderWidth: 2, borderColor: colors.aqua },
  avatarText: { fontSize: 35 },
  profileInfo: { flex: 1 },
  playerName: { color: colors.navy, fontSize: 20, fontWeight: "900" },
  titleText: { color: colors.coral, fontSize: 11, fontWeight: "900", marginTop: 4 },
  expBlock: { gap:5, marginTop:5 }, expLabel: { color:colors.muted, fontSize:10, fontWeight:"800" }, expTrack: { height:10, borderRadius:9, overflow:"hidden", backgroundColor:colors.line }, expFill: { height:"100%", borderRadius:9, backgroundColor:colors.gold },
  equipmentBoard:{minHeight:350,flexDirection:"row",gap:10,padding:10,borderRadius:18,overflow:"hidden",backgroundColor:"#17647F",borderWidth:2,borderColor:"#073D50"},
  slotColumn:{width:88,gap:8},
  slotButton:{height:76,alignItems:"center",justifyContent:"center",overflow:"hidden",borderRadius:5,backgroundColor:colors.white,borderWidth:2,borderColor:"rgba(255,255,255,.7)"},
  slotIcon:{fontSize:27},slotLabel:{color:colors.navy,fontSize:11,fontWeight:"900",marginTop:-2},
  outfitStage:{flex:1,alignItems:"center",justifyContent:"center",overflow:"hidden"},
  outfitStageTitle:{position:"absolute",top:120,zIndex:2,color:colors.white,fontSize:28,fontWeight:"900",textShadowColor:"rgba(0,30,45,.8)",textShadowRadius:6},
  outfitStageName:{position:"absolute",bottom:28,color:colors.white,fontSize:15,fontWeight:"900",textShadowColor:"#00384D",textShadowRadius:5},
  outfitStageHint:{position:"absolute",bottom:7,color:"#BFEAF2",fontSize:9,fontWeight:"800"},
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
  modalBackdrop:{flex:1,justifyContent:"center",padding:18,backgroundColor:"rgba(0,19,29,.82)"},
  equipmentSheet:{maxHeight:"86%",gap:10,padding:16,borderRadius:25,backgroundColor:colors.white},
  modalEyebrow:{color:colors.ocean,fontSize:10,fontWeight:"900",letterSpacing:1.5},modalTitle:{color:colors.navy,fontSize:24,fontWeight:"900"},
  modalChoices:{gap:8,paddingVertical:4},modalChoice:{minHeight:88,flexDirection:"row",alignItems:"center",gap:12,padding:9,borderRadius:15,borderWidth:2,borderColor:colors.line,backgroundColor:colors.foam,overflow:"hidden"},
  modalChoiceBody:{flex:1},modalChoiceName:{color:colors.navy,fontSize:15,fontWeight:"900"},modalDefaultIcon:{width:65,height:65,textAlign:"center",textAlignVertical:"center",borderRadius:14,color:colors.ocean,fontSize:15,fontWeight:"900",backgroundColor:colors.white},
  itemEffect:{color:colors.muted,fontSize:9,fontWeight:"700",marginTop:3},effectChange:{marginTop:5,padding:7,borderRadius:9,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line},effectChangeLabel:{color:colors.muted,fontSize:8,fontWeight:"800"},effectValues:{color:colors.navy,fontSize:11,fontWeight:"900",marginTop:2},effectDelta:{fontSize:9,fontWeight:"900",marginTop:2},effectUp:{color:"#169447"},effectDown:{color:"#D94242"},effectSame:{color:colors.muted},
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
