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
const AREAS_PER_SECTION = 4;
const PAGE_NODES = [
  {x:20,y:.763},{x:19,y:.590},{x:65,y:.503},{x:76,y:.419},
];
const JAPAN_PREFECTURE_POSITIONS: Record<string,{x:number;y:number}> = {
  hokkaido:{x:76,y:.14},aomori:{x:72,y:.255},iwate:{x:77,y:.29},miyagi:{x:78,y:.325},akita:{x:68,y:.29},yamagata:{x:69,y:.33},fukushima:{x:72,y:.36},
  ibaraki:{x:79,y:.40},tochigi:{x:74,y:.38},gunma:{x:69,y:.385},saitama:{x:73,y:.405},chiba:{x:80,y:.435},tokyo:{x:74,y:.425},kanagawa:{x:72,y:.45},
  niigata:{x:65,y:.35},toyama:{x:59,y:.405},ishikawa:{x:55,y:.40},fukui:{x:52,y:.44},yamanashi:{x:67,y:.435},nagano:{x:63,y:.40},gifu:{x:59,y:.445},shizuoka:{x:66,y:.475},aichi:{x:60,y:.48},
  mie:{x:57,y:.505},shiga:{x:53,y:.47},kyoto:{x:49,y:.47},osaka:{x:49,y:.505},hyogo:{x:44,y:.49},nara:{x:53,y:.505},wakayama:{x:51,y:.535},
  tottori:{x:39,y:.48},shimane:{x:34,y:.50},okayama:{x:40,y:.52},hiroshima:{x:34,y:.54},yamaguchi:{x:28,y:.56},tokushima:{x:43,y:.57},kagawa:{x:42,y:.54},ehime:{x:37,y:.57},kochi:{x:39,y:.605},
  fukuoka:{x:24,y:.59},saga:{x:20,y:.615},nagasaki:{x:15,y:.635},kumamoto:{x:22,y:.655},oita:{x:28,y:.62},miyazaki:{x:27,y:.685},kagoshima:{x:22,y:.725},okinawa:{x:39,y:.885},
};

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
  const [areaPage, setAreaPage] = useState(0);
  const [mapZoomed, setMapZoomed] = useState(false);
  const [focusAreaId, setFocusAreaId] = useState(FISHING_AREAS[0].id);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlockCelebration, setUnlockCelebration] = useState<FishingArea | null>(null);
  const [unlockAnimation] = useState(() => new Animated.Value(0));
  const [unlockBurst] = useState(() => new Animated.Value(0));
  const [unlockSpin] = useState(() => new Animated.Value(0));
  const [readyPulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(readyPulse, { toValue:1, duration:700, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      Animated.timing(readyPulse, { toValue:0, duration:700, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [readyPulse]);

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getTotalSteps(), getInventory(), getSelectedArea(), getUnlockedAreaIds()]).then(([catches, steps, inventory, currentArea, unlockedIds]) => {
      setCaughtIds(new Set(catches.map((row) => row.fish_id)));
      setCatchSummaries(new Map(catches.map((row) => [row.fish_id, row])));
      setUnlockedAreaIds(unlockedIds);
      setTotalSteps(steps);
      const stage = [1, 2, 3, 4].find((level) => ["hat", "top", "bottom", "shoes"].every((kind) => inventory.some((row) => row.item_id === `${kind}${level}` && row.equipped === 1)));
      setOutfitStage(stage ?? 0);
      setCurrentAreaId(currentArea.id);
      setFocusAreaId(currentArea.id);
      setStory(currentArea.story);
      const storyAreas = FISHING_AREAS.filter((area) => area.story === currentArea.story);
      setAreaPage(Math.floor(Math.max(0,storyAreas.findIndex((area) => area.id === currentArea.id)) / AREAS_PER_SECTION));
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
  const sectionCount = Math.ceil(states.length / AREAS_PER_SECTION);
  const mapHeight = width * 1.5;
  const chapterMap = story === "japan" ? japanMap : story === "world" ? worldMap : spaceMap;
  const pageStart = areaPage * AREAS_PER_SECTION;
  const visibleStates = states.slice(pageStart,pageStart + AREAS_PER_SECTION);
  const areaPosition = useCallback((index: number) => {
    if (story === "japan") {
      const slug = states[index]?.area.id.replace(/^jp_/,"");
      const position = JAPAN_PREFECTURE_POSITIONS[slug];
      if (position) return { x:position.x / 100, y:position.y };
    }
    const local = index % AREAS_PER_SECTION;
    return { x:PAGE_NODES[local].x / 100, y:PAGE_NODES[local].y };
  }, [states, story]);
  const zoomScale = mapZoomed ? 1.9 : 1;
  const displayWidth = width * zoomScale;
  const displayHeight = mapHeight * zoomScale;
  const focusIndex = Math.max(pageStart,states.findIndex((state) => state.area.id === focusAreaId));
  const focusPosition = areaPosition(focusIndex);
  const mapLeft = mapZoomed ? width / 2 - focusPosition.x * displayWidth : 0;
  const mapTop = mapZoomed ? mapHeight / 2 - focusPosition.y * displayHeight : 0;
  const nodePoint = useCallback((index: number) => {
    const position = areaPosition(index);
    return { left:position.x * displayWidth, top:position.y * displayHeight };
  }, [areaPosition, displayHeight, displayWidth]);
  const zoomToCurrentArea = () => {
    const index = states.findIndex((state) => state.area.id === currentAreaId);
    if (index >= 0) setAreaPage(Math.floor(index / AREAS_PER_SECTION));
    setFocusAreaId(currentAreaId);
    setMapZoomed(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ y:0, animated:false }), 80);
    return () => clearTimeout(timer);
  }, [story]);

  const chooseArea = async (state: typeof states[number]) => {
    setSelected(state.area);
    setFocusAreaId(state.area.id);
    setMapZoomed(true);
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
    unlockBurst.setValue(0);
    unlockSpin.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(unlockAnimation, { toValue:1, speed:10, bounciness:18, useNativeDriver:true }),
        Animated.timing(unlockBurst, { toValue:1, duration:1250, easing:Easing.out(Easing.cubic), useNativeDriver:true }),
        Animated.timing(unlockSpin, { toValue:1, duration:1500, easing:Easing.out(Easing.cubic), useNativeDriver:true }),
      ]),
      Animated.delay(1600),
      Animated.timing(unlockAnimation, { toValue:0, duration:450, useNativeDriver:true }),
    ]).start(() => setUnlockCelebration(null));
  };

  const selectedFish = selectedFishId ? FISH.find((fish) => fish.id === selectedFishId) : undefined;
  const selectedFishSummary = selectedFishId ? catchSummaries.get(selectedFishId) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        <View style={[styles.mapViewport,{height:mapHeight}]}>
        <ImageBackground source={chapterMap} resizeMode="contain" style={[styles.map,{width:displayWidth,height:displayHeight,left:mapLeft,top:mapTop}]}>
          <View style={styles.sectionShade} />
          {visibleStates.slice(0, -1).map((state, localIndex) => {
            const first = nodePoint(pageStart + localIndex);
            const second = nodePoint(pageStart + localIndex + 1);
            const x1 = first.left;
            const x2 = second.left;
            const y1 = first.top + 26;
            const y2 = second.top + 26;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            return <View key={`line-${state.area.id}`} style={[styles.route, state.unlocked && styles.routeUnlocked, { left:(x1+x2-length)/2, top:(y1+y2)/2-3, width:length, transform:[{ rotate:`${Math.atan2(dy,dx)*180/Math.PI}deg` }] }]} />;
          })}
          {visibleStates.map((state, localIndex) => {
            const index = pageStart + localIndex;
            const point = nodePoint(index);
            const normalizedPoint = areaPosition(index);
            const labelShift = story === "japan" ? (normalizedPoint.x < .32 ? 48 : normalizedPoint.x > .68 ? -48 : localIndex % 2 ? 42 : -42) : 0;
            return (
              <Pressable key={state.area.id} onPress={() => void chooseArea(state)} style={[styles.node, { left:point.left, top:point.top }]}>
                <Animated.View style={[styles.nodeCircle, state.unlocked && styles.nodeUnlocked, state.canUnlock && styles.nodeCanUnlock, state.bossCaught && styles.nodeBoss, state.completed && styles.nodeComplete, state.canUnlock && { transform:[{ scale:readyPulse.interpolate({ inputRange:[0,1], outputRange:[1,1.13] }) }] }]}>
                  <Text style={styles.nodeMark}>{state.canUnlock ? "🔓" : !state.unlocked ? "?" : state.completed ? "★" : state.bossCaught ? "👑" : index + 1}</Text>
                </Animated.View>
                {(mapZoomed || state.area.id === currentAreaId || state.canUnlock) && <View style={[styles.nodeLabel, {transform:[{translateX:labelShift}]}, state.canUnlock && styles.canUnlockLabel, state.completed && styles.completeLabel]}>
                  <Text numberOfLines={1} style={[styles.nodeName, state.canUnlock && styles.canUnlockName]}>{state.unlocked ? state.area.name : state.canUnlock ? "解放可能" : "？？？"}</Text>
                  <Text style={[styles.nodeStatus, state.canUnlock && styles.canUnlockStatus]}>{state.unlocked ? `${state.discovered}/10` : state.canUnlock ? "タップして解放" : `${state.area.requiredSteps.toLocaleString()}歩`}</Text>
                  <View style={styles.nodeMarks}><Text style={[styles.nodeMiniMark, state.bossCaught && styles.nodeBossMark]}>♛</Text><Text style={[styles.nodeMiniMark, state.completed && styles.nodeCompleteMark]}>★</Text></View>
                </View>}
                {state.area.id === currentAreaId && state.unlocked && <View style={styles.avatar}><AnglerArt stage={outfitStage} height={72} /></View>}
              </Pressable>
            );
          })}
        </ImageBackground>
          <View style={styles.zoomControls}>
            <Pressable onPress={() => setMapZoomed(false)} style={[styles.zoomButton,!mapZoomed && styles.zoomButtonActive]}><Text style={[styles.zoomButtonText,!mapZoomed && styles.zoomButtonTextActive]}>全体表示</Text></Pressable>
            <Pressable onPress={zoomToCurrentArea} style={[styles.zoomButton,mapZoomed && styles.zoomButtonActive]}><Text style={[styles.zoomButtonText,mapZoomed && styles.zoomButtonTextActive]}>現在地を拡大</Text></Pressable>
          </View>
          <View style={styles.pageNav}>
            <Pressable disabled={areaPage === 0} onPress={() => { setMapZoomed(false); setAreaPage((page) => Math.max(0,page-1)); }} style={[styles.pageButton,areaPage === 0 && styles.pageButtonDisabled]}><Text style={styles.pageButtonText}>‹ 前へ</Text></Pressable>
            <View style={styles.pageCount}><Text style={styles.pageCountText}>{areaPage+1} / {sectionCount}</Text><Text style={styles.pageRangeText}>AREA {pageStart+1}–{Math.min(states.length,pageStart+AREAS_PER_SECTION)}</Text></View>
            <Pressable disabled={areaPage >= sectionCount-1} onPress={() => { setMapZoomed(false); setAreaPage((page) => Math.min(sectionCount-1,page+1)); }} style={[styles.pageButton,areaPage >= sectionCount-1 && styles.pageButtonDisabled]}><Text style={styles.pageButtonText}>次へ ›</Text></Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.header}>
        <View style={styles.chapterTabs}>
          {(["japan","world","space"] as ChapterId[]).map((id) => {
            const open = id === "japan" || id === "world" ? id === "japan" || japanClear : worldClear;
            return <Pressable key={id} onPress={() => { if (open) { setStory(id); setAreaPage(0); setMapZoomed(false); setSelected(null); } }} style={[styles.chapterTab, story === id && styles.activeChapterTab, !open && styles.lockedChapterTab]}><Text style={[styles.chapterTabText, story === id && styles.activeChapterTabText]}>{id === "japan" ? "日本編" : id === "world" ? "世界編" : "宇宙編"}{!open ? " 🔒" : ""}</Text></Pressable>;
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
            <Text style={styles.sheetEyebrow}>{selectedState.unlocked ? `AREA ${states.indexOf(selectedState) + 1}/${states.length}` : selectedState.canUnlock ? "UNLOCK READY" : "LOCKED AREA"}</Text>
            <Text style={[styles.sheetName, selectedState.canUnlock && styles.readySheetName]}>{selectedState.unlocked ? selected.name : selectedState.canUnlock ? "解放可能" : "？？？"}</Text>
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
          <Animated.View style={[styles.unlockFlash, { opacity:unlockBurst.interpolate({ inputRange:[0,.12,.42,1], outputRange:[0,1,.15,0] }) }]} />
          <Animated.View style={[styles.unlockRing, { opacity:unlockBurst.interpolate({ inputRange:[0,.2,.8,1], outputRange:[0,1,.35,0] }), transform:[{ scale:unlockBurst.interpolate({ inputRange:[0,1], outputRange:[.15,3.8] }) }] }]} />
          <Animated.View style={[styles.unlockRing, styles.unlockRingSecond, { opacity:unlockBurst.interpolate({ inputRange:[0,.3,.9,1], outputRange:[0,1,.25,0] }), transform:[{ scale:unlockBurst.interpolate({ inputRange:[0,1], outputRange:[.1,2.7] }) }] }]} />
          <Animated.View style={[styles.unlockStarOrbit, { transform:[{ rotate:unlockSpin.interpolate({ inputRange:[0,1], outputRange:["0deg","540deg"] }) }, { scale:unlockAnimation }] }]}><Text style={styles.unlockStarOrbitText}>✦　✧　★　✦　✧　★</Text></Animated.View>
          {Array.from({ length:14 }, (_, index) => {
            const angle = index / 14 * Math.PI * 2;
            const distance = 125 + index % 3 * 20;
            return <Animated.Text key={index} style={[styles.unlockParticle, { opacity:unlockBurst.interpolate({ inputRange:[0,.12,.75,1], outputRange:[0,1,1,0] }), transform:[{ translateX:unlockBurst.interpolate({ inputRange:[0,1], outputRange:[0,Math.cos(angle)*distance] }) }, { translateY:unlockBurst.interpolate({ inputRange:[0,1], outputRange:[0,Math.sin(angle)*distance] }) }, { rotate:`${index*31}deg` }, { scale:unlockBurst.interpolate({ inputRange:[0,.3,1], outputRange:[.2,1.5,.6] }) }] }]}>{index % 3 === 0 ? "★" : index % 3 === 1 ? "✦" : "◆"}</Animated.Text>;
          })}
          <Animated.View style={[styles.unlockCard, { opacity:unlockAnimation, transform:[{ scale:unlockAnimation }] }]}>
            <Text style={styles.unlockLight}>★ ✦ CONGRATULATIONS ✦ ★</Text>
            <Text style={styles.unlockCrown}>👑</Text>
            <Text style={styles.unlockIcon}>🔓✨</Text>
            <Text style={styles.unlockTitle}>AREA UNLOCK!</Text>
            <Text style={styles.unlockName}>{unlockCelebration?.name}</Text>
            <View style={styles.unlockDivider} />
            <Text style={styles.unlockText}>新しい釣り場が解放されました！</Text>
            <Text style={styles.unlockSubText}>新たな魚とヌシがあなたを待っています</Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#0E80B8"},scroll:{flex:1},scrollContent:{paddingTop:145},mapViewport:{width:"100%",overflow:"hidden",backgroundColor:"#087EAC"},map:{position:"absolute",overflow:"hidden",backgroundColor:"#087EAC"},sectionShade:{position:"absolute",top:0,right:0,bottom:0,left:0,backgroundColor:"rgba(0,42,62,.08)"},zoomControls:{position:"absolute",top:10,right:10,zIndex:20,flexDirection:"row",gap:6},zoomButton:{paddingHorizontal:10,paddingVertical:8,borderRadius:99,backgroundColor:"rgba(255,255,255,.9)",borderWidth:2,borderColor:colors.white},zoomButtonActive:{backgroundColor:colors.ocean,borderColor:"#9EEBE5"},zoomButtonText:{color:colors.navy,fontSize:9,fontWeight:"900"},zoomButtonTextActive:{color:colors.white},pageNav:{position:"absolute",zIndex:20,left:14,right:14,bottom:14,height:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},pageButton:{minWidth:84,height:43,borderRadius:99,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(5,65,81,.92)",borderWidth:2,borderColor:"rgba(255,255,255,.85)"},pageButtonDisabled:{opacity:.35},pageButtonText:{color:colors.white,fontSize:12,fontWeight:"900"},pageCount:{minWidth:92,alignItems:"center",paddingVertical:5,paddingHorizontal:10,borderRadius:12,backgroundColor:"rgba(255,255,255,.92)"},pageCountText:{color:colors.navy,fontSize:13,fontWeight:"900"},pageRangeText:{color:colors.muted,fontSize:8,fontWeight:"900"},
  header:{position:"absolute",top:10,left:12,right:12,borderRadius:18,padding:12,backgroundColor:"rgba(255,255,255,.95)",elevation:12},title:{color:colors.navy,fontSize:22,fontWeight:"900"},sub:{color:colors.muted,fontSize:10,fontWeight:"700",marginTop:2},progress:{height:6,borderRadius:9,backgroundColor:colors.line,overflow:"hidden",marginTop:8},progressFill:{height:"100%",backgroundColor:colors.coral},
  chapterTabs:{flexDirection:"row",gap:5,marginBottom:7},chapterTab:{flex:1,paddingVertical:6,borderRadius:10,alignItems:"center",backgroundColor:colors.foam},activeChapterTab:{backgroundColor:colors.ocean},lockedChapterTab:{opacity:.55},chapterTabText:{color:colors.navy,fontSize:10,fontWeight:"900"},activeChapterTabText:{color:colors.white},
  route:{position:"absolute",height:6,borderRadius:5,backgroundColor:"rgba(255,255,255,.45)",zIndex:1},routeUnlocked:{backgroundColor:"#FFD55A"},
  node:{position:"absolute",width:112,marginLeft:-56,alignItems:"center",zIndex:3},nodeCircle:{width:48,height:48,borderRadius:24,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(17,50,65,.88)",borderWidth:3,borderColor:"#A6B8BE"},nodeUnlocked:{backgroundColor:"#FFFFFF",borderColor:colors.aqua},nodeCanUnlock:{backgroundColor:"#FFF1A8",borderWidth:4,borderColor:"#FFB300",shadowColor:"#FFD200",shadowOpacity:1,shadowRadius:14,elevation:18},nodeBoss:{backgroundColor:"#FFF3C3",borderColor:"#F2B93B"},nodeComplete:{backgroundColor:"#FFE066",borderColor:"#C88B00"},nodeMark:{color:colors.navy,fontSize:18,fontWeight:"900"},nodeLabel:{marginTop:-3,minWidth:88,borderRadius:9,paddingHorizontal:6,paddingVertical:3,backgroundColor:"rgba(4,48,63,.84)"},canUnlockLabel:{backgroundColor:"#FFB300",borderWidth:2,borderColor:"#FFF3A3",shadowColor:"#FFD200",shadowOpacity:.9,shadowRadius:8,elevation:12},completeLabel:{backgroundColor:"rgba(132,87,0,.9)"},nodeName:{color:colors.white,fontSize:10,fontWeight:"900",textAlign:"center"},canUnlockName:{color:"#3E2900",fontSize:11},nodeStatus:{color:"#D8F5F2",fontSize:8,fontWeight:"800",textAlign:"center"},canUnlockStatus:{color:"#5B3900",fontSize:8,fontWeight:"900"},nodeMarks:{flexDirection:"row",justifyContent:"center",gap:8,marginTop:1},nodeMiniMark:{color:"#718A91",fontSize:9,fontWeight:"900"},nodeBossMark:{color:"#FFD04E"},nodeCompleteMark:{color:"#FFE866"},avatar:{position:"absolute",left:82,bottom:-7,width:48,height:72,overflow:"hidden"},
  backdrop:{flex:1,justifyContent:"center",padding:13,backgroundColor:"rgba(1,20,29,.78)"},sheet:{maxHeight:"94%",borderRadius:24,padding:15,gap:9,backgroundColor:colors.white},sheetEyebrow:{color:colors.ocean,fontSize:10,fontWeight:"900",letterSpacing:1},sheetName:{color:colors.navy,fontSize:25,fontWeight:"900"},readySheetName:{color:"#E99A00"},lockBox:{borderRadius:14,padding:13,backgroundColor:"#EDF2F2"},lockTitle:{color:colors.navy,fontWeight:"900"},lockText:{color:colors.muted,fontSize:11,marginTop:4},summaryRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:10,borderRadius:14,backgroundColor:colors.foam},summaryLabel:{color:colors.ink,fontWeight:"800"},summaryValue:{color:colors.navy,fontSize:21,fontWeight:"900"},marks:{flexDirection:"row",justifyContent:"space-between",gap:6},markText:{color:colors.muted,fontSize:10,fontWeight:"900"},goldText:{color:"#BA7A00",fontSize:11},products:{color:colors.coral,fontSize:10,fontWeight:"900"},fishGrid:{flexDirection:"row",flexWrap:"wrap",gap:5},fishCell:{width:"18.8%",alignItems:"center",padding:3,borderRadius:9,backgroundColor:colors.foam},caughtFishCell:{borderWidth:1,borderColor:colors.aqua,backgroundColor:"#E2F8F5"},fishArt:{width:50,height:50,alignItems:"center",justifyContent:"center"},question:{color:colors.navy,fontSize:31,fontWeight:"900",opacity:.7},fishName:{maxWidth:"100%",color:colors.ink,fontSize:7,fontWeight:"900"},fishRank:{color:colors.muted,fontSize:6,fontWeight:"800"},
  detailBackdrop:{flex:1,justifyContent:"center",padding:18,backgroundColor:"rgba(0,15,23,.88)"},fishDetailSheet:{borderRadius:26,padding:17,gap:10,backgroundColor:colors.white,alignItems:"stretch"},detailEyebrow:{color:colors.ocean,fontSize:12,fontWeight:"900",letterSpacing:1.5,textAlign:"center"},detailArt:{height:220,alignItems:"center",justifyContent:"center",borderRadius:20,backgroundColor:"#E7F8F7",overflow:"hidden"},detailName:{color:colors.navy,fontSize:27,fontWeight:"900",textAlign:"center"},detailDescription:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},detailGrid:{flexDirection:"row",flexWrap:"wrap",gap:7},detailStat:{width:"48.8%",borderRadius:13,padding:10,backgroundColor:colors.foam},detailStatLabel:{color:colors.muted,fontSize:9,fontWeight:"800"},detailStatValue:{color:colors.navy,fontSize:14,fontWeight:"900",marginTop:3},detailRange:{color:colors.ocean,fontSize:11,fontWeight:"900",textAlign:"center"},
  confirmBackdrop:{flex:1,alignItems:"center",justifyContent:"center",padding:22,backgroundColor:"rgba(0,16,24,.84)"},confirmSheet:{width:"100%",borderRadius:26,padding:20,gap:10,backgroundColor:colors.white,alignItems:"center"},confirmIcon:{fontSize:54},confirmTitle:{color:colors.navy,fontSize:23,fontWeight:"900"},confirmArea:{color:colors.coral,fontSize:20,fontWeight:"900"},confirmText:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:"center"},confirmActions:{width:"100%",flexDirection:"row",gap:8,marginTop:5},confirmAction:{flex:1},
  unlockBackdrop:{flex:1,alignItems:"center",justifyContent:"center",overflow:"hidden",backgroundColor:"rgba(0,12,32,.96)"},
  unlockFlash:{position:"absolute",top:0,right:0,bottom:0,left:0,backgroundColor:"#FFF7B0"},
  unlockRing:{position:"absolute",width:150,height:150,borderRadius:75,borderWidth:7,borderColor:"#FFD84A",shadowColor:"#FFF3A0",shadowOpacity:1,shadowRadius:20,elevation:8},
  unlockRingSecond:{width:210,height:210,borderRadius:105,borderWidth:3,borderColor:"#52E5FF"},
  unlockStarOrbit:{position:"absolute",width:330,height:330,borderRadius:165,alignItems:"center",paddingTop:4},
  unlockStarOrbitText:{color:"#FFF4A0",fontSize:22,fontWeight:"900",letterSpacing:5},
  unlockParticle:{position:"absolute",color:"#FFD936",fontSize:26,fontWeight:"900",textShadowColor:"#FFF8B8",textShadowRadius:10},
  unlockCard:{width:"88%",borderRadius:34,paddingVertical:31,paddingHorizontal:18,alignItems:"center",backgroundColor:"#FFFDF0",borderWidth:5,borderColor:"#FFD34E",shadowColor:"#FFD34E",shadowOpacity:1,shadowRadius:30,elevation:30},
  unlockLight:{color:"#D99700",fontSize:15,fontWeight:"900",letterSpacing:1.5},unlockCrown:{fontSize:38,marginTop:5},unlockIcon:{fontSize:66,marginTop:-5},unlockTitle:{color:"#E48B00",fontSize:30,fontWeight:"900",letterSpacing:1.5,textShadowColor:"#FFE189",textShadowRadius:8},unlockName:{color:colors.navy,fontSize:25,fontWeight:"900",marginTop:8,textAlign:"center"},unlockDivider:{width:"72%",height:3,borderRadius:2,backgroundColor:"#FFD34E",marginVertical:12},unlockText:{color:colors.ink,fontSize:14,fontWeight:"900"},unlockSubText:{color:colors.muted,fontSize:11,fontWeight:"800",marginTop:6,textAlign:"center"},
});
