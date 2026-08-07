import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { AnglerArt, FishArt } from "../../src/components/GameArt";
import { Button } from "../../src/components/ui";
import { FISHING_AREAS, FishingArea } from "../../src/constants/areas";
import { CatchSummary, getCatchSummaries, getInventory, getTotalSteps } from "../../src/database/db";
import { getSelectedArea, getUnlockedAreaIds, selectArea, unlockArea } from "../../src/services/areaService";
import { colors } from "../../src/constants/theme";
import { ChapterId } from "../../src/constants/expansionData";
import { FISH, HABITAT_NAMES } from "../../src/constants/game";

const japanMap = require("../../assets/game/japan-prefecture-map.png");
const worldMap = require("../../assets/game/world-chapter-map.png");
const spaceMap = require("../../assets/game/space-chapter-map.png");
const MAP_HEIGHT = 3450;
const NODE_START = 170;
const NODE_GAP = 64;
const NODE_LEFT = [28, 51, 73, 56, 34];

export default function JapanAreaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [catchSummaries, setCatchSummaries] = useState<Map<string, CatchSummary>>(new Map());
  const [unlockedAreaIds, setUnlockedAreaIds] = useState<Set<string>>(new Set());
  const [totalSteps, setTotalSteps] = useState(0);
  const [selected, setSelected] = useState<FishingArea | null>(null);
  const [outfitStage, setOutfitStage] = useState(0);
  const [currentAreaId, setCurrentAreaId] = useState(FISHING_AREAS[0].id);
  const [story, setStory] = useState<ChapterId>("japan");
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlockCelebration, setUnlockCelebration] = useState<FishingArea | null>(null);
  const [unlockAnimation] = useState(() => new Animated.Value(0));

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getTotalSteps(), getInventory(), getSelectedArea(), getUnlockedAreaIds()]).then(([catches, steps, inventory, currentArea, unlockedIds]) => {
      setCaughtIds(new Set(catches.map((row) => row.fish_id)));
      setCatchSummaries(new Map(catches.map((row) => [row.fish_id, row])));
      setUnlockedAreaIds(unlockedIds);
      setTotalSteps(steps);
      const stage = [1, 2, 3, 4].find((level) => ["hat", "top", "bottom", "shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${level}` && row.equipped === 1)));
      setOutfitStage(stage ?? 0);
      setCurrentAreaId(currentArea.id);
      setStory(currentArea.story);
      setSelected(null);
      setSelectedFishId(null);
      setShowUnlockConfirm(false);
    });
  }, []));

  const japanClear = caughtIds.has("jp_okinawa_sss");
  const worldLast = FISHING_AREAS.filter((area) => area.story === "world").at(-1);
  const worldClear = Boolean(worldLast && caughtIds.has(worldLast.bossFishId));
  const chapterOpen = story === "japan" || story === "world" ? story === "japan" || japanClear : worldClear;
  const states = useMemo(() => {
    const chapterAreas = FISHING_AREAS.filter((area) => area.story === story);
    return chapterAreas.map((area, index) => {
      const discovered = area.fishIds.filter((id) => caughtIds.has(id)).length;
      const unlocked = chapterOpen && unlockedAreaIds.has(area.id);
      const previousUnlocked = index === 0
        ? story === "japan" || chapterOpen
        : unlockedAreaIds.has(chapterAreas[index - 1].id);
      return {
        area,
        unlocked,
        canUnlock: chapterOpen && !unlocked && previousUnlocked && totalSteps >= area.requiredSteps,
        bossCaught: caughtIds.has(area.bossFishId),
        completed: discovered === area.fishIds.length,
        discovered,
      };
    });
  }, [caughtIds, totalSteps, story, chapterOpen, unlockedAreaIds]);
  const selectedState = selected ? states.find((state) => state.area.id === selected.id) : undefined;
  const currentIndex = Math.max(0, states.reduce((last, state, index) => state.unlocked ? index : last, 0));
  const nodeTop = useCallback((index: number) => NODE_START + (states.length - 1 - index) * NODE_GAP, [states.length]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated:false }), 80);
    return () => clearTimeout(timer);
  }, [story]);

  const chooseArea = async (state: typeof states[number]) => {
    setSelected(state.area);
    if (!state.unlocked) return;
    await selectArea(state.area);
    setCurrentAreaId(state.area.id);
  };

  const enterArea = async () => {
    if (!selected || !selectedState?.unlocked) return;
    await selectArea(selected);
    setCurrentAreaId(selected.id);
    setSelected(null);
    router.push("/(tabs)/fish");
  };

  const confirmUnlock = async () => {
    if (!selected || !selectedState?.canUnlock) return;
    const nextUnlocked = await unlockArea(selected);
    setUnlockedAreaIds(new Set(nextUnlocked));
    setShowUnlockConfirm(false);
    setUnlockCelebration(selected);
    unlockAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(unlockAnimation, { toValue:1, duration:520, easing:Easing.out(Easing.back(1.5)), useNativeDriver:true }),
      Animated.delay(1100),
      Animated.timing(unlockAnimation, { toValue:0, duration:320, useNativeDriver:true }),
    ]).start(() => setUnlockCelebration(null));
  };

  const selectedFish = selectedFishId ? FISH.find((fish) => fish.id === selectedFishId) : undefined;
  const selectedFishSummary = selectedFishId ? catchSummaries.get(selectedFishId) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        <ImageBackground source={story === "japan" ? japanMap : story === "world" ? worldMap : spaceMap} resizeMode="cover" style={styles.map}>
          {states.slice(0, -1).map((state, index) => {
            const x1 = NODE_LEFT[index % NODE_LEFT.length] / 100 * width;
            const x2 = NODE_LEFT[(index + 1) % NODE_LEFT.length] / 100 * width;
            const y1 = nodeTop(index) + 26;
            const y2 = nodeTop(index + 1) + 26;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            return <View key={`line-${state.area.id}`} style={[styles.route, state.unlocked && styles.routeUnlocked, { left:(x1+x2-length)/2, top:(y1+y2)/2-3, width:length, transform:[{ rotate:`${Math.atan2(dy,dx)*180/Math.PI}deg` }] }]} />;
          })}
          {states.map((state, index) => {
            const left = `${NODE_LEFT[index % NODE_LEFT.length]}%` as `${number}%`;
            return (
              <Pressable key={state.area.id} onPress={() => void chooseArea(state)} style={[styles.node, { left, top:nodeTop(index) }]}>
                <View style={[styles.nodeCircle, state.unlocked && styles.nodeUnlocked, state.bossCaught && styles.nodeBoss, state.completed && styles.nodeComplete]}>
                  <Text style={styles.nodeMark}>{!state.unlocked ? "?" : state.completed ? "★" : state.bossCaught ? "👑" : index + 1}</Text>
                </View>
                <View style={[styles.nodeLabel, state.completed && styles.completeLabel]}>
                  <Text numberOfLines={1} style={styles.nodeName}>{state.unlocked ? state.area.name : "？？？"}</Text>
                  <Text style={styles.nodeStatus}>{state.unlocked ? `${state.discovered}/10` : `${state.area.requiredSteps.toLocaleString()}歩`}</Text>
                  <View style={styles.nodeMarks}><Text style={[styles.nodeMiniMark, state.bossCaught && styles.nodeBossMark]}>♛</Text><Text style={[styles.nodeMiniMark, state.completed && styles.nodeCompleteMark]}>★</Text></View>
                </View>
                {state.area.id === currentAreaId && state.unlocked && <View style={styles.avatar}><AnglerArt stage={outfitStage} height={72} /></View>}
              </Pressable>
            );
          })}
        </ImageBackground>
      </ScrollView>

      <View style={styles.header}>
        <View style={styles.chapterTabs}>
          {(["japan","world","space"] as ChapterId[]).map((id) => {
            const open = id === "japan" || id === "world" ? id === "japan" || japanClear : worldClear;
            return <Pressable key={id} onPress={() => { if (open) { setStory(id); setSelected(null); } }} style={[styles.chapterTab, story === id && styles.activeChapterTab, !open && styles.lockedChapterTab]}><Text style={[styles.chapterTabText, story === id && styles.activeChapterTabText]}>{id === "japan" ? "日本編" : id === "world" ? "世界編" : "宇宙編"}{!open ? " 🔒" : ""}</Text></Pressable>;
          })}
        </View>
        <Text style={styles.title}>{story === "japan" ? "日本全国 Fishing" : story === "world" ? "世界一周 Fishing" : "銀河宇宙 Fishing"}</Text>
        <Text style={styles.sub}>{!chapterOpen ? "前の章の最終ヌシを捕獲すると解放" : `累計 ${totalSteps.toLocaleString()}歩 · 条件達成後にタップして手動解放`}</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width:`${Math.min(100, (currentIndex + 1) / states.length * 100)}%` }]} /></View>
      </View>

      <Modal visible={Boolean(selected)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          {selected && selectedState && <View style={styles.sheet}>
            <Text style={styles.sheetEyebrow}>{selectedState.unlocked ? `AREA ${states.indexOf(selectedState) + 1}/${states.length}` : "LOCKED AREA"}</Text>
            <Text style={styles.sheetName}>{selectedState.unlocked ? selected.name : "？？？"}</Text>
            {!selectedState.unlocked ? (
              <>
                <View style={styles.lockBox}>
                  <Text style={styles.lockTitle}>{selectedState.canUnlock ? "解放条件を達成しました！" : "このエリアは未解放です"}</Text>
                  <Text style={styles.lockText}>{selectedState.canUnlock ? "エリアを手動で解放できます。" : `必要歩数 ${selected.requiredSteps.toLocaleString()}歩。あと ${Math.max(0, selected.requiredSteps-totalSteps).toLocaleString()}歩`}</Text>
                </View>
                {selectedState.canUnlock && <Button title="このエリアを解放する" onPress={() => setShowUnlockConfirm(true)} />}
              </>
            ) : <>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>発見した魚・名産物</Text><Text style={styles.summaryValue}>{selectedState.discovered}/10</Text></View>
              <View style={styles.marks}><Text style={styles.markText}>{selectedState.bossCaught ? "👑 ヌシ捕獲済み" : "ヌシ未捕獲"}</Text><Text style={[styles.markText, selectedState.completed && styles.goldText]}>{selectedState.completed ? "★ 金の完全制覇マーク" : "全10種で金マーク"}</Text></View>
              <View style={styles.fishGrid}>{selected.fishIds.map((fishId) => {
                const caught = caughtIds.has(fishId);
                const fish = FISH.find((entry) => entry.id === fishId);
                return <Pressable key={fishId} disabled={!caught} onPress={() => setSelectedFishId(fishId)} style={[styles.fishCell, caught && styles.caughtFishCell]}><View style={styles.fishArt}>{caught ? <FishArt fishId={fishId} size={50} /> : <Text style={styles.question}>?</Text>}</View><Text numberOfLines={1} style={styles.fishName}>{caught ? fish?.name : "？？？"}</Text><Text style={styles.fishRank}>{fish?.isSpecial ? "収集物" : `${fish?.rank ?? "?"} RANK`}</Text></Pressable>;
              })}</View>
              <Text style={styles.products}>名産物2種：どの餌でも各0.3%</Text>
              <Button title="このエリアで釣る" onPress={enterArea} />
            </>}
            <Button title="閉じる" kind="secondary" onPress={() => setSelected(null)} />
          </View>}
        </View>
      </Modal>

      <Modal visible={Boolean(selectedFish && selectedFishSummary)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedFishId(null)}>
        <View style={styles.detailBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedFishId(null)} />
          {selectedFish && selectedFishSummary && <View style={styles.fishDetailSheet}>
            <Text style={styles.detailEyebrow}>{selectedFish.isSpecial ? "SPECIAL ITEM" : `${selectedFish.rank} RANK`}</Text>
            <View style={styles.detailArt}><FishArt fishId={selectedFish.id} size={210} /></View>
            <Text style={styles.detailName}>{selectedFish.name}</Text>
            <Text style={styles.detailDescription}>{selectedFish.description}</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailStat}><Text style={styles.detailStatLabel}>釣った回数</Text><Text style={styles.detailStatValue}>{selectedFishSummary.count}回</Text></View>
              <View style={styles.detailStat}><Text style={styles.detailStatLabel}>自己ベスト</Text><Text style={styles.detailStatValue}>{selectedFishSummary.max_size.toLocaleString()} cm</Text></View>
              <View style={styles.detailStat}><Text style={styles.detailStatLabel}>生息地</Text><Text style={styles.detailStatValue}>{selectedFish.habitats.map((habitat) => HABITAT_NAMES[habitat]).join("・")}</Text></View>
              <View style={styles.detailStat}><Text style={styles.detailStatLabel}>最終捕獲日</Text><Text style={styles.detailStatValue}>{new Date(selectedFishSummary.last_caught_at).toLocaleDateString("ja-JP")}</Text></View>
            </View>
            <Text style={styles.detailRange}>サイズ範囲：{selectedFish.minCm.toLocaleString()}～{selectedFish.maxCm.toLocaleString()} cm</Text>
            <Button title="閉じる" kind="secondary" onPress={() => setSelectedFishId(null)} />
          </View>}
        </View>
      </Modal>

      <Modal visible={showUnlockConfirm} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowUnlockConfirm(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmIcon}>🔓</Text>
            <Text style={styles.confirmTitle}>エリアを解放しますか？</Text>
            <Text style={styles.confirmArea}>{selected?.name ?? "新しいエリア"}</Text>
            <Text style={styles.confirmText}>解放すると、このエリアへ移動して釣りができるようになります。</Text>
            <View style={styles.confirmActions}><View style={styles.confirmAction}><Button title="いいえ" kind="secondary" onPress={() => setShowUnlockConfirm(false)} /></View><View style={styles.confirmAction}><Button title="はい、解放する" onPress={confirmUnlock} /></View></View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(unlockCelebration)} transparent animationType="none" statusBarTranslucent>
        <View style={styles.unlockBackdrop}>
          <Animated.View style={[styles.unlockCard, { opacity:unlockAnimation, transform:[{ scale:unlockAnimation }] }]}>
            <Text style={styles.unlockLight}>✦　✧　✦</Text>
            <Text style={styles.unlockIcon}>🔓</Text>
            <Text style={styles.unlockTitle}>AREA UNLOCK!</Text>
            <Text style={styles.unlockName}>{unlockCelebration?.name}</Text>
            <Text style={styles.unlockText}>新しい釣り場が解放されました！</Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#0E80B8"},scroll:{flex:1},scrollContent:{paddingTop:0},map:{height:MAP_HEIGHT,width:"100%",overflow:"hidden"},
  header:{position:"absolute",top:10,left:12,right:12,borderRadius:18,padding:12,backgroundColor:"rgba(255,255,255,.95)",elevation:12},title:{color:colors.navy,fontSize:22,fontWeight:"900"},sub:{color:colors.muted,fontSize:10,fontWeight:"700",marginTop:2},progress:{height:6,borderRadius:9,backgroundColor:colors.line,overflow:"hidden",marginTop:8},progressFill:{height:"100%",backgroundColor:colors.coral},
  chapterTabs:{flexDirection:"row",gap:5,marginBottom:7},chapterTab:{flex:1,paddingVertical:6,borderRadius:10,alignItems:"center",backgroundColor:colors.foam},activeChapterTab:{backgroundColor:colors.ocean},lockedChapterTab:{opacity:.55},chapterTabText:{color:colors.navy,fontSize:10,fontWeight:"900"},activeChapterTabText:{color:colors.white},
  route:{position:"absolute",height:6,borderRadius:5,backgroundColor:"rgba(255,255,255,.45)",zIndex:1},routeUnlocked:{backgroundColor:"#FFD55A"},
  node:{position:"absolute",width:112,marginLeft:-56,alignItems:"center",zIndex:3},nodeCircle:{width:48,height:48,borderRadius:24,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(17,50,65,.88)",borderWidth:3,borderColor:"#A6B8BE"},nodeUnlocked:{backgroundColor:"#FFFFFF",borderColor:colors.aqua},nodeBoss:{backgroundColor:"#FFF3C3",borderColor:"#F2B93B"},nodeComplete:{backgroundColor:"#FFE066",borderColor:"#C88B00"},nodeMark:{color:colors.navy,fontSize:18,fontWeight:"900"},nodeLabel:{marginTop:-3,minWidth:88,borderRadius:9,paddingHorizontal:6,paddingVertical:3,backgroundColor:"rgba(4,48,63,.84)"},completeLabel:{backgroundColor:"rgba(132,87,0,.9)"},nodeName:{color:colors.white,fontSize:10,fontWeight:"900",textAlign:"center"},nodeStatus:{color:"#D8F5F2",fontSize:8,fontWeight:"800",textAlign:"center"},nodeMarks:{flexDirection:"row",justifyContent:"center",gap:8,marginTop:1},nodeMiniMark:{color:"#718A91",fontSize:9,fontWeight:"900"},nodeBossMark:{color:"#FFD04E"},nodeCompleteMark:{color:"#FFE866"},avatar:{position:"absolute",left:-45,bottom:-9,width:48,height:72,overflow:"hidden"},
  backdrop:{flex:1,justifyContent:"center",padding:13,backgroundColor:"rgba(1,20,29,.78)"},sheet:{maxHeight:"94%",borderRadius:24,padding:15,gap:9,backgroundColor:colors.white},sheetEyebrow:{color:colors.ocean,fontSize:10,fontWeight:"900",letterSpacing:1},sheetName:{color:colors.navy,fontSize:25,fontWeight:"900"},lockBox:{borderRadius:14,padding:13,backgroundColor:"#EDF2F2"},lockTitle:{color:colors.navy,fontWeight:"900"},lockText:{color:colors.muted,fontSize:11,marginTop:4},summaryRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:10,borderRadius:14,backgroundColor:colors.foam},summaryLabel:{color:colors.ink,fontWeight:"800"},summaryValue:{color:colors.navy,fontSize:21,fontWeight:"900"},marks:{flexDirection:"row",justifyContent:"space-between",gap:6},markText:{color:colors.muted,fontSize:10,fontWeight:"900"},goldText:{color:"#BA7A00",fontSize:11},products:{color:colors.coral,fontSize:10,fontWeight:"900"},fishGrid:{flexDirection:"row",flexWrap:"wrap",gap:5},fishCell:{width:"18.8%",alignItems:"center",padding:3,borderRadius:9,backgroundColor:colors.foam},caughtFishCell:{borderWidth:1,borderColor:colors.aqua,backgroundColor:"#E2F8F5"},fishArt:{width:50,height:50,alignItems:"center",justifyContent:"center"},question:{color:colors.navy,fontSize:31,fontWeight:"900",opacity:.7},fishName:{maxWidth:"100%",color:colors.ink,fontSize:7,fontWeight:"900"},fishRank:{color:colors.muted,fontSize:6,fontWeight:"800"},
  detailBackdrop:{flex:1,justifyContent:"center",padding:18,backgroundColor:"rgba(0,15,23,.88)"},fishDetailSheet:{borderRadius:26,padding:17,gap:10,backgroundColor:colors.white,alignItems:"stretch"},detailEyebrow:{color:colors.ocean,fontSize:12,fontWeight:"900",letterSpacing:1.5,textAlign:"center"},detailArt:{height:220,alignItems:"center",justifyContent:"center",borderRadius:20,backgroundColor:"#E7F8F7",overflow:"hidden"},detailName:{color:colors.navy,fontSize:27,fontWeight:"900",textAlign:"center"},detailDescription:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},detailGrid:{flexDirection:"row",flexWrap:"wrap",gap:7},detailStat:{width:"48.8%",borderRadius:13,padding:10,backgroundColor:colors.foam},detailStatLabel:{color:colors.muted,fontSize:9,fontWeight:"800"},detailStatValue:{color:colors.navy,fontSize:14,fontWeight:"900",marginTop:3},detailRange:{color:colors.ocean,fontSize:11,fontWeight:"900",textAlign:"center"},
  confirmBackdrop:{flex:1,alignItems:"center",justifyContent:"center",padding:22,backgroundColor:"rgba(0,16,24,.84)"},confirmSheet:{width:"100%",borderRadius:26,padding:20,gap:10,backgroundColor:colors.white,alignItems:"center"},confirmIcon:{fontSize:54},confirmTitle:{color:colors.navy,fontSize:23,fontWeight:"900"},confirmArea:{color:colors.coral,fontSize:20,fontWeight:"900"},confirmText:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},confirmActions:{width:"100%",flexDirection:"row",gap:8,marginTop:5},confirmAction:{flex:1},
  unlockBackdrop:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(0,20,31,.9)"},unlockCard:{width:"84%",borderRadius:30,paddingVertical:34,paddingHorizontal:18,alignItems:"center",backgroundColor:"#FFF8D8",borderWidth:4,borderColor:"#FFD34E",shadowColor:"#FFD34E",shadowOpacity:.85,shadowRadius:24,elevation:20},unlockLight:{color:"#EAAE00",fontSize:25,fontWeight:"900"},unlockIcon:{fontSize:68,marginVertical:5},unlockTitle:{color:"#D58C00",fontSize:28,fontWeight:"900",letterSpacing:1},unlockName:{color:colors.navy,fontSize:24,fontWeight:"900",marginTop:7},unlockText:{color:colors.muted,fontSize:12,fontWeight:"800",marginTop:5},
});
