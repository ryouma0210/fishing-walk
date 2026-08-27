import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, PanResponder, Platform, Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import { AnglerArt, FishArt } from "../../src/components/GameArt";
import { Button } from "../../src/components/ui";
import { FISHING_AREAS, FishingArea } from "../../src/constants/areas";
import { CatchSummary, getCatchSummaries, getInventory, getTotalSteps } from "../../src/database/db";
import { getSelectedArea, getUnlockedAreaIds, selectArea, unlockArea } from "../../src/services/areaService";
import { colors } from "../../src/constants/theme";
import { ChapterId } from "../../src/constants/expansionData";
import { FISH, HABITAT_NAMES } from "../../src/constants/game";
import { AREA_COORDINATES } from "../../src/constants/areaCoordinates";

const AREAS_PER_SECTION = 4;
const IS_EXPO_GO = Constants.appOwnership === "expo";
const NativeMaps = IS_EXPO_GO ? null : require("react-native-maps");
const NativeMapView = NativeMaps?.default;
const NativeMarker = NativeMaps?.Marker;
const NativePolyline = NativeMaps?.Polyline;
const NativeProviderGoogle = NativeMaps?.PROVIDER_GOOGLE;
const TILE_SIZE = 256;
const MAP_TILES = {
  space: [
    require("../../assets/game/map-tiles/space/tile-0-0.png"),require("../../assets/game/map-tiles/space/tile-0-1.png"),require("../../assets/game/map-tiles/space/tile-1-0.png"),require("../../assets/game/map-tiles/space/tile-1-1.png"),
    require("../../assets/game/map-tiles/space/tile-2-0.png"),require("../../assets/game/map-tiles/space/tile-2-1.png"),require("../../assets/game/map-tiles/space/tile-3-0.png"),require("../../assets/game/map-tiles/space/tile-3-1.png"),
    require("../../assets/game/map-tiles/space/tile-4-0.png"),require("../../assets/game/map-tiles/space/tile-4-1.png"),require("../../assets/game/map-tiles/space/tile-5-0.png"),require("../../assets/game/map-tiles/space/tile-5-1.png"),
  ],
} as const;
const PAGE_NODES = [
  {x:20,y:.763},{x:19,y:.590},{x:65,y:.503},{x:76,y:.419},
];
const JAPAN_PREFECTURE_POSITIONS: Record<string,{x:number;y:number}> = {
  hokkaido:{x:78,y:.17},aomori:{x:68,y:.30},iwate:{x:71,y:.34},miyagi:{x:70,y:.37},akita:{x:64,y:.33},yamagata:{x:64,y:.37},fukushima:{x:65,y:.40},
  ibaraki:{x:68,y:.45},tochigi:{x:65,y:.43},gunma:{x:62,y:.43},saitama:{x:64,y:.45},chiba:{x:69,y:.48},tokyo:{x:65,y:.47},kanagawa:{x:63,y:.49},
  niigata:{x:59,y:.38},toyama:{x:53,y:.43},ishikawa:{x:49,y:.42},fukui:{x:46,y:.45},yamanashi:{x:60,y:.47},nagano:{x:57,y:.44},gifu:{x:52,y:.47},shizuoka:{x:59,y:.50},aichi:{x:54,y:.50},
  mie:{x:51,y:.52},shiga:{x:48,y:.49},kyoto:{x:44,y:.49},osaka:{x:44,y:.52},hyogo:{x:39,y:.51},nara:{x:48,y:.52},wakayama:{x:46,y:.55},
  tottori:{x:34,y:.50},shimane:{x:29,y:.51},okayama:{x:36,y:.53},hiroshima:{x:30,y:.54},yamaguchi:{x:25,y:.55},tokushima:{x:38,y:.57},kagawa:{x:37,y:.55},ehime:{x:32,y:.57},kochi:{x:34,y:.59},
  fukuoka:{x:17,y:.56},saga:{x:13,y:.58},nagasaki:{x:9,y:.60},kumamoto:{x:15,y:.62},oita:{x:20,y:.59},miyazaki:{x:20,y:.65},kagoshima:{x:15,y:.68},okinawa:{x:25,y:.82},
};
const WORLD_COUNTRY_POSITIONS: Record<string,{x:number;y:number}> = {
  south_korea:{x:.87,y:.38},china:{x:.79,y:.38},mongolia:{x:.75,y:.31},taiwan:{x:.86,y:.43},philippines:{x:.87,y:.49},vietnam:{x:.81,y:.47},thailand:{x:.79,y:.49},cambodia:{x:.81,y:.51},malaysia:{x:.81,y:.54},singapore:{x:.80,y:.56},indonesia:{x:.84,y:.58},india:{x:.72,y:.47},nepal:{x:.75,y:.43},sri_lanka:{x:.73,y:.55},uae:{x:.64,y:.47},turkey:{x:.58,y:.42},greece:{x:.55,y:.43},italy:{x:.52,y:.41},spain:{x:.47,y:.42},portugal:{x:.45,y:.42},france:{x:.49,y:.38},united_kingdom:{x:.47,y:.34},ireland:{x:.45,y:.34},netherlands:{x:.50,y:.35},belgium:{x:.49,y:.36},germany:{x:.52,y:.35},switzerland:{x:.51,y:.38},austria:{x:.54,y:.38},czechia:{x:.53,y:.36},poland:{x:.56,y:.35},denmark:{x:.52,y:.32},norway:{x:.51,y:.26},sweden:{x:.54,y:.27},finland:{x:.57,y:.27},iceland:{x:.43,y:.27},egypt:{x:.58,y:.48},morocco:{x:.46,y:.47},kenya:{x:.60,y:.59},tanzania:{x:.60,y:.63},south_africa:{x:.56,y:.70},canada:{x:.18,y:.28},united_states:{x:.18,y:.42},mexico:{x:.18,y:.52},peru:{x:.27,y:.66},brazil:{x:.33,y:.61},argentina:{x:.31,y:.76},chile:{x:.27,y:.74},australia:{x:.86,y:.67},new_zealand:{x:.95,y:.75},antarctica:{x:.58,y:.86},
};
const coordinateToPixel = (latitude: number, longitude: number, zoom: number) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const clampedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const sinLatitude = Math.sin(clampedLatitude * Math.PI / 180);
  return {
    x:(longitude + 180) / 360 * scale,
    y:(.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
};
const expoTileUrl = (story: ChapterId, zoom: number, x: number, y: number) => {
  if (story === "japan") return `https://cyberjapandata.gsi.go.jp/xyz/pale/${zoom}/${x}/${y}.png?fw-map=3`;
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${y}/${x}`;
};
export default function JapanAreaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topSafeInset = Math.max(insets.top, Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0);
  const { width, height } = useWindowDimensions();
  const horizontalMapRef = useRef<ScrollView>(null);
  const verticalMapRef = useRef<ScrollView>(null);
  const nativeMapRef = useRef<any>(null);
  const [viewportHeight, setViewportHeight] = useState(Math.max(width * 1.5, height - 90));
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [catchSummaries, setCatchSummaries] = useState<Map<string, CatchSummary>>(new Map());
  const [unlockedAreaIds, setUnlockedAreaIds] = useState<Set<string>>(new Set());
  const [totalSteps, setTotalSteps] = useState(0);
  const [selected, setSelected] = useState<FishingArea | null>(null);
  const [outfitStage, setOutfitStage] = useState(0);
  const [currentAreaId, setCurrentAreaId] = useState(FISHING_AREAS[0].id);
  const [story, setStory] = useState<ChapterId>("japan");
  const [mapZoomed, setMapZoomed] = useState(true);
  const [focusAreaId, setFocusAreaId] = useState(FISHING_AREAS[0].id);
  const [mapPan, setMapPan] = useState({x:0,y:0});
  const mapPanValue = useRef({x:0,y:0});
  const mapPanStart = useRef({x:0,y:0});
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [unlockCelebration, setUnlockCelebration] = useState<FishingArea | null>(null);
  const [unlockAnimation] = useState(() => new Animated.Value(0));
  const [unlockBurst] = useState(() => new Animated.Value(0));
  const [unlockSpin] = useState(() => new Animated.Value(0));
  const [readyPulse] = useState(() => new Animated.Value(0));
  const mapPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder:() => false,
    onMoveShouldSetPanResponder:(_, gesture) => IS_EXPO_GO && story !== "space" && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5),
    onPanResponderGrant:() => { mapPanStart.current = mapPanValue.current; },
    onPanResponderMove:(_, gesture) => {
      const next = {x:mapPanStart.current.x + gesture.dx,y:mapPanStart.current.y + gesture.dy};
      mapPanValue.current = next;
      setMapPan(next);
    },
    onPanResponderRelease:(_, gesture) => {
      const next = {x:mapPanStart.current.x + gesture.dx,y:mapPanStart.current.y + gesture.dy};
      mapPanValue.current = next;
      mapPanStart.current = next;
      setMapPan(next);
    },
    onPanResponderTerminate:(_, gesture) => {
      const next = {x:mapPanStart.current.x + gesture.dx,y:mapPanStart.current.y + gesture.dy};
      mapPanValue.current = next;
      mapPanStart.current = next;
      setMapPan(next);
    },
  }), [story]);

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
      setMapZoomed(true);
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
  const focusedStateIndex = Math.max(0, states.findIndex((state) => state.area.id === focusAreaId));
  const filteredAreaStates = useMemo(() => {
    const query = areaSearchQuery.trim().toLocaleLowerCase("ja");
    if (!query) return states;
    return states.filter((state) => state.area.name.toLocaleLowerCase("ja").includes(query));
  }, [areaSearchQuery, states]);
  const mapHeight = viewportHeight;
  const chapterTiles = MAP_TILES.space;
  const areaPosition = useCallback((index: number) => {
    if (story === "japan") {
      const slug = states[index]?.area.id.replace(/^jp_/,"");
      const position = JAPAN_PREFECTURE_POSITIONS[slug];
      if (position) return { x:position.x / 100, y:position.y };
    }
    if (story === "world") {
      const slug=states[index]?.area.id.replace(/^jp_world_/,"");
      const position=WORLD_COUNTRY_POSITIONS[slug];
      if (position) return position;
    }
    const local = index % AREAS_PER_SECTION;
    if (story === "space") {
      const progress = states.length <= 1 ? 0 : index / (states.length - 1);
      return { x:index % 2 === 0 ? .43 : .57, y:.88 - progress * .78 };
    }
    return { x:PAGE_NODES[local].x / 100, y:PAGE_NODES[local].y };
  }, [states, story]);
  const zoomScale = mapZoomed ? 4.2 : 1;
  const baseMapWidth = Math.max(width, mapHeight / 1.5);
  const baseMapHeight = baseMapWidth * 1.5;
  const displayWidth = baseMapWidth * zoomScale;
  const displayHeight = baseMapHeight * zoomScale;
  const focusIndex = Math.max(0,states.findIndex((state) => state.area.id === focusAreaId));
  const focusPosition = areaPosition(focusIndex);
  const expoTileZoom = story === "japan" ? 9 : 3;
  const expoTileMap = useMemo(() => {
    if (!IS_EXPO_GO || story === "space") return null;
    const focusCoordinate = AREA_COORDINATES[focusAreaId] ?? { latitude:35.6812, longitude:139.7671 };
    const center = coordinateToPixel(focusCoordinate.latitude, focusCoordinate.longitude, expoTileZoom);
    const originX = center.x - width / 2 - mapPan.x;
    const originY = center.y - mapHeight / 2 - mapPan.y;
    const firstTileX = Math.floor(originX / TILE_SIZE);
    const firstTileY = Math.floor(originY / TILE_SIZE);
    const columns = Math.ceil(width / TILE_SIZE) + 2;
    const rows = Math.ceil(mapHeight / TILE_SIZE) + 2;
    const tileCount = 2 ** expoTileZoom;
    const tiles = Array.from({ length:columns * rows }, (_, tileIndex) => {
      const column = tileIndex % columns;
      const row = Math.floor(tileIndex / columns);
      const rawX = firstTileX + column;
      const y = firstTileY + row;
      if (y < 0 || y >= tileCount) return null;
      const x = ((rawX % tileCount) + tileCount) % tileCount;
      return {
        key:`${expoTileZoom}-${rawX}-${y}`,
        uri:expoTileUrl(story, expoTileZoom, x, y),
        left:rawX * TILE_SIZE - originX,
        top:y * TILE_SIZE - originY,
      };
    }).filter((tile): tile is { key:string; uri:string; left:number; top:number } => Boolean(tile));
    return { originX, originY, tiles };
  }, [expoTileZoom, focusAreaId, mapHeight, mapPan.x, mapPan.y, story, width]);
  const nodePoint = useCallback((index: number) => {
    const position = areaPosition(index);
    return { left:position.x * displayWidth, top:position.y * displayHeight };
  }, [areaPosition, displayHeight, displayWidth]);
  const zoomToCurrentArea = () => {
    mapPanValue.current = {x:0,y:0};
    setMapPan({x:0,y:0});
    setFocusAreaId(currentAreaId);
    setMapZoomed(true);
  };

  const moveArea = async (direction: -1 | 1) => {
    const nextIndex = focusedStateIndex + direction;
    const nextState = states[nextIndex];
    if (!nextState) return;
    mapPanValue.current = {x:0,y:0};
    setMapPan({x:0,y:0});
    setFocusAreaId(nextState.area.id);
    setMapZoomed(true);
    setSelected(null);
    if (nextState.unlocked) {
      await selectArea(nextState.area);
      setCurrentAreaId(nextState.area.id);
    }
  };

  const jumpToArea = async (areaId: string) => {
    const targetState = states.find((state) => state.area.id === areaId);
    if (!targetState) return;
    mapPanValue.current = {x:0,y:0};
    setMapPan({x:0,y:0});
    setFocusAreaId(targetState.area.id);
    setMapZoomed(true);
    setSelected(null);
    setShowAreaSearch(false);
    setAreaSearchQuery("");
    if (targetState.unlocked) {
      await selectArea(targetState.area);
      setCurrentAreaId(targetState.area.id);
    }
  };

  useEffect(() => {
    if (story !== "space") return;
    const timer = setTimeout(() => {
      const x = mapZoomed ? Math.max(0, Math.min(displayWidth - width, focusPosition.x * displayWidth - width / 2)) : 0;
      const y = mapZoomed ? Math.max(0, Math.min(displayHeight - mapHeight, focusPosition.y * displayHeight - mapHeight / 2)) : 0;
      horizontalMapRef.current?.scrollTo({ x, animated:true });
      verticalMapRef.current?.scrollTo({ y, animated:true });
    }, 80);
    return () => clearTimeout(timer);
  }, [displayHeight, displayWidth, focusPosition.x, focusPosition.y, mapHeight, mapZoomed, story, width]);

  useEffect(() => {
    if (IS_EXPO_GO || story === "space") return;
    const coordinate = AREA_COORDINATES[focusAreaId];
    if (!coordinate) return;
    nativeMapRef.current?.animateToRegion({
      ...coordinate,
      latitudeDelta:story === "japan" ? 0.36 : 12,
      longitudeDelta:story === "japan" ? 0.36 : 12,
    }, 450);
  }, [focusAreaId, story]);

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
      <View style={styles.scrollContent}>
        <View style={styles.mapViewport} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
          {story !== "space" && IS_EXPO_GO ? <View style={StyleSheet.absoluteFill} {...mapPanResponder.panHandlers}>
            <View style={styles.expoTileMap}>
              {expoTileMap?.tiles.map((tile) => <Image key={tile.key} source={{ uri:tile.uri }} resizeMode="cover" style={[styles.expoTile,{left:tile.left,top:tile.top}]} />)}
              {states.slice(0, -1).map((state, index) => {
                const firstCoordinate = AREA_COORDINATES[state.area.id];
                const secondCoordinate = AREA_COORDINATES[states[index + 1].area.id];
                if (!expoTileMap || !firstCoordinate || !secondCoordinate) return null;
                const firstPixel = coordinateToPixel(firstCoordinate.latitude, firstCoordinate.longitude, expoTileZoom);
                const secondPixel = coordinateToPixel(secondCoordinate.latitude, secondCoordinate.longitude, expoTileZoom);
                const x1 = firstPixel.x - expoTileMap.originX;
                const y1 = firstPixel.y - expoTileMap.originY;
                const x2 = secondPixel.x - expoTileMap.originX;
                const y2 = secondPixel.y - expoTileMap.originY;
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                return <View key={`expo-line-${state.area.id}`} style={[styles.expoRoute,state.unlocked && styles.routeUnlocked,{left:(x1+x2-length)/2,top:(y1+y2)/2-3,width:length,transform:[{rotate:`${Math.atan2(dy,dx)*180/Math.PI}deg`}]}]} />;
              })}
              {states.map((state,index) => {
                const coordinate = AREA_COORDINATES[state.area.id];
                if (!expoTileMap || !coordinate) return null;
                const pixel = coordinateToPixel(coordinate.latitude, coordinate.longitude, expoTileZoom);
                const isFocused = state.area.id === focusAreaId;
                return <Pressable key={`expo-${state.area.id}`} onPress={() => void chooseArea(state)} style={[styles.expoMarker,isFocused && styles.googleMarkerFocused,{left:pixel.x-expoTileMap.originX-47,top:pixel.y-expoTileMap.originY-17}]}>
                  <View style={[styles.googlePin,state.unlocked && styles.googlePinUnlocked,state.canUnlock && styles.googlePinReady,state.completed && styles.googlePinComplete]}>
                    <Text style={styles.googlePinText}>{state.canUnlock ? "🔓" : !state.unlocked ? "?" : state.completed ? "★" : state.bossCaught ? "👑" : index+1}</Text>
                  </View>
                  {isFocused && <View style={styles.googleStageCard}>
                    <View style={styles.googleStageText}><Text numberOfLines={1} style={styles.googleStageName}>{state.unlocked ? state.area.name : state.canUnlock ? "解放可能" : "？？？"}</Text><Text style={styles.googleStageStatus}>{state.unlocked ? `${state.discovered}/10` : state.canUnlock ? "タップして解放" : `${state.area.requiredSteps.toLocaleString()}歩`}</Text></View>
                    {state.area.id === currentAreaId && state.unlocked && <View style={styles.googleAvatar}><AnglerArt stage={outfitStage} height={62} /></View>}
                  </View>}
                </Pressable>;
              })}
            </View>
          </View> : story !== "space" && NativeMapView && NativeMarker && NativePolyline ? <NativeMapView
            ref={nativeMapRef}
            provider={NativeProviderGoogle}
            style={StyleSheet.absoluteFill}
            mapType="standard"
            initialRegion={{...(AREA_COORDINATES[focusAreaId] ?? {latitude:35.6812,longitude:139.7671}),latitudeDelta:story === "japan" ? 0.36 : 12,longitudeDelta:story === "japan" ? 0.36 : 12}}
            toolbarEnabled={false}
            rotateEnabled={false}
          >
            <NativePolyline coordinates={states.map((state) => AREA_COORDINATES[state.area.id]).filter((coordinate): coordinate is {latitude:number;longitude:number} => Boolean(coordinate))} strokeColor="#F4C94F" strokeWidth={4} />
            {states.map((state,index) => {
              const coordinate=AREA_COORDINATES[state.area.id];
              if (!coordinate) return null;
              const isFocused=state.area.id === focusAreaId;
              return <NativeMarker key={`${state.area.id}-${isFocused}-${state.unlocked}-${state.canUnlock}-${state.completed}-${state.area.id === currentAreaId}`} coordinate={coordinate} anchor={{x:.5,y:.5}} onPress={() => void chooseArea(state)} tracksViewChanges={false}>
                <View style={[styles.googleMarker,isFocused && styles.googleMarkerFocused]}>
                  <View style={[styles.googlePin,state.unlocked && styles.googlePinUnlocked,state.canUnlock && styles.googlePinReady,state.completed && styles.googlePinComplete]}>
                    <Text style={styles.googlePinText}>{state.canUnlock ? "🔓" : !state.unlocked ? "?" : state.completed ? "★" : state.bossCaught ? "👑" : index+1}</Text>
                  </View>
                  {isFocused && <View style={styles.googleStageCard}>
                    <View style={styles.googleStageText}><Text numberOfLines={1} style={styles.googleStageName}>{state.unlocked ? state.area.name : state.canUnlock ? "解放可能" : "？？？"}</Text><Text style={styles.googleStageStatus}>{state.unlocked ? `${state.discovered}/10` : state.canUnlock ? "タップして解放" : `${state.area.requiredSteps.toLocaleString()}歩`}</Text></View>
                    {state.area.id === currentAreaId && state.unlocked && <View style={styles.googleAvatar}><AnglerArt stage={outfitStage} height={62} /></View>}
                  </View>}
                </View>
              </NativeMarker>;
            })}
          </NativeMapView> : <>
          <ScrollView ref={horizontalMapRef} horizontal scrollEnabled={mapZoomed} showsHorizontalScrollIndicator={false} bounces={false} style={styles.horizontalMap}>
          <ScrollView ref={verticalMapRef} scrollEnabled={mapZoomed} showsVerticalScrollIndicator={false} bounces={false} style={{width:displayWidth,height:mapHeight}} contentContainerStyle={{width:displayWidth,height:displayHeight}}>
          <View style={[styles.map,{width:displayWidth,height:displayHeight}]}>
          {chapterTiles.map((tile, tileIndex) => {
            const column = tileIndex % 2;
            const row = Math.floor(tileIndex / 2);
            return <Image key={`${story}-tile-${tileIndex}`} source={tile} resizeMode="stretch" fadeDuration={0} style={{position:"absolute",left:column*displayWidth/2,top:row*displayHeight/6,width:displayWidth/2+.5,height:displayHeight/6+.5}} />;
          })}
          <View style={styles.sectionShade} />
          {states.slice(0, -1).map((state, index) => {
            const first = nodePoint(index);
            const second = nodePoint(index + 1);
            const x1 = first.left;
            const x2 = second.left;
            const y1 = first.top + 26;
            const y2 = second.top + 26;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            return <View key={`line-${state.area.id}`} style={[styles.route, state.unlocked && styles.routeUnlocked, { left:(x1+x2-length)/2, top:(y1+y2)/2-3, width:length, transform:[{ rotate:`${Math.atan2(dy,dx)*180/Math.PI}deg` }] }]} />;
          })}
          {states.map((state, index) => {
            const point = nodePoint(index);
            const normalizedPoint = areaPosition(index);
            const labelShift = normalizedPoint.x < .32 ? 48 : normalizedPoint.x > .68 ? -48 : index % 2 ? 42 : -42;
            const isFocused = state.area.id === focusAreaId;
            const showLabel = mapZoomed ? isFocused : state.area.id === currentAreaId || state.canUnlock;
            return (
              <Pressable key={state.area.id} onPress={() => void chooseArea(state)} style={[styles.node, isFocused && mapZoomed && styles.focusedNode, { left:point.left, top:point.top }]}>
                <Animated.View style={[styles.nodeCircle, isFocused && mapZoomed && styles.focusedNodeCircle, state.unlocked && styles.nodeUnlocked, state.canUnlock && styles.nodeCanUnlock, state.bossCaught && styles.nodeBoss, state.completed && styles.nodeComplete, state.canUnlock && { transform:[{ scale:readyPulse.interpolate({ inputRange:[0,1], outputRange:[1,1.13] }) }] }]}>
                  <Text style={styles.nodeMark}>{state.canUnlock ? "🔓" : !state.unlocked ? "?" : state.completed ? "★" : state.bossCaught ? "👑" : index + 1}</Text>
                </Animated.View>
                {showLabel && <View style={[styles.nodeLabel, isFocused && mapZoomed ? styles.focusedNodeLabel : {transform:[{translateX:labelShift}]}, state.canUnlock && styles.canUnlockLabel, state.completed && styles.completeLabel]}>
                  <Text numberOfLines={1} style={[styles.nodeName, state.canUnlock && styles.canUnlockName]}>{state.unlocked ? state.area.name : state.canUnlock ? "解放可能" : "？？？"}</Text>
                  <Text style={[styles.nodeStatus, state.canUnlock && styles.canUnlockStatus]}>{state.unlocked ? `${state.discovered}/10` : state.canUnlock ? "タップして解放" : `${state.area.requiredSteps.toLocaleString()}歩`}</Text>
                  <View style={styles.nodeMarks}><Text style={[styles.nodeMiniMark, state.bossCaught && styles.nodeBossMark]}>♛</Text><Text style={[styles.nodeMiniMark, state.completed && styles.nodeCompleteMark]}>★</Text></View>
                </View>}
                {state.area.id === currentAreaId && state.unlocked && <View style={styles.avatar}><AnglerArt stage={outfitStage} height={72} /></View>}
              </Pressable>
            );
          })}
          </View>
          </ScrollView>
          </ScrollView>
          </>}
        </View>
      </View>

      <View style={[styles.header,{top:topSafeInset+8}]}>
        <View style={styles.chapterTabs}>
          {(["japan","world","space"] as ChapterId[]).map((id) => {
            const open = id === "japan" || id === "world" ? id === "japan" || japanClear : worldClear;
            return <Pressable key={id} onPress={() => { if (open) { const first=FISHING_AREAS.find((area) => area.story === id); mapPanValue.current={x:0,y:0}; setMapPan({x:0,y:0}); setStory(id); if (first) setFocusAreaId(first.id); setMapZoomed(true); setSelected(null); } }} style={[styles.chapterTab, story === id && styles.activeChapterTab, !open && styles.lockedChapterTab]}><Text style={[styles.chapterTabText, story === id && styles.activeChapterTabText]}>{id === "japan" ? "日本編" : id === "world" ? "世界編" : "宇宙編"}{!open ? " 🔒" : ""}</Text></Pressable>;
          })}
        </View>
        <Text style={styles.title}>{story === "japan" ? "日本全国 Fishing" : story === "world" ? "世界一周 Fishing" : "銀河宇宙 Fishing"}</Text>
        <Text style={styles.sub}>{!chapterOpen ? "前の章の最終ヌシを捕獲すると解放" : `累計 ${totalSteps.toLocaleString()}歩 · 条件達成後にタップして手動解放`}</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width:`${Math.min(100, (currentIndex + 1) / states.length * 100)}%` }]} /></View>
      </View>

      <View style={[styles.areaNavigation,{top:topSafeInset+142}]}>
        <Pressable disabled={focusedStateIndex === 0} onPress={() => void moveArea(-1)} style={({pressed}) => [styles.areaNavigationButton,(pressed || focusedStateIndex === 0) && styles.areaNavigationButtonDisabled]}>
          <Text style={styles.areaNavigationButtonText}>‹ 前へ</Text>
        </Pressable>
        <Pressable onPress={() => setShowAreaSearch(true)} style={({pressed}) => [styles.areaNavigationCurrent,pressed && styles.areaNavigationCurrentPressed]}>
          <Text numberOfLines={1} style={styles.areaNavigationName}>{states[focusedStateIndex]?.unlocked ? states[focusedStateIndex].area.name : states[focusedStateIndex]?.canUnlock ? "解放可能" : "？？？"}</Text>
          <Text style={styles.areaNavigationCount}>{focusedStateIndex+1} / {states.length}</Text>
        </Pressable>
        <Pressable disabled={focusedStateIndex === states.length-1} onPress={() => void moveArea(1)} style={({pressed}) => [styles.areaNavigationButton,(pressed || focusedStateIndex === states.length-1) && styles.areaNavigationButtonDisabled]}>
          <Text style={styles.areaNavigationButtonText}>次へ ›</Text>
        </Pressable>
      </View>

      <Modal visible={showAreaSearch} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowAreaSearch(false)}>
        <View style={styles.areaSearchBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAreaSearch(false)} />
          <View style={styles.areaSearchSheet}>
            <View style={styles.areaSearchHeader}>
              <View><Text style={styles.areaSearchTitle}>エリアを検索</Text><Text style={styles.areaSearchSub}>名前の一部でも検索できます</Text></View>
              <Pressable onPress={() => setShowAreaSearch(false)} style={styles.areaSearchClose}><Text style={styles.areaSearchCloseText}>×</Text></Pressable>
            </View>
            <TextInput value={areaSearchQuery} onChangeText={setAreaSearchQuery} placeholder="例：長崎、東京" placeholderTextColor="#81969C" autoFocus returnKeyType="search" clearButtonMode="while-editing" style={styles.areaSearchInput} />
            <Text style={styles.areaSearchResultCount}>{filteredAreaStates.length}件</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.areaSearchResults}>
              {filteredAreaStates.map((state) => {
                const areaIndex=states.indexOf(state);
                const isCurrent=state.area.id === focusAreaId;
                return <Pressable key={state.area.id} onPress={() => void jumpToArea(state.area.id)} style={({pressed}) => [styles.areaSearchRow,isCurrent && styles.areaSearchRowCurrent,pressed && styles.areaSearchRowPressed]}>
                  <View style={[styles.areaSearchNumber,state.unlocked && styles.areaSearchNumberUnlocked,state.canUnlock && styles.areaSearchNumberReady]}><Text style={styles.areaSearchNumberText}>{areaIndex+1}</Text></View>
                  <View style={styles.areaSearchRowText}><Text numberOfLines={1} style={styles.areaSearchAreaName}>{state.unlocked ? state.area.name : state.canUnlock ? "解放可能" : "？？？"}</Text><Text style={styles.areaSearchStatus}>{state.unlocked ? `発見 ${state.discovered}/10` : state.canUnlock ? "タップしてエリアへ移動" : `${state.area.requiredSteps.toLocaleString()}歩で解放`}</Text></View>
                  <View style={styles.areaSearchMarks}>
                    <Text style={[styles.areaSearchMark,state.bossCaught && styles.areaSearchBossMark]}>♛</Text>
                    <Text style={[styles.areaSearchMark,state.completed && styles.areaSearchCompleteMark]}>★</Text>
                  </View>
                  <Text style={styles.areaSearchArrow}>›</Text>
                </Pressable>;
              })}
              {filteredAreaStates.length === 0 && <View style={styles.areaSearchEmpty}><Text style={styles.areaSearchEmptyText}>該当するエリアがありません</Text></View>}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  safe:{flex:1,backgroundColor:"#087EAC"},scrollContent:{flex:1},mapViewport:{flex:1,width:"100%",overflow:"hidden",backgroundColor:"#087EAC"},horizontalMap:{width:"100%",height:"100%"},map:{position:"relative",overflow:"hidden",backgroundColor:"#087EAC"},expoTileMap:{position:"absolute",top:0,right:0,bottom:0,left:0,overflow:"hidden",backgroundColor:"#D8EFE5"},expoTile:{position:"absolute",width:TILE_SIZE,height:TILE_SIZE},expoRoute:{position:"absolute",height:6,borderRadius:5,backgroundColor:"rgba(255,255,255,.58)",zIndex:2},expoMarker:{position:"absolute",alignItems:"center",width:94,zIndex:5},sectionShade:{position:"absolute",top:0,right:0,bottom:0,left:0,backgroundColor:"rgba(0,42,62,.08)"},zoomControls:{position:"absolute",top:150,right:10,zIndex:20,flexDirection:"row",gap:6},zoomButton:{paddingHorizontal:10,paddingVertical:8,borderRadius:99,backgroundColor:"rgba(255,255,255,.9)",borderWidth:2,borderColor:colors.white},zoomButtonActive:{backgroundColor:colors.ocean,borderColor:"#9EEBE5"},zoomButtonText:{color:colors.navy,fontSize:9,fontWeight:"900"},zoomButtonTextActive:{color:colors.white},
  header:{position:"absolute",zIndex:30,top:10,left:12,right:12,borderRadius:18,padding:12,backgroundColor:"rgba(255,255,255,.95)",elevation:12},title:{color:colors.navy,fontSize:22,fontWeight:"900"},sub:{color:colors.muted,fontSize:10,fontWeight:"700",marginTop:2},progress:{height:6,borderRadius:9,backgroundColor:colors.line,overflow:"hidden",marginTop:8},progressFill:{height:"100%",backgroundColor:colors.coral},
  chapterTabs:{flexDirection:"row",gap:5,marginBottom:7},chapterTab:{flex:1,paddingVertical:6,borderRadius:10,alignItems:"center",backgroundColor:colors.foam},activeChapterTab:{backgroundColor:colors.ocean},lockedChapterTab:{opacity:.55},chapterTabText:{color:colors.navy,fontSize:10,fontWeight:"900"},activeChapterTabText:{color:colors.white},
  areaNavigation:{position:"absolute",zIndex:29,left:12,right:12,height:44,flexDirection:"row",alignItems:"center",gap:7},areaNavigationButton:{minWidth:78,height:40,borderRadius:20,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(3,63,82,.94)",borderWidth:2,borderColor:"rgba(255,255,255,.9)",elevation:9},areaNavigationButtonDisabled:{opacity:.35},areaNavigationButtonText:{color:colors.white,fontSize:12,fontWeight:"900"},areaNavigationCurrent:{flex:1,height:40,borderRadius:14,alignItems:"center",justifyContent:"center",paddingHorizontal:6,backgroundColor:"rgba(255,255,255,.94)",borderWidth:1,borderColor:colors.line,elevation:7},areaNavigationCurrentPressed:{transform:[{scale:.98}],backgroundColor:"#E5F8F5"},areaNavigationName:{maxWidth:"100%",color:colors.navy,fontSize:10,fontWeight:"900"},areaNavigationCount:{color:colors.muted,fontSize:8,fontWeight:"800",marginTop:1},
  areaSearchBackdrop:{flex:1,justifyContent:"center",padding:18,backgroundColor:"rgba(1,20,29,.72)"},areaSearchSheet:{width:"100%",maxHeight:"76%",borderRadius:26,padding:17,backgroundColor:colors.white,elevation:24},areaSearchHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:13},areaSearchTitle:{color:colors.navy,fontSize:23,fontWeight:"900"},areaSearchSub:{color:colors.muted,fontSize:10,fontWeight:"700",marginTop:2},areaSearchClose:{width:36,height:36,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:colors.foam},areaSearchCloseText:{color:colors.navy,fontSize:24,fontWeight:"700",marginTop:-2},areaSearchInput:{height:48,borderRadius:15,paddingHorizontal:15,color:colors.navy,fontSize:15,fontWeight:"800",backgroundColor:"#EFF8F6",borderWidth:2,borderColor:"#B9DED8"},areaSearchResultCount:{alignSelf:"flex-end",marginTop:7,marginBottom:4,color:colors.muted,fontSize:10,fontWeight:"800"},areaSearchResults:{flexGrow:0},areaSearchRow:{minHeight:62,flexDirection:"row",alignItems:"center",gap:10,marginBottom:7,padding:8,borderRadius:15,backgroundColor:colors.foam,borderWidth:1,borderColor:"#DCEBE8"},areaSearchRowCurrent:{borderWidth:2,borderColor:colors.aqua,backgroundColor:"#E1F8F4"},areaSearchRowPressed:{opacity:.65},areaSearchNumber:{width:42,height:42,borderRadius:21,alignItems:"center",justifyContent:"center",backgroundColor:"#D5E0E1"},areaSearchNumberUnlocked:{backgroundColor:colors.aqua},areaSearchNumberReady:{backgroundColor:"#FFD75B"},areaSearchNumberText:{color:colors.navy,fontSize:13,fontWeight:"900"},areaSearchRowText:{flex:1},areaSearchAreaName:{color:colors.navy,fontSize:14,fontWeight:"900"},areaSearchStatus:{color:colors.muted,fontSize:9,fontWeight:"700",marginTop:3},areaSearchMarks:{flexDirection:"row",alignItems:"center",gap:5},areaSearchMark:{color:"#AAB9BC",fontSize:15,fontWeight:"900"},areaSearchBossMark:{color:"#F2B93B",textShadowColor:"rgba(242,185,59,.4)",textShadowRadius:4},areaSearchCompleteMark:{color:"#D99500",textShadowColor:"rgba(255,214,70,.55)",textShadowRadius:4},areaSearchArrow:{color:colors.ocean,fontSize:28,fontWeight:"700",paddingHorizontal:2},areaSearchEmpty:{height:120,alignItems:"center",justifyContent:"center"},areaSearchEmptyText:{color:colors.muted,fontSize:12,fontWeight:"800"},
  googleMarker:{alignItems:"center",width:94},googleMarkerFocused:{width:170,zIndex:20},googlePin:{width:34,height:34,borderRadius:17,alignItems:"center",justifyContent:"center",backgroundColor:"#123D4C",borderWidth:3,borderColor:"#A9BDC4",elevation:7},googlePinUnlocked:{backgroundColor:colors.white,borderColor:colors.aqua},googlePinReady:{backgroundColor:"#FFE16A",borderColor:"#F0A000"},googlePinComplete:{backgroundColor:"#FFD54F",borderColor:"#B77C00"},googlePinText:{color:colors.navy,fontSize:13,fontWeight:"900"},googleStageCard:{marginTop:3,minWidth:142,minHeight:47,flexDirection:"row",alignItems:"center",justifyContent:"center",borderRadius:12,paddingLeft:11,backgroundColor:"rgba(3,49,65,.94)",borderWidth:2,borderColor:colors.white,elevation:12},googleStageText:{flex:1,alignItems:"center"},googleStageName:{color:colors.white,fontSize:11,fontWeight:"900"},googleStageStatus:{color:"#D8F5F2",fontSize:8,fontWeight:"800",marginTop:1},googleAvatar:{width:45,height:62,borderRadius:10,overflow:"hidden",alignItems:"center",justifyContent:"flex-end",backgroundColor:"#DDF7F4"},
  route:{position:"absolute",height:6,borderRadius:5,backgroundColor:"rgba(255,255,255,.45)",zIndex:1},routeUnlocked:{backgroundColor:"#FFD55A"},
  node:{position:"absolute",width:112,marginLeft:-56,alignItems:"center",zIndex:3},focusedNode:{zIndex:12},nodeCircle:{width:48,height:48,borderRadius:24,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(17,50,65,.88)",borderWidth:3,borderColor:"#A6B8BE"},focusedNodeCircle:{width:64,height:64,borderRadius:32,borderWidth:5,marginTop:-8,shadowColor:"#001C28",shadowOpacity:.45,shadowRadius:8,elevation:16},nodeUnlocked:{backgroundColor:"#FFFFFF",borderColor:colors.aqua},nodeCanUnlock:{backgroundColor:"#FFF1A8",borderWidth:4,borderColor:"#FFB300",shadowColor:"#FFD200",shadowOpacity:1,shadowRadius:14,elevation:18},nodeBoss:{backgroundColor:"#FFF3C3",borderColor:"#F2B93B"},nodeComplete:{backgroundColor:"#FFE066",borderColor:"#C88B00"},nodeMark:{color:colors.navy,fontSize:18,fontWeight:"900"},nodeLabel:{marginTop:-3,minWidth:88,borderRadius:9,paddingHorizontal:6,paddingVertical:3,backgroundColor:"rgba(4,48,63,.84)"},focusedNodeLabel:{width:154,marginTop:7,borderRadius:14,paddingHorizontal:12,paddingVertical:8,borderWidth:2,borderColor:"rgba(255,255,255,.9)",backgroundColor:"rgba(4,48,63,.94)",shadowColor:"#001C28",shadowOpacity:.45,shadowRadius:8,elevation:15},canUnlockLabel:{backgroundColor:"#FFB300",borderWidth:2,borderColor:"#FFF3A3",shadowColor:"#FFD200",shadowOpacity:.9,shadowRadius:8,elevation:12},completeLabel:{backgroundColor:"rgba(132,87,0,.9)"},nodeName:{color:colors.white,fontSize:10,fontWeight:"900",textAlign:"center"},canUnlockName:{color:"#3E2900",fontSize:11},nodeStatus:{color:"#D8F5F2",fontSize:8,fontWeight:"800",textAlign:"center"},canUnlockStatus:{color:"#5B3900",fontSize:8,fontWeight:"900"},nodeMarks:{flexDirection:"row",justifyContent:"center",gap:8,marginTop:1},nodeMiniMark:{color:"#718A91",fontSize:9,fontWeight:"900"},nodeBossMark:{color:"#FFD04E"},nodeCompleteMark:{color:"#FFE866"},avatar:{position:"absolute",left:82,bottom:-7,width:48,height:72,overflow:"hidden"},
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
