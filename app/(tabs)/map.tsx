import { useCallback, useMemo, useRef, useState } from "react";
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { AnglerArt } from "../../src/components/GameArt";
import { Button } from "../../src/components/ui";
import { FISHING_AREAS, FishingArea } from "../../src/constants/areas";
import { getCatchSummaries, getInventory, getTotalSteps } from "../../src/database/db";
import { getSelectedArea, selectArea } from "../../src/services/areaService";
import { colors } from "../../src/constants/theme";
import { ChapterId } from "../../src/constants/expansionData";

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
  const [totalSteps, setTotalSteps] = useState(0);
  const [selected, setSelected] = useState<FishingArea | null>(null);
  const [outfitStage, setOutfitStage] = useState(0);
  const [currentAreaId, setCurrentAreaId] = useState(FISHING_AREAS[0].id);
  const [story, setStory] = useState<ChapterId>("japan");

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getTotalSteps(), getInventory(), getSelectedArea()]).then(([catches, steps, inventory, currentArea]) => {
      setCaughtIds(new Set(catches.map((row) => row.fish_id)));
      setTotalSteps(steps);
      const stage = [1, 2, 3, 4].find((level) => ["hat", "top", "bottom", "shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${level}` && row.equipped === 1)));
      setOutfitStage(stage ?? 0);
      setCurrentAreaId(currentArea.id);
      setStory(currentArea.story);
      setSelected(null);
    });
  }, []));

  const japanClear = caughtIds.has("jp_okinawa_sss");
  const worldLast = FISHING_AREAS.filter((area) => area.story === "world").at(-1);
  const worldClear = Boolean(worldLast && caughtIds.has(worldLast.bossFishId));
  const chapterOpen = story === "japan" || story === "world" ? story === "japan" || japanClear : worldClear;
  const states = useMemo(() => FISHING_AREAS.filter((area) => area.story === story).map((area) => {
    const discovered = area.fishIds.filter((id) => caughtIds.has(id)).length;
    return {
      area,
      unlocked: chapterOpen && totalSteps >= area.requiredSteps,
      bossCaught: caughtIds.has(area.bossFishId),
      completed: discovered === area.fishIds.length,
      discovered,
    };
  }), [caughtIds, totalSteps, story, chapterOpen]);
  const selectedState = selected ? states.find((state) => state.area.id === selected.id) : undefined;
  const currentIndex = Math.max(0, states.reduce((last, state, index) => state.unlocked ? index : last, 0));

  const enterArea = async () => {
    if (!selected || !selectedState?.unlocked) return;
    await selectArea(selected);
    setCurrentAreaId(selected.id);
    setSelected(null);
    router.push("/(tabs)/fish");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        <ImageBackground source={story === "japan" ? japanMap : story === "world" ? worldMap : spaceMap} resizeMode="cover" style={styles.map}>
          {states.slice(0, -1).map((state, index) => {
            const x1 = NODE_LEFT[index % NODE_LEFT.length] / 100 * width;
            const x2 = NODE_LEFT[(index + 1) % NODE_LEFT.length] / 100 * width;
            const y1 = NODE_START + index * NODE_GAP + 26;
            const y2 = NODE_START + (index + 1) * NODE_GAP + 26;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            return <View key={`line-${state.area.id}`} style={[styles.route, state.unlocked && styles.routeUnlocked, { left:(x1+x2-length)/2, top:(y1+y2)/2-3, width:length, transform:[{ rotate:`${Math.atan2(dy,dx)*180/Math.PI}deg` }] }]} />;
          })}
          {states.map((state, index) => {
            const left = `${NODE_LEFT[index % NODE_LEFT.length]}%` as `${number}%`;
            return (
              <Pressable key={state.area.id} onPress={() => setSelected(state.area)} style={[styles.node, { left, top:NODE_START + index * NODE_GAP }]}>
                <View style={[styles.nodeCircle, state.unlocked && styles.nodeUnlocked, state.bossCaught && styles.nodeBoss, state.completed && styles.nodeComplete]}>
                  <Text style={styles.nodeMark}>{!state.unlocked ? "?" : state.completed ? "★" : state.bossCaught ? "👑" : index + 1}</Text>
                </View>
                <View style={[styles.nodeLabel, state.completed && styles.completeLabel]}>
                  <Text numberOfLines={1} style={styles.nodeName}>{state.unlocked ? state.area.name : "？？？"}</Text>
                  <Text style={styles.nodeStatus}>{state.unlocked ? `${state.discovered}/10` : `${state.area.requiredSteps.toLocaleString()}歩`}</Text>
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
            return <Pressable key={id} onPress={() => { if (open) { setStory(id); setSelected(null); scrollRef.current?.scrollTo({ y:0, animated:true }); } }} style={[styles.chapterTab, story === id && styles.activeChapterTab, !open && styles.lockedChapterTab]}><Text style={[styles.chapterTabText, story === id && styles.activeChapterTabText]}>{id === "japan" ? "日本編" : id === "world" ? "世界編" : "宇宙編"}{!open ? " 🔒" : ""}</Text></Pressable>;
          })}
        </View>
        <Text style={styles.title}>{story === "japan" ? "日本全国 Fishing" : story === "world" ? "世界一周 Fishing" : "銀河宇宙 Fishing"}</Text>
        <Text style={styles.sub}>{!chapterOpen ? "前の章の最終ヌシを捕獲すると解放" : `累計 ${totalSteps.toLocaleString()}歩 · 50,000歩ごとに次のエリアを解放`}</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width:`${Math.min(100, (currentIndex + 1) / states.length * 100)}%` }]} /></View>
      </View>

      <Modal visible={Boolean(selected)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          {selected && selectedState && <View style={styles.sheet}>
            <Text style={styles.sheetEyebrow}>{selectedState.unlocked ? `AREA ${states.indexOf(selectedState) + 1}/${states.length}` : "LOCKED AREA"}</Text>
            <Text style={styles.sheetName}>{selectedState.unlocked ? selected.name : "？？？"}</Text>
            {!selectedState.unlocked ? (
              <View style={styles.lockBox}><Text style={styles.lockTitle}>このエリアは未解放です</Text><Text style={styles.lockText}>累計 {selected.requiredSteps.toLocaleString()}歩で表示されます。あと {Math.max(0, selected.requiredSteps-totalSteps).toLocaleString()}歩</Text></View>
            ) : <>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>発見した魚・名産物</Text><Text style={styles.summaryValue}>{selectedState.discovered}/10</Text></View>
              <View style={styles.marks}><Text style={styles.markText}>{selectedState.bossCaught ? "👑 ヌシ捕獲済み" : "ヌシ未捕獲"}</Text><Text style={[styles.markText, selectedState.completed && styles.goldText]}>{selectedState.completed ? "★ 金の完全制覇マーク" : "全10種で金マーク"}</Text></View>
              <Text style={styles.products}>名産物2種：どの餌でも各0.3%</Text>
              <Button title="このエリアで釣る" onPress={enterArea} />
            </>}
            <Button title="閉じる" kind="secondary" onPress={() => setSelected(null)} />
          </View>}
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
  node:{position:"absolute",width:112,marginLeft:-56,alignItems:"center",zIndex:3},nodeCircle:{width:48,height:48,borderRadius:24,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(17,50,65,.88)",borderWidth:3,borderColor:"#A6B8BE"},nodeUnlocked:{backgroundColor:"#FFFFFF",borderColor:colors.aqua},nodeBoss:{backgroundColor:"#FFF3C3",borderColor:"#F2B93B"},nodeComplete:{backgroundColor:"#FFE066",borderColor:"#C88B00"},nodeMark:{color:colors.navy,fontSize:18,fontWeight:"900"},nodeLabel:{marginTop:-3,minWidth:88,borderRadius:9,paddingHorizontal:6,paddingVertical:3,backgroundColor:"rgba(4,48,63,.84)"},completeLabel:{backgroundColor:"rgba(132,87,0,.9)"},nodeName:{color:colors.white,fontSize:10,fontWeight:"900",textAlign:"center"},nodeStatus:{color:"#D8F5F2",fontSize:8,fontWeight:"800",textAlign:"center"},avatar:{position:"absolute",left:-45,bottom:-9,width:48,height:72,overflow:"hidden"},
  backdrop:{flex:1,justifyContent:"center",padding:18,backgroundColor:"rgba(1,20,29,.78)"},sheet:{borderRadius:24,padding:18,gap:11,backgroundColor:colors.white},sheetEyebrow:{color:colors.ocean,fontSize:10,fontWeight:"900",letterSpacing:1},sheetName:{color:colors.navy,fontSize:28,fontWeight:"900"},lockBox:{borderRadius:14,padding:13,backgroundColor:"#EDF2F2"},lockTitle:{color:colors.navy,fontWeight:"900"},lockText:{color:colors.muted,fontSize:11,marginTop:4},summaryRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:12,borderRadius:14,backgroundColor:colors.foam},summaryLabel:{color:colors.ink,fontWeight:"800"},summaryValue:{color:colors.navy,fontSize:23,fontWeight:"900"},marks:{gap:6},markText:{color:colors.muted,fontSize:12,fontWeight:"900"},goldText:{color:"#BA7A00",fontSize:14},products:{color:colors.coral,fontSize:11,fontWeight:"900"},
});
